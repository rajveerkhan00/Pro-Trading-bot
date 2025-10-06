// Technical Indicators
export class TechnicalIndicators {
  static calculateRSI(prices: number[], period: number): { value: number; signal: 'BUY' | 'SELL' | 'HOLD'; strength: number } {
    if (prices.length < period + 1) {
      return { value: 50, signal: 'HOLD', strength: 0 };
    }

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(-change);
      }
    }

    const avgGain = gains.slice(-period).reduce((sum, val) => sum + val, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, val) => sum + val, 0) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;

    if (rsi < 30) {
      signal = 'BUY';
      strength = (30 - rsi) / 30;
    } else if (rsi > 70) {
      signal = 'SELL';
      strength = (rsi - 70) / 30;
    }

    return { value: rsi, signal, strength };
  }

  static calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    if (prices.length < 26) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    const signalLine = this.calculateEMA(prices.slice(-26), 9);
    const histogram = macdLine - signalLine;

    return { macd: macdLine, signal: signalLine, histogram };
  }

  static calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }

    const sma = this.calculateSMA(prices, period);
    const stdDev = Math.sqrt(
      prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    );

    return {
      upper: sma + (2 * stdDev),
      middle: sma,
      lower: sma - (2 * stdDev)
    };
  }

  static calculateStochastic(prices: number[], high: number[], low: number[], period: number = 14): { value: number; signal: 'BUY' | 'SELL' | 'HOLD'; strength: number } {
    if (prices.length < period) {
      return { value: 50, signal: 'HOLD', strength: 0 };
    }

    const recentHigh = Math.max(...high.slice(-period));
    const recentLow = Math.min(...low.slice(-period));
    const currentPrice = prices[prices.length - 1];

    const k = ((currentPrice - recentLow) / (recentHigh - recentLow)) * 100;

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;

    if (k < 20) {
      signal = 'BUY';
      strength = (20 - k) / 20;
    } else if (k > 80) {
      signal = 'SELL';
      strength = (k - 80) / 20;
    }

    return { value: k, signal, strength };
  }

  static calculateCCI(prices: number[], high: number[], low: number[], period: number = 20): number {
    if (prices.length < period) {
      return 0;
    }

    const typicalPrices = prices.map((p, i) => (p + high[i] + low[i]) / 3);
    const sma = this.calculateSMA(typicalPrices, period);
    const meanDeviation = typicalPrices.slice(-period).reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;

    if (meanDeviation === 0) return 0;

    const cci = (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);

    return cci;
  }

  static calculateATR(high: number[], low: number[], prices: number[], period: number = 14): number {
    if (high.length < period) {
      return 0;
    }

    const trValues: number[] = [];
    for (let i = 1; i < high.length; i++) {
      const tr = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - prices[i - 1]),
        Math.abs(low[i] - prices[i - 1])
      );
      trValues.push(tr);
    }

    return this.calculateSMA(trValues, period);
  }

  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return 0;
    }
    return prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  }

  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return 0;
    }

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }
}

// Types
export interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: Date;
  duration: string;
  reason: string;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
}

export interface MarketAnalysis {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number;
  volume: number;
  volatility: number;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
}

// Trading Strategies Class
export class TradingStrategies {
  private static readonly MIN_DATA_POINTS = 50;

  static getAllStrategyNames(): string[] {
    return [
      'Multi-Timeframe RSI',
      'Trend Following MACD',
      'Mean Reversion BB',
      'Volume-Weighted MACD',
      'Ichimoku Cloud',
      'Supertrend Strategy',
      'Parabolic SAR',
      'ADX Momentum',
      'RSI Divergence',
      'MACD Histogram',
      'Bollinger Squeeze',
      'Stochastic Oscillator',
      'Williams %R',
      'CCI Strategy',
      'ATR Breakout',
      'VWAP Strategy',
      'Fibonacci Retracement',
      'Pivot Points',
      'Moving Average Cross',
      'EMA Ribbon',
      'Price Action',
      'Support Resistance',
      'Volume Profile',
      'Order Flow',
      'Market Structure',
      'Elliott Wave',
      'Harmonic Patterns',
      'Gartley Pattern',
      'Butterfly Pattern',
      'Bat Pattern',
      'Crab Pattern',
      'Cypher Pattern',
      'Deep Learning AI',
      'Neural Network',
      'Genetic Algorithm',
      'Reinforcement Learning',
      'Sentiment Analysis',
      'Social Volume',
      'Whale Tracking',
      'Liquidity Analysis',
      'Market Cycle',
      'Seasonality',
      'Correlation Matrix',
      'Volatility Smile',
      'Gamma Exposure',
      'Delta Neutral',
      'Options Flow',
      'Funding Rate',
      'Open Interest',
      'Leverage Ratio',
      'Fear & Greed',
      'Network Growth',
      'On-Chain Analysis',
      'MVRV Z-Score',
      'NVT Ratio',
      'Stock-to-Flow',
      'Realized Price',
      'Coin Days Destroyed'
    ];
  }

