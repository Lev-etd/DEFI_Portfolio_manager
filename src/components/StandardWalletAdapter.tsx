'use client';

import React, { useState, useEffect } from 'react';

export interface WalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: string[];
  features: string[];
}

export interface StandardWalletAdapter {
  name: string;
  icon?: string;
  accounts: WalletAccount[];
  features: string[];
  chains: string[];
  connecting: boolean;
  connected: boolean;
  hasPermissions(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getAccounts(): Promise<WalletAccount[]>;
  disconnect(): Promise<void>;
}

export default function StandardWalletAdapter() {
  const [wallets, setWallets] = useState<StandardWalletAdapter[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<StandardWalletAdapter | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect wallets using the Wallet Standard
  useEffect(() => {
    let detectionCount = 0;
    const maxDetectionAttempts = 5;
    const detectWallets = async () => {
      detectionCount++;
      console.log(`Detecting wallets (attempt ${detectionCount})...`);
      
      try {
        // Check for window.wallet (Wallet Standard)
        if ((window as any).wallet) {
          // Get the list of wallet adapters
          if (typeof (window as any).wallet.getWallets === 'function') {
            const walletAdapters = await (window as any).wallet.getWallets();
            console.log("Found wallet adapters:", walletAdapters);
            setWallets(walletAdapters);
            return;
          } else if ((window as any).wallet.features || 
                     typeof (window as any).wallet.hasPermissions === 'function') {
            // Single wallet exposed directly
            console.log("Found single wallet adapter:", (window as any).wallet);
            setWallets([(window as any).wallet]);
            return;
          }
        }
        
        // Check for window.suiWallet (older Sui Wallet)
        if ((window as any).suiWallet) {
          console.log("Found legacy Sui wallet:", (window as any).suiWallet);
          // Create adapter-like interface
          const legacyAdapter = {
            name: "Sui Wallet",
            icon: "https://sui.io/favicon.ico",
            accounts: [],
            features: ["sui:signTransaction", "sui:signAndExecuteTransaction"],
            chains: ["sui:mainnet", "sui:testnet", "sui:devnet"],
            connecting: false,
            connected: false,
            hasPermissions: async () => {
              try {
                return await (window as any).suiWallet.hasPermissions();
              } catch (e) {
                return false;
              }
            },
            requestPermissions: async () => {
              try {
                return await (window as any).suiWallet.requestPermissions();
              } catch (e) {
                return false;
              }
            },
            getAccounts: async () => {
              try {
                const accounts = await (window as any).suiWallet.getAccounts();
                return accounts.map((addr: string) => ({
                  address: addr,
                  publicKey: new Uint8Array(),
                  chains: ["sui:mainnet", "sui:testnet", "sui:devnet"],
                  features: ["sui:signTransaction", "sui:signAndExecuteTransaction"]
                }));
              } catch (e) {
                return [];
              }
            },
            disconnect: async () => {
              // Legacy wallet doesn't have disconnect
              console.log("Disconnected from legacy wallet");
            }
          };
          setWallets([legacyAdapter]);
          return;
        }
        
        // Try again if not found and we haven't exceeded max attempts
        if (detectionCount < maxDetectionAttempts) {
          setTimeout(detectWallets, 1000);
        } else {
          console.log("No wallets detected after maximum attempts");
        }
      } catch (e) {
        console.error("Error detecting wallets:", e);
      }
    };

    detectWallets();
    
    // Return cleanup function
    return () => {
      detectionCount = maxDetectionAttempts; // To prevent further detections
    };
  }, []);

  // Connect to wallet
  const connectWallet = async (wallet: StandardWalletAdapter) => {
    try {
      setError(null);
      console.log(`Connecting to ${wallet.name}...`);
      
      // Check permissions
      const hasPermission = await wallet.hasPermissions();
      if (!hasPermission) {
        console.log("Requesting permissions...");
        const granted = await wallet.requestPermissions();
        if (!granted) {
          throw new Error("Wallet permissions not granted");
        }
      }
      
      // Get accounts
      const accounts = await wallet.getAccounts();
      console.log("Retrieved accounts:", accounts);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found in wallet");
      }
      
      setAccounts(accounts);
      setSelectedWallet(wallet);
      setConnected(true);
      setIsOpen(false);
      
      // Store connection info for auto-connect
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletName', wallet.name);
      
      return accounts[0].address;
    } catch (e) {
      console.error("Error connecting to wallet:", e);
      setError(`Error connecting: ${e}`);
      return null;
    }
  };

  // Disconnect from wallet
  const disconnectWallet = async () => {
    try {
      if (selectedWallet) {
        await selectedWallet.disconnect();
      }
    } catch (e) {
      console.error("Error disconnecting:", e);
    } finally {
      setSelectedWallet(null);
      setAccounts([]);
      setConnected(false);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletName');
    }
  };

  // Auto-connect on startup if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const walletName = localStorage.getItem('walletName');
    
    if (wasConnected && walletName && wallets.length > 0) {
      const savedWallet = wallets.find(w => w.name === walletName);
      if (savedWallet) {
        connectWallet(savedWallet);
      }
    }
  }, [wallets]);

  return (
    <div className="relative">
      <button
        onClick={() => connected ? disconnectWallet() : setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        {connected && accounts.length > 0 ? (
          <div className="flex items-center space-x-2">
            <span>{`${accounts[0].address.substring(0, 6)}...${accounts[0].address.substring(accounts[0].address.length - 4)}`}</span>
            <small className="text-blue-200">Connected to {selectedWallet?.name}</small>
          </div>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      
      {isOpen && !connected && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          
          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}
          
          {wallets.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              <p className="mb-2">No wallet detected</p>
              <p className="text-sm">Please install a Sui wallet extension</p>
              <a 
                href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-500 text-sm underline block mt-2"
              >
                Get Sui Wallet
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => connectWallet(wallet)}
                  className="w-full flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-left px-3 py-2 rounded"
                >
                  {wallet.icon && (
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      className="w-6 h-6" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span>{wallet.name}</span>
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 border border-gray-300 px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
} 