import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAccountBalance, getAccountObjects } from './sui-client';
import { getProcessedTransactionHistory } from './sui-client';

// Define types for Sui Wallet window objects
declare global {
  interface Window {
    // Standard property for Sui Wallet
    suiWallet?: {
      hasPermissions: () => Promise<boolean>;
      requestPermissions: () => Promise<boolean>;
      getAccounts: () => Promise<string[]>;
      getBalance: (address: string) => Promise<{
        totalBalance: string;
        coinType: string;
        coinObjectCount: number;
      }>;
    };
    
    // Alternative properties that might be used
    sui?: any;
    Sui?: any;
    SuiWallet?: any;
  }
}

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: any | null;
  assets: any[] | null;
  transactions: any[] | null;
  connectWallet: (addr: string) => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  error: string | null;
  
  // New Sui Wallet properties
  connectSuiWallet: () => Promise<void>;
  isSuiWalletInstalled: boolean;
  checkForWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<any | null>(null);
  const [assets, setAssets] = useState<any[] | null>(null);
  const [transactions, setTransactions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sui Wallet specific states
  const [isSuiWalletInstalled, setIsSuiWalletInstalled] = useState<boolean>(false);
  
  // Function to check for wallet
  const checkForWallet = () => {
    console.log("Checking for Sui Wallet...");
    
    if (typeof window !== 'undefined') {
      // Log all potentially relevant properties to help debugging
      console.log("window.suiWallet:", window.suiWallet);
      console.log("window.sui:", window.sui);
      console.log("window.Sui:", window.Sui);
      console.log("window.SuiWallet:", window.SuiWallet);
      
      // Check for any of the potential wallet objects
      const walletDetected = !!(
        window.suiWallet || 
        window.sui || 
        window.Sui || 
        window.SuiWallet
      );
      
      console.log("Wallet detected:", walletDetected);
      setIsSuiWalletInstalled(walletDetected);
      
      // If we find any wallet object, normalize to window.suiWallet for consistency
      if (walletDetected && !window.suiWallet) {
        if (window.SuiWallet) window.suiWallet = window.SuiWallet;
        else if (window.Sui) window.suiWallet = window.Sui;
        else if (window.sui) window.suiWallet = window.sui;
      }
    }
  };
  
  // Check if Sui Wallet is installed - with multiple attempts
  useEffect(() => {
    // First check - immediate
    checkForWallet();
    
    // Second check - after a delay to allow extension to initialize
    const timeoutId = setTimeout(() => {
      checkForWallet();
    }, 1000);
    
    // Setup event listener for wallet injection
    const handleWalletReady = () => {
      console.log("Wallet ready event triggered");
      checkForWallet();
    };
    
    // Different events that might signal wallet is ready
    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleWalletReady);
      // Custom event that might be dispatched by wallet extensions
      window.addEventListener('sui-wallet-ready', handleWalletReady as EventListener);
      document.addEventListener('DOMContentLoaded', handleWalletReady);
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleWalletReady);
        window.removeEventListener('sui-wallet-ready', handleWalletReady as EventListener);
        document.removeEventListener('DOMContentLoaded', handleWalletReady);
      }
    };
  }, []);

  const connectWallet = async (addr: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get account balance
      const accountBalance = await getAccountBalance(addr);
      setBalance(accountBalance);
      
      // Get owned objects (assets)
      const accountObjects = await getAccountObjects(addr);
      setAssets(accountObjects.data);
      
      // Get transaction history
      const txHistory = await getProcessedTransactionHistory(addr);
      setTransactions(txHistory);
      
      // Set connected address
      setAddress(addr);
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };
  
  // Connect to Sui Wallet
  const connectSuiWallet = async () => {
    // Check again right before connecting
    checkForWallet();
    
    if (!isSuiWalletInstalled) {
      setError('Sui Wallet is not installed. Please refresh the page if you just installed it.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the actual wallet object (might be in different properties)
      const wallet = window.suiWallet || window.SuiWallet || window.Sui || window.sui;
      
      if (!wallet) {
        throw new Error('Could not find Sui Wallet object even though it was detected');
      }
      
      console.log("Using wallet object:", wallet);
      
      // Request permissions
      const hasPermissions = await wallet.hasPermissions();
      console.log("Has permissions:", hasPermissions);
      
      if (!hasPermissions) {
        console.log("Requesting permissions...");
        const granted = await wallet.requestPermissions();
        console.log("Permissions granted:", granted);
        
        if (!granted) {
          throw new Error('Permission to access Sui Wallet was denied');
        }
      }
      
      // Get accounts
      console.log("Getting accounts...");
      const accounts = await wallet.getAccounts();
      console.log("Accounts:", accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found in Sui Wallet');
      }
      
      // Set the first account as active
      const addr = accounts[0];
      console.log("Selected address:", addr);
      
      // Get balance using Sui Wallet API
      console.log("Getting balance...");
      const balanceData = await wallet.getBalance(addr);
      console.log("Balance data:", balanceData);
      setBalance(balanceData);
      
      // Get owned objects (assets)
      const accountObjects = await getAccountObjects(addr);
      setAssets(accountObjects.data);
      
      // Get transaction history
      const txHistory = await getProcessedTransactionHistory(addr);
      setTransactions(txHistory);
      
      // Set connected address
      setAddress(addr);
      
      setLoading(false);
      console.log("Wallet connected successfully!");
    } catch (error) {
      console.error('Error connecting to Sui Wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Sui Wallet');
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setAssets(null);
    setTransactions(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        balance,
        assets,
        transactions,
        connectWallet,
        disconnectWallet,
        loading,
        error,
        connectSuiWallet,
        isSuiWalletInstalled,
        checkForWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 