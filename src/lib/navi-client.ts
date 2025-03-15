'use client';

// Cache for price data to avoid too many requests
let priceDataCache = {
  timestamp: 0,
  data: null,
  // Cache expires after 5 minutes
  expirationTime: 5 * 60 * 1000
};

// Historical price data will still be mocked for now
// In a production app, you would fetch this from a real API with historical data
interface PriceDataPoint {
  timestamp: number;
  price: number;
}

// Convert mock data to typed array
const mockHistoricalPrices: PriceDataPoint[] = [
  // Generate data points for the past year
  ...Array.from({ length: 13 }, (_, i) => {
    // Base price around $1.10 with some variation
    const basePrice = 1.10;
    const variation = Math.sin(i * 0.5) * 0.3; // Sinusoidal variation
    const randomFactor = 0.95 + (Math.random() * 0.1); // Random factor between 0.95 and 1.05
    
    return {
      timestamp: Date.now() - (365 - i * 30) * 24 * 60 * 60 * 1000, // Every 30 days
      price: parseFloat((basePrice + variation * randomFactor).toFixed(2))
    };
  }),
  
  // Add more frequent data points for recent months
  ...Array.from({ length: 10 }, (_, i) => {
    const basePrice = 1.15;
    const variation = Math.sin(i * 0.8) * 0.25;
    const randomFactor = 0.97 + (Math.random() * 0.06);
    
    return {
      timestamp: Date.now() - (90 - i * 9) * 24 * 60 * 60 * 1000, // Every 9 days in last 90 days
      price: parseFloat((basePrice + variation * randomFactor).toFixed(2))
    };
  }),
  
  // Add daily data points for the past 30 days
  ...Array.from({ length: 31 }, (_, i) => {
    const basePrice = 1.20;
    const variation = Math.sin(i * 1.2) * 0.15;
    const randomFactor = 0.98 + (Math.random() * 0.04);
    
    return {
      timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000, // Daily for past 30 days
      price: parseFloat((basePrice + variation * randomFactor).toFixed(2))
    };
  }),
  
  // Add hourly data points for the past 24 hours
  ...Array.from({ length: 25 }, (_, i) => {
    const basePrice = 1.22;
    const variation = Math.sin(i * 1.5) * 0.08;
    const randomFactor = 0.99 + (Math.random() * 0.02);
    
    return {
      timestamp: Date.now() - (24 - i) * 60 * 60 * 1000, // Hourly for past 24 hours
      price: parseFloat((basePrice + variation * randomFactor).toFixed(2))
    };
  }),
];

