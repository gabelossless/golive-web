// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VibeStreamSplitter
 * @notice Atomically splits ETH or USDC payments 75/25 between a creator and the platform.
 * @dev Deployed on Base (and EVM-compatible chains like Monad).
 *      The platform wallet is updatable by the owner with a 48-hour timelock
 *      to prevent immediate compromise if the owner key is exposed.
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract VibeStreamSplitter {
    // ─── State ───────────────────────────────────────────────────────────────

    address public owner;
    address public platformWallet;

    // Pending wallet update (timelock)
    address public pendingPlatformWallet;
    uint256 public walletUpdateAvailableAt;
    uint256 public constant TIMELOCK_PERIOD = 48 hours;

    // Split: 75 creator / 25 platform (out of 100)
    uint256 public constant CREATOR_BPS = 7500;  // 75%
    uint256 public constant PLATFORM_BPS = 2500; // 25%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // USDC on Base (official Circle deployment)
    address public constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // ─── Events ──────────────────────────────────────────────────────────────

    event TipSent(
        address indexed from,
        address indexed creator,
        address indexed token,    // address(0) = ETH
        uint256 creatorAmount,
        uint256 platformAmount
    );
    event WalletUpdateProposed(address newWallet, uint256 availableAt);
    event WalletUpdateConfirmed(address newWallet);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @param _platformWallet Initial platform payout wallet.
     */
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Zero address");
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Send an ETH tip. Splits 75% to creator, 25% to platform atomically.
     * @param creator The creator's wallet address.
     */
    function tipETH(address payable creator) external payable {
        require(msg.value > 0, "Zero tip");
        require(creator != address(0), "Invalid creator");
        require(creator != platformWallet, "Creator is platform");

        uint256 platformCut = (msg.value * PLATFORM_BPS) / BPS_DENOMINATOR;
        uint256 creatorCut  = msg.value - platformCut;

        // Transfer both in the same transaction → atomic, non-custodial
        (bool cOk, ) = creator.call{value: creatorCut}("");
        require(cOk, "Creator transfer failed");

        (bool pOk, ) = payable(platformWallet).call{value: platformCut}("");
        require(pOk, "Platform transfer failed");

        emit TipSent(msg.sender, creator, address(0), creatorCut, platformCut);
    }

    /**
     * @notice Send a USDC tip. Caller must approve this contract for `amount` first.
     * @param creator The creator's wallet address.
     * @param amount  USDC amount in 6-decimal units (e.g., 5_000_000 = $5.00).
     */
    function tipUSDC(address creator, uint256 amount) external {
        require(amount > 0, "Zero tip");
        require(creator != address(0), "Invalid creator");
        require(creator != platformWallet, "Creator is platform");

        uint256 platformCut = (amount * PLATFORM_BPS) / BPS_DENOMINATOR;
        uint256 creatorCut  = amount - platformCut;

        IERC20 usdc = IERC20(USDC_BASE);

        // Pull total from sender → contract → distribute (single approval flow)
        require(usdc.transferFrom(msg.sender, creator, creatorCut), "Creator USDC failed");
        require(usdc.transferFrom(msg.sender, platformWallet, platformCut), "Platform USDC failed");

        emit TipSent(msg.sender, creator, USDC_BASE, creatorCut, platformCut);
    }

    // ─── Admin: Wallet Update with 48h Timelock ───────────────────────────────

    /**
     * @notice Propose a new platform wallet. Must wait 48h before confirming.
     *         This prevents immediate damage if the owner key is compromised.
     */
    function proposePlatformWalletUpdate(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Zero address");
        pendingPlatformWallet = newWallet;
        walletUpdateAvailableAt = block.timestamp + TIMELOCK_PERIOD;
        emit WalletUpdateProposed(newWallet, walletUpdateAvailableAt);
    }

    /**
     * @notice Confirm the proposed wallet update after the 48h timelock has passed.
     */
    function confirmPlatformWalletUpdate() external onlyOwner {
        require(pendingPlatformWallet != address(0), "No pending update");
        require(block.timestamp >= walletUpdateAvailableAt, "Timelock not elapsed");
        platformWallet = pendingPlatformWallet;
        pendingPlatformWallet = address(0);
        walletUpdateAvailableAt = 0;
        emit WalletUpdateConfirmed(platformWallet);
    }

    /**
     * @notice Transfer contract ownership (for multisig migration).
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Emergency: recover any ERC20 accidentally sent to this contract.
     *         Only recovers tokens to the owner — cannot drain user tips (they go direct).
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    // ─── Reject plain ETH sends ───────────────────────────────────────────────
    receive() external payable { revert("Use tipETH()"); }
    fallback() external payable { revert("Use tipETH()"); }
}