  // Core Strategies (1-10)
  static multiTimeframeRSI(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const rsi5 = TechnicalIndicators.calculateRSI(prices.slice(-5), 5);
    const rsi14 = TechnicalIndicators.calculateRSI(prices, 14);
    const rsi21 = TechnicalIndicators.calculateRSI(prices.slice(-21), 21);
    const currentPrice = prices[prices.length - 1];
    const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
    let buySignals = 0;
    let sellSignals = 0;
    let totalConfidence = 0;
    if (rsi5.signal === 'BUY') { buySignals++; totalConfidence += rsi5.strength; }
    if (rsi5.signal === 'SELL') { sellSignals++; totalConfidence += rsi5.strength; }
    if (rsi14.signal === 'BUY') { buySignals++; totalConfidence += rsi14.strength; }
    if (rsi14.signal === 'SELL') { sellSignals++; totalConfidence += rsi14.strength; }
    if (rsi21.signal === 'BUY') { buySignals++; totalConfidence += rsi21.strength; }
    if (rsi21.signal === 'SELL') { sellSignals++; totalConfidence += rsi21.strength; }
    if (currentPrice > sma20 * 1.02) { buySignals++; totalConfidence += 0.2; }
    if (currentPrice < sma20 * 0.98) { sellSignals++; totalConfidence += 0.2; }
    const confidence = Math.min(totalConfidence / 4, 0.95);
    const action = buySignals > sellSignals ? 'BUY' : sellSignals > buySignals ? 'SELL' : 'HOLD';
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Multi-timeframe RSI: ${buySignals}B/${sellSignals}S signals`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static trendFollowingMACD(prices: number[], symbol: string): TradeSignal {
    const macd = TechnicalIndicators.calculateMACD(prices);
    const ema9 = TechnicalIndicators.calculateEMA(prices, 9);
    const ema21 = TechnicalIndicators.calculateEMA(prices, 21);
    const currentPrice = prices[prices.length - 1];
    let buySignals = 0;
    let sellSignals = 0;
    let totalConfidence = 0;
    if (macd.macd > macd.signal && macd.histogram > 0) {
      buySignals++;
      totalConfidence += Math.min(Math.abs(macd.histogram) * 100, 0.3);
    }
    if (macd.macd < macd.signal && macd.histogram < 0) {
      sellSignals++;
      totalConfidence += Math.min(Math.abs(macd.histogram) * 100, 0.3);
    }
    if (ema9 > ema21) {
      buySignals++;
      totalConfidence += 0.2;
    } else {
      sellSignals++;
      totalConfidence += 0.2;
    }
    if (currentPrice > ema21) {
      buySignals++;
      totalConfidence += 0.1;
    } else {
      sellSignals++;
      totalConfidence += 0.1;
    }
    const confidence = Math.min(totalConfidence / 3, 0.9);
    const action = buySignals > sellSignals ? 'BUY' : sellSignals > buySignals ? 'SELL' : 'HOLD';
    const stopLoss = action === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03;
    const takeProfit = action === 'BUY' ? currentPrice * 1.06 : currentPrice * 0.94;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `Trend Following: MACD ${macd.histogram > 0 ? 'Bullish' : 'Bearish'}, EMA${ema9 > ema21 ? ' Bull' : ' Bear'}`,
      stopLoss,
      takeProfit,
      leverage: 5
    };
  }

  static meanReversionBB(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const bb = TechnicalIndicators.calculateBollingerBands(prices, 20);
    const rsi = TechnicalIndicators.calculateRSI(prices, 14);
    const stochastic = TechnicalIndicators.calculateStochastic(prices, high, low, 14);
    const currentPrice = prices[prices.length - 1];
    let buySignals = 0;
    let sellSignals = 0;
    let totalConfidence = 0;
    if (currentPrice < bb.lower) {
      buySignals++;
      totalConfidence += Math.min((bb.lower - currentPrice) / bb.lower * 1000, 0.4);
    }
    if (currentPrice > bb.upper) {
      sellSignals++;
      totalConfidence += Math.min((currentPrice - bb.upper) / bb.upper * 1000, 0.4);
    }
    if (rsi.signal === 'BUY') {
      buySignals++;
      totalConfidence += rsi.strength;
    }
    if (rsi.signal === 'SELL') {
      sellSignals++;
      totalConfidence += rsi.strength;
    }
    if (stochastic.signal === 'BUY') {
      buySignals++;
      totalConfidence += stochastic.strength;
    }
    if (stochastic.signal === 'SELL') {
      sellSignals++;
      totalConfidence += stochastic.strength;
    }
    const confidence = Math.min(totalConfidence / 3, 0.85);
    const action = buySignals > sellSignals ? 'BUY' : sellSignals > buySignals ? 'SELL' : 'HOLD';
    const stopLoss = action === 'BUY' ? currentPrice * 0.99 : currentPrice * 1.01;
    const takeProfit = bb.middle;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '5m-15m',
      reason: `Mean Reversion: BB${currentPrice < bb.lower ? ' Oversold' : ' Overbought'}, RSI:${rsi.value.toFixed(1)}`,
      stopLoss,
      takeProfit,
      leverage: 2
    };
  }

  static volumeWeightedMACD(prices: number[], volumes: number[], symbol: string): TradeSignal {
    if (prices.length < 26 || volumes.length < 26) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for VW-MACD',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    const vwPrices = prices.map((p, i) => p * (volumes[i] || 1));
    const macd = TechnicalIndicators.calculateMACD(vwPrices);
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (macd.macd > macd.signal && macd.histogram > 0) {
      action = 'BUY';
      confidence = Math.min(Math.abs(macd.histogram) * 200, 0.9);
    } else if (macd.macd < macd.signal && macd.histogram < 0) {
      action = 'SELL';
      confidence = Math.min(Math.abs(macd.histogram) * 200, 0.9);
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03;
    const takeProfit = action === 'BUY' ? currentPrice * 1.06 : currentPrice * 0.94;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `Volume-Weighted MACD: ${macd.histogram > 0 ? 'Bullish' : 'Bearish'}`,
      stopLoss,
      takeProfit,
      leverage: 4
    };
  }

  static ichimokuCloud(prices: number[], symbol: string): TradeSignal {
    if (prices.length < 52) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for Ichimoku',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    const high9 = Math.max(...prices.slice(-9));
    const low9 = Math.min(...prices.slice(-9));
    const high26 = Math.max(...prices.slice(-26));
    const low26 = Math.min(...prices.slice(-26));
    const high52 = Math.max(...prices.slice(-52));
    const low52 = Math.min(...prices.slice(-52));
    const conversionLine = (high9 + low9) / 2;
    const baseLine = (high26 + low26) / 2;
    const leadingSpanA = (conversionLine + baseLine) / 2;
    const leadingSpanB = (high52 + low52) / 2;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > leadingSpanA && currentPrice > leadingSpanB && conversionLine > baseLine) {
      action = 'BUY';
      confidence = 0.85;
    } else if (currentPrice < leadingSpanA && currentPrice < leadingSpanB && conversionLine < baseLine) {
      action = 'SELL';
      confidence = 0.85;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '4h-1d',
      reason: `Ichimoku Cloud: ${action === 'BUY' ? 'Price above cloud' : action === 'SELL' ? 'Price below cloud' : 'Neutral'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static supertrendStrategy(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    if (prices.length < 20) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for Supertrend',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    const sma10 = TechnicalIndicators.calculateSMA(prices, 10);
    const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
    if (currentPrice > sma10 && sma10 > sma20) {
      action = 'BUY';
      confidence = 0.75;
    } else if (currentPrice < sma10 && sma10 < sma20) {
      action = 'SELL';
      confidence = 0.75;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '30m-2h',
      reason: `Supertrend: ${action === 'BUY' ? 'Uptrend confirmed' : action === 'SELL' ? 'Downtrend confirmed' : 'No trend'}`,
      stopLoss,
      takeProfit,
      leverage: 4
    };
  }

  static parabolicSAR(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    if (prices.length < 10) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for Parabolic SAR',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    const recentHigh = Math.max(...high.slice(-5));
    const recentLow = Math.min(...low.slice(-5));
    if (currentPrice > recentHigh * 1.01) {
      action = 'BUY';
      confidence = 0.75;
    } else if (currentPrice < recentLow * 0.99) {
      action = 'SELL';
      confidence = 0.75;
    }
    const stopLoss = action === 'BUY' ? recentLow : recentHigh;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-6h',
      reason: `Parabolic SAR: ${action === 'BUY' ? 'Trend reversal up' : action === 'SELL' ? 'Trend reversal down' : 'No reversal'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static adxMomentum(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    if (prices.length < 14) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for ADX',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    const recentTrend = currentPrice > prices[prices.length - 5] ? 'UP' : 'DOWN';
    const volatility = Math.abs((currentPrice - prices[prices.length - 5]) / prices[prices.length - 5]);
    if (recentTrend === 'UP' && volatility > 0.02) {
      action = 'BUY';
      confidence = Math.min(volatility * 10, 0.8);
    } else if (recentTrend === 'DOWN' && volatility > 0.02) {
      action = 'SELL';
      confidence = Math.min(volatility * 10, 0.8);
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '2h-1d',
      reason: `ADX Momentum: ${recentTrend} trend with ${(volatility * 100).toFixed(1)}% volatility`,
      stopLoss,
      takeProfit,
      leverage: 2
    };
  }

  static rsiDivergence(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const rsi = TechnicalIndicators.calculateRSI(prices, 14);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (rsi.value < 30 && currentPrice > prices[prices.length - 5]) {
      action = 'BUY';
      confidence = 0.7;
    } else if (rsi.value > 70 && currentPrice < prices[prices.length - 5]) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `RSI Divergence: ${rsi.value.toFixed(1)}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static macdHistogram(prices: number[], symbol: string): TradeSignal {
    const macd = TechnicalIndicators.calculateMACD(prices);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (macd.histogram > 0 && macd.histogram > macd.signal * 0.5) {
      action = 'BUY';
      confidence = Math.min(Math.abs(macd.histogram) * 150, 0.8);
    } else if (macd.histogram < 0 && macd.histogram < macd.signal * 0.5) {
      action = 'SELL';
      confidence = Math.min(Math.abs(macd.histogram) * 150, 0.8);
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '30m-2h',
      reason: `MACD Histogram: ${macd.histogram > 0 ? 'Bullish' : 'Bearish'} momentum`,
      stopLoss,
      takeProfit,
      leverage: 4
    };
  }

  static bollingerSqueeze(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const bb = TechnicalIndicators.calculateBollingerBands(prices, 20);
    const currentPrice = prices[prices.length - 1];
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (bbWidth < 0.1) {
      if (currentPrice > bb.middle) {
        action = 'BUY';
        confidence = 0.8;
      } else {
        action = 'SELL';
        confidence = 0.8;
      }
    }
    const stopLoss = action === 'BUY' ? bb.lower : bb.upper;
    const takeProfit = action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Bollinger Squeeze: Breakout expected`,
      stopLoss,
      takeProfit,
      leverage: 5
    };
  }

  static stochasticOscillator(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const stochastic = TechnicalIndicators.calculateStochastic(prices, high, low, 14);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (stochastic.value < 20) {
      action = 'BUY';
      confidence = 0.7;
    } else if (stochastic.value > 80) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.99 : currentPrice * 1.01;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Stochastic: ${stochastic.value.toFixed(1)}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static williamsR(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const highestHigh = Math.max(...high.slice(-14));
    const lowestLow = Math.min(...low.slice(-14));
    const williamsR = ((highestHigh - currentPrice) / (highestHigh - lowestLow)) * -100;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (williamsR < -80) {
      action = 'BUY';
      confidence = 0.7;
    } else if (williamsR > -20) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.99 : currentPrice * 1.01;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Williams %R: ${williamsR.toFixed(1)}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static cciStrategy(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const cci = TechnicalIndicators.calculateCCI(prices, high, low, 20);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (cci < -100) {
      action = 'BUY';
      confidence = 0.7;
    } else if (cci > 100) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.99 : currentPrice * 1.01;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '30m-2h',
      reason: `CCI: ${cci.toFixed(1)}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static atrBreakout(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const atr = TechnicalIndicators.calculateATR(high, low, prices, 14);
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > prevPrice + atr) {
      action = 'BUY';
      confidence = 0.75;
    } else if (currentPrice < prevPrice - atr) {
      action = 'SELL';
      confidence = 0.75;
    }
    const stopLoss = action === 'BUY' ? currentPrice - (atr * 1.5) : currentPrice + (atr * 1.5);
    const takeProfit = action === 'BUY' ? currentPrice + (atr * 2) : currentPrice - (atr * 2);
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `ATR Breakout: ${(atr / currentPrice * 100).toFixed(2)}% volatility`,
      stopLoss,
      takeProfit,
      leverage: 4
    };
  }

  static vwapStrategy(prices: number[], volumes: number[], high: number[], low: number[], symbol: string): TradeSignal {
    if (prices.length < 20 || volumes.length < 20) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'Insufficient data for VWAP',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const currentPrice = prices[prices.length - 1];
    const typicalPrices = prices.map((p, i) => (p + high[i] + low[i]) / 3);
    const vwap = typicalPrices.reduce((sum, tp, i) => sum + (tp * volumes[i]), 0) / volumes.reduce((sum, vol) => sum + vol, 0);
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > vwap * 1.01) {
      action = 'BUY';
      confidence = 0.7;
    } else if (currentPrice < vwap * 0.99) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? vwap : vwap;
    const takeProfit = action === 'BUY' ? currentPrice * 1.02 : currentPrice * 0.98;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `VWAP: Price ${currentPrice > vwap ? 'above' : 'below'} VWAP`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static fibonacciRetracement(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const recentHigh = Math.max(...high.slice(-20));
    const recentLow = Math.min(...low.slice(-20));
    const diff = recentHigh - recentLow;
    const level236 = recentHigh - (diff * 0.236);
    const level382 = recentHigh - (diff * 0.382);
    const level500 = recentHigh - (diff * 0.5);
    const level618 = recentHigh - (diff * 0.618);
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice <= level618 && currentPrice > recentLow) {
      action = 'BUY';
      confidence = 0.8;
    } else if (currentPrice >= level236 && currentPrice < recentHigh) {
      action = 'SELL';
      confidence = 0.8;
    }
    const stopLoss = action === 'BUY' ? recentLow : recentHigh;
    const takeProfit = action === 'BUY' ? level382 : level500;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '4h-1d',
      reason: `Fibonacci: ${action === 'BUY' ? 'Support' : 'Resistance'} level`,
      stopLoss,
      takeProfit,
      leverage: 2
    };
  }

