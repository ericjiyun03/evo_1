# Introduction to Solidity

Last deployed at [`0xd58ab8899132a7add4cc16cc4efef36f655a7359`](https://sepolia.basescan.org/address/0xd58ab8899132a7add4cc16cc4efef36f655a7359#code)

Get Base Sepolia ETH [here](https://p2p-faucet.vercel.app/).

## Installation

Install `foundryup`
```
curl -L https://foundry.paradigm.xyz | bash
```

Install foundry toolchain (`forge`, `cast`, `anvil`, `chisel`)
```
foundryup
```

## Build

Compile contracts to surface build issues.
```
forge build
```

## Deploy

Import your EOA into a CLI account
```
cast wallet import dev --private-key [pk]
```

Make sure your account has testnet ETH!

Run deploy script and verify contracts
```
forge script Deploy \
    --account dev \
    --rpc-url "https://sepolia.base.org" \
    --broadcast \
    --verify \
    --verifier etherscan \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

> Note: Etherscan can sometimes incorrectly give an error message `"Invalid API Key"` when deploying this exact Attendance contract.
