import { NextResponse } from 'next/server';

interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

export async function GET() {
  try {
    const binanceUrl = 'https://api.binance.com/api/v3/exchangeInfo';
    
    console.log('Fetching from Binance API...');
    const res = await fetch(binanceUrl, {
      next: { revalidate: 300 },
    });

    console.log(`Binance API status: ${res.status}`);
    
    if (!res.ok) {
      // Get more details about the failure
      const errorText = await res.text();
      console.error('Binance API error response:', errorText);
      throw new Error(`Binance API failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log(`Received ${data.symbols?.length || 0} symbols`);

    if (!data.symbols || !Array.isArray(data.symbols)) {
      throw new Error('Invalid response format from Binance API');
    }

    const usdtSymbols = (data.symbols as BinanceSymbol[])
      .filter(s => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_')
      )
      .map(s => s.symbol)
      .sort()
      .slice(0, 850);

    console.log(`Filtered to ${usdtSymbols.length} USDT pairs`);
    
    return NextResponse.json(usdtSymbols);
    
  } catch (error) {
    console.error('Detailed Binance symbols fetch error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to load trading pairs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}