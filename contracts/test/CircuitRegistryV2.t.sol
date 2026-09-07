// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CircuitRegistryV2} from "../src/CircuitRegistryV2.sol";
import {RFTRegistry} from "../src/RFTRegistry.sol";
import {IDreamDexMarketReader, IBinarySettlement} from "../src/interfaces/IDreamDex.sol";

contract CircuitRegistryV2MarketReaderMock is IDreamDexMarketReader {
  struct Market {
    uint256 oracleQuestionId;
    uint8 outcomeSlotCount;
    uint8 voidPolicy;
    address collateral;
    uint32 originOperatorId;
    bytes32 originVenueId;
    address oracleAdapter;
    address creator;
    address market;
    address pool;
    uint256 yesId;
    uint256 noId;
    uint64 tradingStart;
    uint64 expiry;
  }

  mapping(bytes32 => Market) private marketData;

  function setMarket(bytes32 marketId, uint64 expiry) external {
    marketData[marketId] = Market({
      oracleQuestionId: 1,
      outcomeSlotCount: 2,
      voidPolicy: 0,
      collateral: address(0xCAFE),
      originOperatorId: 1,
      originVenueId: bytes32(uint256(2)),
      oracleAdapter: address(0xA),
      creator: address(0xB),
      market: address(0xC),
      pool: address(0xD),
      yesId: 0x7001,
      noId: 0x7002,
      tradingStart: uint64(block.timestamp),
      expiry: expiry
    });
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
    Market memory m = marketData[marketId];
    return (
      m.oracleQuestionId,
      m.outcomeSlotCount,
      m.voidPolicy,
      m.collateral,
      m.originOperatorId,
      m.originVenueId,
      m.oracleAdapter,
      m.creator,
      m.market,
      m.pool,
      m.yesId,
      m.noId,
      m.tradingStart,
      m.expiry
    );
  }

  function marketNonce(bytes32) external pure returns (uint64 nonce) {
    return nonce;
  }
}

contract CircuitRegistryV2ForecastCaller {
  function commit(RFTRegistry registry, bytes32 marketId) external returns (bytes32 trialId) {
    return registry.commitForecast(marketId, 5000, 5000, true, 1, 3);
  }
}

contract CircuitRegistryV2SettlementMock is IBinarySettlement {
  bool public finalized;
  Settlement private settlementData;

  function setResolved(bool voided_) external {
    finalized = true;
    settlementData.finalized = true;
    settlementData.voided = voided_;
    delete settlementData.payoutNumerators;
    settlementData.payoutNumerators.push(1);
    settlementData.payoutNumerators.push(0);
  }

  function isFinalized(uint256) external view returns (bool) {
    return finalized;
  }

  function getSettlement(uint256) external view returns (Settlement memory) {
    return settlementData;
  }
}

contract CircuitRegistryV2NonOwnerCaller {
  function bind(CircuitRegistryV2 registry, bytes32 circuitId, bytes32 marketId, bytes32 trialId) external {
    registry.bindTrial(circuitId, marketId, trialId);
  }

  function advance(CircuitRegistryV2 registry, bytes32 circuitId, bytes32 marketId, bool missed) external {
    registry.advance(circuitId, marketId, missed, false, false);
  }
}

