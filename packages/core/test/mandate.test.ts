import { describe, expect, it } from "vitest";
import {
  AgentSourceType,
  ApiTransport,
  AuthorizedActionKind,
  ExecuteCapability,
  ForecastCapability,
  MandateLifecycle,
  MarketAsset,
  MarketClass,
  MarketVenue,
  ReadCapability,
  type AgentBinding,
  type AgentPrincipal,
  type AuthorizedAction,
  type ForecastRequest,
  type ForecastSubmission,
  type MandatePolicy,
} from "../src/types.js";
import {
  AuthorizedActionLedger,
  assertAuthorizedActionImmutable,
  assertLifecycleTransition,
  assertSafeAttenuation,
  effectiveMandateLifecycle,
  formatMandatePolicy,
  freezeAuthorizedAction,
  iterationIdentity,
  mandatePolicyHash,
  revokeMandatePolicy,
  validateAgentBinding,
  validateAuthorizedAction,
  validateForecastRequest,
  validateForecastSubmission,
  validateMandatePolicy,
} from "../src/mandate.js";
import { asCollateralRaw, asPriceRaw, asQuantityRaw, asUnitScaleRaw } from "../src/units.js";

const id = (byte: string) => `0x${byte.repeat(64)}` as `0x${string}`;
const address = (suffix: string) => `0x${suffix.padStart(40, "0")}` as `0x${string}`;

const MANDATE_ID = id("1");
const CIRCUIT_ID = id("2");
const MARKET_ID = id("3");
const OWNER = address("a1");
const HUMAN_FORECAST = address("b1");
const AGENT_FORECAST = address("b2");
const EXECUTOR = address("c1");
const UNIT_SCALE = asUnitScaleRaw(1_000_000n);

const human: AgentPrincipal = {
  agentId: id("a"),
  displayName: "Alice",
  sourceType: AgentSourceType.HUMAN,
  forecastAddress: HUMAN_FORECAST,
  executorAddress: OWNER,
};
const forecastAgent: AgentPrincipal = {
  agentId: id("b"),
  displayName: "Forecast Bot",
  sourceType: AgentSourceType.AGENT,
  forecastAddress: AGENT_FORECAST,
};
const executorAgent: AgentPrincipal = {
  agentId: id("c"),
  displayName: "Execution Service",
  sourceType: AgentSourceType.SERVICE,
  executorAddress: EXECUTOR,
};

const policy: MandatePolicy = {
  version: 1,
  mandateId: MANDATE_ID,
  owner: OWNER,
  forecasters: [human, forecastAgent],
  executors: [human, executorAgent],
  marketScope: {
    venue: MarketVenue.DREAMDEX,
    assets: [MarketAsset.BTC],
    intervalsSec: [300],
    marketClass: MarketClass.BTC_15M,
    marketIds: [MARKET_ID],
  },
  forecastAuthority: {
    agentIds: [human.agentId, forecastAgent.agentId],
    capabilities: [ForecastCapability.SUBMIT_FORECAST],
  },
  executionAuthority: {
    agentIds: [human.agentId, executorAgent.agentId],
    capabilities: [
      ExecuteCapability.EVALUATE_ACTION,
      ExecuteCapability.GET_AUTHORIZED_ACTION,
      ExecuteCapability.EXECUTE_AUTHORIZED_ACTION,
    ],
    allowedActions: [AuthorizedActionKind.BUY_UP, AuthorizedActionKind.BUY_DOWN],
    minMarginBps: 800,
  },
  capitalAuthority: {
    maxPerMarketRaw: asCollateralRaw(1_000_000n),
    totalBudgetRaw: asCollateralRaw(20_000_000n),
    stopLossRaw: asCollateralRaw(2_000_000n),
  },
  temporalAuthority: {
    issuedAt: 100n,
    startsAt: 100n,
    expiresAt: 1_000n,
  },
  lifecycle: MandateLifecycle.ACTIVE,
  revocation: { enabled: true, ownerOnly: true },
};

