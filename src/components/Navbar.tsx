'use client';

import React, { useState } from 'react';
import { useWallet } from '../lib/wallet-context';
import Link from 'next/link';

export default function Navbar() {
  const { address, isConnected, connectWallet, disconnectWallet, loading } = useWallet();
  const [walletInput, setWalletInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleConnectClick = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      setShowInput(!showInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletInput) {
      connectWallet(walletInput);
      setShowInput(false);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl">Sui Portfolio</Link>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              <Link href="/" className="text-white hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/protocols" className="text-white hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                Protocols
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {showInput ? (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  className="px-3 py-1 rounded-md text-black"
                  type="text"
                  placeholder="Enter wallet address"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-1 px-4 rounded-md text-sm"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Submit'}
                </button>
              </form>
            ) : (
              <button
                onClick={handleConnectClick}
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md text-sm"
              >
                {isConnected ? `Disconnect (${address?.slice(0, 6)}...${address?.slice(-4)})` : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 