// Fetch data from Navi Protocol API
async function fetchNaviProtocolData() {
  try {
    // Check if cache is still valid
    const now = Date.now();
    if (priceDataCache.data && now - priceDataCache.timestamp < priceDataCache.expirationTime) {
      return priceDataCache.data;
    }

    // Fetch from Navi Protocol API
    const response = await fetch('https://api-defi.naviprotocol.io/getIndexAssetData');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Update cache
    priceDataCache = {
      timestamp: now,
      data,
      expirationTime: priceDataCache.expirationTime
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching Navi Protocol data:', error);
    return null;
  }
}

// Use mock data as fallback when API fails
const useMockHistoricalData = (timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): PriceDataPoint[] => {
  // Filter based on timeframe
  const now = Date.now();
  let startTime: number;
  
  // Special handler for day view to create a more realistic curve
  if (timeframe === 'day') {
    // Create realistic day data with small, gradual changes
    const result: PriceDataPoint[] = [];
    const hours = 24;
    const hourMs = 60 * 60 * 1000;
    const basePrice = 1.20; // Starting price
    
    // Create a more realistic price trend (slight ups and downs, no oscillations)
    // Overall trend direction (up or down)
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const trendStrength = 0.05 + Math.random() * 0.15; // How much to move overall (5-20%)
    
    for (let i = 0; i <= hours; i++) {
      const timePoint = now - (hours - i) * hourMs;
      
      // Calculate price: base + overall trend + slight noise
      // This creates a somewhat natural looking curve with some noise
      const trendProgress = i / hours; // 0 to 1 as day progresses
      const trendComponent = basePrice * trendDirection * trendStrength * trendProgress;
      
      // Add small random noise (±1%)
      const randomNoise = basePrice * (Math.random() * 0.02 - 0.01);
      
      // Add slight curve using sin function (smaller amplitude)
      const curveComponent = basePrice * 0.02 * Math.sin(trendProgress * Math.PI * 2);
      
      const price = basePrice + trendComponent + randomNoise + curveComponent;
      
      result.push({
        timestamp: timePoint,
        price: parseFloat(price.toFixed(4))
      });
    }
    
    return result;
  }
  
  // Default handling for other timeframes
  switch (timeframe) {
    case 'week':
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      startTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case 'year':
      startTime = now - 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      startTime = now - 30 * 24 * 60 * 60 * 1000;
  }
  
  return mockHistoricalPrices.filter((item: { timestamp: number, price: number }) => item.timestamp >= startTime);
};

// Get current price data
export const getCurrentPrice = async (symbol: string = 'SUI'): Promise<{
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
}> => {
  try {
    // Try to get fresh data from CoinGecko for current price
    if (symbol === 'SUI') {
      const url = 'https://api.coingecko.com/api/v3/coins/sui?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
      
      console.log('Fetching current price from CoinGecko');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.market_data) {
        throw new Error('Invalid data format from CoinGecko API');
      }
      
      const marketData = data.market_data;
      
      return {
        symbol: symbol,
        price: marketData.current_price?.usd || 0,
        change24h: marketData.price_change_24h || 0,
        changePercentage24h: marketData.price_change_percentage_24h || 0
      };
    } else {
      // For other tokens, try to use Navi Protocol API
      throw new Error(`Token ${symbol} is not yet supported directly, trying Navi Protocol`);
    }
  } catch (error) {
    console.error('Error fetching from CoinGecko, trying Navi Protocol:', error);
    
    try {
      // Fallback to Navi Protocol API 
      const naviData = await fetchNaviProtocolData();
      
      if (!naviData) {
        throw new Error('Failed to fetch data from Navi Protocol');
      }
      
      // Define token data interface
      interface TokenData {
        symbol: string;
        price: string;
        priceChangeInUSD: string;
        priceChangePercent: string;
      }
      
      // Try to find the token in Navi's data
      const tokenData = naviData.find((token: TokenData) => token.symbol.toLowerCase() === symbol.toLowerCase());
      
      if (!tokenData) {
        throw new Error(`Token ${symbol} not found in Navi Protocol data`);
      }
      
      return {
        symbol: symbol,
        price: parseFloat(tokenData.price) || 0,
        change24h: parseFloat(tokenData.priceChangeInUSD) || 0,
        changePercentage24h: parseFloat(tokenData.priceChangePercent) || 0
      };
    } catch (naviError) {
      console.error('Error fetching from Navi Protocol:', naviError);
      
      // If both APIs fail, return a mock price
      return getMockPrice(symbol);
    }
  }
};

// Provide mock prices as last resort fallback
const getMockPrice = (symbol: string): {
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
} => {
  // Default mock values
  const mockPrices: Record<string, { price: number; change24h: number; changePercentage24h: number }> = {
    'SUI': {
      price: 1.21,
      change24h: 0.03,
      changePercentage24h: 2.5
    }
  };
  
  const data = mockPrices[symbol] || { price: 1.00, change24h: 0, changePercentage24h: 0 };
  
  return {
    symbol: symbol,
    price: data.price,
    change24h: data.change24h,
    changePercentage24h: data.changePercentage24h
  };
};

// Historical price data cache
interface PriceCache {
  timestamp: number;
  data: { timestamp: number; price: number }[] | null;
}

interface TokenCache {
  day: PriceCache;
  week: PriceCache;
  month: PriceCache;
  year: PriceCache;
}

interface HistoricalCache {
  [key: string]: TokenCache;
}

// Historical price data cache
let historicalPriceCache: HistoricalCache = {
  SUI: {
    day: { timestamp: 0, data: null },
    week: { timestamp: 0, data: null },
    month: { timestamp: 0, data: null },
    year: { timestamp: 0, data: null }
  }
};