  static pivotPoints(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const prevHigh = high[high.length - 2] || currentPrice;
    const prevLow = low[low.length - 2] || currentPrice;
    const prevClose = prices[prices.length - 2] || currentPrice;
    const pivot = (prevHigh + prevLow + prevClose) / 3;
    const r1 = (2 * pivot) - prevLow;
    const s1 = (2 * pivot) - prevHigh;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > r1) {
      action = 'BUY';
      confidence = 0.7;
    } else if (currentPrice < s1) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? pivot : pivot;
    const takeProfit = action === 'BUY' ? currentPrice * 1.02 : currentPrice * 0.98;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `Pivot Points: ${action === 'BUY' ? 'Above R1' : 'Below S1'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static movingAverageCross(prices: number[], symbol: string): TradeSignal {
    const sma10 = TechnicalIndicators.calculateSMA(prices, 10);
    const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (sma10 > sma20) {
      action = 'BUY';
      confidence = 0.75;
    } else if (sma10 < sma20) {
      action = 'SELL';
      confidence = 0.75;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
    const takeProfit = action === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '30m-2h',
      reason: `MA Cross: SMA10 ${sma10 > sma20 ? 'above' : 'below'} SMA20`,
      stopLoss,
      takeProfit,
      leverage: 4
    };
  }

  static emaRibbon(prices: number[], symbol: string): TradeSignal {
    const ema8 = TechnicalIndicators.calculateEMA(prices, 8);
    const ema13 = TechnicalIndicators.calculateEMA(prices, 13);
    const ema21 = TechnicalIndicators.calculateEMA(prices, 21);
    const ema34 = TechnicalIndicators.calculateEMA(prices, 34);
    const currentPrice = prices[prices.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (ema8 > ema13 && ema13 > ema21 && ema21 > ema34) {
      action = 'BUY';
      confidence = 0.8;
    } else if (ema8 < ema13 && ema13 < ema21 && ema21 < ema34) {
      action = 'SELL';
      confidence = 0.8;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03;
    const takeProfit = action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `EMA Ribbon: ${action === 'BUY' ? 'Bullish alignment' : 'Bearish alignment'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static priceAction(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];
    const prevPrevPrice = prices[prices.length - 3];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > prevPrice && prevPrice > prevPrevPrice) {
      action = 'BUY';
      confidence = 0.7;
    } else if (currentPrice < prevPrice && prevPrice < prevPrevPrice) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? prevPrevPrice : prevPrevPrice;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Price Action: ${action === 'BUY' ? 'Higher highs' : 'Lower lows'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static supportResistance(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const recentHigh = Math.max(...high.slice(-10));
    const recentLow = Math.min(...low.slice(-10));
    const resistance = recentHigh * 0.99;
    const support = recentLow * 1.01;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice <= support) {
      action = 'BUY';
      confidence = 0.75;
    } else if (currentPrice >= resistance) {
      action = 'SELL';
      confidence = 0.75;
    }
    const stopLoss = action === 'BUY' ? recentLow : recentHigh;
    const takeProfit = action === 'BUY' ? resistance : support;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1h-4h',
      reason: `Support/Resistance: ${action === 'BUY' ? 'Bounce from support' : 'Rejection at resistance'}`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static volumeProfile(prices: number[], volumes: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentVolume > avgVolume * 1.5 && currentPrice > prices[prices.length - 2]) {
      action = 'BUY';
      confidence = 0.7;
    } else if (currentVolume > avgVolume * 1.5 && currentPrice < prices[prices.length - 2]) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.99 : currentPrice * 1.01;
    const takeProfit = action === 'BUY' ? currentPrice * 1.03 : currentPrice * 0.97;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '15m-1h',
      reason: `Volume Profile: ${(currentVolume / avgVolume).toFixed(1)}x avg volume`,
      stopLoss,
      takeProfit,
      leverage: 3
    };
  }

  static orderFlow(prices: number[], volumes: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const priceChange = currentPrice - prices[prices.length - 2];
    const volumeChange = volumes[volumes.length - 1] - (volumes[volumes.length - 2] || volumes[volumes.length - 1]);
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (priceChange > 0 && volumeChange > 0) {
      action = 'BUY';
      confidence = 0.7;
    } else if (priceChange < 0 && volumeChange > 0) {
      action = 'SELL';
      confidence = 0.7;
    }
    const stopLoss = action === 'BUY' ? currentPrice * 0.995 : currentPrice * 1.005;
    const takeProfit = action === 'BUY' ? currentPrice * 1.015 : currentPrice * 0.985;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '5m-15m',
      reason: `Order Flow: ${priceChange > 0 ? 'Bullish' : 'Bearish'} with volume`,
      stopLoss,
      takeProfit,
      leverage: 5
    };
  }

  static marketStructure(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const currentPrice = prices[prices.length - 1];
    const sma50 = TechnicalIndicators.calculateSMA(prices, 50);
    const sma200 = TechnicalIndicators.calculateSMA(prices, 200);
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    if (currentPrice > sma50 && sma50 > sma200) {
      action = 'BUY';
      confidence = 0.8;
    } else if (currentPrice < sma50 && sma50 < sma200) {
      action = 'SELL';
      confidence = 0.8;
    }
    const stopLoss = action === 'BUY' ? sma200 : sma200;
    const takeProfit = action === 'BUY' ? currentPrice * 1.1 : currentPrice * 0.9;
    return {
      symbol,
      action,
      confidence: action === 'HOLD' ? 0 : confidence,
      price: currentPrice,
      timestamp: new Date(),
      duration: '1d-1w',
      reason: `Market Structure: ${action === 'BUY' ? 'Bull market' : 'Bear market'}`,
      stopLoss,
      takeProfit,
      leverage: 2
    };
  }

  static elliottWave(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Elliott Wave analysis requires manual pattern recognition');
  }

  static harmonicPatterns(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Harmonic patterns require manual pattern recognition');
  }

  static gartleyPattern(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Gartley pattern requires manual identification');
  }

  static butterflyPattern(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Butterfly pattern requires manual identification');
  }

  static batPattern(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Bat pattern requires manual identification');
  }

  static crabPattern(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Crab pattern requires manual identification');
  }

  static cypherPattern(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Cypher pattern requires manual identification');
  }

  static deepLearningAI(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Deep Learning AI requires trained model');
  }

  static neuralNetwork(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Neural Network requires trained model');
  }

  static geneticAlgorithm(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Genetic Algorithm requires optimization');
  }

  static reinforcementLearning(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Reinforcement Learning requires trained agent');
  }

  static sentimentAnalysis(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Sentiment Analysis requires external data');
  }

  static socialVolume(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Social Volume requires social media data');
  }

  static whaleTracking(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Whale Tracking requires on-chain data');
  }

  static liquidityAnalysis(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Liquidity Analysis requires order book data');
  }

  static marketCycle(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Market Cycle requires long-term data');
  }

  static seasonality(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Seasonality requires historical seasonal data');
  }

  static correlationMatrix(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Correlation Matrix requires multiple assets');
  }

  static volatilitySmile(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Volatility Smile requires options data');
  }

  static gammaExposure(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Gamma Exposure requires options flow data');
  }

  static deltaNeutral(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Delta Neutral requires options positions');
  }

  static optionsFlow(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Options Flow requires options market data');
  }

  static fundingRate(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Funding Rate requires perpetual swap data');
  }

  static openInterest(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Open Interest requires futures market data');
  }

  static leverageRatio(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Leverage Ratio requires margin trading data');
  }

  static fearGreed(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Fear & Greed requires sentiment indicators');
  }

  static networkGrowth(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Network Growth requires blockchain data');
  }

  static onChainAnalysis(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'On-Chain Analysis requires blockchain metrics');
  }

  static mvrvZScore(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'MVRV Z-Score requires market value vs realized value data');
  }

  static nvtRatio(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'NVT Ratio requires network value to transaction ratio');
  }

  static stockToFlow(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Stock-to-Flow requires supply issuance data');
  }

  static realizedPrice(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Realized Price requires UTXO age data');
  }

  static coinDaysDestroyed(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    return this.createHoldSignal(prices, symbol, 'Coin Days Destroyed requires coin movement data');
  }

  private static createHoldSignal(prices: number[], symbol: string, reason: string): TradeSignal {
    return {
      symbol,
      action: 'HOLD',
      confidence: 0,
      price: prices[prices.length - 1],
      timestamp: new Date(),
      duration: 'N/A',
      reason,
      stopLoss: 0,
      takeProfit: 0,
      leverage: 1
    };
  }

  static analyzeMarket(prices: number[], high: number[], low: number[]): MarketAnalysis {
    const rsi = TechnicalIndicators.calculateRSI(prices, 14);
    const macd = TechnicalIndicators.calculateMACD(prices);
    const bb = TechnicalIndicators.calculateBollingerBands(prices);
    const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
    const sma50 = TechnicalIndicators.calculateSMA(prices, 50);
    const currentPrice = prices[prices.length - 1];
    let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
    let strength = 0;
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'BULLISH';
      strength = 0.7;
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'BEARISH';
      strength = 0.7;
    } else {
      strength = 0.3;
    }
    const priceChanges = prices.slice(1).map((price, i) => Math.abs((price - prices[i]) / prices[i]));
    const volatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    return {
      trend,
      strength,
      volume: 0,
      volatility: volatility * 100,
      rsi: rsi.value,
      macd: {
        value: macd.macd,
        signal: macd.signal,
        histogram: macd.histogram
      }
    };
  }

  static getAllSignals(prices: number[], high: number[], low: number[], symbol: string): TradeSignal[] {
    const volumes = Array(prices.length).fill(1);
    return [
      this.multiTimeframeRSI(prices, high, low, symbol),
      this.trendFollowingMACD(prices, symbol),
      this.meanReversionBB(prices, high, low, symbol),
      this.volumeWeightedMACD(prices, volumes, symbol),
      this.ichimokuCloud(prices, symbol),
      this.supertrendStrategy(prices, high, low, symbol),
      this.parabolicSAR(prices, high, low, symbol),
      this.adxMomentum(prices, high, low, symbol),
      this.rsiDivergence(prices, high, low, symbol),
      this.macdHistogram(prices, symbol),
      this.bollingerSqueeze(prices, high, low, symbol),
      this.stochasticOscillator(prices, high, low, symbol),
      this.williamsR(prices, high, low, symbol),
      this.cciStrategy(prices, high, low, symbol),
      this.atrBreakout(prices, high, low, symbol),
      this.vwapStrategy(prices, volumes, high, low, symbol),
      this.fibonacciRetracement(prices, high, low, symbol),
      this.pivotPoints(prices, high, low, symbol),
      this.movingAverageCross(prices, symbol),
      this.emaRibbon(prices, symbol),
      this.priceAction(prices, high, low, symbol),
      this.supportResistance(prices, high, low, symbol),
      this.volumeProfile(prices, volumes, symbol),
      this.orderFlow(prices, volumes, symbol),
      this.marketStructure(prices, high, low, symbol),
      this.elliottWave(prices, high, low, symbol),
      this.harmonicPatterns(prices, high, low, symbol),
      this.gartleyPattern(prices, high, low, symbol),
      this.butterflyPattern(prices, high, low, symbol),
      this.batPattern(prices, high, low, symbol),
      this.crabPattern(prices, high, low, symbol),
      this.cypherPattern(prices, high, low, symbol),
      this.deepLearningAI(prices, high, low, symbol),
      this.neuralNetwork(prices, high, low, symbol),
      this.geneticAlgorithm(prices, high, low, symbol),
      this.reinforcementLearning(prices, high, low, symbol),
      this.sentimentAnalysis(prices, high, low, symbol),
      this.socialVolume(prices, high, low, symbol),
      this.whaleTracking(prices, high, low, symbol),
      this.liquidityAnalysis(prices, high, low, symbol),
      this.marketCycle(prices, high, low, symbol),
      this.seasonality(prices, high, low, symbol),
      this.correlationMatrix(prices, high, low, symbol),
      this.volatilitySmile(prices, high, low, symbol),
      this.gammaExposure(prices, high, low, symbol),
      this.deltaNeutral(prices, high, low, symbol),
      this.optionsFlow(prices, high, low, symbol),
      this.fundingRate(prices, high, low, symbol),
      this.openInterest(prices, high, low, symbol),
      this.leverageRatio(prices, high, low, symbol),
      this.fearGreed(prices, high, low, symbol),
      this.networkGrowth(prices, high, low, symbol),
      this.onChainAnalysis(prices, high, low, symbol),
      this.mvrvZScore(prices, high, low, symbol),
      this.nvtRatio(prices, high, low, symbol),
      this.stockToFlow(prices, high, low, symbol),
      this.realizedPrice(prices, high, low, symbol),
      this.coinDaysDestroyed(prices, high, low, symbol)
    ].filter(signal => signal !== null);
  }

  static getConsensusSignal(prices: number[], high: number[], low: number[], symbol: string): TradeSignal {
    const signals = this.getAllSignals(prices, high, low, symbol);
    const validSignals = signals.filter(s => s.action !== 'HOLD');
    if (validSignals.length === 0) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: prices[prices.length - 1],
        timestamp: new Date(),
        duration: 'N/A',
        reason: 'No clear consensus across strategies',
        stopLoss: 0,
        takeProfit: 0,
        leverage: 1
      };
    }
    const buySignals = validSignals.filter(s => s.action === 'BUY');
    const sellSignals = validSignals.filter(s => s.action === 'SELL');
    const totalConfidence = validSignals.reduce((sum, s) => sum + s.confidence, 0);
    const avgConfidence = totalConfidence / validSignals.length;
    const action = buySignals.length > sellSignals.length ? 'BUY' : 'SELL';
    const consensusCount = Math.max(buySignals.length, sellSignals.length);
    return {
      symbol,
      action,
      confidence: avgConfidence * (consensusCount / validSignals.length),
      price: prices[prices.length - 1],
      timestamp: new Date(),
      duration: '15m-4h',
      reason: `Consensus: ${consensusCount}/${validSignals.length} strategies agree`,
      stopLoss: action === 'BUY' ? prices[prices.length - 1] * 0.98 : prices[prices.length - 1] * 1.02,
      takeProfit: action === 'BUY' ? prices[prices.length - 1] * 1.03 : prices[prices.length - 1] * 0.97,
      leverage: 3
    };
  }
}