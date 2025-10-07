import { NextResponse } from 'next/server';

interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

export async function GET() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 300 },
      headers: {
        'User-Agent': 'YourApp/1.0.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 418 || res.status === 429) {
        throw new Error(`Binance rate limit exceeded. Please try again later.`);
      }
      throw new Error(`Binance API responded with status ${res.status}`);
    }

    const data = await res.json();

    const usdtSymbols = (data.symbols as BinanceSymbol[])
      .filter(s => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_')
      )
      .map(s => s.symbol)
      .sort()
      .slice(0, 850);

    // Add CORS headers
    const response = NextResponse.json(usdtSymbols);
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Binance symbols fetch error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to load trading pairs' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}