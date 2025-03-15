'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SUI_TYPE_ARG, MIST_PER_SUI } from '@mysten/sui/utils';
import { useEffect, useState } from 'react';
import { getCurrentSuiPrice } from '../lib/navi-client';

export default function WalletConnect() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [balance, setBalance] = useState<string>('0.00');
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  
  // Fetch SUI balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount) return;
      
      try {
        console.log('Fetching balance for', currentAccount.address);
        const balanceResponse = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: SUI_TYPE_ARG,
        });
        
        console.log('Balance response:', balanceResponse);
        
        // Format the balance from MIST to SUI
        const balanceInSui = Number(balanceResponse.totalBalance) / Number(MIST_PER_SUI);
        const formattedBalance = balanceInSui.toFixed(2);
        setBalance(formattedBalance);
        
        console.log('Formatted balance:', formattedBalance);
        
        // Fetch USD price
        try {
          const price = await getCurrentSuiPrice();
          console.log('SUI price:', price);
          setUsdBalance(balanceInSui * price);
        } catch (error) {
          console.error('Error fetching USD price:', error);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    
    fetchBalance();
  }, [currentAccount, suiClient]);
  
  return (
    <div className="flex items-center space-x-4">
      {currentAccount ? (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Balance</div>
            <div className="font-medium flex items-baseline">
              <span>{balance} SUI</span>
              {usdBalance !== null && (
                <span className="ml-1 text-xs text-gray-500">
                  (≈${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {`${currentAccount.address.substring(0, 6)}...${currentAccount.address.substring(currentAccount.address.length - 4)}`}
            </div>
          </div>
          <ConnectButton />
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
} 