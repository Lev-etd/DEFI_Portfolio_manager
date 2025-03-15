'use client';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { WalletContext } from '../contexts/wallet-context';

export default function WalletSelector() {
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the wallet context
  const { 
    walletAddress, 
    walletConnected, 
    setWalletAddress, 
    setWalletConnected,
    disconnectWallet
  } = useContext(WalletContext);
  
  // Simplified wallet detection function
  const detectWallets = useCallback(() => {
    try {
      console.log("Detecting wallets...");
      const detected: string[] = [];
      
      // Check for Sui Wallet - try various methods
      if ((window as any).wallet) {
        console.log("Standard wallet detected", (window as any).wallet);
        detected.push("Standard Wallet");
      }
      
      if ((window as any).suiWallet) {
        console.log("Sui wallet detected", (window as any).suiWallet);
        detected.push("Sui Wallet");
      }
      
      // Check for Ethereum wallet (Trust Wallet, MetaMask, etc)
      if ((window as any).ethereum) {
        console.log("Ethereum wallet detected", (window as any).ethereum);
        // Check if it's a Sui wallet in disguise
        if ((window as any).ethereum.isSui || (window as any).ethereum.isSuiWallet) {
          detected.push("Sui Wallet (via ethereum)");
        } else {
          detected.push("Ethereum Wallet");
        }
      }
      
      console.log("Detected wallets:", detected);
      setAvailableWallets(detected);
      
      // Always show the modal when clicking connect
      if (detected.length === 0) {
        setError("No wallets detected");
      } else {
        setError(null);
      }
    } catch (e) {
      console.error("Error detecting wallets:", e);
      setError("Failed to detect wallets");
    }
  }, []);

  useEffect(() => {
    // Detect wallets once on mount
    const timeout = setTimeout(() => {
      detectWallets();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [detectWallets]);

  // Simplified connect function
  const connectWallet = async (walletType: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log(`Connecting to ${walletType}...`);
      
      // Handle standard wallet
      if (walletType === "Standard Wallet" && (window as any).wallet) {
        try {
          const wallet = (window as any).wallet;
          console.log("Wallet object:", wallet);
          
          // Get permissions
          if (wallet.hasPermissions && typeof wallet.hasPermissions === 'function') {
            const permissions = await wallet.hasPermissions();
            if (!permissions) {
              await wallet.requestPermissions();
            }
          }
          
          // Get accounts
          if (wallet.getAccounts && typeof wallet.getAccounts === 'function') {
            const accounts = await wallet.getAccounts();
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              
              // Update wallet context
              setWalletAddress(address);
              setWalletConnected(true);
              
              console.log("Connected to wallet:", address);
              setIsOpen(false);
            } else {
              throw new Error("No accounts found");
            }
          } else {
            throw new Error("Wallet doesn't support getAccounts");
          }
        } catch (e) {
          console.error("Error connecting to Standard Wallet:", e);
          throw new Error(`Failed to connect to Standard Wallet: ${e}`);
        }
      }
      // Handle Sui Wallet specific
      else if (walletType === "Sui Wallet" && (window as any).suiWallet) {
        try {
          const wallet = (window as any).suiWallet;
          
          if (wallet.hasPermissions && typeof wallet.hasPermissions === 'function') {
            const permissions = await wallet.hasPermissions();
            if (!permissions) {
              await wallet.requestPermissions();
            }
          }
          
          if (wallet.getAccounts && typeof wallet.getAccounts === 'function') {
            const accounts = await wallet.getAccounts();
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              
              // Update wallet context
              setWalletAddress(address);
              setWalletConnected(true);
              
              console.log("Connected to Sui wallet:", address);
              setIsOpen(false);
            } else {
              throw new Error("No accounts found");
            }
          } else {
            throw new Error("Wallet doesn't support getAccounts");
          }
        } catch (e) {
          console.error("Error connecting to Sui Wallet:", e);
          throw new Error(`Failed to connect to Sui Wallet: ${e}`);
        }
      }
      // Handle Sui Wallet via ethereum
      else if (walletType === "Sui Wallet (via ethereum)" && (window as any).ethereum && 
               ((window as any).ethereum.isSui || (window as any).ethereum.isSuiWallet)) {
        try {
          const wallet = (window as any).ethereum;
          
          // Try to get accounts
          let accounts: string[] = [];
          try {
            accounts = await wallet.request({ method: 'sui_requestAccounts' });
          } catch {
            accounts = await wallet.request({ method: 'eth_requestAccounts' });
          }
          
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            
            // Update wallet context
            setWalletAddress(address);
            setWalletConnected(true);
            
            console.log("Connected to Sui wallet via ethereum:", address);
            setIsOpen(false);
          } else {
            throw new Error("No accounts found");
          }
        } catch (e) {
          console.error("Error connecting to Sui Wallet via ethereum:", e);
          throw new Error(`Failed to connect to Sui Wallet: ${e}`);
        }
      }
      // Handle Ethereum wallet
      else if (walletType === "Ethereum Wallet" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            
            // Update wallet context
            setWalletAddress(address);
            setWalletConnected(true);
            
            console.log("Connected to Ethereum wallet:", address);
            setIsOpen(false);
          } else {
            throw new Error("No accounts found");
          }
        } catch (e) {
          console.error("Error connecting to Ethereum wallet:", e);
          throw new Error(`Failed to connect to Ethereum wallet: ${e}`);
        }
      } else {
        throw new Error(`Wallet type ${walletType} not supported or not found`);
      }
    } catch (e) {
      console.error("Wallet connection error:", e);
      setError(`${e}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => walletConnected ? disconnectWallet() : setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        {walletConnected && walletAddress 
          ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` 
          : "Connect Wallet"}
      </button>
      
      {isOpen && !walletConnected && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          
          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}
          
          {availableWallets.length === 0 ? (
            <div className="text-gray-500 text-sm mb-2">
              No wallets detected. Please install a Sui wallet extension.
            </div>
          ) : (
            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet}
                  onClick={() => connectWallet(wallet)}
                  disabled={isConnecting}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-left px-3 py-2 rounded"
                >
                  {wallet}
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