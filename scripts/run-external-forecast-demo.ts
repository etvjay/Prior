import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import {
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
  type ForecastSubmissionWire,
} from "@prior/forecast-protocol";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE_PATH = resolve(ROOT, "evidence", "external-forecast-agent.json");
const BASE_ENV = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "/home/ubuntu",
  PNPM_HOME: process.env.PNPM_HOME ?? "",
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function freePort(): Promise<number> {
  const server = createNetServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen());
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("could not reserve a local TCP port");
  const port = address.port;
  await new Promise<void>((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
  return port;
}

function childEnvironment(extra: Record<string, string>): NodeJS.ProcessEnv {
  return { ...BASE_ENV, ...extra };
}

function spawnPnpm(args: readonly string[], env: NodeJS.ProcessEnv): ChildProcessWithoutNullStreams {
  return spawn("pnpm", args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
}

async function waitForHealth(url: string, child: ChildProcessWithoutNullStreams): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`provider server exited before health check (${child.exitCode})`);
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // The next iteration performs another real health check.
    }
    await delay(50);
  }
  throw new Error("provider server did not become healthy");
}

function collect(child: ChildProcessWithoutNullStreams): { stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk.toString("utf8")));
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString("utf8")));
  return { stdout, stderr };
}

async function waitForExit(child: ChildProcessWithoutNullStreams): Promise<number> {
  return new Promise<number>((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolveExit(code ?? 1));
  });
}

async function runAgent(baseUrl: string, profile: "A" | "B"): Promise<any> {
  const child = spawnPnpm(
    ["exec", "tsx", "packages/forecast-agent/src/main.ts"],
    childEnvironment({ PRIOR_PROVIDER_URL: baseUrl, FORECAST_PROVIDER_PROFILE: profile }),
  );
  const output = collect(child);
  const code = await waitForExit(child);
  const text = output.stdout.join("");
  const match = text.match(/EXTERNAL_FORECAST_RESULT=(\{.*\})/s);
  if (code !== 0 || match === null) {
    throw new Error(`external Forecast agent ${profile} failed: ${output.stderr.join("").trim() || text.trim()}`);
  }
  return JSON.parse(match[1]) as any;
}

