'use client';

import React, { useState, useEffect } from 'react';

export default function WalletDebug() {
  const [windowProps, setWindowProps] = useState<string[]>([]);
  const [walletInfo, setWalletInfo] = useState<string>('');
  const [count, setCount] = useState(0);

  // Function to scan window object for wallet-related properties
  const scanForWallets = () => {
    if (typeof window === 'undefined') return;
    
    setCount(prev => prev + 1);
    console.log(`Scanning for wallets (attempt ${count + 1})...`);
    
    try {
      // Get all properties on the window object
      const allProps = Object.getOwnPropertyNames(window);
      setWindowProps(allProps);
      
      // Check potentially wallet-related properties
      const walletProps = [
        'suiWallet', 'sui', 'Sui', 'ethereum', 'wallets',
        'trustwallet', 'SafePal', 'coinbase', 'wallet',
        'suix', 'experimentalSui', '_sui', 'sukiWallet'
      ];
      
      let walletText = '';
      
      // Check each potential wallet property
      for (const prop of walletProps) {
        try {
          if ((window as any)[prop]) {
            walletText += `Found ${prop} on window\n`;
            console.log(`Found ${prop} on window:`, (window as any)[prop]);
            
            // Additional checks for ethereum
            if (prop === 'ethereum') {
              walletText += `  ethereum.isSui: ${(window as any).ethereum.isSui || false}\n`;
              walletText += `  ethereum.isSuiWallet: ${(window as any).ethereum.isSuiWallet || false}\n`;
              walletText += `  ethereum._suiWallet: ${(window as any).ethereum._suiWallet ? 'exists' : 'not exists'}\n`;
              walletText += `  ethereum.isMetaMask: ${(window as any).ethereum.isMetaMask || false}\n`;
            }
            
            // Additional checks for wallet
            if (prop === 'wallet') {
              walletText += `  wallet.features: ${JSON.stringify((window as any).wallet.features || [])}\n`;
              const methods = Object.getOwnPropertyNames((window as any).wallet);
              walletText += `  wallet methods: ${methods.join(', ')}\n`;
            }
          } else {
            walletText += `${prop} not found\n`;
          }
        } catch (e) {
          walletText += `Error checking ${prop}: ${e}\n`;
        }
      }
      
      // Check if window is in an iframe
      walletText += `\nIn iframe: ${window !== window.top}\n`;
      
      // Check for extensions communication channel
      if ('chrome' in window && 'runtime' in (window as any).chrome) {
        walletText += `Chrome extension API available\n`;
      }
      
      setWalletInfo(walletText);
    } catch (e) {
      console.error("Error in wallet scanning:", e);
      setWalletInfo(`Error scanning: ${e}`);
    }
  };
  
  // Scan on mount and periodically
  useEffect(() => {
    // Initial scan
    const initialScan = setTimeout(scanForWallets, 1000);
    
    // Additional scans with increasing delays
    const timeoutIds = [
      setTimeout(scanForWallets, 2000),
      setTimeout(scanForWallets, 4000),
      setTimeout(scanForWallets, 6000)
    ];
    
    return () => {
      clearTimeout(initialScan);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);
  
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Wallet Detection Debug</h2>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={scanForWallets}
        >
          Scan Again
        </button>
        <span className="ml-2 text-sm text-gray-500">Scan count: {count}</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="font-medium mb-2">Wallet Information</h3>
          <div className="bg-gray-50 p-3 rounded-lg h-60 overflow-auto text-xs font-mono">
            {walletInfo || "No wallet information yet"}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Window Properties (First 20)</h3>
          <div className="bg-gray-50 p-3 rounded-lg h-40 overflow-auto text-xs font-mono">
            {windowProps.slice(0, 20).map(prop => (
              <div key={prop} className="mb-1">{prop}</div>
            ))}
            {windowProps.length > 20 && <div className="text-gray-500">...and {windowProps.length - 20} more</div>}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Check the browser console for additional logging information.
      </div>
    </div>
  );
} 