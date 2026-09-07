// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RFTRegistry} from "../src/RFTRegistry.sol";
import {IBinarySettlement, IDreamDexMarketReader} from "../src/interfaces/IDreamDex.sol";

contract RFTRegistryMarketMock is IDreamDexMarketReader {
  mapping(bytes32 => uint64) public expiries;

  function setExpiry(bytes32 marketId, uint64 expiry) external {
    expiries[marketId] = expiry;
  }

  function markets(bytes32 marketId)
    external
    view
    returns (
      uint256 oracleQuestionId,
      uint8 outcomeSlotCount,
      uint8 voidPolicy,
      address collateral,
      uint32 originOperatorId,
      bytes32 originVenueId,
      address oracleAdapter,
      address creator,
      address market,
      address pool,
      uint256 yesId,
      uint256 noId,
      uint64 tradingStart,
      uint64 expiry
    )
  {
    return (
      1,
      2,
      0,
      address(0xCAFE),
      1,
      bytes32(uint256(2)),
      address(0xA),
      address(0xB),
      address(0xC),
      address(0xD),
      0x7001,
      0x7002,
      uint64(block.timestamp),
      expiries[marketId]
    );
  }

  function marketNonce(bytes32) external pure returns (uint64 nonce) {
    return nonce;
  }
}

contract RFTRegistrySettlementMock is IBinarySettlement {
  mapping(uint256 => bool) public finalized;
  mapping(uint256 => Settlement) private settlementData;

  function setSettlement(
    uint256 marketKey,
    bool isFinalized_,
    bool voided_,
    uint256[] calldata payoutNumerators
  ) external {
    finalized[marketKey] = isFinalized_;
    Settlement storage s = settlementData[marketKey];
    s.collateralToken = address(0xCAFE);
    s.backing = 1;
    s.finalized = isFinalized_;
    s.voided = voided_;
    s.settlementFeeBpsTimes1k = 0;
    s.feeRecipient = address(0xFEE);
    s.pool = address(0xD);
    s.nonce = 1;
    s.payoutNumerators = payoutNumerators;
  }

  function isFinalized(uint256 outcomeId) external view returns (bool) {
    return finalized[outcomeId >> 8];
  }

  function getSettlement(uint256 marketKey) external view returns (Settlement memory) {
    return settlementData[marketKey];
  }
}

contract RFTRegistrySecondForecaster {
  function commit(RFTRegistry registry, bytes32 marketId) external returns (bytes32 trialId) {
    return registry.commitForecast(marketId, 4000, 5000, true, 2, 3);
  }
}

contract RFTRegistryTest {
  bytes32 internal constant MARKET_A = bytes32(uint256(0xA1));
  bytes32 internal constant MARKET_B = bytes32(uint256(0xB1));

  function _setup()
    internal
    returns (RFTRegistryMarketMock reader, RFTRegistrySettlementMock settlement, RFTRegistry registry)
  {
    reader = new RFTRegistryMarketMock();
    reader.setExpiry(MARKET_A, uint64(block.timestamp + 1000));
    reader.setExpiry(MARKET_B, uint64(block.timestamp + 1000));
    settlement = new RFTRegistrySettlementMock();
    registry = new RFTRegistry(address(reader), address(settlement));
  }

  function _commit(RFTRegistry registry, bytes32 marketId) internal returns (bytes32 trialId) {
    trialId = registry.commitForecast(marketId, 7234, 6100, true, 45, 1);
  }

  function testCommitIsIndependentAndTrialIdentityIsDeterministic() public {
    (RFTRegistryMarketMock reader, RFTRegistrySettlementMock settlement, RFTRegistry registry) = _setup();
    bytes32 trialId = _commit(registry, MARKET_A);
    bytes32 expected = keccak256(abi.encode(block.chainid, address(registry), address(this), MARKET_A));
    require(trialId == expected, "trial identity changed");
    require(registry.trialFor(address(this), MARKET_A) == expected, "trial index missing");

    RFTRegistrySecondForecaster secondForecaster = new RFTRegistrySecondForecaster();
    bytes32 secondTrial = secondForecaster.commit(registry, MARKET_A);
    require(secondTrial != trialId, "forecasters are not independent");
    require(registry.trialFor(address(secondForecaster), MARKET_A) == secondTrial, "second trial missing");
    reader;
    settlement;
  }

  function testDuplicateForecastRevertsAndCommittedFieldsRemainImmutable() public {
    (,, RFTRegistry registry) = _setup();
    bytes32 trialId = _commit(registry, MARKET_A);
    RFTRegistry.Trial memory beforeTrial = registry.getTrial(trialId);
    (bool ok,) = address(registry)
      .call(abi.encodeWithSelector(registry.commitForecast.selector, MARKET_A, 7235, 6100, true, 46, 1));
    require(!ok, "duplicate Forecast accepted");
    RFTRegistry.Trial memory afterTrial = registry.getTrial(trialId);
    require(afterTrial.trialId == beforeTrial.trialId, "trial id mutated");
    require(afterTrial.marketId == beforeTrial.marketId, "market mutated");
    require(afterTrial.forecaster == beforeTrial.forecaster, "forecaster mutated");
    require(afterTrial.pUpBps == beforeTrial.pUpBps, "probability mutated");
    require(afterTrial.referenceUpBps == beforeTrial.referenceUpBps, "reference mutated");
    require(
      afterTrial.committedAt == beforeTrial.committedAt
        && afterTrial.committedBlock == beforeTrial.committedBlock,
      "commit evidence mutated"
    );
  }

  function testResolvedForecastScoresAndTerminalTrialCannotFinalizeAgain() public {
    (, RFTRegistrySettlementMock settlement, RFTRegistry registry) = _setup();
    bytes32 trialId = _commit(registry, MARKET_A);
    uint256[] memory payouts = new uint256[](2);
    payouts[0] = 1;
    settlement.setSettlement(0x70, true, false, payouts);
    registry.finalize(trialId);

    RFTRegistry.Trial memory trial = registry.getTrial(trialId);
    uint32 forecastDelta = uint32(10_000 - 7234);
    uint32 marketDelta = uint32(10_000 - 6100);
    require(trial.status == 2 && trial.outcome == 1, "resolved state incorrect");
    require(trial.forecastBrier == forecastDelta * forecastDelta, "forecast score incorrect");
    require(trial.marketBrier == marketDelta * marketDelta, "market score incorrect");
    require(
      trial.marketScoreDelta == int64(uint64(trial.marketBrier)) - int64(uint64(trial.forecastBrier)),
      "score delta incorrect"
    );
    (bool ok,) = address(registry).call(abi.encodeWithSelector(registry.finalize.selector, trialId));
    require(!ok, "terminal trial finalized twice");
  }

  function testVoidedTrialIsTerminalAndHasNoScore() public {
    (, RFTRegistrySettlementMock settlement, RFTRegistry registry) = _setup();
    bytes32 trialId = registry.commitForecast(MARKET_B, 7234, 6100, true, 46, 1);
    uint256[] memory payouts = new uint256[](2);
    payouts[0] = 1;
    settlement.setSettlement(0x70, true, true, payouts);
    registry.finalize(trialId);

    RFTRegistry.Trial memory trial = registry.getTrial(trialId);
    require(trial.status == 3 && trial.outcome == 0, "voided state incorrect");
    require(
      trial.forecastBrier == 0 && trial.marketBrier == 0 && trial.marketScoreDelta == 0, "voided trial scored"
    );
    (bool ok,) = address(registry).call(abi.encodeWithSelector(registry.finalize.selector, trialId));
    require(!ok, "voided trial finalized twice");
  }
}
