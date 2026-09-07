// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CircuitExecutorV2} from "../src/CircuitExecutorV2.sol";
import {CircuitRegistryV2} from "../src/CircuitRegistryV2.sol";
import {RFTRegistry} from "../src/RFTRegistry.sol";
import {
  IDreamDexMarketReader,
  IOperatorPermissionsRegistry,
  IERC20Minimal
} from "../src/interfaces/IDreamDex.sol";

contract CircuitExecutorV2MarketReaderMock is IDreamDexMarketReader {
  address public collateral;
  address public currentPool;
  uint64 public marketExpiry;
  bool public revertOnRead;

  function configure(address collateral_, address pool_, uint64 expiry_, bool revertOnRead_) external {
    collateral = collateral_;
    currentPool = pool_;
    marketExpiry = expiry_;
    revertOnRead = revertOnRead_;
  }

  function markets(bytes32)
    external
    view
    returns (
      uint256 oracleQuestionId,
      uint8 outcomeSlotCount,
      uint8 voidPolicy,
      address collateralOut,
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
    if (revertOnRead) revert("unexpected market read");
    return (
      1,
      2,
      0,
      collateral,
      1,
      bytes32(uint256(2)),
      address(0xA),
      address(0xB),
      address(0xC),
      currentPool,
      0x7001,
      0x7002,
      uint64(block.timestamp),
      marketExpiry
    );
  }

  function marketNonce(bytes32) external pure returns (uint64 nonce) {
    return nonce;
  }
}

contract CircuitExecutorV2OperatorMock is IOperatorPermissionsRegistry {
  bool public approved;
  bool public revertOnRead;

  function configure(bool approved_, bool revertOnRead_) external {
    approved = approved_;
    revertOnRead = revertOnRead_;
  }

  function isApprovedForPool(address, address, address, bytes4) external view returns (bool) {
    if (revertOnRead) revert("unexpected operator read");
    return approved;
  }
}

contract CircuitExecutorV2CollateralMock is IERC20Minimal {
  uint256 public allowanceValue;
  bool public revertOnRead;

  function configure(uint256 allowance_, bool revertOnRead_) external {
    allowanceValue = allowance_;
    revertOnRead = revertOnRead_;
  }

  function allowance(address, address) external view returns (uint256) {
    if (revertOnRead) revert("unexpected allowance read");
    return allowanceValue;
  }
}

contract CircuitExecutorV2PoolMock {
  uint256 public calls;

  function placeBinaryOrderFor(
    address,
    uint8,
    uint256,
    uint256,
    uint64,
    uint8,
    uint8,
    address,
    uint96,
    uint64
  ) external payable returns (bool success, uint128 id) {
    calls += 1;
    return (true, 1);
  }
}

contract CircuitExecutorV2Caller {
  function invoke(CircuitExecutorV2 executor, bytes32 circuitId, bytes32 marketId, address pool, uint8 kind)
    external
    returns (bool ok, bytes memory data)
  {
    (ok, data) = address(executor)
      .call(
        abi.encodeWithSelector(
          executor.execute.selector,
          circuitId,
          marketId,
          pool,
          kind,
          600_000,
          1000,
          uint64((block.timestamp + 10) * 1_000_000_000),
          2,
          0,
          address(0),
          0,
          77,
          1
        )
      );
  }
}

contract CircuitExecutorV2IntendedExecutorCaller is CircuitExecutorV2Caller {}

