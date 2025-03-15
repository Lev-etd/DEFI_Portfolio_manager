'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SUI_TYPE_ARG, MIST_PER_SUI } from '@mysten/sui/utils';
import PortfolioChart from '../components/PortfolioChart';
import TransactionList from '../components/TransactionList';
import { getCurrentSuiPrice } from '../lib/navi-client';

export default function Home() {
  // Use dApp Kit hooks
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const isConnected = !!currentAccount;
  const address = currentAccount?.address || null;
  
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get SUI balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Get balance from SUI network
        const balanceResponse = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: SUI_TYPE_ARG,
        });
        
        // Convert balance from MIST to SUI
        const balanceInSui = Number(balanceResponse.totalBalance) / Number(MIST_PER_SUI);
        setSuiBalance(balanceInSui);
        
        // Get USD value
        try {
          const price = await getCurrentSuiPrice();
          setUsdBalance(balanceInSui * price);
        } catch (error) {
          console.error('Error fetching USD value:', error);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setError('Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
  }, [currentAccount, suiClient]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
          <h2 className="text-2xl mb-4">Loading wallet data...</h2>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
          <h2 className="text-2xl mb-4 text-red-500">Error: {error}</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-6">
      <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Wallet Overview Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Sui Portfolio Manager</h1>
          
          {!isConnected ? (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-lg mb-4">Connect your wallet to view your portfolio</p>
              <p className="text-gray-500">Use the connect button in the navigation bar to get started</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <p className="text-gray-500 mb-1">Wallet Address</p>
                  <p className="font-mono text-sm">{address}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-gray-500 mb-1">Balance</p>
                  <p className="text-2xl font-bold">{suiBalance.toFixed(2)} SUI</p>
                  {usdBalance !== null && (
                    <p className="text-gray-500 text-sm">
                      ≈${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isConnected && address && (
          <div className="space-y-6">
            {/* Portfolio Chart Section */}
            <div className="my-8">
              <PortfolioChart balance={suiBalance} address={address} />
            </div>
            
            {/* Other Assets Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Other Assets</h2>
              <p className="text-gray-500">This section will display your other assets in the future.</p>
            </div>
            
            {/* Recent Transactions Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              <TransactionList address={address} limit={10} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 