async function tamperSignature(baseUrl: string, submission: ForecastSubmissionWire): Promise<{ status: number; code: string }> {
  const tampered = {
    ...submission,
    probabilityUpBps: submission.probabilityUpBps + 1,
  };
  // Keep the old signature deliberately: this is the domain-binding negative case.
  const response = await fetch(`${baseUrl}/v1/forecast-submissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tampered),
  });
  const body = (await response.json()) as { code?: string };
  return { status: response.status, code: body.code ?? "" };
}

function providerResult(agent: any): Record<string, unknown> {
  return {
    key: agent.request.provider.displayName.endsWith("B") ? "B" : "A",
    providerIdentity: agent.request.provider,
    providerSessionIdentity: {
      sessionId: agent.request.sessionId,
      transportPrincipal: agent.acceptance.transportPrincipal,
    },
    requestId: agent.request.requestId,
    forecaster: agent.request.forecaster,
    forecastAddress: agent.request.forecasterAddress,
    probabilityUpBps: agent.submission.probabilityUpBps,
    generatedAt: agent.submission.generatedAt,
    submittedAt: agent.acceptance.submittedAt,
    replaySubmissionId: agent.replay.submissionId,
    readbackSubmissionId: agent.readback.submissionId,
    classification: "END_TO_END_VERIFIED",
  };
}

async function main(): Promise<void> {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawnPnpm(
    ["exec", "tsx", "packages/forecast-provider-server/src/server.ts"],
    childEnvironment({ PORT: String(port) }),
  );
  const serverOutput = collect(server);
  try {
    await waitForHealth(baseUrl, server);
    const agentA = await runAgent(baseUrl, "A");
    const agentB = await runAgent(baseUrl, "B");
    const tampered = await tamperSignature(baseUrl, agentA.submission as ForecastSubmissionWire);

    const readbackExact = JSON.stringify(agentA.readback) === JSON.stringify(agentA.acceptance) && JSON.stringify(agentB.readback) === JSON.stringify(agentB.acceptance);
    const replayExact = agentA.replay.submissionId === agentA.acceptance.submissionId && agentB.replay.submissionId === agentB.acceptance.submissionId;
    const attributionExact =
      agentA.acceptance.provider.providerId === FIXTURE_PROVIDER_A.provider.providerId &&
      agentB.acceptance.provider.providerId === FIXTURE_PROVIDER_B.provider.providerId &&
      agentA.acceptance.forecasterAddress === FIXTURE_PROVIDER_A.forecasterAddress &&
      agentB.acceptance.forecasterAddress === FIXTURE_PROVIDER_B.forecasterAddress;
    const unauthorizedExact =
      agentA.unauthorizedExecution.status === "REJECTED_AUTHORITY" &&
      agentA.unauthorizedExecution.executionAuthority === false &&
      agentB.unauthorizedExecution.status === "REJECTED_AUTHORITY" &&
      agentB.unauthorizedExecution.executionAuthority === false;
    const signatureNegativeExact = tampered.status === 422 && tampered.code === "SIGNATURE_DOMAIN_MISMATCH";

    if (!readbackExact || !replayExact || !attributionExact || !unauthorizedExact || !signatureNegativeExact) {
      throw new Error("external Forecast demo assertions failed");
    }

    const primary = agentA;
    const evidence = {
      milestone: "M4.3",
      status: "EXTERNAL_FIXTURE_PATH_VERIFIED_WITH_LIVE_GATES_BLOCKED",
      classification: "PARTIAL_END_TO_END_VERIFIED",
      evidenceCeiling: "X2_EXTERNAL_FIXTURE_ONLY",
      protocolVersion: primary.request.protocolVersion,
      agentIdentity: {
        agentId: primary.request.forecaster,
        label: "FIXTURE_FORECASTER_IDENTITY",
        sourceType: primary.submission.sourceType,
        classification: "FIXTURE_NOT_REAL",
      },
      forecastAddress: primary.request.forecasterAddress,
      forecastAddressLabel: "FIXTURE_ADDRESS_NOT_REAL_WALLET",
      providerIdentity: primary.request.provider,
      providerSessionIdentity: {
        sessionId: primary.request.sessionId,
        transportPrincipal: primary.acceptance.transportPrincipal,
      },
      circuitId: primary.request.circuitId,
      marketId: primary.request.marketId,
      requestId: primary.request.requestId,
      requestTimestamps: {
        opensAt: primary.request.opensAt,
        expiresAt: primary.request.expiresAt,
        forecastDeadline: primary.request.forecastDeadline,
        nonce: primary.request.nonce,
      },
      marketReference: null,
      marketReferenceStatus: "BLOCKED_EXTERNAL",
      probabilityUpBps: primary.submission.probabilityUpBps,
      generationTimestamp: primary.submission.generatedAt,
      submissionTimestamp: primary.acceptance.submittedAt,
      commitTx: null,
      commitBlock: null,
      commitmentStatus: "BLOCKED_EXTERNAL",
      sourceType: primary.submission.sourceType,
      sourceVersion: primary.submission.sourceVersion,
      circuitDecision: { value: null, status: "UNAVAILABLE_NOT_EVALUATED" },
      executionAuthority: false,
      unauthorizedExecutionAttempt: primary.unauthorizedExecution,
      rftTrialId: null,
      rftStatus: "BLOCKED_EXTERNAL",
      providerIndependence: [providerResult(agentA), providerResult(agentB)],
      gates: {
        A: { status: "PASS", classification: "END_TO_END_VERIFIED", detail: "separate agent/server HTTP request and response" },
        B: { status: "PASS", classification: "END_TO_END_VERIFIED", detail: "protocol request identity and marketId binding parsed at server" },
        C: { status: "PASS", classification: "END_TO_END_VERIFIED", detail: "provider/session/signer attribution plus core readback" },
        D: { status: "NOT_CLAIMED", classification: "NOT_CLAIMED", detail: "deterministic strategy is an integration fixture, not intelligence evidence" },
        E: { status: "BLOCKED_EXTERNAL", classification: "BLOCKED_EXTERNAL", detail: "no live DreamDEX market reference asserted by this demo" },
        F: { status: "BLOCKED_EXTERNAL", classification: "BLOCKED_EXTERNAL", detail: "no funded wallet/signing key and no onchain Forecast commitment" },
        G: { status: replayExact && signatureNegativeExact ? "PASS" : "FAIL", classification: replayExact && signatureNegativeExact ? "END_TO_END_VERIFIED" : "BLOCKED_EXTERNAL", detail: "exact replay is idempotent and tampered sign material is rejected" },
        H: { status: unauthorizedExact ? "PASS" : "FAIL", classification: unauthorizedExact ? "END_TO_END_VERIFIED" : "BLOCKED_EXTERNAL", detail: "execution request returns REJECTED_AUTHORITY" },
      },
      live: {
        marketDiscovery: null,
        eligibleMarket: null,
        commitTx: null,
        commitBlock: null,
        chainId: null,
      },
      demo: {
        transport: "HTTP localhost",
        separateProcesses: true,
        server: "packages/forecast-provider-server/src/server.ts",
        agent: "packages/forecast-agent/src/main.ts",
        tamperedSignature: tampered,
        serverReadyLineObserved: serverOutput.stdout.join("").includes("FORECAST_PROVIDER_SERVER_READY="),
      },
      redactions: ["No secret values read or printed; no private key/RPC credential included."],
    };
    await writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    // Verify the persisted artifact before closeout.
    JSON.parse(await readFile(EVIDENCE_PATH, "utf8"));
    console.log(`external Forecast evidence -> ${EVIDENCE_PATH}`);
    console.log(JSON.stringify({ status: evidence.status, classification: evidence.classification, gates: evidence.gates }));
  } finally {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await waitForExit(server).catch(() => undefined);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "external Forecast demo failed");
  process.exitCode = 1;
});
