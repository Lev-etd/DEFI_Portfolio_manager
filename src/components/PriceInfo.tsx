'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentPrice } from '../lib/navi-client';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
}

interface PriceInfoProps {
  symbol?: string;
}

export default function PriceInfo({ symbol = 'SUI' }: PriceInfoProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        const data = await getCurrentPrice(symbol);
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [symbol]);

  if (loading) {
    return <div className="p-4 text-center">Loading price data...</div>;
  }

  if (!priceData) {
    return <div className="p-4 text-center">No price data available</div>;
  }

  const isPositiveChange = priceData.change24h >= 0;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{priceData.symbol} Price</h2>
          <p className="text-3xl font-bold mt-2">${priceData.price.toFixed(2)}</p>
        </div>
        <div className={`px-3 py-1 rounded-md ${isPositiveChange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="text-lg font-medium">
            {isPositiveChange ? '+' : ''}{priceData.change24h.toFixed(2)} ({isPositiveChange ? '+' : ''}{priceData.changePercentage24h.toFixed(2)}%)
          </p>
          <p className="text-sm">24h Change</p>
        </div>
      </div>
    </div>
  );
} 