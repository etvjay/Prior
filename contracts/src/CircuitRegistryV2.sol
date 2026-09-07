// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RFTRegistry} from "./RFTRegistry.sol";
import {TrialStatusLib} from "./libraries/Enums.sol";

/// @title CircuitRegistryV2
/// @notice Versioned Circuit authority with canonical Circuit-to-RFT iteration bindings.
/// @dev CircuitRegistry (V1) is intentionally unchanged. This registry is a fresh
///      protocol boundary because binding and iteration state are new canonical data.
contract CircuitRegistryV2 {
  enum Status {
    DRAFT,
    AUTHORIZED,
    ACTIVE,
    PAUSED,
    STOPPED,
    COMPLETE,
    EXPIRED,
    REVOKED
  }

  struct Intent {
    bytes32 circuitId;
    address owner;
    address forecaster;
    uint8 marketClass;
    uint16 targetWindows;
    uint128 totalBudget;
    uint128 maxPerMarket;
    uint16 minMarginBps;
    uint8 maxConsecutiveLosses;
    uint64 startsAt;
    uint64 expiresAt;
    uint256 allowedActionsBitmap;
  }

  struct Runtime {
    Status status;
    uint16 completed;
    uint16 missed;
    uint16 abstained;
    uint8 consecutiveLosses;
    uint128 reservedSpend;
  }

  struct CircuitIteration {
    bytes32 iterationId;
    bytes32 circuitId;
    bytes32 marketId;
    bytes32 trialId;
    bool bound;
    bool processed;
    bool missed;
  }

  mapping(bytes32 => Intent) public intents;
  mapping(bytes32 => Runtime) public runtime;
  mapping(bytes32 => mapping(bytes32 => bool)) public executionUsed;

  /// @notice Canonical Circuit × market Forecast/RFT association.
  mapping(bytes32 => mapping(bytes32 => bytes32)) public trialForIteration;
  /// @notice Canonical exactly-once Circuit × market iteration marker.
  mapping(bytes32 => mapping(bytes32 => bool)) public processedMarket;

  mapping(bytes32 => CircuitIteration) public iterations;

  RFTRegistry public immutable rftRegistry;
  address public immutable admin;
  address public executor;

  error InvalidRFTRegistry();
  error Exists();
  error UnknownCircuit();
  error NotOwner();
  error InvalidIntent();
  error InvalidState();
  error NotAuthorized();
  error DuplicateExecution();
  error BudgetExceeded();
  error PerMarketExceeded();
  error TrialAlreadyBound();
  error MarketAlreadyProcessed();
  error UnknownTrial();
  error TrialNotCommitted();
  error TrialMarketMismatch();
  error TrialForecasterMismatch();
  error TrialRequired();
  error DuplicateMarketIteration();

  event CircuitCreated(
    bytes32 indexed circuitId, address indexed owner, uint8 marketClass, uint16 targetWindows
  );
  event CircuitAuthorized(bytes32 indexed circuitId);
  event CircuitStatusChanged(bytes32 indexed circuitId, Status status);
  event ExecutionReserved(bytes32 indexed circuitId, bytes32 indexed marketId, uint128 spend);
  event CircuitTrialBound(
    bytes32 indexed circuitId, bytes32 indexed marketId, bytes32 indexed trialId, address forecaster
  );
  event IterationAdvanced(
    bytes32 indexed circuitId, bytes32 indexed marketId, bool missed, bool abstained, bool loss
  );

  constructor(address rftRegistry_) {
    if (rftRegistry_ == address(0)) revert InvalidRFTRegistry();
    rftRegistry = RFTRegistry(rftRegistry_);
    admin = msg.sender;
  }

  modifier onlyOwner(bytes32 circuitId) {
    address owner = intents[circuitId].owner;
    if (owner == address(0)) revert UnknownCircuit();
    if (owner != msg.sender) revert NotOwner();
    _;
  }

  function create(Intent calldata intent) external returns (bytes32 circuitId) {
    if (
      intent.owner != msg.sender || intent.targetWindows == 0 || intent.maxPerMarket == 0
        || intent.totalBudget < intent.maxPerMarket || intent.expiresAt <= intent.startsAt
    ) revert InvalidIntent();

    circuitId = keccak256(
      abi.encode(
        block.chainid, address(this), msg.sender, intent.marketClass, intent.startsAt, intent.targetWindows
      )
    );
    if (intents[circuitId].owner != address(0)) revert Exists();
    intents[circuitId] = intent;
    intents[circuitId].circuitId = circuitId;
    runtime[circuitId].status = Status.DRAFT;
    emit CircuitCreated(circuitId, msg.sender, intent.marketClass, intent.targetWindows);
  }

  function authorize(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status != Status.DRAFT) revert InvalidState();
    runtime[circuitId].status = Status.AUTHORIZED;
    emit CircuitAuthorized(circuitId);
  }

  function activate(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status != Status.AUTHORIZED) revert InvalidState();
    runtime[circuitId].status = Status.ACTIVE;
    emit CircuitStatusChanged(circuitId, Status.ACTIVE);
  }

  function pause(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status != Status.ACTIVE) revert InvalidState();
    runtime[circuitId].status = Status.PAUSED;
    emit CircuitStatusChanged(circuitId, Status.PAUSED);
  }

  function resume(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status != Status.PAUSED) revert InvalidState();
    runtime[circuitId].status = Status.ACTIVE;
    emit CircuitStatusChanged(circuitId, Status.ACTIVE);
  }

  function stop(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status != Status.ACTIVE && runtime[circuitId].status != Status.PAUSED) {
      revert InvalidState();
    }
    runtime[circuitId].status = Status.STOPPED;
    emit CircuitStatusChanged(circuitId, Status.STOPPED);
  }

  function revoke(bytes32 circuitId) external onlyOwner(circuitId) {
    if (runtime[circuitId].status == Status.COMPLETE || runtime[circuitId].status == Status.REVOKED) {
      revert InvalidState();
    }
    runtime[circuitId].status = Status.REVOKED;
    emit CircuitStatusChanged(circuitId, Status.REVOKED);
  }

  function setExecutor(address executor_) external {
    if (msg.sender != admin || executor != address(0)) revert NotAuthorized();
    executor = executor_;
  }

  function reserveExecution(bytes32 circuitId, bytes32 marketId, uint128 spend) external returns (bool) {
    if (msg.sender != executor) revert NotAuthorized();
    Runtime storage currentRuntime = runtime[circuitId];
    Intent memory intent = intents[circuitId];
    if (currentRuntime.status != Status.ACTIVE) revert InvalidState();
    if (block.timestamp < intent.startsAt || block.timestamp >= intent.expiresAt) revert InvalidState();
    if (executionUsed[circuitId][marketId]) revert DuplicateExecution();
    if (spend > intent.maxPerMarket) revert PerMarketExceeded();
    if (uint256(currentRuntime.reservedSpend) + spend > intent.totalBudget) revert BudgetExceeded();
    executionUsed[circuitId][marketId] = true;
    currentRuntime.reservedSpend += spend;
    emit ExecutionReserved(circuitId, marketId, spend);
    return true;
  }

  /// @notice Bind one already committed canonical RFT to one Circuit iteration.
  /// @dev V2 intentionally requires COMMITTED status so a terminal historical RFT
  ///      cannot be introduced as a new Circuit iteration.
  function bindTrial(bytes32 circuitId, bytes32 marketId, bytes32 trialId) external onlyOwner(circuitId) {
    Intent memory intent = intents[circuitId];
    Runtime storage currentRuntime = runtime[circuitId];
    if (currentRuntime.status != Status.ACTIVE) revert InvalidState();
    if (block.timestamp < intent.startsAt || block.timestamp >= intent.expiresAt) revert InvalidState();
    if (processedMarket[circuitId][marketId]) revert MarketAlreadyProcessed();
    if (trialForIteration[circuitId][marketId] != bytes32(0)) revert TrialAlreadyBound();

    RFTRegistry.Trial memory trial = rftRegistry.getTrial(trialId);
    if (trial.status == TrialStatusLib.NONE) revert UnknownTrial();
    if (trial.status != TrialStatusLib.COMMITTED) revert TrialNotCommitted();
    if (trial.marketId != marketId) revert TrialMarketMismatch();
    if (trial.forecaster != intent.forecaster) revert TrialForecasterMismatch();

    bytes32 iterationId = iterationIdentity(circuitId, marketId);
    trialForIteration[circuitId][marketId] = trialId;
    iterations[iterationId] = CircuitIteration({
      iterationId: iterationId,
      circuitId: circuitId,
      marketId: marketId,
      trialId: trialId,
      bound: true,
      processed: false,
      missed: false
    });
    emit CircuitTrialBound(circuitId, marketId, trialId, trial.forecaster);
  }

  /// @notice Return the deterministic identity for a Circuit × market iteration.
  /// @dev The chain ID and this V2 registry address make the identity domain explicit.
  function iterationIdentity(bytes32 circuitId, bytes32 marketId) public view returns (bytes32) {
    return keccak256(abi.encode(block.chainid, address(this), circuitId, marketId));
  }

  function getIteration(bytes32 circuitId, bytes32 marketId) external view returns (CircuitIteration memory) {
    return iterations[iterationIdentity(circuitId, marketId)];
  }

  /// @notice Advance one Circuit market exactly once.
  /// @dev processedMarket is written before the runtime transition and any future
  ///      external effect can be added after this boundary without moving the marker.
  function advance(bytes32 circuitId, bytes32 marketId, bool missed, bool abstained, bool loss)
    external
    onlyOwner(circuitId)
  {
    Runtime storage currentRuntime = runtime[circuitId];
    Intent memory intent = intents[circuitId];
    if (currentRuntime.status != Status.ACTIVE && currentRuntime.status != Status.PAUSED) {
      revert InvalidState();
    }
    if (block.timestamp < intent.startsAt || block.timestamp >= intent.expiresAt) revert InvalidState();
    if (processedMarket[circuitId][marketId]) revert DuplicateMarketIteration();

    bytes32 trialId = trialForIteration[circuitId][marketId];
    if (!missed && trialId == bytes32(0)) revert TrialRequired();

    // Canonical exactly-once marker: set before all subsequent transition/event work.
    processedMarket[circuitId][marketId] = true;
    bytes32 iterationId = iterationIdentity(circuitId, marketId);
    CircuitIteration storage iteration = iterations[iterationId];
    if (iteration.bound) {
      iteration.processed = true;
      iteration.missed = missed;
    } else {
      iterations[iterationId] = CircuitIteration({
        iterationId: iterationId,
        circuitId: circuitId,
        marketId: marketId,
        trialId: bytes32(0),
        bound: false,
        processed: true,
        missed: true
      });
    }

    currentRuntime.completed += 1;
    if (missed) currentRuntime.missed += 1;
    if (abstained) currentRuntime.abstained += 1;
    if (loss) currentRuntime.consecutiveLosses += 1;
    else currentRuntime.consecutiveLosses = 0;
    if (currentRuntime.completed >= intent.targetWindows) {
      currentRuntime.status = Status.COMPLETE;
    } else if (currentRuntime.consecutiveLosses >= intent.maxConsecutiveLosses) {
      currentRuntime.status = Status.PAUSED;
    }
    emit IterationAdvanced(circuitId, marketId, missed, abstained, loss);
  }
}
