// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Gambling} from "../src/Gambling.sol";

contract GamblingTest is Test {
    Gambling public gambling;

    address public bidder = address(0x1);
    address public challenger = address(0x2);

    function setUp() public {
        gambling = new Gambling();
        // Fund test addresses
        vm.deal(bidder, 10 ether);
        vm.deal(challenger, 10 ether);
    }

    function test_placeBid_success() public {
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 0.0000001 ether}();

        assertEq(bidId, 0);
        assertEq(gambling.activeBidCount(), 1);

        (address bidderAddr, uint256 amount, bool active) = gambling.getBid(bidId);
        assertEq(bidderAddr, bidder);
        assertEq(amount, 0.0000001 ether);
        assertTrue(active);
    }

    function test_placeBid_revert_tooSmall() public {
        vm.prank(bidder);
        vm.expectRevert(abi.encodeWithSelector(Gambling.BidTooSmall.selector, 0.0001 ether, 0.001 ether));
        gambling.placeBid{value: 0.0001 ether}();
    }

    function test_placeBid_revert_maxBids() public {
        // Place 100 bids
        for (uint256 i = 0; i < 100; i++) {
            address user = address(uint160(i + 100));
            vm.deal(user, 1 ether);
            vm.prank(user);
            gambling.placeBid{value: 0.01 ether}();
        }

        assertEq(gambling.activeBidCount(), 100);

        // 101st bid should fail
        vm.prank(bidder);
        vm.expectRevert(Gambling.MaxBidsReached.selector);
        gambling.placeBid{value: 1 ether}();
    }

    function test_cancelBid_success() public {
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        uint256 balanceBefore = bidder.balance;

        vm.prank(bidder);
        gambling.cancelBid(bidId);

        assertEq(bidder.balance, balanceBefore + 1 ether);
        assertEq(gambling.activeBidCount(), 0);

        (, , bool active) = gambling.getBid(bidId);
        assertFalse(active);
    }

    function test_cancelBid_revert_notOwner() public {
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        vm.prank(challenger);
        vm.expectRevert(Gambling.NotBidOwner.selector);
        gambling.cancelBid(bidId);
    }

    function test_challenge_success() public {
        // Place a bid
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        // Challenge the bid
        vm.prank(challenger);
        gambling.challenge{value: 1 ether}(bidId);

        // Bid should still be active with combined pot
        (address bidOwner, uint256 amount, bool active) = gambling.getBid(bidId);
        assertTrue(active);
        assertEq(amount, 2 ether);
        assertEq(gambling.activeBidCount(), 1);

        // Winner should own the bid
        bool bidderWon = bidOwner == bidder;
        bool challengerWon = bidOwner == challenger;
        assertTrue(bidderWon || challengerWon);
    }

    function test_challenge_revert_ownBid() public {
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        vm.prank(bidder);
        vm.expectRevert(Gambling.CannotChallengeOwnBid.selector);
        gambling.challenge{value: 1 ether}(bidId);
    }

    function test_challenge_revert_bidNotActive() public {
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        // Cancel the bid
        vm.prank(bidder);
        gambling.cancelBid(bidId);

        vm.prank(challenger);
        vm.expectRevert(abi.encodeWithSelector(Gambling.BidNotActive.selector, bidId));
        gambling.challenge{value: 1 ether}(bidId);
    }

    function test_challenge_revert_bidDoesNotExist() public {
        vm.prank(challenger);
        vm.expectRevert(abi.encodeWithSelector(Gambling.BidDoesNotExist.selector, 999));
        gambling.challenge{value: 1 ether}(999);
    }

    function test_getActiveBids() public {
        // Place 3 bids
        vm.prank(bidder);
        gambling.placeBid{value: 1 ether}();

        vm.prank(bidder);
        gambling.placeBid{value: 1 ether}();

        vm.prank(bidder);
        gambling.placeBid{value: 1 ether}();

        uint256[] memory activeBids = gambling.getActiveBids();
        assertEq(activeBids.length, 3);
        assertEq(activeBids[0], 0);
        assertEq(activeBids[1], 1);
        assertEq(activeBids[2], 2);

        // Cancel middle bid
        vm.prank(bidder);
        gambling.cancelBid(1);

        activeBids = gambling.getActiveBids();
        assertEq(activeBids.length, 2);
        assertEq(activeBids[0], 0);
        assertEq(activeBids[1], 2);
    }

    function test_totalBids() public {
        assertEq(gambling.totalBids(), 0);

        vm.prank(bidder);
        gambling.placeBid{value: 1 ether}();

        assertEq(gambling.totalBids(), 1);

        vm.prank(bidder);
        gambling.placeBid{value: 1 ether}();

        assertEq(gambling.totalBids(), 2);
    }

    /// @notice Fuzz test to verify the winner takes ownership of the bid with the pot
    function testFuzz_challenge_winnerTakesBid(uint256 bidAmount, uint256 challengeAmount) public {
        // Bound amounts to reasonable values
        bidAmount = bound(bidAmount, 0.001 ether, 10 ether);
        challengeAmount = bound(challengeAmount, 0.001 ether, 10 ether);

        vm.deal(bidder, bidAmount);
        vm.deal(challenger, challengeAmount);

        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: bidAmount}();

        vm.prank(challenger);
        gambling.challenge{value: challengeAmount}(bidId);

        // Verify bid is still active with combined pot and owned by winner
        (address bidOwner, uint256 amount, bool active) = gambling.getBid(bidId);
        uint256 totalPot = bidAmount + challengeAmount;

        assertTrue(active);
        assertEq(amount, totalPot);
        assertTrue(bidOwner == bidder || bidOwner == challenger);
    }

    /// @notice Test that winner can be challenged again after winning
    function test_challenge_winnerCanBeChallengedAgain() public {
        address challenger2 = address(0x3);
        vm.deal(challenger2, 10 ether);

        // Place initial bid
        vm.prank(bidder);
        uint256 bidId = gambling.placeBid{value: 1 ether}();

        // First challenge
        vm.prank(challenger);
        gambling.challenge{value: 1 ether}(bidId);

        // Get winner of first challenge
        (address firstWinner, uint256 amountAfterFirst,) = gambling.getBid(bidId);
        assertEq(amountAfterFirst, 2 ether);

        // Second challenge
        vm.prank(challenger2);
        gambling.challenge{value: 2 ether}(bidId);

        // Bid should now have 4 ether
        (address secondWinner, uint256 amountAfterSecond, bool active) = gambling.getBid(bidId);
        assertTrue(active);
        assertEq(amountAfterSecond, 4 ether);
        assertTrue(secondWinner == firstWinner || secondWinner == challenger2);
    }
}
