// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {CircuitRegistry} from "../src/CircuitRegistry.sol";
contract CircuitRegistryTest {
  function _intent() internal view returns(CircuitRegistry.Intent memory i){ i.owner=address(this); i.forecaster=address(0xBEEF); i.marketClass=0; i.targetWindows=2; i.totalBudget=100; i.maxPerMarket=60; i.minMarginBps=800; i.maxConsecutiveLosses=2; i.startsAt=uint64(block.timestamp-1); i.expiresAt=uint64(block.timestamp+1000); i.allowedActionsBitmap=7; }
  function testLifecycleAndCaps() public { CircuitRegistry r=new CircuitRegistry(); bytes32 id=r.create(_intent()); r.authorize(id); r.activate(id); r.setExecutor(address(this)); r.reserveExecution(id,bytes32(uint256(1)),40); (bool ok,)=address(r).call(abi.encodeWithSelector(r.reserveExecution.selector,id,bytes32(uint256(1)),1)); require(!ok); (ok,)=address(r).call(abi.encodeWithSelector(r.reserveExecution.selector,id,bytes32(uint256(2)),61)); require(!ok); r.advance(id,bytes32(uint256(1)),false,true,false); r.advance(id,bytes32(uint256(2)),false,false,false); (CircuitRegistry.Status s,,,,,)=r.runtime(id); require(uint8(s)==5); }
  function testOwnerCanPauseAndRevoke() public { CircuitRegistry r=new CircuitRegistry(); bytes32 id=r.create(_intent()); r.authorize(id); r.activate(id); r.pause(id); (CircuitRegistry.Status s,,,,,)=r.runtime(id); require(uint8(s)==3); r.resume(id); r.revoke(id); (s,,,,,)=r.runtime(id); require(uint8(s)==7); }
}
