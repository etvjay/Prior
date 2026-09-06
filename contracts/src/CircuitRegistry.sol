// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CircuitRegistry {
  enum Status { DRAFT, AUTHORIZED, ACTIVE, PAUSED, STOPPED, COMPLETE, EXPIRED, REVOKED }
  struct Intent {
    bytes32 circuitId; address owner; address forecaster; uint8 marketClass; uint16 targetWindows;
    uint128 totalBudget; uint128 maxPerMarket; uint16 minMarginBps; uint8 maxConsecutiveLosses;
    uint64 startsAt; uint64 expiresAt; uint256 allowedActionsBitmap;
  }
  struct Runtime { Status status; uint16 completed; uint16 missed; uint16 abstained; uint8 consecutiveLosses; uint128 reservedSpend; }
  mapping(bytes32 => Intent) public intents;
  mapping(bytes32 => Runtime) public runtime;
  mapping(bytes32 => mapping(bytes32 => bool)) public executionUsed;
  address public executor;
  address public immutable admin;

  error Exists(); error NotOwner(); error InvalidIntent(); error InvalidState(); error NotAuthorized(); error DuplicateExecution(); error BudgetExceeded(); error PerMarketExceeded();
  event CircuitCreated(bytes32 indexed circuitId, address indexed owner, uint8 marketClass, uint16 targetWindows);
  event CircuitAuthorized(bytes32 indexed circuitId); event CircuitStatusChanged(bytes32 indexed circuitId, Status status);
  event ExecutionReserved(bytes32 indexed circuitId, bytes32 indexed marketId, uint128 spend);
  event IterationAdvanced(bytes32 indexed circuitId, bytes32 indexed marketId, bool missed, bool abstained, bool loss);

  constructor() { admin = msg.sender; }
  modifier onlyOwner(bytes32 id) { if (intents[id].owner != msg.sender) revert NotOwner(); _; }

  function create(Intent calldata i) external returns (bytes32 id) {
    if (i.owner != msg.sender || i.targetWindows == 0 || i.maxPerMarket == 0 || i.totalBudget < i.maxPerMarket || i.expiresAt <= i.startsAt) revert InvalidIntent();
    id = keccak256(abi.encode(block.chainid, address(this), msg.sender, i.marketClass, i.startsAt, i.targetWindows));
    if (intents[id].owner != address(0)) revert Exists();
    intents[id] = i; intents[id].circuitId = id; runtime[id].status = Status.DRAFT;
    emit CircuitCreated(id, msg.sender, i.marketClass, i.targetWindows);
  }
  function authorize(bytes32 id) external onlyOwner(id) { if (runtime[id].status != Status.DRAFT) revert InvalidState(); runtime[id].status = Status.AUTHORIZED; emit CircuitAuthorized(id); }
  function activate(bytes32 id) external onlyOwner(id) { if (runtime[id].status != Status.AUTHORIZED) revert InvalidState(); runtime[id].status = Status.ACTIVE; emit CircuitStatusChanged(id, Status.ACTIVE); }
  function pause(bytes32 id) external onlyOwner(id) { if (runtime[id].status != Status.ACTIVE) revert InvalidState(); runtime[id].status = Status.PAUSED; emit CircuitStatusChanged(id, Status.PAUSED); }
  function resume(bytes32 id) external onlyOwner(id) { if (runtime[id].status != Status.PAUSED) revert InvalidState(); runtime[id].status = Status.ACTIVE; emit CircuitStatusChanged(id, Status.ACTIVE); }
  function stop(bytes32 id) external onlyOwner(id) { if (runtime[id].status != Status.ACTIVE && runtime[id].status != Status.PAUSED) revert InvalidState(); runtime[id].status = Status.STOPPED; emit CircuitStatusChanged(id, Status.STOPPED); }
  function revoke(bytes32 id) external onlyOwner(id) { if (runtime[id].status == Status.COMPLETE || runtime[id].status == Status.REVOKED) revert InvalidState(); runtime[id].status = Status.REVOKED; emit CircuitStatusChanged(id, Status.REVOKED); }

  function setExecutor(address e) external { if (msg.sender != admin || executor != address(0)) revert NotAuthorized(); executor = e; }
  function reserveExecution(bytes32 id, bytes32 marketId, uint128 spend) external returns (bool) {
    if (msg.sender != executor) revert NotAuthorized();
    Runtime storage r = runtime[id]; Intent memory i = intents[id];
    if (r.status != Status.ACTIVE) revert InvalidState();
    if (block.timestamp < i.startsAt || block.timestamp >= i.expiresAt) revert InvalidState();
    if (executionUsed[id][marketId]) revert DuplicateExecution();
    if (spend > i.maxPerMarket) revert PerMarketExceeded();
    if (uint256(r.reservedSpend) + spend > i.totalBudget) revert BudgetExceeded();
    executionUsed[id][marketId] = true; r.reservedSpend += spend;
    emit ExecutionReserved(id, marketId, spend); return true;
  }

  function advance(bytes32 id, bytes32 marketId, bool missed, bool abstained, bool loss) external {
    Runtime storage r = runtime[id]; Intent memory i = intents[id];
    if (r.status != Status.ACTIVE && r.status != Status.PAUSED) revert InvalidState();
    r.completed += 1; if (missed) r.missed += 1; if (abstained) r.abstained += 1;
    if (loss) r.consecutiveLosses += 1; else r.consecutiveLosses = 0;
    if (r.completed >= i.targetWindows) r.status = Status.COMPLETE;
    else if (r.consecutiveLosses >= i.maxConsecutiveLosses) r.status = Status.PAUSED;
    emit IterationAdvanced(id, marketId, missed, abstained, loss);
  }
}
