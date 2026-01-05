// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MoonDistributor
 * @notice Merkle-based token distributor for r/CryptoCurrency karma rewards
 * @dev Each distribution round has its own merkle root. Users claim by providing proof.
 */
contract MoonDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Distribution {
        bytes32 merkleRoot;
        address token;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 expirationTime;
        bool isSwept;
    }

    // Round ID => Distribution
    mapping(uint256 => Distribution) public distributions;

    // Round ID => (Leaf Index => Claimed bit)
    // Uses bitmap for gas efficiency
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMap;

    event DistributionCreated(
        uint256 indexed roundId,
        address indexed token,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint256 expirationTime
    );

    event Claimed(
        uint256 indexed roundId,
        uint256 indexed index,
        address indexed account,
        uint256 amount
    );

    event Swept(
        uint256 indexed roundId,
        address indexed token,
        uint256 amount
    );

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @notice Create a new distribution round
     * @param _roundId The karma round ID (matches off-chain data)
     * @param _merkleRoot Root of the merkle tree containing all claims
     * @param _token Token to distribute (MOON address)
     * @param _totalAmount Total tokens to lock for this round
     * @param _durationDays How long claims are open (e.g., 90 days)
     */
    function createDistribution(
        uint256 _roundId,
        bytes32 _merkleRoot,
        address _token,
        uint256 _totalAmount,
        uint256 _durationDays
    ) external onlyOwner {
        require(distributions[_roundId].expirationTime == 0, "Round exists");
        require(_merkleRoot != bytes32(0), "Invalid root");
        require(_totalAmount > 0, "Invalid amount");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");

        uint256 expiration = block.timestamp + (_durationDays * 1 days);

        distributions[_roundId] = Distribution({
            merkleRoot: _merkleRoot,
            token: _token,
            totalAmount: _totalAmount,
            claimedAmount: 0,
            expirationTime: expiration,
            isSwept: false
        });

        // Transfer tokens from owner to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _totalAmount);

        emit DistributionCreated(_roundId, _token, _merkleRoot, _totalAmount, expiration);
    }

    /**
     * @notice Check if a specific claim index has been claimed
     */
    function isClaimed(uint256 _roundId, uint256 _index) public view returns (bool) {
        uint256 wordIndex = _index / 256;
        uint256 bitIndex = _index % 256;
        uint256 word = claimedBitMap[_roundId][wordIndex];
        uint256 mask = (1 << bitIndex);
        return word & mask == mask;
    }

    /**
     * @notice Claim tokens for a distribution round
     * @param _roundId The round to claim from
     * @param _index Leaf index in the merkle tree
     * @param _account Address to receive tokens (must match proof)
     * @param _amount Amount to claim (must match proof)
     * @param _merkleProof Proof of inclusion in the tree
     */
    function claim(
        uint256 _roundId,
        uint256 _index,
        address _account,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        Distribution storage dist = distributions[_roundId];

        require(dist.expirationTime > 0, "Round does not exist");
        require(block.timestamp <= dist.expirationTime, "Round expired");
        require(!isClaimed(_roundId, _index), "Already claimed");

        // Verify the merkle proof
        // Note: The leaf construction here must match the off-chain generation
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_index, _account, _amount))));
        require(
            MerkleProof.verify(_merkleProof, dist.merkleRoot, leaf),
            "Invalid proof"
        );

        // Mark as claimed
        uint256 wordIndex = _index / 256;
        uint256 bitIndex = _index % 256;
        claimedBitMap[_roundId][wordIndex] |= (1 << bitIndex);

        // Update claimed amount
        dist.claimedAmount += _amount;

        // Transfer tokens
        IERC20(dist.token).safeTransfer(_account, _amount);

        emit Claimed(_roundId, _index, _account, _amount);
    }

    /**
     * @notice Sweep unclaimed tokens after expiration
     * @param _roundId The expired round to sweep
     */
    function sweep(uint256 _roundId) external onlyOwner {
        Distribution storage dist = distributions[_roundId];

        require(dist.expirationTime > 0, "Round does not exist");
        require(block.timestamp > dist.expirationTime, "Not expired");
        require(!dist.isSwept, "Already swept");

        uint256 unclaimed = dist.totalAmount - dist.claimedAmount;
        require(unclaimed > 0, "Nothing to sweep");

        dist.isSwept = true;

        IERC20(dist.token).safeTransfer(owner(), unclaimed);

        emit Swept(_roundId, dist.token, unclaimed);
    }

    /**
     * @notice View function to get distribution details
     */
    function getDistribution(uint256 _roundId) external view returns (
        bytes32 merkleRoot,
        address token,
        uint256 totalAmount,
        uint256 claimedAmount,
        uint256 expirationTime,
        bool isSwept,
        bool isActive
    ) {
        Distribution storage dist = distributions[_roundId];
        return (
            dist.merkleRoot,
            dist.token,
            dist.totalAmount,
            dist.claimedAmount,
            dist.expirationTime,
            dist.isSwept,
            dist.expirationTime > 0 && block.timestamp <= dist.expirationTime
        );
    }
}
