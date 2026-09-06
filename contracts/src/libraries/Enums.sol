// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Outcome
/// @notice Canonical outcome enum for Resolved Forecast Trials.
library Outcome {
    uint8 internal constant NONE = 0;
    uint8 internal constant UP = 1;
    uint8 internal constant DOWN = 2;

    function toBps(uint8 outcome) internal pure returns (uint16) {
        if (outcome == UP) return 10000;
        if (outcome == DOWN) return 0;
        revert("Outcome: NONE has no bps");
    }
}

/// @title TrialStatus
/// @notice Canonical trial lifecycle. NONE → COMMITTED → (SCORED | VOIDED).
library TrialStatusLib {
    uint8 internal constant NONE = 0;
    uint8 internal constant COMMITTED = 1;
    uint8 internal constant SCORED = 2;
    uint8 internal constant VOIDED = 3;
}

/// @title ActionIntent
/// @notice What the forecaster chose to do at commit time.
library ActionIntentLib {
    uint8 internal constant NONE = 0;
    uint8 internal constant BUY_UP = 1;
    uint8 internal constant BUY_DOWN = 2;
    uint8 internal constant ABSTAIN = 3;
}