contract CircuitRegistryV2Test {
  bytes32 internal constant MARKET_A = bytes32(uint256(0xA1));
  bytes32 internal constant MARKET_B = bytes32(uint256(0xB1));

  function _intent(address forecaster, uint16 targetWindows)
    internal
    view
    returns (CircuitRegistryV2.Intent memory i)
  {
    uint256 now_ = block.timestamp;
    i.owner = address(this);
    i.forecaster = forecaster;
    i.marketClass = 0;
    i.targetWindows = targetWindows;
    i.totalBudget = 100;
    i.maxPerMarket = 60;
    i.minMarginBps = 800;
    i.maxConsecutiveLosses = 2;
    i.startsAt = uint64(now_ == 0 ? 0 : now_ - 1);
    i.expiresAt = uint64(now_ + 1000);
    i.allowedActionsBitmap = 3;
  }

  function _createActive(CircuitRegistryV2 registry, address forecaster, uint16 targetWindows)
    internal
    returns (bytes32 circuitId)
  {
    circuitId = registry.create(_intent(forecaster, targetWindows));
    registry.authorize(circuitId);
    registry.activate(circuitId);
  }

  function _setup(bytes32 marketId)
    internal
    returns (
      CircuitRegistryV2MarketReaderMock reader,
      RFTRegistry rft,
      CircuitRegistryV2ForecastCaller forecaster,
      CircuitRegistryV2 registry,
      bytes32 circuitId,
      bytes32 trialId
    )
  {
    reader = new CircuitRegistryV2MarketReaderMock();
    reader.setMarket(marketId, uint64(block.timestamp + 1000));
    rft = new RFTRegistry(address(reader), address(0));
    forecaster = new CircuitRegistryV2ForecastCaller();
    trialId = forecaster.commit(rft, marketId);
    registry = new CircuitRegistryV2(address(rft));
    circuitId = _createActive(registry, address(forecaster), 2);
  }

  function _bindCall(CircuitRegistryV2 registry, bytes32 circuitId, bytes32 marketId, bytes32 trialId)
    internal
    returns (bool ok)
  {
    (ok,) = address(registry)
      .call(abi.encodeWithSelector(registry.bindTrial.selector, circuitId, marketId, trialId));
  }

  function _advanceCall(CircuitRegistryV2 registry, bytes32 circuitId, bytes32 marketId, bool missed)
    internal
    returns (bool ok)
  {
    (ok,) = address(registry)
      .call(abi.encodeWithSelector(registry.advance.selector, circuitId, marketId, missed, false, false));
  }

  function testValidBindingUsesCanonicalRFTAndStoresIteration() public {
    (
      ,
      RFTRegistry rft,
      CircuitRegistryV2ForecastCaller forecaster,
      CircuitRegistryV2 registry,
      bytes32 circuitId,
      bytes32 trialId
    ) = _setup(MARKET_A);

    registry.bindTrial(circuitId, MARKET_A, trialId);

    require(address(registry.rftRegistry()) == address(rft), "wrong RFT dependency");
    require(registry.trialForIteration(circuitId, MARKET_A) == trialId, "trial not bound");
    require(!registry.processedMarket(circuitId, MARKET_A), "market already processed");
    bytes32 expectedIterationId = keccak256(abi.encode(block.chainid, address(registry), circuitId, MARKET_A));
    require(
      registry.iterationIdentity(circuitId, MARKET_A) == expectedIterationId, "wrong iteration identity"
    );
    CircuitRegistryV2.CircuitIteration memory iteration = registry.getIteration(circuitId, MARKET_A);
    require(iteration.iterationId == expectedIterationId, "iteration id not stored");
    require(
      iteration.trialId == trialId && iteration.bound && !iteration.processed && !iteration.missed,
      "bad iteration"
    );

    RFTRegistry.Trial memory trial = rft.getTrial(trialId);
    require(trial.marketId == MARKET_A, "caller market was trusted");
    require(trial.forecaster == address(forecaster), "wrong canonical forecaster");
    require(trial.status == 1, "binding did not require committed trial");
  }

  function testWrongMarketReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId, bytes32 trialId) = _setup(MARKET_A);
    require(!_bindCall(registry, circuitId, MARKET_B, trialId), "wrong market accepted");
    require(registry.trialForIteration(circuitId, MARKET_B) == bytes32(0), "wrong market stored");
  }

  function testWrongForecasterReverts() public {
    CircuitRegistryV2MarketReaderMock reader = new CircuitRegistryV2MarketReaderMock();
    reader.setMarket(MARKET_A, uint64(block.timestamp + 1000));
    RFTRegistry rft = new RFTRegistry(address(reader), address(0));
    CircuitRegistryV2ForecastCaller committedBy = new CircuitRegistryV2ForecastCaller();
    bytes32 trialId = committedBy.commit(rft, MARKET_A);
    CircuitRegistryV2ForecastCaller expectedForecaster = new CircuitRegistryV2ForecastCaller();
    CircuitRegistryV2 registry = new CircuitRegistryV2(address(rft));
    bytes32 circuitId = _createActive(registry, address(expectedForecaster), 2);

    require(!_bindCall(registry, circuitId, MARKET_A, trialId), "wrong forecaster accepted");
    require(registry.trialForIteration(circuitId, MARKET_A) == bytes32(0), "wrong forecaster stored");
  }

  function testMissingTrialReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId,) = _setup(MARKET_A);
    require(!_bindCall(registry, circuitId, MARKET_A, bytes32(uint256(0x999))), "missing trial accepted");
  }

  function testDuplicateBindingReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId, bytes32 trialId) = _setup(MARKET_A);
    registry.bindTrial(circuitId, MARKET_A, trialId);
    require(!_bindCall(registry, circuitId, MARKET_A, trialId), "duplicate binding accepted");
  }

  function testTerminalRFTCannotBeBound() public {
    CircuitRegistryV2MarketReaderMock reader = new CircuitRegistryV2MarketReaderMock();
    reader.setMarket(MARKET_A, uint64(block.timestamp + 1000));
    CircuitRegistryV2SettlementMock settlement = new CircuitRegistryV2SettlementMock();
    RFTRegistry rft = new RFTRegistry(address(reader), address(settlement));
    CircuitRegistryV2ForecastCaller forecaster = new CircuitRegistryV2ForecastCaller();
    bytes32 trialId = forecaster.commit(rft, MARKET_A);
    settlement.setResolved(false);
    rft.finalize(trialId);

    CircuitRegistryV2 registry = new CircuitRegistryV2(address(rft));
    bytes32 circuitId = _createActive(registry, address(forecaster), 2);
    require(!_bindCall(registry, circuitId, MARKET_A, trialId), "terminal RFT accepted");
  }

  function testSameRFTCanBeBoundBySecondLegitimateCircuit() public {
    CircuitRegistryV2MarketReaderMock reader = new CircuitRegistryV2MarketReaderMock();
    reader.setMarket(MARKET_A, uint64(block.timestamp + 1000));
    RFTRegistry rft = new RFTRegistry(address(reader), address(0));
    CircuitRegistryV2ForecastCaller forecaster = new CircuitRegistryV2ForecastCaller();
    bytes32 trialId = forecaster.commit(rft, MARKET_A);
    CircuitRegistryV2 registry = new CircuitRegistryV2(address(rft));
    bytes32 firstCircuit = _createActive(registry, address(forecaster), 2);
    bytes32 secondCircuit = _createActive(registry, address(forecaster), 3);

    registry.bindTrial(firstCircuit, MARKET_A, trialId);
    registry.bindTrial(secondCircuit, MARKET_A, trialId);
    require(registry.trialForIteration(firstCircuit, MARKET_A) == trialId, "first binding missing");
    require(registry.trialForIteration(secondCircuit, MARKET_A) == trialId, "second binding missing");

    registry.advance(firstCircuit, MARKET_A, false, true, false);
    registry.advance(secondCircuit, MARKET_A, false, true, false);
  }

  function testUnboundNormalAdvanceReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId,) = _setup(MARKET_A);
    require(!_advanceCall(registry, circuitId, MARKET_A, false), "unbound normal advance accepted");
    (,, uint16 missed, uint16 abstained,,) = registry.runtime(circuitId);
    require(missed == 0 && abstained == 0, "runtime changed on rejected advance");
    require(!registry.processedMarket(circuitId, MARKET_A), "market marked on rejected advance");
  }

  function testBoundNormalAdvancePassesAndMarksProcessed() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId, bytes32 trialId) = _setup(MARKET_A);
    registry.bindTrial(circuitId, MARKET_A, trialId);
    registry.advance(circuitId, MARKET_A, false, true, false);

    require(registry.processedMarket(circuitId, MARKET_A), "market not processed");
    (CircuitRegistryV2.Status status, uint16 completed, uint16 missed, uint16 abstained,,) =
      registry.runtime(circuitId);
    require(status == CircuitRegistryV2.Status.ACTIVE, "wrong status");
    require(completed == 1 && missed == 0 && abstained == 1, "wrong runtime");
    CircuitRegistryV2.CircuitIteration memory iteration = registry.getIteration(circuitId, MARKET_A);
    require(
      iteration.processed && !iteration.missed && iteration.trialId == trialId, "iteration not finalized"
    );
  }

  function testSameMarketTwiceReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId, bytes32 trialId) = _setup(MARKET_A);
    registry.bindTrial(circuitId, MARKET_A, trialId);
    registry.advance(circuitId, MARKET_A, false, false, false);
    require(!_advanceCall(registry, circuitId, MARKET_A, false), "same market advanced twice");
    (,, uint16 missed, uint16 abstained,,) = registry.runtime(circuitId);
    require(missed == 0 && abstained == 0, "duplicate changed counters");
  }

  function testMissedUnboundPassesOnceAndSecondMissedReverts() public {
    (,,, CircuitRegistryV2 registry, bytes32 circuitId,) = _setup(MARKET_A);
    registry.advance(circuitId, MARKET_A, true, false, false);
    require(registry.processedMarket(circuitId, MARKET_A), "missed market not processed");
    (,, uint16 missed, uint16 abstained,,) = registry.runtime(circuitId);
    require(missed == 1 && abstained == 0, "wrong missed counters");
    require(!_advanceCall(registry, circuitId, MARKET_A, true), "missed market processed twice");
  }

  function testOwnerAndLifecycleChecksRemainEnforced() public {
    (
      CircuitRegistryV2MarketReaderMock reader,
      RFTRegistry rft,,
      CircuitRegistryV2 registry,
      bytes32 circuitId,
      bytes32 trialId
    ) = _setup(MARKET_A);
    CircuitRegistryV2NonOwnerCaller caller = new CircuitRegistryV2NonOwnerCaller();
    (bool ok,) = address(caller)
      .call(abi.encodeWithSelector(caller.bind.selector, registry, circuitId, MARKET_A, trialId));
    require(!ok, "non-owner bound trial");
    (ok,) = address(caller)
      .call(abi.encodeWithSelector(caller.advance.selector, registry, circuitId, MARKET_A, true));
    require(!ok, "non-owner advanced market");

    CircuitRegistryV2 draftRegistry = new CircuitRegistryV2(address(rft));
    bytes32 draftId = draftRegistry.create(_intent(address(0x1234), 2));
    require(!_bindCall(draftRegistry, draftId, MARKET_A, trialId), "draft circuit bound trial");
    reader;

    CircuitRegistryV2 expiredRegistry = new CircuitRegistryV2(address(rft));
    CircuitRegistryV2.Intent memory expiredIntent = _intent(address(0x1234), 2);
    expiredIntent.expiresAt = uint64(block.timestamp);
    bytes32 expiredId = expiredRegistry.create(expiredIntent);
    expiredRegistry.authorize(expiredId);
    expiredRegistry.activate(expiredId);
    require(!_bindCall(expiredRegistry, expiredId, MARKET_A, trialId), "expired circuit bound trial");
    require(!_advanceCall(expiredRegistry, expiredId, MARKET_A, true), "expired circuit advanced");
  }
}
