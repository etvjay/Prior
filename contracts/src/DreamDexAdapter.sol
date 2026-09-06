// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDreamDexMarketReader} from "./interfaces/IDreamDex.sol";

/// @notice Stateless contract-side binding and lead-time checks used by Prior.
/// It never stores collateral, calls orders, or determines outcomes.
contract DreamDexAdapter {
  IDreamDexMarketReader public immutable binaryModule;
  uint256 public constant MIN_COMMIT_LEAD = 60;
  constructor(address module_) { binaryModule = IDreamDexMarketReader(module_); }
  function binding(bytes32 marketId) external view returns (address collateral, address market, address pool, uint64 nonce, uint256 oracleQuestionId, uint256 expiry) {
    (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address c, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address m, address p, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 e) = binaryModule.markets(marketId);
    oracleQuestionId; outcomeSlotCount; voidPolicy; originOperatorId; originVenueId; oracleAdapter; creator; yesId; noId; tradingStart;
    return (c,m,p,binaryModule.marketNonce(marketId),oracleQuestionId,e);
  }
  function commitEligible(bytes32 marketId) external view returns (bool) {
    (, , , , , uint256 expiry) = this.binding(marketId);
    return expiry > block.timestamp + MIN_COMMIT_LEAD;
  }
}