function bindingFor(agent: AgentPrincipal, overrides: Partial<AgentBinding> = {}): AgentBinding {
  return {
    bindingId: id("4"),
    agentId: agent.agentId,
    circuitId: CIRCUIT_ID,
    apiPrincipal: { transport: ApiTransport.API, principalId: `api:${agent.displayName}` },
    forecastAddress: agent.forecastAddress,
    executorAddress: agent.executorAddress,
    readCapabilities: [ReadCapability.GET_MANDATE, ReadCapability.GET_FORECAST_REQUEST],
    forecastCapabilities: agent.forecastAddress ? [ForecastCapability.SUBMIT_FORECAST] : [],
    executeCapabilities: agent.executorAddress
      ? [ExecuteCapability.EVALUATE_ACTION, ExecuteCapability.GET_AUTHORIZED_ACTION, ExecuteCapability.EXECUTE_AUTHORIZED_ACTION]
      : [],
    issued: 110n,
    expires: 900n,
    mandateId: MANDATE_ID,
    policyHash: mandatePolicyHash(policy),
    ...overrides,
  };
}

function actionFor(overrides: Partial<AuthorizedAction> = {}): AuthorizedAction {
  return {
    actionId: id("5"),
    circuitId: CIRCUIT_ID,
    marketId: MARKET_ID,
    executionId: id("6"),
    executorAgentId: executorAgent.agentId,
    action: AuthorizedActionKind.BUY_UP,
    maxPriceRaw: asPriceRaw(600_000n),
    quantityRaw: asQuantityRaw(1_000n),
    maximumSpendRaw: asCollateralRaw(600n),
    validAfter: 200n,
    expiresAt: 900n,
    policyHash: mandatePolicyHash(policy),
    ...overrides,
  };
}

