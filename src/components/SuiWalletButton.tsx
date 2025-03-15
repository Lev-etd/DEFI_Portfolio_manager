'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentSuiPrice } from '../lib/navi-client';

// Skip type declarations to avoid conflicts
export default function SuiWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetected, setWalletDetected] = useState(false);

  // Check for wallet
  const checkForWallet = () => {
    // @ts-ignore - Suppress TypeScript errors for window properties
    const hasEthereum = typeof window !== 'undefined' && !!window.ethereum;
    // @ts-ignore
    const hasSuiWallet = typeof window !== 'undefined' && !!window.suiWallet;
    
    // Debug logs
    console.log('Checking for wallet availability:');
    console.log('window.ethereum:', window.ethereum);
    console.log('window.suiWallet:', window.suiWallet);
    
    if (hasEthereum) {
      // @ts-ignore
      console.log('ethereum.isSui:', window.ethereum?.isSui);
      // @ts-ignore
      console.log('ethereum.isSuiWallet:', window.ethereum?.isSuiWallet);
      // @ts-ignore
      console.log('ethereum.selectedAddress:', window.ethereum?.selectedAddress);
    }
    
    setWalletDetected(hasEthereum || hasSuiWallet);
    
    // Check if already connected
    // @ts-ignore
    if (hasEthereum && (window.ethereum?.selectedAddress || window.ethereum?.selectedAccount)) {
      // @ts-ignore
      setAddress(window.ethereum?.selectedAddress || window.ethereum?.selectedAccount || null);
    }
  };
  
  // Auto-detect wallet
  useEffect(() => {
    checkForWallet();
    
    // Try again after a short delay
    const timeoutId = setTimeout(() => {
      checkForWallet();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Connect wallet
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let walletAccounts: string[] = [];
      
      // Modern method (window.ethereum)
      // @ts-ignore
      if (window.ethereum) {
        try {
          // First try the request method (EIP-1102)
          // @ts-ignore
          if (window.ethereum.request) {
            // @ts-ignore
            walletAccounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' // Standard method
            });
            console.log('Connected via ethereum.request:', walletAccounts);
          } 
          // Then try the enable method (legacy)
          // @ts-ignore
          else if (window.ethereum.enable) {
            // @ts-ignore
            walletAccounts = await window.ethereum.enable();
            console.log('Connected via ethereum.enable:', walletAccounts);
          }
        } catch (e) {
          console.error('Error connecting via ethereum:', e);
        }
      }
      
      // Legacy method (window.suiWallet)
      // @ts-ignore
      if (walletAccounts.length === 0 && window.suiWallet) {
        try {
          // @ts-ignore
          const hasPermission = await window.suiWallet.hasPermissions();
          if (!hasPermission) {
            // @ts-ignore
            await window.suiWallet.requestPermissions();
          }
          // @ts-ignore
          walletAccounts = await window.suiWallet.getAccounts();
          console.log('Connected via suiWallet:', walletAccounts);
        } catch (e) {
          console.error('Error connecting via suiWallet:', e);
        }
      }
      
      // If we got accounts, use the first one
      if (walletAccounts && walletAccounts.length > 0) {
        const currentAddress = walletAccounts[0];
        setAddress(currentAddress);
        
        // Try to get balance
        try {
          let balanceResult;
          
          // @ts-ignore
          if (window.ethereum?.request) {
            // @ts-ignore
            balanceResult = await window.ethereum.request({
              method: 'wallet_getBalance',
              params: [currentAddress]
            });
          // @ts-ignore
          } else if (window.suiWallet?.getBalance) {
            // @ts-ignore
            balanceResult = await window.suiWallet.getBalance(currentAddress);
          }
          
          if (balanceResult) {
            console.log('Balance result:', balanceResult);
            // Format balance (assuming it's in MIST)
            const balanceInSui = Number(balanceResult.totalBalance || balanceResult) / 1_000_000_000;
            const formattedBalance = balanceInSui.toFixed(2);
            setBalance(formattedBalance);
            
            // Get USD value
            try {
              const price = await getCurrentSuiPrice();
              setUsdBalance(balanceInSui * price);
            } catch (priceError) {
              console.error('Error getting USD price:', priceError);
            }
          }
        } catch (balanceError) {
          console.error('Error getting balance:', balanceError);
        }
      } else {
        throw new Error('No accounts returned from wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setBalance('0.00');
    setUsdBalance(null);
  };
  
  // Register event handlers
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet();
      } else {
        // Account changed
        setAddress(accounts[0]);
      }
    };
    
    // @ts-ignore
    if (window.ethereum?.on) {
      // @ts-ignore
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      // Cleanup
      // @ts-ignore
      if (window.ethereum?.on) {
        // @ts-ignore
        if (window.ethereum.removeListener) {
          // @ts-ignore
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      }
    };
  }, []);
  
  return (
    <div className="flex items-center space-x-4">
      {address ? (
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Balance
            </div>
            <div className="font-medium flex items-baseline">
              <span className="text-gray-700 dark:text-gray-300">{balance} SUI</span>
              {usdBalance !== null && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  (≈${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {address && `${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end">
          {!walletDetected && (
            <div className="mb-2 text-xs text-red-500 flex items-center">
              <span>Sui Wallet extension not detected</span>
              <button 
                onClick={checkForWallet}
                className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-1 flex items-center justify-center"
                title="Refresh wallet detection"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center">
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>Connect Wallet</>
              )}
            </button>
            {!walletDetected && (
              <a 
                href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 text-xs underline"
              >
                Get Sui Wallet
              </a>
            )}
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-500">{error}</div>
          )}
        </div>
      )}
    </div>
  );
} 