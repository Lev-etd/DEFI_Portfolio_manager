'use client';

import React, { useEffect, useState } from 'react';
import { useWallets } from '@mysten/dapp-kit';

export default function WalletDebugKit() {
  const wallets = useWallets();
  const [walletStandard, setWalletStandard] = useState<any>(null);
  const [suiWallet, setSuiWallet] = useState<any>(null);
  const [etherWallet, setEtherWallet] = useState<any>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);

  // Check for wallet interfaces
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('Checking for wallet interfaces...');
    
    if ((window as any).wallet) {
      console.log('Found window.wallet:', (window as any).wallet);
      setWalletStandard((window as any).wallet);
      
      try {
        if (typeof (window as any).wallet.getWallets === 'function') {
          const walletList = (window as any).wallet.getWallets() || [];
          console.log('Wallet list:', walletList);
          setAvailableWallets(walletList.map((w: any) => w.name || 'Unknown'));
        }
      } catch (e) {
        console.error('Error getting wallets:', e);
      }
    }
    
    if ((window as any).suiWallet) {
      console.log('Found window.suiWallet:', (window as any).suiWallet);
      setSuiWallet((window as any).suiWallet);
    }
    
    if ((window as any).ethereum) {
      console.log('Found window.ethereum:', (window as any).ethereum);
      setEtherWallet((window as any).ethereum);
    }
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">Wallet Debug (dapp-kit)</h2>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">useWallets (dapp-kit)</h3>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          {wallets.length > 0 ? (
            <ul>
              {wallets.map((wallet, index) => (
                <li key={index}>
                  Name: {wallet.name} <br />
                  Features: {Object.keys(wallet.features).join(', ')}
                </li>
              ))}
            </ul>
          ) : (
            <p>No wallets detected via dapp-kit</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Wallet Standard (window.wallet)</h3>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          {walletStandard ? (
            <div>
              <p>Found wallet standard interface</p>
              <p>Available wallets: {availableWallets.join(', ') || 'None'}</p>
            </div>
          ) : (
            <p>No wallet standard detected</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Legacy Sui Wallet (window.suiWallet)</h3>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          {suiWallet ? (
            <p>Found legacy Sui wallet interface</p>
          ) : (
            <p>No legacy Sui wallet detected</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Ethereum Wallet (window.ethereum)</h3>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          {etherWallet ? (
            <div>
              <p>Found ethereum wallet interface</p>
              <p>isSui: {etherWallet.isSui ? 'Yes' : 'No'}</p>
              <p>isSuiWallet: {etherWallet.isSuiWallet ? 'Yes' : 'No'}</p>
              <p>isMetaMask: {etherWallet.isMetaMask ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p>No ethereum wallet detected</p>
          )}
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Refresh Page
      </button>
    </div>
  );
} 