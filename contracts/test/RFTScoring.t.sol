// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {RFTScoring} from "../src/libraries/RFTScoring.sol";
contract RFTScoringTest {
  function testParity7234Up() public pure { RFTScoring.Result memory r=RFTScoring.scoreFinalized(7234,RFTScoring.Reference(6100,true),1,false); require(r.forecastBrier==7650756); require(r.marketBrier==15210000); require(r.marketScoreDelta==7559244); }
  function testVoidNoScore() public pure { RFTScoring.Result memory r=RFTScoring.scoreFinalized(7234,RFTScoring.Reference(6100,true),0,true); require(r.status==3); require(r.forecastBrier==0); }
}
