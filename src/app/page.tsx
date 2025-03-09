'use client';

import React from 'react';
import { useWallet } from '../lib/wallet-context';
import { formatSuiBalance } from '../lib/sui-client';
import PriceInfo from '../components/PriceInfo';
import PortfolioChart from '../components/PortfolioChart';
import TransactionList from '../components/TransactionList';

export default function Home() {
  const { address, isConnected, balance, assets, transactions, loading, error } = useWallet();
  
  // Add debugging for balance
  console.log('Raw balance from wallet:', balance);
  console.log('Balance type:', typeof balance);
  console.log('Formatted balance:', formatSuiBalance(balance));

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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
          <h1 className="text-4xl font-bold mb-6">Sui Portfolio Manager</h1>
          <p className="text-xl mb-8">Track and manage your Sui blockchain assets</p>
          
          <div className="p-6 max-w-sm bg-white rounded-xl shadow-md flex flex-col space-y-4">
            <p>Use the connect button in the navigation bar to connect your wallet</p>
          </div>
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
                  <p className="text-2xl font-bold">{formatSuiBalance(balance)} SUI</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isConnected && (
          <div className="space-y-6">
            {/* Portfolio Chart Section */}
            <div className="my-8">
              <PortfolioChart balance={balance} address={address} />
            </div>
            
            {/* Transaction List Section */}
            <div className="my-8">
              <TransactionList address={address} limit={20} />
            </div>
            
            {/* Other Assets Section (placeholder for future expansion) */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Other Assets</h2>
              <p className="text-gray-500">This section will display your other assets in the future.</p>
            </div>
            
            {/* Recent Transactions Section (placeholder for future expansion) */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <TransactionList address={address} limit={10} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 