// Cache expiration times (in milliseconds)
const cacheExpiration: Record<string, number> = {
  day: 5 * 60 * 1000, // 5 minutes for 1-day data 
  week: 30 * 60 * 1000, // 30 minutes for 1-week data
  month: 2 * 60 * 60 * 1000, // 2 hours for 1-month data
  year: 24 * 60 * 60 * 1000 // 24 hours for 1-year data
};

// Fetch historical price data from CoinGecko API
export const getHistoricalPrices = async (
  symbol: string = 'SUI',
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  try {
    console.log(`Fetching historical prices for ${symbol} with timeframe: ${timeframe}`);
    
    // Check if we have cached data that's still valid (using shorter cache times)
    const cacheValidityTimes = {
      day: 5 * 60 * 1000, // 5 minutes for day data (more frequent updates)
      week: 15 * 60 * 1000, // 15 minutes for week data
      month: 30 * 60 * 1000, // 30 minutes for month data
      year: 60 * 60 * 1000, // 1 hour for year data
    };
    
    const cache = historicalPriceCache[symbol]?.[timeframe];
    const now = Date.now();
    if (cache && cache.data && now - cache.timestamp < cacheValidityTimes[timeframe]) {
      console.log('Using cached historical price data');
      return cache.data;
    }
    
    // Map timeframe to days and interval for CoinGecko API
    const days = timeframe === 'day' ? 1 : 
                timeframe === 'week' ? 7 :
                timeframe === 'month' ? 30 : 
                timeframe === 'year' ? 365 : 30;
                
    // For 1-day view we need hourly data points
    const interval = timeframe === 'day' ? 'hourly' : 'daily';
    
    // For SUI, use CoinGecko API with appropriate parameters
    if (symbol === 'SUI') {
      const url = `https://api.coingecko.com/api/v3/coins/sui/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;
      
      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.prices || !Array.isArray(data.prices)) {
        throw new Error('Invalid data format from CoinGecko API');
      }
      
      console.log(`Retrieved ${data.prices.length} price points from CoinGecko`);
      
      // Transform CoinGecko data to our format and ensure it's sorted by timestamp
      const historicalPrices = data.prices
        .map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price
        }))
        .sort((a: PriceDataPoint, b: PriceDataPoint) => a.timestamp - b.timestamp);
      
      console.log(`Sample of real data:`, historicalPrices.slice(0, 2), '...', historicalPrices.slice(-2));
      
      // Cache the results
      if (!historicalPriceCache[symbol]) {
        historicalPriceCache[symbol] = {
          day: { timestamp: 0, data: null },
          week: { timestamp: 0, data: null },
          month: { timestamp: 0, data: null },
          year: { timestamp: 0, data: null }
        };
      }
      
      historicalPriceCache[symbol][timeframe] = {
        timestamp: now,
        data: historicalPrices
      };
      
      return historicalPrices;
    } else {
      // For other tokens, we would implement similar API calls
      throw new Error(`Historical data for ${symbol} is not yet supported`);
    }
  } catch (error) {
    console.error('Error fetching historical price data:', error);
    
    // Only fall back to mock data if API completely fails
    console.log('Falling back to mock data due to API failure');
    return useMockHistoricalData(timeframe);
  }
};

// Calculate the portfolio value based on token balances and prices
export const calculatePortfolioValue = async (
  balances: { symbol: string; amount: number }[]
) => {
  try {
    let totalValue = 0;
    
    for (const balance of balances) {
      const priceData = await getCurrentPrice(balance.symbol);
      totalValue += balance.amount * priceData.price;
    }
    
    return totalValue;
  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    return 0;
  }
};

/**
 * Get portfolio value history based on historical prices
 * @param balance Current balance in SUI
 * @param symbol Token symbol (default: SUI)
 * @param timeframe Time period for portfolio history
 * @returns Array of portfolio value data points with timestamps
 */
export const getPortfolioHistory = async (
  balance: number,
  symbol: string = 'SUI',
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<Array<{timestamp: number, value: number}>> => {
  console.log(`getPortfolioHistory called with: balance=${balance}, symbol=${symbol}, timeframe=${timeframe}`);
  
  // Validate balance
  if (!balance || isNaN(balance) || balance <= 0) {
    console.error(`Invalid balance: ${balance}, returning sample data`);
    return generateSamplePortfolioData(timeframe);
  }
  
  try {
    // Get current price first to ensure we have accurate present value
    console.log(`Fetching current price for ${symbol}...`);
    const currentPriceData = await getCurrentPrice(symbol);
    const currentPrice = currentPriceData.price;
    console.log(`Current price for ${symbol}: $${currentPrice}`);
    
    // Current portfolio value
    const currentValue = balance * currentPrice;
    console.log(`Current portfolio value: $${currentValue}`);
    
    // Get historical prices
    console.log(`Fetching historical prices for ${symbol} (${timeframe})...`);
    const historicalPrices = await getHistoricalPrices(symbol, timeframe);
    
    if (!historicalPrices || !Array.isArray(historicalPrices) || historicalPrices.length === 0) {
      console.error(`Failed to get historical prices for ${symbol}, returning sample data`);
      return generateSamplePortfolioData(timeframe, currentValue);
    }
    
    console.log(`Retrieved ${historicalPrices.length} historical price points`);
    
    // Calculate how many tokens the user has based on current value and price
    const tokenAmount = balance;
    console.log(`Estimated token amount: ${tokenAmount} ${symbol}`);
    
    // Calculate portfolio value at each historical price point
    const portfolioHistory = historicalPrices.map(pricePoint => {
      return {
        timestamp: pricePoint.timestamp,
        value: tokenAmount * pricePoint.price
      };
    });
    
    // Add current value as the final data point to ensure we show the latest value
    const now = Date.now();
    portfolioHistory.push({
      timestamp: now,
      value: currentValue
    });
    
    // Sort by timestamp to ensure chronological order
    portfolioHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Debug output
    console.log(`Generated ${portfolioHistory.length} portfolio history data points`);
    console.log('First point:', portfolioHistory[0]);
    console.log('Last point:', portfolioHistory[portfolioHistory.length - 1]);
    
    return portfolioHistory;
  } catch (error) {
    console.error(`Error in getPortfolioHistory:`, error);
    // Return sample data in case of error
    return generateSamplePortfolioData(timeframe);
  }
};

/**
 * Generate sample portfolio data for testing/fallback purposes
 */
function generateSamplePortfolioData(
  timeframe: 'day' | 'week' | 'month' | 'year',
  currentValue: number = 1000
): Array<{timestamp: number, value: number}> {
  const now = Date.now();
  const data: Array<{timestamp: number, value: number}> = [];
  
  let interval: number;
  let points: number;
  
  // Set interval and number of points based on timeframe
  switch (timeframe) {
    case 'day':
      interval = 60 * 60 * 1000; // 1 hour in ms
      points = 24;
      break;
    case 'week':
      interval = 24 * 60 * 60 * 1000; // 1 day in ms
      points = 7;
      break;
    case 'month':
      interval = 24 * 60 * 60 * 1000; // 1 day in ms
      points = 30;
      break;
    case 'year':
      interval = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
      points = 52;
      break;
  }
  
  // Generate sample data with slight random variations
  for (let i = 0; i < points; i++) {
    const timestamp = now - ((points - i) * interval);
    
    // Random value between 0.9 and 1.1 of currentValue
    // For a somewhat realistic growth trend, increase likelihood of positive changes
    const randomFactor = 0.9 + (Math.random() * 0.2);
    const growthFactor = 1 + (i / points * 0.2); // Gradually increase by up to 20%
    
    const value = currentValue * randomFactor * growthFactor;
    
    data.push({ timestamp, value });
  }
  
  // Add current value as last point
  data.push({ timestamp: now, value: currentValue });
  
  console.log(`Generated ${data.length} sample portfolio data points`);
  return data;
}

/**
 * Get the current price of SUI in USD from CoinGecko
 * @returns Current SUI price in USD
 */
export const getCurrentSuiPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching SUI price: ${response.statusText}`);
    }
    
    const data = await response.json();
    const price = data.sui?.usd;
    
    if (!price) {
      throw new Error('Could not get SUI price from response');
    }
    
    console.log(`Current SUI price: $${price}`);
    return price;
  } catch (error) {
    console.error('Error getting SUI price:', error);
    // Fallback price if API fails
    return 1.42; // Default fallback price
  }
}; 