// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/// @notice Decentralized gambling where users place bids and others can challenge.
/// @dev Winner is determined probabilistically based on bid amounts.
contract Gambling {
    /// @notice Maximum number of active bids allowed at any time
    uint256 public constant MAX_BIDS = 100;

    /// @notice Minimum bid amount to prevent dust attacks (10 gwei = 0.00000001 ETH)
    uint256 public constant MIN_BID = 10 gwei;

    struct Bid {
        address bidder;
        uint256 amount;
        bool active;
    }

    /// @notice All bids (both active and inactive)
    Bid[] public bids;

    /// @notice Count of currently active bids
    uint256 public activeBidCount;

    // Events
    event BidPlaced(uint256 indexed bidId, address indexed bidder, uint256 amount);
    event BidChallenged(
        uint256 indexed bidId,
        address indexed challenger,
        uint256 challengeAmount,
        address winner,
        uint256 winnings
    );
    event BidCancelled(uint256 indexed bidId, address indexed bidder, uint256 amount);

    // Errors
    error MaxBidsReached();
    error BidTooSmall(uint256 amount, uint256 minimum);
    error BidNotActive(uint256 bidId);
    error BidDoesNotExist(uint256 bidId);
    error CannotChallengeOwnBid();
    error TransferFailed();
    error NotBidOwner();

    /// @notice Place a new bid with ETH
    /// @return bidId The ID of the newly created bid
    function placeBid() external payable returns (uint256 bidId) {
        if (activeBidCount >= MAX_BIDS) revert MaxBidsReached();
        if (msg.value < MIN_BID) revert BidTooSmall(msg.value, MIN_BID);

        bidId = bids.length;
        bids.push(Bid({bidder: msg.sender, amount: msg.value, active: true}));

        activeBidCount++;

        emit BidPlaced(bidId, msg.sender, msg.value);
    }

    /// @notice Cancel your own bid and get refunded
    /// @param bidId The ID of the bid to cancel
    function cancelBid(uint256 bidId) external {
        if (bidId >= bids.length) revert BidDoesNotExist(bidId);
        Bid storage bid = bids[bidId];
        if (!bid.active) revert BidNotActive(bidId);
        if (bid.bidder != msg.sender) revert NotBidOwner();

        uint256 amount = bid.amount;
        bid.active = false;
        bid.amount = 0;
        activeBidCount--;

        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit BidCancelled(bidId, msg.sender, amount);
    }

    /// @notice Challenge an existing bid with your own ETH
    /// @param bidId The ID of the bid to challenge
    /// @dev Winner determined probabilistically: bidder wins with probability X/(X+Y),
    ///      challenger wins with probability Y/(X+Y), where X = bid amount, Y = challenge amount
    /// @dev WARNING: Uses block.prevrandao for randomness which has limitations.
    ///      For production, consider using Chainlink VRF for secure randomness.
    function challenge(uint256 bidId) external payable {
        if (bidId >= bids.length) revert BidDoesNotExist(bidId);

        Bid storage bid = bids[bidId];
        if (!bid.active) revert BidNotActive(bidId);
        if (msg.sender == bid.bidder) revert CannotChallengeOwnBid();
        if (msg.value < MIN_BID) revert BidTooSmall(msg.value, MIN_BID);

        // Store values before state changes (Checks-Effects-Interactions pattern)
        address bidder = bid.bidder;
        uint256 bidAmount = bid.amount; // X
        uint256 challengeAmount = msg.value; // Y
        uint256 totalPot = bidAmount + challengeAmount;

        // Generate pseudo-random number
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, bidder, bidId, totalPot))
        );

        // Determine winner based on probability
        // randomNumber % totalPot gives value in [0, totalPot)
        // If result < bidAmount (probability X/(X+Y)), bidder wins
        // Otherwise (probability Y/(X+Y)), challenger wins
        uint256 randomValue = randomNumber % totalPot;

        address winner;
        if (randomValue < bidAmount) {
            // Bidder wins - bid stays with them, amount increases to total pot
            winner = bidder;
            bid.amount = totalPot;
        } else {
            // Challenger wins - bid transfers to challenger with total pot
            winner = msg.sender;
            bid.bidder = msg.sender;
            bid.amount = totalPot;
        }
        // Bid remains active with the winner owning it

        emit BidChallenged(bidId, msg.sender, challengeAmount, winner, totalPot);
    }

    /// @notice Get the total number of bids ever created
    function totalBids() external view returns (uint256) {
        return bids.length;
    }

    /// @notice Get all active bid IDs
    /// @return activeBidIds Array of bid IDs that are currently active
    function getActiveBids() external view returns (uint256[] memory activeBidIds) {
        activeBidIds = new uint256[](activeBidCount);
        uint256 index = 0;

        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].active) {
                activeBidIds[index] = i;
                index++;
            }
        }
    }

    /// @notice Get details of a specific bid
    /// @param bidId The ID of the bid to query
    /// @return bidder The address that placed the bid
    /// @return amount The ETH amount of the bid
    /// @return active Whether the bid is still active
    function getBid(uint256 bidId) external view returns (address bidder, uint256 amount, bool active) {
        if (bidId >= bids.length) revert BidDoesNotExist(bidId);
        Bid memory bid = bids[bidId];
        return (bid.bidder, bid.amount, bid.active);
    }
}
