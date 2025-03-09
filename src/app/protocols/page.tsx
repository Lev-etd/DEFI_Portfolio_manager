'use client';

import React from 'react';
import { useWallet } from '../../lib/wallet-context';

// This is a placeholder component for protocol integrations
// In a real app, this would connect to actual Sui protocols

export default function Protocols() {
  const { isConnected, address } = useWallet();

  const protocols = [
    {
      name: 'Cetus',
      description: 'Decentralized Exchange on Sui',
      url: 'https://www.cetus.zone/',
      icon: '🔄'
    },
    {
      name: 'Scallop',
      description: 'Lending and Borrowing Protocol',
      url: 'https://scallop.io/',
      icon: '💰'
    },
    {
      name: 'Aftermath',
      description: 'Decentralized Perpetual Exchange',
      url: 'https://aftermath.finance/',
      icon: '📈'
    },
    {
      name: 'BlueMove',
      description: 'NFT Marketplace',
      url: 'https://sui.bluemove.net/',
      icon: '🖼️'
    },
    {
      name: 'Kriya',
      description: 'DEX and Staking Platform',
      url: 'https://kriya.finance/',
      icon: '🔄'
    },
    {
      name: 'Turbos Finance',
      description: 'Concentrated Liquidity DEX',
      url: 'https://turbos.finance/',
      icon: '⚡'
    }
  ];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
          <h1 className="text-4xl font-bold mb-6">Protocol Integrations</h1>
          <p className="text-xl mb-8">Please connect your wallet to access protocol integrations</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-8">
      <h1 className="text-3xl font-bold mb-6">Protocol Integrations</h1>
      <p className="mb-6">Access various DeFi protocols on Sui with your connected wallet</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {protocols.map((protocol) => (
          <div key={protocol.name} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">{protocol.icon}</span>
              <h2 className="text-xl font-semibold">{protocol.name}</h2>
            </div>
            <p className="text-gray-600 mb-4">{protocol.description}</p>
            <a 
              href={protocol.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit {protocol.name} →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 