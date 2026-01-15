import { Address } from "viem";

// Deployed on Base Sepolia
export const gamblingContract = "0xF91909defb4B6C5691E613E857186640518337fA" as Address;

export const GamblingAbi = [
  {
    type: "function",
    name: "MAX_BIDS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_BID",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activeBidCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bids",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "bidder", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cancelBid",
    inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "challenge",
    inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getActiveBids",
    inputs: [],
    outputs: [
      { name: "activeBidIds", type: "uint256[]", internalType: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBid",
    inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "bidder", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "placeBid",
    inputs: [],
    outputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "totalBids",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BidCancelled",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "bidder", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BidChallenged",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "challenger", type: "address", indexed: true, internalType: "address" },
      { name: "challengeAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "winner", type: "address", indexed: false, internalType: "address" },
      { name: "winnings", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BidPlaced",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "bidder", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  { type: "error", name: "BidDoesNotExist", inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }] },
  { type: "error", name: "BidNotActive", inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }] },
  { type: "error", name: "BidTooSmall", inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }, { name: "minimum", type: "uint256", internalType: "uint256" }] },
  { type: "error", name: "CannotChallengeOwnBid", inputs: [] },
  { type: "error", name: "MaxBidsReached", inputs: [] },
  { type: "error", name: "NotBidOwner", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
] as const;