contract CircuitExecutorV2Test {
  bytes32 internal constant CIRCUIT_ID = bytes32(uint256(0xC1));
  bytes32 internal constant MARKET_ID = bytes32(uint256(0xD1));

  function _setup(uint256 bitmap, bool revertOnMarketRead)
    internal
    returns (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,
      CircuitExecutorV2MarketReaderMock marketReader,
      CircuitExecutorV2OperatorMock operatorRegistry,
      CircuitExecutorV2CollateralMock collateral,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    )
  {
    marketReader = new CircuitExecutorV2MarketReaderMock();
    collateral = new CircuitExecutorV2CollateralMock();
    pool = new CircuitExecutorV2PoolMock();
    marketReader.configure(
      address(collateral), address(pool), uint64(block.timestamp + 1000), revertOnMarketRead
    );
    collateral.configure(1_000_000, false);
    operatorRegistry = new CircuitExecutorV2OperatorMock();
    operatorRegistry.configure(true, false);

    RFTRegistry rft = new RFTRegistry(address(marketReader), address(0));
    registry = new CircuitRegistryV2(address(rft));
    executor = new CircuitExecutorV2(address(registry), address(marketReader), address(operatorRegistry));
    registry.setExecutor(address(executor));

    CircuitRegistryV2.Intent memory intent;
    uint256 now_ = block.timestamp;
    intent.owner = address(this);
    intent.forecaster = address(0xBEEF);
    intent.marketClass = 0;
    intent.targetWindows = 2;
    intent.totalBudget = 100;
    intent.maxPerMarket = 60;
    intent.minMarginBps = 800;
    intent.maxConsecutiveLosses = 2;
    intent.startsAt = uint64(now_ == 0 ? 0 : now_ - 1);
    intent.expiresAt = uint64(now_ + 1000);
    intent.allowedActionsBitmap = bitmap;
    circuitId = registry.create(intent);
    registry.authorize(circuitId);
    registry.activate(circuitId);
  }

  function _selector(bytes memory data) internal pure returns (bytes4 selector) {
    assembly {
      selector := mload(add(data, 32))
    }
  }

  function _requireActionRejected(
    CircuitRegistryV2 registry,
    CircuitExecutorV2 executor,
    CircuitExecutorV2PoolMock pool,
    bytes32 circuitId,
    bytes memory result
  ) internal view {
    require(_selector(result) == CircuitExecutorV2.ActionNotAllowed.selector, "wrong rejection");
    require(pool.calls() == 0, "pool call reached");
    (,,,,, uint128 reservedSpend) = registry.runtime(circuitId);
    require(reservedSpend == 0, "reserve reached");
    executor;
  }

  function testZeroBitmapBuyUpOwnerIsInert() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(0, true);
    (bool ok, bytes memory data) = address(executor)
      .call(
        abi.encodeWithSelector(
          executor.execute.selector,
          circuitId,
          MARKET_ID,
          address(pool),
          0,
          600_000,
          1000,
          uint64((block.timestamp + 10) * 1_000_000_000),
          2,
          0,
          address(0),
          0,
          77,
          1
        )
      );
    require(!ok, "zero bitmap accepted BUY_UP");
    _requireActionRejected(registry, executor, pool, circuitId, data);
  }

  function testZeroBitmapBuyDownOwnerIsInert() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(0, true);
    (bool ok, bytes memory data) = address(executor)
      .call(
        abi.encodeWithSelector(
          executor.execute.selector,
          circuitId,
          MARKET_ID,
          address(pool),
          2,
          600_000,
          1000,
          uint64((block.timestamp + 10) * 1_000_000_000),
          2,
          0,
          address(0),
          0,
          77,
          1
        )
      );
    require(!ok, "zero bitmap accepted BUY_DOWN");
    _requireActionRejected(registry, executor, pool, circuitId, data);
  }

  function testZeroBitmapBuyUpArbitraryCallerIsInert() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(0, true);
    CircuitExecutorV2Caller caller = new CircuitExecutorV2Caller();
    (bool ok, bytes memory data) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 0);
    require(!ok, "arbitrary caller accepted BUY_UP");
    _requireActionRejected(registry, executor, pool, circuitId, data);
  }

  function testZeroBitmapBuyDownIntendedExecutorIsInert() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(0, true);
    CircuitExecutorV2IntendedExecutorCaller caller = new CircuitExecutorV2IntendedExecutorCaller();
    (bool ok, bytes memory data) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 2);
    require(!ok, "intended executor accepted BUY_DOWN");
    _requireActionRejected(registry, executor, pool, circuitId, data);
  }

  function testUpOnlyAcceptsBuyUpAndRejectsBuyDown() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(1, false);
    registry;
    CircuitExecutorV2Caller caller = new CircuitExecutorV2Caller();
    (bool ok, bytes memory data) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 2);
    require(
      !ok && _selector(data) == CircuitExecutorV2.ActionNotAllowed.selector, "UP-only accepted BUY_DOWN"
    );
    require(pool.calls() == 0, "wrong UP-only action called pool");

    (ok,) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 0);
    require(ok, "UP-only rejected BUY_UP");
    require(pool.calls() == 1, "BUY_UP did not reach pool");
  }

  function testDownOnlyAcceptsBuyDownAndRejectsBuyUp() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,,,,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(2, false);
    registry;
    CircuitExecutorV2Caller caller = new CircuitExecutorV2Caller();
    (bool ok, bytes memory data) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 0);
    require(
      !ok && _selector(data) == CircuitExecutorV2.ActionNotAllowed.selector, "DOWN-only accepted BUY_UP"
    );
    require(pool.calls() == 0, "wrong DOWN-only action called pool");

    (ok,) = caller.invoke(executor, circuitId, MARKET_ID, address(pool), 2);
    require(ok, "DOWN-only rejected BUY_DOWN");
    require(pool.calls() == 1, "BUY_DOWN did not reach pool");
  }

  function testBitmapGatePrecedesReserveAndAllExternalEconomicChecks() public {
    (
      CircuitRegistryV2 registry,
      CircuitExecutorV2 executor,
      CircuitExecutorV2MarketReaderMock reader,
      CircuitExecutorV2OperatorMock operatorRegistry,
      CircuitExecutorV2CollateralMock collateral,
      CircuitExecutorV2PoolMock pool,
      bytes32 circuitId
    ) = _setup(0, true);
    reader;
    operatorRegistry;
    collateral;
    (bool ok, bytes memory data) = address(executor)
      .call(
        abi.encodeWithSelector(
          executor.execute.selector,
          circuitId,
          MARKET_ID,
          address(pool),
          0,
          600_000,
          1000,
          uint64((block.timestamp + 10) * 1_000_000_000),
          2,
          0,
          address(0),
          0,
          77,
          1
        )
      );
    require(!ok && _selector(data) == CircuitExecutorV2.ActionNotAllowed.selector, "bitmap gate was bypassed");
    require(pool.calls() == 0, "pool economic call reached");
    (,,,,, uint128 reservedSpend) = registry.runtime(circuitId);
    require(reservedSpend == 0, "reserve economic effect reached");
  }
}
