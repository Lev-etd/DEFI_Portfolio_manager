'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';

// Define the context type
type WalletContextType = {
  walletConnected: boolean;
  walletAddress: string | null;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  connectWallet: (address?: string) => void;
  disconnectWallet: () => void;
};

// Create the context with default values
export const WalletContext = createContext<WalletContextType>({
  walletConnected: false,
  walletAddress: null,
  setWalletConnected: () => {},
  setWalletAddress: () => {},
  connectWallet: () => {},
  disconnectWallet: () => {},
});

// Create the provider component
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  // Enhanced wallet detection with more checks
  const checkForWallet = useCallback(() => {
    const count = checkCount + 1;
    setCheckCount(count);
    console.log(`Checking for Sui Wallet... (attempt ${count})`);
    
    // Log available wallet interfaces for debugging
    console.log("window.suiWallet:", (window as any).suiWallet);
    console.log("window.sui:", (window as any).sui);
    console.log("window.Sui:", (window as any).Sui);
    console.log("window.SuiWallet:", (window as any).SuiWallet);
    
    // Check standard wallet interface (Web3 wallet standard)
    if ((window as any).wallet) {
      console.log("Found window.wallet:", (window as any).wallet);
      
      // Check if this is a Sui wallet
      try {
        // Check for any Sui-related properties or methods that would indicate it's a Sui wallet
        if ((window as any).wallet.features && 
            ((window as any).wallet.features.includes('sui:signAndExecuteTransaction') ||
             (window as any).wallet.features.includes('sui:signTransaction'))) {
          console.log("Found Sui features in window.wallet");
          return true;
        }
      } catch (e) {
        console.error("Error checking wallet features:", e);
      }
    }
    
    // Additional check for new universal interface at window.suix
    if ((window as any).suix) {
      console.log("Found window.suix:", (window as any).suix);
      return true;
    }
    
    // Check experimental interfaces
    if ((window as any).experimentalSui) {
      console.log("Found window.experimentalSui:", (window as any).experimentalSui);
      return true;
    }
    
    // Check for Sui Wallet via ethereum interface (some wallets like Sui Wallet use this)
    if ((window as any).ethereum && 
        ((window as any).ethereum.isSui || 
         (window as any).ethereum.isSuiWallet || 
         (window as any).ethereum._suiWallet)) {
      console.log("Found Sui wallet via ethereum interface:", (window as any).ethereum);
      return true;
    }
    
    // Check if wallet is available in standard locations
    const hasWallet = Boolean(
      (window as any).wallet || 
      (window as any).suiWallet || 
      (window as any).sui || 
      (window as any).Sui || 
      (window as any).SuiWallet
    );
    
    console.log("Wallet detected:", hasWallet);
    
    return hasWallet;
  }, [checkCount]);

  // Connect wallet with optional address parameter
  const connectWallet = useCallback((address?: string) => {
    if (address) {
      setWalletAddress(address);
      setWalletConnected(true);
      console.log(`Connected to wallet with address: ${address}`);
    } else {
      console.log("No address provided to connectWallet");
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setWalletConnected(false);
    console.log("Wallet disconnected");
  }, []);

  // Check for wallet on mount with multiple attempts at increasing delays
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Multiple attempts with increasing delays to catch late-loading wallets
      const timeouts = [
        setTimeout(() => checkForWallet(), 500),   // First check after 500ms
        setTimeout(() => checkForWallet(), 1500),  // Second check after 1.5s
        setTimeout(() => checkForWallet(), 3000),  // Third check after 3s
        setTimeout(() => checkForWallet(), 5000),  // Fourth check after 5s
      ];
      
      return () => timeouts.forEach(clearTimeout);
    }
  }, [checkForWallet]);

  // Create the context value
  const contextValue: WalletContextType = {
    walletConnected,
    walletAddress,
    setWalletConnected,
    setWalletAddress,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider; 