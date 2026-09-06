// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RFTScoring} from "./libraries/RFTScoring.sol";
import {TrialStatusLib, ActionIntentLib} from "./libraries/Enums.sol";
import {IDreamDexMarketReader, IBinarySettlement} from "./interfaces/IDreamDex.sol";

contract RFTRegistry {
  uint256 public constant MIN_COMMIT_LEAD = 60;
  IDreamDexMarketReader public immutable binaryModule;
  IBinarySettlement public immutable settlement;

  struct Trial {
    bytes32 trialId;
    bytes32 marketId;
    address forecaster;
    uint16 pUpBps;
    uint16 referenceUpBps;
    bool referenceValid;
    uint64 committedAt;
    uint64 committedBlock;
    uint32 secondsToExpiry;
    uint64 tradeTag;
    uint8 actionIntent;
    uint8 status;
    uint8 outcome;
    uint32 forecastBrier;
    uint32 marketBrier;
    int64 marketScoreDelta;
  }

  mapping(bytes32 => Trial) private trials;
  mapping(address => mapping(bytes32 => bytes32)) public trialFor;

  error InvalidProbability();
  error DuplicateForecast();
  error MarketMissing();
  error MarketNotTrading();
  error TooNearExpiry();
  error UnknownTrial();
  error AlreadyTerminal();
  error NotResolved();

  event ForecastCommitted(bytes32 indexed trialId, bytes32 indexed marketId, address indexed forecaster, uint16 pUpBps, uint16 referenceUpBps, bool referenceValid, uint64 tradeTag);
  event TrialScored(bytes32 indexed trialId, uint8 outcome, uint32 forecastBrier, uint32 marketBrier, int64 marketScoreDelta);
  event TrialVoided(bytes32 indexed trialId);

  constructor(address binaryModule_, address settlement_) {
    binaryModule = IDreamDexMarketReader(binaryModule_);
    settlement = IBinarySettlement(settlement_);
  }

  function commitForecast(bytes32 marketId, uint16 pUpBps, uint16 referenceUpBps, bool referenceValid, uint64 tradeTag, uint8 actionIntent) external returns (bytes32 trialId) {
    if (pUpBps > 10000 || (referenceValid && referenceUpBps > 10000)) revert InvalidProbability();
    if (trialFor[msg.sender][marketId] != bytes32(0)) revert DuplicateForecast();
    (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address pool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry) = binaryModule.markets(marketId);
    oracleQuestionId; outcomeSlotCount; voidPolicy; collateral; originOperatorId; originVenueId; oracleAdapter; creator; market; pool; yesId; noId; tradingStart;
    if (expiry == 0) revert MarketMissing();
    // The module's binding is canonical; lifecycle is checked by the caller's adapter
    // before writes. This contract also enforces a time lead independent of UI.
    if (expiry <= block.timestamp) revert MarketNotTrading();
    if (expiry - block.timestamp < MIN_COMMIT_LEAD) revert TooNearExpiry();
    trialId = keccak256(abi.encode(block.chainid, address(this), msg.sender, marketId));
    trials[trialId] = Trial(trialId, marketId, msg.sender, pUpBps, referenceUpBps, referenceValid, uint64(block.timestamp), uint64(block.number), uint32(expiry - block.timestamp), tradeTag, actionIntent, TrialStatusLib.COMMITTED, 0, 0, 0, 0);
    trialFor[msg.sender][marketId] = trialId;
    emit ForecastCommitted(trialId, marketId, msg.sender, pUpBps, referenceUpBps, referenceValid, tradeTag);
  }

  function finalize(bytes32 trialId) external {
    Trial storage t = trials[trialId];
    if (t.status == TrialStatusLib.NONE) revert UnknownTrial();
    if (t.status != TrialStatusLib.COMMITTED) revert AlreadyTerminal();
    (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address pool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry) = binaryModule.markets(t.marketId);
    oracleQuestionId; outcomeSlotCount; voidPolicy; collateral; originOperatorId; originVenueId; oracleAdapter; creator; market; pool; noId; tradingStart; expiry;
    if (!settlement.isFinalized(yesId)) revert NotResolved();
    IBinarySettlement.Settlement memory settled = settlement.getSettlement(yesId >> 8);
    uint8 resolvedOutcome = settled.payoutNumerators.length > 1 && settled.payoutNumerators[0] > settled.payoutNumerators[1] ? 1 : 2;
    bool voided = settled.voided;
    RFTScoring.Result memory r = RFTScoring.scoreFinalized(t.pUpBps, RFTScoring.Reference(t.referenceUpBps, t.referenceValid), resolvedOutcome, voided);
    t.status = r.status; t.outcome = r.outcome; t.forecastBrier = r.forecastBrier; t.marketBrier = r.marketBrier; t.marketScoreDelta = r.marketScoreDelta;
    if (voided) emit TrialVoided(trialId); else emit TrialScored(trialId, r.outcome, r.forecastBrier, r.marketBrier, r.marketScoreDelta);
  }

  function getTrial(bytes32 trialId) external view returns (Trial memory) { return trials[trialId]; }
}
