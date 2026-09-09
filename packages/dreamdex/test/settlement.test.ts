import { describe, expect, it } from "vitest";
import { canonicalSettlementFromReads } from "../src/index.js";
describe("canonical settlement truth",()=>{
 const base={yesId:256n,noId:257n,expiry:999n};
 it("maps Trading and resolved/voided from direct settlement reads",()=>{
  expect(canonicalSettlementFromReads({market:base,finalized:false,settlement:null})).toMatchObject({state:"TRADING"});
  expect(canonicalSettlementFromReads({market:base,finalized:true,settlement:{voided:false,payoutNumerators:[2n,1n]}})).toMatchObject({state:"RESOLVED_UP",outcome:"UP"});
  expect(canonicalSettlementFromReads({market:base,finalized:true,settlement:{voided:false,payoutNumerators:[1n,2n]}})).toMatchObject({state:"RESOLVED_DOWN",outcome:"DOWN"});
  expect(canonicalSettlementFromReads({market:base,finalized:true,settlement:{voided:true,payoutNumerators:[0n,0n]}})).toMatchObject({state:"VOIDED",voided:true});
 });
 it("fails closed on incomplete/conflicting reads",()=>{
  expect(canonicalSettlementFromReads({market:base,finalized:true,settlement:null}).state).toBe("INCOMPLETE");
  expect(canonicalSettlementFromReads({market:base,finalized:false,settlement:{voided:false,payoutNumerators:[1n,2n]}}).state).toBe("CONFLICT");
 });
});
