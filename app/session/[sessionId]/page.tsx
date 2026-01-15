'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction"
import { encodeFunctionData, Hex } from 'viem';
import { AttendanceAbi, attendanceContract } from '@/app/lib/Attendance';
import { useAccount, useChainId, useReadContract, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { parseSession } from '@/app/lib/utils';
import { useEffect } from 'react';

export default function App({ params }: {params: {sessionId: string}}) {
    // state for connected wallet
    const account = useAccount()

    // state for querying totalSessions
    const {data: totalSessions, isLoading} = useReadContract({
        abi: AttendanceAbi, 
        address: attendanceContract, 
        functionName: "totalSessions"
    })

    // state for querying a session's data
    const {data: sessionRaw} = useReadContract({
        abi: AttendanceAbi,
        address: attendanceContract,
        functionName: "sessions",
        args: [BigInt(params.sessionId)]
    })

    // state for querying if an account has attended a session
    const {data: hasAttended} = useReadContract({
        abi: AttendanceAbi, 
        address: attendanceContract, 
        functionName: "hasAttended", 
        args: [BigInt(params.sessionId), account.address as Hex]
    })

    // state for wallet's currently connected chain
    const chainId = useChainId()

    // Enforce that users are connected to base sepolia
    const {switchChain} = useSwitchChain()
    useEffect(() => {
        if (chainId && chainId !== baseSepolia.id) {
            switchChain({ chainId: baseSepolia.id })
        }
    }, [chainId, switchChain])

    const session = parseSession(sessionRaw)
    console.log({session})

    return isLoading ? (
        <></>
    ) : parseInt(params.sessionId) >= (totalSessions ?? 0) ? (
        // If session id is greater than total sessions, session does not exist
        <div className='flex flex-col text-center justify-center min-h-screen'>Session does not exist.</div>
    ) : (
        // If session exists, display session data
        <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
            <div className='flex flex-col space-y-4 mb-12'>
                {/* Show session id and total attendance */}
                <div className='text-2xl'>Session #{params.sessionId}</div>
                <div className='text-2xl'>Total attended: {session?.totalAttended}</div>
            </div>
            {/* If user is not connected, display connect wallet button */}
            {!account.address ? (
                <Wallet>
                    <ConnectWallet>
                    <Avatar className="h-6 w-6" />
                    <Name />
                    </ConnectWallet>
                </Wallet>
            ) : (
                <>
                    <div className='absolute top-4 right-4'>
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
                    <div className='w-1/4'>
                    {/* If user has not attended session, display attend session button */}
                    {!hasAttended ? (
                        <Transaction calls={[{
                            to: attendanceContract, 
                            data: encodeFunctionData({
                                abi: AttendanceAbi, 
                                functionName: "attendSession", 
                                args: [BigInt(params.sessionId)]
                            })
                        }]}>
                            <TransactionButton text={"Attend"} />
                            <TransactionSponsor />
                            <TransactionStatus>
                                <TransactionStatusLabel />
                                <TransactionStatusAction />
                            </TransactionStatus>
                        </Transaction>  
                    ) : (
                        // If user has attended session, display message
                        <div className='text-center'>You have already attended this session.</div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}