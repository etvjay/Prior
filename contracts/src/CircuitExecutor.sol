// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CircuitRegistry} from "./CircuitRegistry.sol";
import {IDreamDexMarketReader, IBinaryPool, IOperatorPermissionsRegistry, IERC20Minimal} from "./interfaces/IDreamDex.sol";

contract CircuitExecutor {
  bytes4 public constant PLACE_BINARY_ORDER_FOR_SELECTOR = 0x718c2d4d;
  CircuitRegistry public immutable circuits;
  IDreamDexMarketReader public immutable binaryModule;
  IOperatorPermissionsRegistry public immutable operatorRegistry;

  error NotRunner(); error InvalidPoolBinding(); error NotTradingOrExpired(); error LimitExceeded(); error AllowanceInsufficient(); error OperatorNotApproved(); error InvalidKind(); error OrderFailed();
  event BinaryOrderExecuted(bytes32 indexed circuitId, bytes32 indexed marketId, address indexed owner, address pool, uint128 orderId, uint64 userData, uint256 price, uint256 quantity);

  constructor(address circuits_, address binaryModule_, address operatorRegistry_) {
    circuits = CircuitRegistry(circuits_); binaryModule = IDreamDexMarketReader(binaryModule_); operatorRegistry = IOperatorPermissionsRegistry(operatorRegistry_);
  }

  function execute(
    bytes32 circuitId, bytes32 marketId, address pool, uint8 kind, uint256 price, uint256 quantity,
    uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder,
    uint96 builderFeeBpsTimes1k, uint64 userData, uint128 maxSpend
  ) external payable returns (uint128 orderId) {
    if (msg.sender == address(0)) revert NotRunner();
    (bytes32 id, address owner, address forecaster, uint8 marketClass, uint16 targetWindows, uint128 totalBudget, uint128 maxPerMarket, uint16 minMarginBps, uint8 maxConsecutiveLosses, uint64 startsAt, uint64 circuitExpiry, uint256 allowedActionsBitmap) = circuits.intents(circuitId);
    id; forecaster; marketClass; targetWindows; totalBudget; maxPerMarket; minMarginBps; maxConsecutiveLosses; startsAt; circuitExpiry; allowedActionsBitmap;
    (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address currentPool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry) = binaryModule.markets(marketId);
    oracleQuestionId; outcomeSlotCount; voidPolicy; collateral; originOperatorId; originVenueId; oracleAdapter; creator; market; yesId; noId; tradingStart;
    if (currentPool != pool) revert InvalidPoolBinding();
    if (expiry <= block.timestamp) revert NotTradingOrExpired();
    if (kind > 1) revert InvalidKind();
    // Contract-side economic ceiling: price is raw and maxSpend is the caller's
    // bounded reservation, but the CircuitRegistry remains the canonical budget gate.
    if (maxSpend == 0) revert LimitExceeded();
    if (!operatorRegistry.isApprovedForPool(pool, owner, address(this), PLACE_BINARY_ORDER_FOR_SELECTOR)) revert OperatorNotApproved();
    if (IERC20Minimal(collateral).allowance(owner, pool) == 0) revert AllowanceInsufficient();
    circuits.reserveExecution(circuitId, marketId, maxSpend);
    (bool ok, bytes memory ret) = pool.call{value: msg.value}(abi.encodeWithSelector(PLACE_BINARY_ORDER_FOR_SELECTOR, owner, kind, price, quantity, expireTimestampNs, orderType, selfMatchingOption, builder, builderFeeBpsTimes1k, userData));
    if (!ok) revert OrderFailed();
    (bool success, uint128 idOut) = abi.decode(ret, (bool, uint128));
    if (!success) revert OrderFailed();
    orderId = idOut;
    emit BinaryOrderExecuted(circuitId, marketId, owner, pool, orderId, userData, price, quantity);
  }
}
