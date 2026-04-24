// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Wrapped DarkWave Coin (wDWC)
 * @notice ERC-20 representation of DWC bridged from DarkWave Smart Chain (DSC)
 * @dev Governance-supervised with emergency pause capability
 * 
 * Security Features:
 * - Emergency pause: Freeze bridge operations if issues detected
 * - Multi-sig ready: Transfer ownership to Gnosis Safe for production
 * - Version tracking: All implementations tracked for compatibility
 * 
 * Bridge Flow:
 * 1. User locks DWC on DarkWave Smart Chain
 * 2. Bridge operator calls mint() to create wDWC on Ethereum
 * 3. User can transfer wDWC freely on Ethereum
 * 4. To bridge back: user calls bridgeBurn(), operator releases DWC on DSC
 */
contract WDWC is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable 
{
    /// @notice Contract version for compatibility tracking
    uint256 public constant VERSION = 1;
    
    /// @notice Emitted when wDWC is minted after DWC lock on DSC
    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed lockId);
    
    /// @notice Emitted when wDWC is burned to release DWC on DSC
    event BridgeBurn(address indexed from, uint256 amount, string dscAddress);
    
    /// @notice Emitted when contract maintenance is performed
    event ContractMaintenance(address indexed newImplementation, uint256 newVersion);
    
    /// @notice Tracks processed lock IDs to prevent double-minting
    mapping(bytes32 => bool) public processedLocks;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the contract (replaces constructor for proxy)
     * @param bridgeOperator Address of the bridge operator (multi-sig recommended)
     */
    function initialize(address bridgeOperator) public initializer {
        __ERC20_init("Wrapped DarkWave Coin", "wDWC");
        __ERC20Burnable_init();
        __Ownable_init(bridgeOperator);
        __Pausable_init();
        __UUPSUpgradeable_init();
    }
    
    /**
     * @notice Pause bridge operations (emergency stop)
     * @dev Only callable by owner. Use in case of security issues.
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Resume bridge operations
     * @dev Only callable by owner after issue is resolved.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Mint wDWC after DWC is locked on DarkWave Smart Chain
     * @param to Recipient address on Ethereum
     * @param amount Amount to mint (18 decimals, matches DWC)
     * @param lockId Unique lock ID from DSC to prevent double-minting
     */
    function mint(address to, uint256 amount, bytes32 lockId) external onlyOwner whenNotPaused {
        require(!processedLocks[lockId], "Lock already processed");
        processedLocks[lockId] = true;
        _mint(to, amount);
        emit BridgeMint(to, amount, lockId);
    }
    
    /**
     * @notice Burn wDWC to release DWC on DarkWave Smart Chain
     * @param amount Amount to burn
     * @param dscAddress Recipient address on DSC
     */
    function bridgeBurn(uint256 amount, string calldata dscAddress) external whenNotPaused {
        require(bytes(dscAddress).length > 0, "Invalid DSC address");
        _burn(msg.sender, amount);
        emit BridgeBurn(msg.sender, amount, dscAddress);
    }
    
    /**
     * @notice Check if a lock ID has been processed
     * @param lockId The lock ID to check
     */
    function isLockProcessed(bytes32 lockId) external view returns (bool) {
        return processedLocks[lockId];
    }
    
    /**
     * @notice Transfer bridge operator role
     * @param newOperator New bridge operator address
     */
    function transferBridgeOperator(address newOperator) external onlyOwner {
        transferOwnership(newOperator);
    }
    
    /**
     * @notice Required for governance - only owner can authorize maintenance
     * @param newImplementation Address of new implementation contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        emit ContractMaintenance(newImplementation, VERSION + 1);
    }
    
    /**
     * @notice Get the current implementation version
     */
    function getVersion() external pure returns (uint256) {
        return VERSION;
    }
    
    /**
     * @notice Check if bridge operations are paused
     */
    function isPaused() external view returns (bool) {
        return paused();
    }
}
