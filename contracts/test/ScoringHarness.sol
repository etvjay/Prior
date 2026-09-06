// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {RFTScoring} from "../src/libraries/RFTScoring.sol";
contract ScoringHarness { function score(uint16 p,uint16 q,bool valid,uint8 out,bool voided) external pure returns (uint8,uint8,uint32,uint32,int64){ RFTScoring.Result memory r=RFTScoring.scoreFinalized(p,RFTScoring.Reference(q,valid),out,voided); return(r.status,r.outcome,r.forecastBrier,r.marketBrier,r.marketScoreDelta); } }
