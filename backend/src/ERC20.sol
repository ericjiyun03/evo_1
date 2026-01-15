// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Starter contract for ERC-20 Token
contract ERC20 {
    // VARIABLES

    uint8 public decimals = 18;
    string public name;
    string public symbol;
    uint256 public totalSupply;

    // EVENTS

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        _mint(msg.sender, initialSupply);
    }

    // FUNCTIONS

    function balanceOf(address account) external view returns (uint256) {
        // TODO
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        // TODO
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        // TODO
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        // TODO
    }

    function _mint(address account, uint256 amount) internal {
        // TODO
    }
}
