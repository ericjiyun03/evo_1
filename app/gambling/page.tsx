'use client';

import { useState } from 'react';
import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from '@coinbase/onchainkit/identity';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { GamblingAbi, gamblingContract } from '@/app/lib/Gambling';

interface Bid {
  bidId: bigint;
  bidder: string;
  amount: bigint;
  active: boolean;
}

function BidCard({
  bid,
  userAddress,
  onChallenge,
  onCancel,
  isLoading,
}: {
  bid: Bid;
  userAddress?: string;
  onChallenge: (bidId: bigint, amount: string) => void;
  onCancel: (bidId: bigint) => void;
  isLoading: boolean;
}) {
  const [challengeAmount, setChallengeAmount] = useState('0.01');
  const isOwner =
    userAddress?.toLowerCase() === bid.bidder.toLowerCase();
  const bidAmountEth = parseFloat(formatEther(bid.amount));
  const challengeAmountNum = parseFloat(challengeAmount) || 0;
  const totalPot = bidAmountEth + challengeAmountNum;
  const winProbability =
    totalPot > 0 ? ((challengeAmountNum / totalPot) * 100).toFixed(1) : '0';

  return (
    <div className="bid-card group">
      <div className="bid-card-glow"></div>
      <div className="bid-card-content">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="bid-id">#{bid.bidId.toString()}</div>
          {isOwner && (
            <span className="owner-badge">YOUR BID</span>
          )}
        </div>

        {/* Pot Amount */}
        <div className="pot-display">
          <div className="pot-label">Current Pot</div>
          <div className="pot-amount">
            <span className="eth-icon">◈</span>
            {formatEther(bid.amount)} ETH
          </div>
        </div>

        {/* Bidder Address */}
        <div className="bidder-info">
          <span className="bidder-label">Holder</span>
          <span className="bidder-address">
            {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
          </span>
        </div>

        {/* Actions */}
        {userAddress && (
          <div className="mt-4">
            {isOwner ? (
              <button
                onClick={() => onCancel(bid.bidId)}
                disabled={isLoading}
                className="cancel-btn"
              >
                {isLoading ? 'Processing...' : 'Withdraw Bid'}
              </button>
            ) : (
              <div className="challenge-section">
                <div className="challenge-input-group">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0.00000001"
                    value={challengeAmount}
                    onChange={(e) => setChallengeAmount(e.target.value)}
                    className="challenge-input"
                    placeholder="ETH amount"
                  />
                  <span className="input-suffix">ETH</span>
                </div>
                <div className="probability-display">
                  <span className="prob-label">Your win chance:</span>
                  <span className="prob-value">{winProbability}%</span>
                </div>
                <button
                  onClick={() => onChallenge(bid.bidId, challengeAmount)}
                  disabled={isLoading || challengeAmountNum < 0.00000001}
                  className="challenge-btn"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Challenging...
                    </span>
                  ) : (
                    `⚔️ Challenge for ${challengeAmount} ETH`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceBidForm({
  onPlaceBid,
  isLoading,
}: {
  onPlaceBid: (amount: string) => void;
  isLoading: boolean;
}) {
  const [bidAmount, setBidAmount] = useState('0.01');

  return (
    <div className="place-bid-card">
      <h3 className="place-bid-title">🎲 Place a New Bid</h3>
      <p className="place-bid-description">
        Stake your ETH and wait for challengers. Higher stakes attract bigger
        fish!
      </p>
      <div className="place-bid-input-group">
        <input
          type="number"
          step="0.00000001"
          min="0.00000001"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className="place-bid-input"
          placeholder="Amount in ETH"
        />
        <button
          onClick={() => onPlaceBid(bidAmount)}
          disabled={isLoading || parseFloat(bidAmount) < 0.00000001}
          className="place-bid-btn"
        >
          {isLoading ? 'Placing Bid...' : `Place Bid (${bidAmount} ETH)`}
        </button>
      </div>
    </div>
  );
}

export default function GamblingPage() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Read active bids
  const { data: activeBidIds, refetch: refetchActiveBids } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getActiveBids',
  });

  // Read active bid count
  const { data: activeBidCount } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'activeBidCount',
  });

  // Get bid details for each active bid
  const { data: bid0 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 0 ? [activeBidIds[0]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 0 },
  });

  const { data: bid1 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 1 ? [activeBidIds[1]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 1 },
  });

  const { data: bid2 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 2 ? [activeBidIds[2]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 2 },
  });

  const { data: bid3 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 3 ? [activeBidIds[3]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 3 },
  });

  const { data: bid4 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 4 ? [activeBidIds[4]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 4 },
  });

  const { data: bid5 } = useReadContract({
    abi: GamblingAbi,
    address: gamblingContract,
    functionName: 'getBid',
    args: activeBidIds && activeBidIds.length > 5 ? [activeBidIds[5]] : undefined,
    query: { enabled: !!activeBidIds && activeBidIds.length > 5 },
  });

  // Combine bids into array
  const bids: Bid[] = [];
  const bidResults = [bid0, bid1, bid2, bid3, bid4, bid5];
  if (activeBidIds) {
    activeBidIds.forEach((bidId, index) => {
      if (index < 6 && bidResults[index]) {
        const [bidder, amount, active] = bidResults[index]!;
        if (active) {
          bids.push({ bidId, bidder, amount, active });
        }
      }
    });
  }

  // Write functions
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isLoading = isWritePending || isTxLoading;

  const handlePlaceBid = (amount: string) => {
    try {
      writeContract(
        {
          abi: GamblingAbi,
          address: gamblingContract,
          functionName: 'placeBid',
          value: parseEther(amount),
          chainId: baseSepolia.id,
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setTimeout(() => refetchActiveBids(), 3000);
          },
          onError: (error) => {
            console.error('Error placing bid:', error);
            alert(`Failed to place bid: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Error in handlePlaceBid:', error);
      alert('Failed to place bid. Please check your wallet and try again.');
    }
  };

  const handleChallenge = (bidId: bigint, amount: string) => {
    try {
      writeContract(
        {
          abi: GamblingAbi,
          address: gamblingContract,
          functionName: 'challenge',
          args: [bidId],
          value: parseEther(amount),
          chainId: baseSepolia.id,
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setTimeout(() => refetchActiveBids(), 3000);
          },
          onError: (error) => {
            console.error('Error challenging bid:', error);
            alert(`Failed to challenge: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Error in handleChallenge:', error);
      alert('Failed to challenge bid. Please check your wallet and try again.');
    }
  };

  const handleCancel = (bidId: bigint) => {
    try {
      writeContract(
        {
          abi: GamblingAbi,
          address: gamblingContract,
          functionName: 'cancelBid',
          args: [bidId],
          chainId: baseSepolia.id,
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setTimeout(() => refetchActiveBids(), 3000);
          },
          onError: (error) => {
            console.error('Error cancelling bid:', error);
            alert(`Failed to cancel: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Error in handleCancel:', error);
      alert('Failed to cancel bid. Please check your wallet and try again.');
    }
  };

  return (
    <div className="gambling-page">
      {/* Animated background */}
      <div className="gambling-bg">
        <div className="gambling-bg-gradient"></div>
        <div className="gambling-bg-pattern"></div>
      </div>

      {/* Wallet in top right */}
      <div className="wallet-container">
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownLink
              icon="wallet"
              href="https://keys.coinbase.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wallet
            </WalletDropdownLink>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      {/* Main content */}
      <div className="gambling-content">
        {/* Header */}
        <div className="gambling-header">
          <h1 className="gambling-title">
            <span className="title-icon">🎰</span>
            STAKE & DUEL
            <span className="title-icon">🎰</span>
          </h1>
          <p className="gambling-subtitle">
            Place your bids. Challenge others. Winner takes all.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{activeBidCount?.toString() || '0'}</div>
            <div className="stat-label">Active Bids</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">100</div>
            <div className="stat-label">Max Bids</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0.00000001</div>
            <div className="stat-label">Min Bid (ETH)</div>
          </div>
        </div>

        {/* Place bid form */}
        {address && <PlaceBidForm onPlaceBid={handlePlaceBid} isLoading={isLoading} />}

        {/* Connect prompt */}
        {!address && (
          <div className="connect-prompt">
            <p>Connect your wallet to place bids and challenge others!</p>
          </div>
        )}

        {/* Bids Grid */}
        <div className="bids-section">
          <h2 className="bids-title">⚔️ Active Battles</h2>
          {bids.length === 0 ? (
            <div className="no-bids">
              <p>No active bids yet. Be the first to stake!</p>
            </div>
          ) : (
            <div className="bids-grid">
              {bids.map((bid) => (
                <BidCard
                  key={bid.bidId.toString()}
                  bid={bid}
                  userAddress={address}
                  onChallenge={handleChallenge}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="how-it-works">
          <h3>How It Works</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Place a Bid</strong>
                <p>Stake ETH to create a bid that others can challenge</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Challenge</strong>
                <p>Pick a bid and stake your ETH to challenge the holder</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>Win or Lose</strong>
                <p>
                  Probability based on stakes: Your ETH / Total Pot = Your
                  win chance
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-text">
                <strong>Winner Takes All</strong>
                <p>Winner keeps the bid with the combined pot!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
