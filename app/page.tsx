'use client';

import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect, WalletDropdownLink } from "@coinbase/onchainkit/wallet";
import { useQuery } from "@tanstack/react-query";
import { useReadContract, useAccount } from "wagmi";
import { Hex } from "viem";
import Link from "next/link";
import { AttendanceAbi, attendanceContract } from "@/app/lib/Attendance";

async function fetchSessions() {
  const response = await fetch("/sessions");
  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return response.json();
}

// Component to display individual session card with attendance status
function SessionCard({ session, userAddress }: { session: any; userAddress?: Hex }) {
  const { data: hasAttended } = useReadContract({
    abi: AttendanceAbi,
    address: attendanceContract,
    functionName: "hasAttended",
    args: [BigInt(session.sessionId), userAddress as Hex],
    query: {
      enabled: !!userAddress, // Only query if user is connected
    }
  });

  return (
    <Link 
      key={session.sessionId} 
      href={`/session/${session.sessionId}`} 
      className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 min-h-[200px] w-full max-w-[280px] flex items-center justify-center"
    >
      {/* Attendance Badge */}
      {userAddress && (
        <div className="absolute top-3 right-3">
          {hasAttended ? (
            <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
              <span>✓</span>
              <span>Attended</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
              <span>○</span>
              <span>Not Attended</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center space-y-3 w-full">
        <div className="text-base font-medium text-gray-500 dark:text-gray-400">Session</div>
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          #{session.sessionId}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </div>
      </div>
    </Link>
  );
}

export default function App() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  // Get connected account
  const account = useAccount();

  // Call totalSessions() directly from the contract
  const { data: totalSessions, isLoading: isTotalSessionsLoading } = useReadContract({
    abi: AttendanceAbi,
    address: attendanceContract,
    functionName: "totalSessions"
  });

  return isLoading ? (<></>) : (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
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
      <div className="flex flex-col items-center space-y-6">
        {/* Display total number of sessions */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Total Sessions</h1>
          <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {isTotalSessionsLoading ? "..." : totalSessions?.toString() ?? "0"}
          </p>
        </div>
        
        {!data?.sessions?.length ? (
          // If no sessions have been created, display message
          <div className="text-center">No sessions created. <br /> Call POST /sessions or transact directly onchain. </div>
        ) : (
          // If sessions have been created, display grid of sessions
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6 max-w-7xl w-full justify-items-center">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.sessions?.map((session: any) => (
              <SessionCard 
                key={session.sessionId} 
                session={session} 
                userAddress={account.address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}