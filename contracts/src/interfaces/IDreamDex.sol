// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDreamDexMarketReader {
  function markets(bytes32 marketId) external view returns (
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
  );
  function marketNonce(bytes32 marketId) external view returns (uint64 nonce);
}

interface IBinaryPool {
  function placeBinaryOrderFor(
    address owner,
    uint8 kind,
    uint256 price,
    uint256 quantity,
    uint64 expireTimestampNs,
    uint8 orderType,
    uint8 selfMatchingOption,
    address builder,
    uint96 builderFeeBpsTimes1k,
    uint64 userData
  ) external payable returns (bool success, uint128 id);
}

interface IOperatorPermissionsRegistry {
  function isApprovedForPool(address pool, address owner, address operator, bytes4 selector) external view returns (bool);
}

interface IERC20Minimal {
  function allowance(address owner, address spender) external view returns (uint256);
}

interface IBinarySettlement {
  function isFinalized(uint256 outcomeId) external view returns (bool);
  function getSettlement(uint256 marketKey) external view returns (Settlement memory);
  struct Settlement {
    address collateralToken;
    uint128 backing;
    bool finalized;
    bool voided;
    uint256 settlementFeeBpsTimes1k;
    address feeRecipient;
    address pool;
    uint64 nonce;
    uint256[] payoutNumerators;
  }
}
