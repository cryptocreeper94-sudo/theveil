// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DSC Governance Timelock
 * @notice 48-hour delay before governance actions take effect
 * @dev Wrapper around OpenZeppelin's TimelockController
 * 
 * Usage:
 * 1. Deploy TimelockController with proposers and executors
 * 2. Transfer wDWC ownership to this timelock
 * 3. All upgrades/changes now require 48hr delay
 * 
 * This ensures:
 * - Community can review proposed changes before execution
 * - No surprise changes to the bridge contract
 * - Time to react if malicious proposal is submitted
 */
contract DSCTimelock is TimelockController {
    /**
     * @notice Deploy the timelock with 48-hour minimum delay
     * @param proposers Addresses that can propose actions (multi-sig wallets)
     * @param executors Addresses that can execute after delay (can be same as proposers)
     * @param admin Admin address (set to address(0) to renounce admin role)
     */
    constructor(
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(
        2 days,        // 48-hour minimum delay
        proposers,     // Who can propose
        executors,     // Who can execute
        admin          // Admin (can change delay, add/remove roles)
    ) {}
    
    /**
     * @notice Get the minimum delay in human-readable format
     */
    function getDelayHours() external view returns (uint256) {
        return getMinDelay() / 1 hours;
    }
}
