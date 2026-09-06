// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Outcome} from "./Enums.sol";

/// @notice RFTScoring
/// @notice Pure deterministic scoring library. All math is integer. Mirrors
///         prior core scoring exactly (INV-013).
library RFTScoring {
    uint16 internal constant BPS_MAX = 10_000;

    struct Reference {
        uint16 referenceUpBps; // 0..10000
        bool referenceValid;
    }

    struct Result {
        uint8 status; // TrialStatusLib.SCORED or VOIDED
        uint8 outcome; // Outcome.UP / DOWN / NONE
        uint32 forecastBrier; // bps^2
        uint32 marketBrier; // bps^2, 0 if reference invalid or voided
        int64 marketScoreDelta; // marketBrier - forecastBrier
    }

    /// @notice Score a finalized trial.
    /// @dev Pure function, no external calls. Tested for parity with
    ///      packages/core/src/scoring.ts.
    function scoreFinalized(
        uint16 pUpBps,
        Reference memory ref,
        uint8 outcome,
        bool voided
    ) internal pure returns (Result memory r) {
        if (voided) {
            r.status = 3; // VOIDED
            r.outcome = 0; // NONE
            r.forecastBrier = 0;
            r.marketBrier = 0;
            r.marketScoreDelta = 0;
            return r;
        }
        if (outcome != Outcome.UP && outcome != Outcome.DOWN) {
            revert("RFTScoring: outcome must be UP or DOWN for non-voided");
        }
        uint32 y = Outcome.toBps(outcome); // 10000 or 0
        uint32 p = uint32(pUpBps);
        uint32 dy = y > p ? y - p : p - y;
        r.forecastBrier = dy * dy;
        r.outcome = outcome;
        r.status = 2; // SCORED
        if (ref.referenceValid) {
            uint32 q = uint32(ref.referenceUpBps);
            uint32 dq = y > q ? y - q : q - y;
            r.marketBrier = dq * dq;
        } else {
            r.marketBrier = 0;
        }
        r.marketScoreDelta = int64(uint64(r.marketBrier)) - int64(uint64(r.forecastBrier));
    }
}