describe("M4.1 typed mandate authority foundation", () => {
  it("A/B: validates Forecast-only, execute-only, both, and split-principal bindings", () => {
    validateMandatePolicy(policy, 200n);
    validateAgentBinding(bindingFor(human), policy, 200n);
    validateAgentBinding(bindingFor(forecastAgent), policy, 200n);
    validateAgentBinding(bindingFor(executorAgent), policy, 200n);

    const readOnly = bindingFor(forecastAgent, {
      forecastAddress: undefined,
      forecastCapabilities: [],
      executeCapabilities: [],
    });
    validateAgentBinding(readOnly, policy, 200n);

    expect(policy.forecastAuthority.agentIds).not.toEqual(policy.executionAuthority.agentIds);
    expect(policy.forecastAuthority.capabilities).not.toContain(ExecuteCapability.EXECUTE_AUTHORIZED_ACTION);
    expect(policy.executionAuthority.capabilities).not.toContain(ForecastCapability.SUBMIT_FORECAST as never);
  });

  it("C: API/MCP authentication does not grant capital or execution permission", () => {
    const apiOnly = bindingFor(executorAgent, {
      executeCapabilities: [],
      executorAddress: undefined,
      apiPrincipal: { transport: ApiTransport.MCP, principalId: "mcp:read-only" },
    });
    validateAgentBinding(apiOnly, policy, 200n);
    expect(() =>
      validateAuthorizedAction(actionFor(), {
        policy,
        binding: apiOnly,
        unitScaleRaw: UNIT_SCALE,
        now: 200n,
      })
    ).toThrow(/execute capability|executor address|executeAuthorizedAction/i);
  });

  it("D/E/F/G/H/I: rejects every authority expansion during attenuation", () => {
    const cases: Array<[string, MandatePolicy]> = [
      ["maxPerMarketRaw", { ...policy, capitalAuthority: { ...policy.capitalAuthority, maxPerMarketRaw: asCollateralRaw(2_000_000n) } }],
      ["totalBudgetRaw", { ...policy, capitalAuthority: { ...policy.capitalAuthority, totalBudgetRaw: asCollateralRaw(21_000_000n) } }],
      ["assets", { ...policy, marketScope: { ...policy.marketScope, assets: [MarketAsset.BTC, MarketAsset.ETH] } }],
      ["intervalsSec", { ...policy, marketScope: { ...policy.marketScope, intervalsSec: [300, 900] } }],
      ["expiresAt", { ...policy, temporalAuthority: { ...policy.temporalAuthority, expiresAt: 2_000n } }],
      ["revocation", { ...policy, revocation: { enabled: false, ownerOnly: true } }],
      ["minMarginBps", { ...policy, executionAuthority: { ...policy.executionAuthority, minMarginBps: 700 } }],
      ["capability", { ...policy, executionAuthority: { ...policy.executionAuthority, capabilities: [...policy.executionAuthority.capabilities, ExecuteCapability.GET_EXECUTION_STATUS] } }],
    ];
    for (const [field, expanded] of cases) {
      expect(() => assertSafeAttenuation(policy, expanded), field).toThrow();
    }

    const reduced = {
      ...policy,
      marketScope: { ...policy.marketScope, assets: [MarketAsset.BTC], intervalsSec: [300] },
      capitalAuthority: { ...policy.capitalAuthority, maxPerMarketRaw: asCollateralRaw(500_000n) },
      temporalAuthority: { ...policy.temporalAuthority, expiresAt: 800n },
      lifecycle: MandateLifecycle.PAUSED,
    };
    expect(() => assertSafeAttenuation(policy, reduced)).not.toThrow();
  });

  it("J: AuthorizedAction is immutable after issuance", () => {
    const action = actionFor();
    const changed = { ...action, maxPriceRaw: asPriceRaw(590_000n) };
    expect(() => assertAuthorizedActionImmutable(action, changed)).toThrow(/maxPriceRaw/);
    expect(Object.isFrozen(freezeAuthorizedAction(action))).toBe(true);
  });

  it("K: active/paused/expired/revoked/completed lifecycle controls future actions", () => {
    const activeAction = actionFor();
    expect(() => validateAuthorizedAction(activeAction, { policy, binding: bindingFor(executorAgent), unitScaleRaw: UNIT_SCALE, now: 200n })).not.toThrow();

    for (const lifecycle of [
      MandateLifecycle.PAUSED,
      MandateLifecycle.EXPIRED,
      MandateLifecycle.REVOKED,
      MandateLifecycle.COMPLETED,
    ]) {
      const changedPolicy = { ...policy, lifecycle };
      const changedAction = actionFor({ policyHash: mandatePolicyHash(changedPolicy) });
      expect(() => validateAuthorizedAction(changedAction, {
        policy: changedPolicy,
        binding: bindingFor(executorAgent, { policyHash: mandatePolicyHash(changedPolicy) }),
        unitScaleRaw: UNIT_SCALE,
        now: 200n,
      }), lifecycle).toThrow(/lifecycle|active|future|revoked|expired/i);
    }

    expect(effectiveMandateLifecycle({ ...policy, lifecycle: MandateLifecycle.ACTIVE }, 1_000n)).toBe(MandateLifecycle.EXPIRED);
    expect(effectiveMandateLifecycle({ ...policy, lifecycle: MandateLifecycle.COMPLETED }, 2_000n)).toBe(MandateLifecycle.COMPLETED);
    expect(() => assertLifecycleTransition(MandateLifecycle.COMPLETED, MandateLifecycle.ACTIVE)).toThrow();
  });

  it("L: enforces policy linkage, fixed-point spend, expiry, and duplicate action rejection", () => {
    const action = actionFor();
    expect(() => validateAuthorizedAction(action, {
      policy,
      binding: bindingFor(executorAgent),
      unitScaleRaw: UNIT_SCALE,
      now: 200n,
    })).not.toThrow();
    expect(() => validateAuthorizedAction({ ...action, maximumSpendRaw: asCollateralRaw(601n) }, {
      policy,
      binding: bindingFor(executorAgent),
      unitScaleRaw: UNIT_SCALE,
      now: 200n,
    })).toThrow(/maximumSpendRaw|spend/i);
    expect(() => validateAuthorizedAction({ ...action, policyHash: id("7") }, {
      policy,
      binding: bindingFor(executorAgent),
      unitScaleRaw: UNIT_SCALE,
      now: 200n,
    })).toThrow(/policy hash/i);
    expect(() => validateAuthorizedAction({ ...action, expiresAt: 1_001n }, {
      policy,
      binding: bindingFor(executorAgent),
      unitScaleRaw: UNIT_SCALE,
      now: 200n,
    })).toThrow(/expir/i);

    const ledger = new AuthorizedActionLedger();
    ledger.recordEffect(action);
    expect(ledger.hasEffect(action.actionId)).toBe(true);
    expect(() => ledger.recordEffect(action)).toThrow(/duplicate actionId/i);
  });

  it("M: revocation preserves historical Forecast/RFT/execution evidence", () => {
    const request: ForecastRequest = {
      forecastId: id("8"),
      circuitId: CIRCUIT_ID,
      marketId: MARKET_ID,
      asset: MarketAsset.BTC,
      intervalSec: 300,
      opensAt: 100n,
      expiresAt: 300n,
      forecastDeadline: 250n,
      reference: { referenceUpBps: 6100, referenceValid: true },
    };
    const submission: ForecastSubmission = {
      marketId: MARKET_ID,
      forecaster: forecastAgent.agentId,
      forecasterAddress: AGENT_FORECAST,
      probabilityUpBps: 7_200,
      generatedAt: 200n,
      validUntil: 250n,
      sourceType: AgentSourceType.AGENT,
      sourceVersion: "deterministic-test-v1",
      signature: "0x1234",
    };
    validateForecastRequest(request, policy, 200n);
    validateForecastSubmission(submission, request, policy, bindingFor(forecastAgent), 200n);

    const action = actionFor();
    const history = { request, submission, action, executionId: action.executionId };
    const revoked = revokeMandatePolicy(policy, OWNER, 200n);
    expect(revoked.lifecycle).toBe(MandateLifecycle.REVOKED);
    expect(policy.lifecycle).toBe(MandateLifecycle.ACTIVE);
    expect(history.submission.probabilityUpBps).toBe(7_200);
    expect(history.action.actionId).toBe(action.actionId);
    expect(history.executionId).toBe(action.executionId);
  });

  it("canonicalizes policy identity and formats the same policy for a human", () => {
    const hashA = mandatePolicyHash(policy);
    const hashB = mandatePolicyHash({
      ...policy,
      forecasters: [...policy.forecasters].reverse(),
      executors: [...policy.executors].reverse(),
      marketScope: { ...policy.marketScope, assets: [MarketAsset.BTC], intervalsSec: [300] },
    });
    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^0x[0-9a-f]{64}$/);

    const output = formatMandatePolicy(policy);
    expect(output).toContain("Alice");
    expect(output).toContain("Forecast");
    expect(output).toContain("execute");
    expect(output).toContain("BTC");
    expect(output).toContain("5m");
    expect(output).toContain("8 points");
    expect(output).toContain("$1/market");
    expect(output).toContain("$20 total");
    expect(output).toContain("expiresAt=1000");
    expect(output).toContain("may revoke");
    expect(iterationIdentity(CIRCUIT_ID, MARKET_ID)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("rejects reasoning fields from ForecastSubmission", () => {
    const request: ForecastRequest = {
      circuitId: CIRCUIT_ID,
      marketId: MARKET_ID,
      asset: MarketAsset.BTC,
      intervalSec: 300,
      opensAt: 100n,
      expiresAt: 300n,
    };
    const submission = {
      marketId: MARKET_ID,
      forecaster: forecastAgent.agentId,
      forecasterAddress: AGENT_FORECAST,
      probabilityUpBps: 7_200,
      generatedAt: 200n,
      validUntil: 250n,
      sourceType: AgentSourceType.AGENT,
      sourceVersion: "v1",
      signature: "0x1234",
      chainOfThought: "must never be persisted",
    } as ForecastSubmission & { chainOfThought: string };
    expect(() => validateForecastSubmission(submission, request, policy, bindingFor(forecastAgent), 200n)).toThrow(/reasoning|chain/i);
  });
});
