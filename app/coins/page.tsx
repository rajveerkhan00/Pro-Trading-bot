'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { TradingStrategies } from '@/types/index';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PriceData {
  current: number;
  change: number;
  high: number;
  low: number;
  volume: number;
}

interface ConsensusSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  duration: string;
  leverage: number;
  reason: string;
  stopLoss?: number;
  takeProfit?: number;
}

interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}

interface CoinDetails {
  symbol: string;
  signals: Signal[];
  consensus: ConsensusSignal;
  priceData: PriceData;
  strategyStats: {
    buy: { count: number; strategies: string[] };
    sell: { count: number; strategies: string[] };
    hold: { count: number; strategies: string[] };
  };
  lastUpdated: Date;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
}

interface SignalResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}

export default function CoinsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState<CoinDetails | null>(null);
  const [loadingCoin, setLoadingCoin] = useState<string | null>(null);
  const [realTimePrices, setRealTimePrices] = useState<Record<string, PriceUpdate>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [coinSignals, setCoinSignals] = useState<Record<string, SignalResult>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const coinsPerPage = 20;

  const analysisRef = useRef<HTMLDivElement>(null);

  const { data: symbols, error } = useSWR<string[]>('/api/binance-symbols', fetcher);

  const classifySignal = (confidence: number, action: string) => {
    if (action === 'HOLD') return 'HOLD';
    if (action === 'BUY') return confidence >= 0.8 ? 'STRONG_BUY' : 'BUY';
    return confidence >= 0.8 ? 'STRONG_SELL' : 'SELL';
  };

  const computeSignalForSymbol = useCallback(async (symbol: string): Promise<SignalResult> => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const klines: string[][] = await res.json();

      const prices = klines.map(k => parseFloat(k[4]));
      const high = klines.map(k => parseFloat(k[2]));
      const low = klines.map(k => parseFloat(k[3]));

      const consensus = TradingStrategies.getConsensusSignal(prices, high, low, symbol);
      return {
        action: consensus.action,
        confidence: consensus.confidence
      };
    } catch (err) {
      console.error(`Failed to compute signal for ${symbol}:`, err);
      return { action: 'HOLD', confidence: 0 };
    }
  }, []);

  const fetchRealTimePrices = useCallback(async () => {
    if (!symbols || symbols.length === 0) return;

    try {
      const allPrices: Record<string, PriceUpdate> = {};
      const batchSize = 100;

      // Process symbols in batches of 100
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const symbolList = JSON.stringify(batch);
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolList)}`);
        
        if (!response.ok) {
          console.warn(`Binance batch ${i / batchSize + 1} failed:`, response.status);
          continue;
        }

        const data: Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
        }> = await response.json();

        const validPrices: PriceUpdate[] = data
          .filter(item => item && typeof item.lastPrice === 'string' && typeof item.priceChangePercent === 'string')
          .map(item => {
            const symbol = item.symbol.toUpperCase();
            const price = parseFloat(item.lastPrice);
            const change = parseFloat(item.priceChangePercent);
            return { symbol, price, change };
          })
          .filter(price => !isNaN(price.price) && !isNaN(price.change));

        validPrices.forEach(price => {
          allPrices[price.symbol] = price;
        });
      }

      setRealTimePrices(allPrices);
    } catch (error) {
      console.error('Failed to fetch real-time prices:', error);
    }
  }, [symbols]);

  const filteredCoins = useMemo(() => {
    if (!symbols) return [];
    let filtered = symbols.filter((symbol: string) => {
      if (activeTab === 'ALL') return true;
      const signal = coinSignals[symbol] || { action: 'HOLD', confidence: 0 };
      const classification = classifySignal(signal.confidence, signal.action);
      return classification === activeTab;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toUpperCase();
      filtered = filtered.filter(symbol => symbol.includes(query));
    }
    return filtered;
  }, [symbols, activeTab, coinSignals, searchQuery]);

  const totalPages = Math.ceil(filteredCoins.length / coinsPerPage);
  const paginatedCoins = filteredCoins.slice(
    (currentPage - 1) * coinsPerPage,
    currentPage * coinsPerPage
  );

  useEffect(() => {
    if (!autoRefresh || !symbols) return;
    fetchRealTimePrices();
    const interval = setInterval(fetchRealTimePrices, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, symbols, fetchRealTimePrices]);

  useEffect(() => {
    if (!symbols || paginatedCoins.length === 0) return;
    paginatedCoins.forEach((symbol: string) => {
      if (!coinSignals[symbol]) {
        computeSignalForSymbol(symbol).then(signal => {
          setCoinSignals(prev => ({ ...prev, [symbol]: signal }));
        });
      }
    });
  }, [paginatedCoins, symbols, coinSignals, computeSignalForSymbol]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const loadCoinDetails = async (symbol: string) => {
    setLoadingCoin(symbol);
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`
      );
      const klines: string[][] = await res.json();

      const prices = klines.map(k => parseFloat(k[4]));
      const high = klines.map(k => parseFloat(k[2]));
      const low = klines.map(k => parseFloat(k[3]));

      const currentPrice = prices[prices.length - 1];
      const priceChange = ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;

      const priceData = {
        current: currentPrice,
        change: priceChange,
        high: Math.max(...high),
        low: Math.min(...low),
        volume: klines.reduce((sum, k) => sum + parseFloat(k[5]), 0)
      };

      const allSignals = TradingStrategies.getAllSignals(prices, high, low, symbol);
      const consensusSignal = TradingStrategies.getConsensusSignal(prices, high, low, symbol);

      const strategyNames = TradingStrategies.getAllStrategyNames();
      const buyStrategies: string[] = [];
      const sellStrategies: string[] = [];
      const holdStrategies: string[] = [];

      allSignals.forEach((signal, index) => {
        const strategyName = strategyNames[index];
        if (signal.action === 'BUY') {
          buyStrategies.push(`${index + 1}. ${strategyName}`);
        } else if (signal.action === 'SELL') {
          sellStrategies.push(`${index + 1}. ${strategyName}`);
        } else {
          holdStrategies.push(`${index + 1}. ${strategyName}`);
        }
      });

      const coinDetails: CoinDetails = {
        symbol,
        signals: allSignals,
        consensus: consensusSignal,
        priceData,
        strategyStats: {
          buy: { count: buyStrategies.length, strategies: buyStrategies },
          sell: { count: sellStrategies.length, strategies: sellStrategies },
          hold: { count: holdStrategies.length, strategies: holdStrategies }
        },
        lastUpdated: new Date()
      };

      setSelectedCoin(coinDetails);

      setCoinSignals(prev => ({
        ...prev,
        [symbol]: {
          action: consensusSignal.action,
          confidence: consensusSignal.confidence
        }
      }));

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to load coin details:', err);
    } finally {
      setLoadingCoin(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (error) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-red-400 text-xl">Failed to load coins data</div>
    </div>
  );
  
  if (!symbols) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Loading 800+ coins...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">PerfectBot</h1>
          <p className="text-gray-400 text-center mt-2">
            800+ coins - 58 strategies - Real-time signals
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search coins (e.g., BTC, ETH, ADA...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>
        </div>

        {searchQuery && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">Search results for:</span>
                <span className="font-semibold text-white">{`"${searchQuery}"`}</span>
                <span className="text-gray-400">({filteredCoins.length} coins found)</span>
              </div>
              <button
                onClick={clearSearch}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {(['ALL', 'STRONG_BUY', 'BUY', 'SELL', 'STRONG_SELL'] as const).map((tab) => (
            <button
              key={tab}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400 shadow-lg' 
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
                setSelectedCoin(null);
              }}
            >
              <div className="text-2xl font-bold mb-1">
                {tab === 'ALL' ? filteredCoins.length : 
                 tab === 'STRONG_BUY' ? filteredCoins.filter((s: string) => {
                   const signal = coinSignals[s] || { action: 'HOLD', confidence: 0 };
                   return classifySignal(signal.confidence, signal.action) === 'STRONG_BUY';
                 }).length :
                 tab === 'BUY' ? filteredCoins.filter((s: string) => {
                   const signal = coinSignals[s] || { action: 'HOLD', confidence: 0 };
                   return classifySignal(signal.confidence, signal.action) === 'BUY';
                 }).length :
                 tab === 'SELL' ? filteredCoins.filter((s: string) => {
                   const signal = coinSignals[s] || { action: 'HOLD', confidence: 0 };
                   const classification = classifySignal(signal.confidence, signal.action);
                   return classification === 'SELL' || classification === 'STRONG_SELL';
                 }).length : 0}
              </div>
              <div className="text-sm font-medium opacity-90">{tab.replace('_', ' ')}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {paginatedCoins.length > 0 ? (
            paginatedCoins.map((symbol: string) => {
              const signal = coinSignals[symbol] || { action: 'HOLD', confidence: 0 };
              const classification = classifySignal(signal.confidence, signal.action);
              const realTimePrice = realTimePrices[symbol];
              
              const displayAction = 
                classification === 'STRONG_BUY' ? 'STRONG BUY' :
                classification === 'STRONG_SELL' ? 'STRONG SELL' :
                classification;

              return (
                <button
                  key={symbol}
                  onClick={() => loadCoinDetails(symbol)}
                  className={`block border rounded-lg p-4 hover:scale-[1.02] transition-transform duration-200 ${
                    classification === 'STRONG_BUY' ? 'border-green-500 bg-green-900/20' :
                    classification === 'BUY' ? 'border-blue-500 bg-blue-900/20' :
                    classification === 'HOLD' ? 'border-yellow-500 bg-yellow-900/20' :
                    'border-red-500 bg-red-900/20'
                  }`}
                  disabled={loadingCoin === symbol}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">{symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      classification === 'STRONG_BUY' ? 'bg-green-500 text-white' :
                      classification === 'BUY' ? 'bg-blue-500 text-white' :
                      classification === 'HOLD' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {displayAction}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="font-mono">
                        {realTimePrice 
                          ? `$${realTimePrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` 
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24h Change:</span>
                      <span className={realTimePrice?.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {realTimePrice 
                          ? `${realTimePrice.change >= 0 ? '+' : ''}${realTimePrice.change.toFixed(2)}%` 
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence:</span>
                      <span className="font-semibold">{Math.round(signal.confidence * 100)}%</span>
                    </div>
                  </div>
                  
                  {loadingCoin === symbol ? (
                    <div className="mt-3 text-xs text-blue-400 text-center flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Click for 58-strategy analysis
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <svg className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg mb-2">No coins found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mb-12">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`w-8 h-8 rounded-lg transition-all ${
                  currentPage === i + 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <div ref={analysisRef} className="mt-8">
          {selectedCoin ? (
            (() => {
              const livePriceData = realTimePrices[selectedCoin.symbol]
                ? {
                    ...selectedCoin.priceData,
                    current: realTimePrices[selectedCoin.symbol].price,
                    change: realTimePrices[selectedCoin.symbol].change,
                  }
                : selectedCoin.priceData;

              return (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold">{selectedCoin.symbol} Analysis</h2>
                        <p className="text-gray-400 text-sm mt-1">
                          Last updated: {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-6 py-3 rounded-xl font-bold text-lg ${
                        selectedCoin.consensus.action === 'BUY' 
                          ? 'bg-green-500 text-white' 
                          : selectedCoin.consensus.action === 'SELL' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {selectedCoin.consensus.action}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">${livePriceData.current.toFixed(4)}</div>
                        <div className={`text-sm font-semibold ${livePriceData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {livePriceData.change >= 0 ? '+' : ''}{Math.abs(livePriceData.change).toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-300">24h High</div>
                        <div className="text-green-400 font-bold">${livePriceData.high.toFixed(4)}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-300">24h Low</div>
                        <div className="text-red-400 font-bold">${livePriceData.low.toFixed(4)}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-300">Strategies</div>
                        <div className="text-white font-bold">{selectedCoin.signals.length}/58 Active</div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 border-l-4 ${
                    selectedCoin.consensus.action === 'BUY' 
                      ? 'bg-green-900/20 border-green-500' 
                      : selectedCoin.consensus.action === 'SELL' 
                      ? 'bg-red-900/20 border-red-500' 
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <h3 className="text-xl font-bold mb-4">Consensus Signal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Action</div>
                        <div className={`text-lg font-bold ${
                          selectedCoin.consensus.action === 'BUY' ? 'text-green-400' :
                          selectedCoin.consensus.action === 'SELL' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {selectedCoin.consensus.action}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Confidence</div>
                        <div className="text-lg font-bold text-blue-400">
                          {(selectedCoin.consensus.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Duration</div>
                        <div className="text-lg font-bold text-purple-400">{selectedCoin.consensus.duration}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Leverage</div>
                        <div className="text-lg font-bold text-orange-400">{selectedCoin.consensus.leverage}x</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-400 mb-2">Analysis Reason</div>
                      <p className="text-gray-200 leading-relaxed">{selectedCoin.consensus.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-900/20 border border-green-500 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-green-400">BUY Signals</h4>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                          {selectedCoin.strategyStats.buy.count}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedCoin.strategyStats.buy.strategies.map((strategy, idx) => (
                          <div key={idx} className="bg-green-500/20 p-3 rounded-lg text-sm">
                            <div className="text-green-300 font-medium">{strategy}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-500 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-red-400">SELL Signals</h4>
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                          {selectedCoin.strategyStats.sell.count}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedCoin.strategyStats.sell.strategies.map((strategy, idx) => (
                          <div key={idx} className="bg-red-500/20 p-3 rounded-lg text-sm">
                            <div className="text-red-300 font-medium">{strategy}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-yellow-400">HOLD Signals</h4>
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
                          {selectedCoin.strategyStats.hold.count}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedCoin.strategyStats.hold.strategies.map((strategy, idx) => (
                          <div key={idx} className="bg-yellow-500/20 p-3 rounded-lg text-sm">
                            <div className="text-yellow-300 font-medium">{strategy}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Select a coin above to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 PerfectBot - Advanced Crypto Trading Signals</p>
          <p className="text-sm mt-2">Powered by 58 sophisticated trading algorithms</p>
        </div>
      </footer>
    </div>
  );
}