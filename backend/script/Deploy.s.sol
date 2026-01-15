// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {Gambling} from "../src/Gambling.sol";

/**
 * forge script Deploy --rpc-url "https://sepolia.base.org" --account dev --sender $SENDER  --broadcast -vvvv --verify --verifier-url "https://api-sepolia.basescan.org/api" --etherscan-api-key $BASESCAN_API_KEY
 */
contract Deploy is Script {
    function run() public {
        vm.startBroadcast();

        address owner = 0x787EA2192E49c9c12C26D8f7cc277c58404EB595;
        
        new Gambling();

        vm.stopBroadcast();
    }
}
