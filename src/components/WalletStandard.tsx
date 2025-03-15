'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getWallets, 
  Wallet,
  WalletWithFeatures,
  Wallets,
  StandardConnect,
  StandardDisconnect,
  SuiFeatures
} from '@mysten/wallet-standard';

// Helper function to check if a wallet supports Sui
function isWalletWithSui(wallet: Wallet): wallet is WalletWithFeatures<StandardConnect & Partial<StandardDisconnect>> {
  return 'standard:connect' in wallet.features && wallet.features['standard:connect'].supportedFeatures?.includes('sui:signTransaction');
}

export default function WalletStandard() {
  const [wallets, setWallets] = useState<Wallets | null>(null);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and register for wallet changes
  useEffect(() => {
    try {
      // Get the wallet registry
      const walletRegistry = getWallets();
      console.log("Wallet registry initialized:", walletRegistry);
      setWallets(walletRegistry);

      // Get current wallets
      const currentWallets = walletRegistry.get();
      console.log("Current wallets:", currentWallets);
      
      // Filter to wallets with Sui features
      const suiWallets = currentWallets.filter(isWalletWithSui);
      console.log("Sui wallets:", suiWallets);
      setAvailableWallets(suiWallets);
      
      // Handle new wallet registrations
      const handleWalletsChange = () => {
        if (!walletRegistry) return;
        const updatedWallets = walletRegistry.get();
        console.log("Wallets updated:", updatedWallets);
        const updatedSuiWallets = updatedWallets.filter(isWalletWithSui);
        setAvailableWallets(updatedSuiWallets);
      };
      
      // Register for wallet changes
      const unregister = walletRegistry.on('register', handleWalletsChange);
      
      // Try to restore previous connection
      const lastConnectedWallet = localStorage.getItem('selectedWalletName');
      if (lastConnectedWallet) {
        const savedWallet = suiWallets.find(wallet => wallet.name === lastConnectedWallet);
        if (savedWallet) {
          console.log("Found previously connected wallet:", savedWallet.name);
          tryAutoConnect(savedWallet);
        }
      }
      
      return () => {
        unregister();
      };
    } catch (e) {
      console.error("Error initializing wallet standard:", e);
      setError(`Error initializing wallets: ${e}`);
    }
  }, []);

  // Try to auto-connect to a previously connected wallet
  const tryAutoConnect = useCallback(async (wallet: Wallet) => {
    if (!isWalletWithSui(wallet)) {
      console.log(`${wallet.name} does not support Sui features`);
      return;
    }
    
    try {
      console.log(`Attempting to auto-connect to ${wallet.name}...`);
      
      // Get the current accounts (if already connected)
      const accounts = wallet.features['standard:connect'].getAccounts();
      console.log("Current accounts:", accounts);
      
      if (accounts.length > 0) {
        // Already connected
        setSelectedWallet(wallet);
        setCurrentAccount(accounts[0].address);
        setConnected(true);
        console.log(`Auto-connected to ${wallet.name} with account ${accounts[0].address}`);
        return;
      }
      
      // Try to connect if not connected yet
      const connectFeature = wallet.features['standard:connect'];
      const connectResult = await connectFeature.connect();
      
      if (connectResult.accounts.length > 0) {
        setSelectedWallet(wallet);
        setCurrentAccount(connectResult.accounts[0].address);
        setConnected(true);
        // Save for future auto-connect
        localStorage.setItem('selectedWalletName', wallet.name);
        console.log(`Connected to ${wallet.name} with account ${connectResult.accounts[0].address}`);
      } else {
        console.log("No accounts returned after connect");
      }
    } catch (e) {
      console.error("Error auto-connecting to wallet:", e);
      // Don't show error - silent failure for auto-connect
    }
  }, []);

  // Connect to a selected wallet
  const connectWallet = useCallback(async (wallet: Wallet) => {
    if (!isWalletWithSui(wallet)) {
      setError(`${wallet.name} does not support Sui features`);
      return;
    }
    
    try {
      setError(null);
      console.log(`Connecting to ${wallet.name}...`);
      
      // Connect to the wallet
      const connectFeature = wallet.features['standard:connect'];
      const connectResult = await connectFeature.connect();
      
      console.log("Connect result:", connectResult);
      
      if (connectResult.accounts.length > 0) {
        setSelectedWallet(wallet);
        setCurrentAccount(connectResult.accounts[0].address);
        setConnected(true);
        setIsOpen(false);
        
        // Save for future auto-connect
        localStorage.setItem('selectedWalletName', wallet.name);
        
        console.log(`Connected to ${wallet.name} with account ${connectResult.accounts[0].address}`);
      } else {
        throw new Error("No accounts returned");
      }
    } catch (e) {
      console.error("Error connecting to wallet:", e);
      setError(`Error connecting: ${e}`);
    }
  }, []);

  // Disconnect from wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (selectedWallet && isWalletWithSui(selectedWallet) && 
          'standard:disconnect' in selectedWallet.features && 
          selectedWallet.features['standard:disconnect']) {
        await selectedWallet.features['standard:disconnect'].disconnect();
      }
    } catch (e) {
      console.error("Error disconnecting:", e);
    } finally {
      setSelectedWallet(null);
      setCurrentAccount(null);
      setConnected(false);
      localStorage.removeItem('selectedWalletName');
      console.log("Disconnected from wallet");
    }
  }, [selectedWallet]);

  return (
    <div className="relative">
      <button
        onClick={() => connected ? disconnectWallet() : setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        {connected && currentAccount ? (
          <div className="flex items-center space-x-2">
            <span>{`${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`}</span>
            <small className="text-blue-200">({selectedWallet?.name})</small>
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
          
          {availableWallets.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              <p className="mb-2">No Sui wallet detected</p>
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
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => connectWallet(wallet)}
                  className="w-full flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-left px-3 py-2 rounded"
                >
                  {wallet.icon && (
                    <img 
                      src={URL.createObjectURL(new Blob([wallet.icon], { type: 'image/svg+xml' }))} 
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