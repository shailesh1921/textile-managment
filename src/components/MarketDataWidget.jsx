import React, { useState, useEffect } from 'react';
import { Card } from './ui';
import { TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';
import { api } from '../lib/api';

export function MarketDataWidget() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState(null);

  const fetchMarketPrices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/analytics/market-prices');
      setMarketData(res.items || []);
      setTimestamp(res.timestamp);
    } catch (err) {
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketPrices();
  }, []);

  return (
    <Card 
      title="Surat Textile Commodity Index" 
      description="Live benchmark pricing for yarn, cotton & dye inputs (Cached 10m)"
      headerActions={
        <button 
          onClick={fetchMarketPrices} 
          disabled={loading} 
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {marketData.map((item) => {
          const isPositive = item.changePct >= 0;
          return (
            <div key={item.code} className="border rounded-lg p-3 bg-card/60 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-muted-foreground">{item.name}</span>
                <span className={`text-xs font-medium flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                  {isPositive ? `+${item.changePct}%` : `${item.changePct}%`}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{item.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
