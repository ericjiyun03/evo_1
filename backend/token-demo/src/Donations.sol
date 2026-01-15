// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC20} from "./ERC20.sol";

/// @notice Sample app for receiving ERC-20 donations
contract Donations {
    address public owner;

    error TransferFailed();

    constructor() {
        owner = msg.sender;
    }

    function donate(address token, uint256 amount) public {
        // requires user to first set approval to this Donations contract
        bool success = ERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
    }

    function withdraw(address token, address recipient) public {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = ERC20(token).balanceOf(address(this));
        bool success = ERC20(token).transfer(recipient, balance);
        if (!success) revert TransferFailed();
    }
}