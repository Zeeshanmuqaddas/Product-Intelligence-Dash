import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, TrendingDown, Cpu, MemoryStick, HardDrive, Star, AlertTriangle, CheckCircle, Zap, ShieldCheck, Bell, BellRing, X, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, ArrowLeftRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, AgentStatus, Alert } from '../types';
// @ts-ignore
import rogStrixImg from '../assets/images/rog_strix_g16_1780992049774.png';
// @ts-ignore
import predatorImg from '../assets/images/predator_helios_16_1780992072646.png';
import { PriceTrendChart, type PriceDataPoint } from './PriceTrendChart';
import { IntelligenceService, type IntelligenceResponse } from '../services/IntelligenceService';
import { IntelligenceSummary } from './IntelligenceSummary';
import { TrendAlertsManager } from './TrendAlertsManager';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const PriceForecastChart = ({ basePrice, productId, savedAlert, expanded }: { basePrice: number, productId: string, savedAlert?: number, expanded: boolean }) => {
  const [data, setData] = useState<PriceDataPoint[]>([]);

  useEffect(() => {
    if (expanded && data.length === 0) {
      // Simulate fetching ML price forecast
      setTimeout(() => {
        const forecast = [];
        let currentPrice = basePrice;
        // Generate next 30 days forecast
        for (let i = 0; i <= 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          if (i === 0) {
              forecast.push({
                 date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                 price: basePrice,
                 isForecast: false,
              });
          } else {
             // Simulate trend: mostly downward with random fluctuations
             if (Math.random() > 0.4) currentPrice -= Math.random() * 8;
             else if (Math.random() > 0.7) currentPrice += Math.random() * 5;
             forecast.push({
                 date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                 price: Math.max(basePrice * 0.8, Math.round(currentPrice)),
                 isForecast: true,
             });
          }
        }
        setData(forecast);
      }, 600); // Simulate network latency
    }
  }, [expanded, basePrice, productId, data.length]);

  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 120, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 overflow-hidden"
        >
          {data.length > 0 ? (
            <PriceTrendChart data={data} savedAlert={savedAlert} />
          ) : (
            <div className="w-full h-[120px] flex items-center justify-center text-xs text-slate-500">
               Generating ML Price Forecast...
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'ASUS ROG Strix G16 (2024)',
    brand: 'ASUS',
    price: 1399,
    rating: 4.6,
    reviewCount: 1240,
    seller: { name: 'ASUS Official', trustScore: 98 },
    specs: { cpu: 'i7-13650HX', gpu: 'RTX 4060', ram: '16GB DDR5', storage: '1TB NVMe' },
    reviewAuthenticityScore: 92,
    predictedPriceDrop: true,
    predictedPriceDropAmount: 150,
    image: rogStrixImg
  },
  {
    id: 'p2',
    title: 'Acer Predator Helios Neo 16',
    brand: 'Acer',
    price: 1199,
    rating: 4.2,
    reviewCount: 3845,
    seller: { name: 'TechBros Electronics', trustScore: 71 },
    specs: { cpu: 'i7-13700HX', gpu: 'RTX 4060', ram: '16GB DDR5', storage: '512GB NVMe' },
    reviewAuthenticityScore: 45,
    predictedPriceDrop: false,
    image: predatorImg
  }
];

const PRICE_HISTORY = [
  { date: 'Jan 1', asus: 1499, acer: 1299 },
  { date: 'Jan 15', asus: 1499, acer: 1249 },
  { date: 'Feb 1', asus: 1450, acer: 1249 },
  { date: 'Feb 15', asus: 1399, acer: 1199 },
  { date: 'Mar 1 (Proj)', asus: 1249, acer: 1199 },
];

export default function Dashboard() {
  const { logout, user } = useAuth();
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', status: 'idle', lastLog: 'Awaiting query...' },
    { name: 'Search', status: 'idle', lastLog: 'Ready' },
    { name: 'Review Analysis', status: 'idle', lastLog: 'Model loaded' },
    { name: 'Pricing Engine', status: 'idle', lastLog: 'Connected to BigQuery' },
    { name: 'Recommendation', status: 'idle', lastLog: 'Ready' },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', type: 'info', message: 'Monitoring 2,400 new tech listings...', timestamp: 'Just now' }
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceResponse | null>(null);
  const [activeAlertProduct, setActiveAlertProduct] = useState<string | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [savedAlerts, setSavedAlerts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('apollo_alerts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  useEffect(() => {
    localStorage.setItem('apollo_alerts', JSON.stringify(savedAlerts));
  }, [savedAlerts]);
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [filterMinRating, setFilterMinRating] = useState<string>('0');
  const [bookmarkedProducts, setBookmarkedProducts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apollo_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('apollo_bookmarks', JSON.stringify(bookmarkedProducts));
  }, [bookmarkedProducts]);

  const toggleBookmark = (id: string) => {
    setBookmarkedProducts(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleSelectForCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  const renderCompareTable = () => {
    if (selectedForCompare.length !== 2) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 border border-slate-800 border-dashed rounded-xl flex items-center justify-center text-slate-500 text-sm">
          Select exactly two products to see a side-by-side comparison.
        </motion.div>
      );
    }
    const p1 = MOCK_PRODUCTS.find(p => p.id === selectedForCompare[0])!;
    const p2 = MOCK_PRODUCTS.find(p => p.id === selectedForCompare[1])!;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Activity size={20} className="text-cyan-400" /> Executive Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="py-3 px-4 font-medium text-slate-400">Feature</th>
                <th className="py-3 px-4 w-[35%]">
                  <div className="font-semibold text-white truncate max-w-[200px]">{p1.title}</div>
                  <div className="text-xs text-slate-500">{p1.brand}</div>
                </th>
                <th className="py-3 px-4 w-[35%]">
                  <div className="font-semibold text-white truncate max-w-[200px]">{p2.title}</div>
                  <div className="text-xs text-slate-500">{p2.brand}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Price</td>
                <td className="py-4 px-4 text-white font-bold">${p1.price}</td>
                <td className="py-4 px-4 text-white font-bold">${p2.price}</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Rating</td>
                <td className="py-4 px-4 flex items-center gap-1 font-semibold text-amber-500">
                   <Star size={14} fill="currentColor" /> {p1.rating} <span className="text-slate-500 text-xs ml-1 font-normal">({p1.reviewCount})</span>
                </td>
                <td className="py-4 px-4">
                   <div className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star size={14} fill="currentColor" /> {p2.rating} <span className="text-slate-500 text-xs ml-1 font-normal">({p2.reviewCount})</span>
                   </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Review Authenticity</td>
                <td className={`py-4 px-4 font-semibold ${p1.reviewAuthenticityScore > 80 ? 'text-green-400' : 'text-amber-400'}`}>{p1.reviewAuthenticityScore}%</td>
                <td className={`py-4 px-4 font-semibold ${p2.reviewAuthenticityScore > 80 ? 'text-green-400' : 'text-amber-400'}`}>{p2.reviewAuthenticityScore}%</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">CPU</td>
                <td className="py-4 px-4">{p1.specs.cpu}</td>
                <td className="py-4 px-4">{p2.specs.cpu}</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">GPU</td>
                <td className="py-4 px-4">{p1.specs.gpu}</td>
                <td className="py-4 px-4">{p2.specs.gpu}</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Memory</td>
                <td className="py-4 px-4">{p1.specs.ram}</td>
                <td className="py-4 px-4">{p2.specs.ram}</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Storage</td>
                <td className="py-4 px-4">{p1.specs.storage}</td>
                <td className="py-4 px-4">{p2.specs.storage}</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-slate-400">Price Forecast</td>
                <td className="py-4 px-4">
                  {p1.predictedPriceDrop ? <span className="text-green-400 flex items-center gap-1"><TrendingDown size={14}/> Drops ~${p1.predictedPriceDropAmount}</span> : <span className="text-slate-500">Stable</span>}
                </td>
                <td className="py-4 px-4">
                  {p2.predictedPriceDrop ? <span className="text-green-400 flex items-center gap-1"><TrendingDown size={14}/> Drops ~${p2.predictedPriceDropAmount}</span> : <span className="text-slate-500">Stable</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  const renderProductCard = (p: Product, idx: number, isTopPick: boolean) => {
    const isSelected = selectedForCompare.includes(p.id);
    return (
    <motion.div 
      key={p.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.2 }}
      className={`rounded-xl border p-5 relative overflow-hidden bg-black/40 ${isTopPick && !compareMode ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'border-slate-800'} ${isSelected && compareMode ? 'ring-2 ring-cyan-500 bg-cyan-900/10' : ''}`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {compareMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleSelectForCompare(p.id); }}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${isSelected ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-slate-900 border-slate-600 text-transparent hover:border-cyan-500'}`}
          >
            <CheckCircle size={14} className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
          </button>
        )}
        {!compareMode && isTopPick && (
          <div className="bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
            <Star size={12} fill="black" /> TOP PICK
          </div>
        )}
        <button 
          onClick={() => toggleBookmark(p.id)} 
          className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-md"
        >
          {bookmarkedProducts.includes(p.id) ? (
            <BookmarkCheck size={16} className="text-cyan-400" />
          ) : (
            <Bookmark size={16} className="text-slate-400" />
          )}
        </button>
      </div>

      <div className="flex gap-4 mb-4 mt-2">
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
          <img src={p.image} alt={p.title} className="w-full h-full object-cover bg-slate-800" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{p.brand}</p>
          <h3 className="text-white font-medium mb-1 line-clamp-2 pr-6">{p.title}</h3>
          <div className="text-2xl font-bold text-white">${p.price}</div>
        </div>
      </div>

      {/* AUTHENTICITY METER */}
      <div className="mb-5 bg-slate-900/80 rounded-lg p-3 border border-white/5">
        <div className="flex justify-between items-end mb-2">
          <p className="text-xs text-slate-400 uppercase font-semibold">Review Authenticity</p>
          <span className={`text-sm font-bold ${p.reviewAuthenticityScore > 80 ? 'text-green-400' : 'text-red-400'}`}>
            {p.reviewAuthenticityScore}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${p.reviewAuthenticityScore > 80 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}
            style={{ width: `${p.reviewAuthenticityScore}%` }}
          />
        </div>
        {p.reviewAuthenticityScore < 50 && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
            <ShieldAlert size={12} /> High probability of astroturfing detected.
          </div>
        )}
      </div>

      {/* SPECS */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-white/5 p-2 rounded flex items-center gap-2">
          <Cpu size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300">{p.specs.cpu}</span>
        </div>
         <div className="bg-white/5 p-2 rounded flex items-center gap-2">
          <Zap size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300">{p.specs.gpu}</span>
        </div>
         <div className="bg-white/5 p-2 rounded flex items-center gap-2">
          <MemoryStick size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300">{p.specs.ram}</span>
        </div>
         <div className="bg-white/5 p-2 rounded flex items-center gap-2">
          <HardDrive size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300">{p.specs.storage}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase">Seller Trust</span>
          <span className="text-sm font-medium text-slate-300">{p.seller.name} <span className="text-xs text-slate-500">({p.seller.trustScore}/100)</span></span>
        </div>
        {p.predictedPriceDrop && (
          <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
            <TrendingDown size={14} />
            <span className="text-xs font-semibold">Will drop ~${p.predictedPriceDropAmount}</span>
          </div>
        )}
      </div>

      {/* ALERT ACTIONS */}
      <div className="pt-3 border-t border-white/10 mt-3 flex justify-between items-center">
        {activeAlertProduct === p.id ? (
          <div className="flex w-full gap-2 items-center">
            <span className="text-slate-400 font-medium text-sm">$</span>
            <input 
              type="number" 
              value={targetPriceInput}
              onChange={e => setTargetPriceInput(e.target.value)}
              placeholder="Target price..."
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500 w-full"
              autoFocus
            />
            <button 
              onClick={() => {
                if(targetPriceInput) {
                  setSavedAlerts(prev => ({ ...prev, [p.id]: Number(targetPriceInput) }));
                  setAlerts(a => [{ id: Date.now().toString(), type: 'success', message: `Price alert set: $${targetPriceInput} for ${p.brand} ${p.title}`, timestamp: 'Just now' }, ...a]);
                }
                setActiveAlertProduct(null);
              }}
              className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 p-1.5 rounded hover:bg-cyan-500/30 transition-colors"
            >
              <CheckCircle size={16} />
            </button>
            <button 
              onClick={() => setActiveAlertProduct(null)}
              className="bg-slate-800 border border-slate-700 text-slate-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex w-full justify-between items-center">
            {savedAlerts[p.id] ? (
              <div className="flex items-center gap-2 text-sm text-cyan-400 font-medium">
                {p.price <= savedAlerts[p.id] ? (
                  <span className="flex items-center gap-1.5 text-green-400 px-2 py-1 rounded bg-green-500/10 border border-green-500/30 animate-pulse">
                    <CheckCircle size={14} />
                    Target Reached! (${p.price})
                  </span>
                ) : (
                  <>
                    <BellRing size={16} className="text-cyan-500 animate-pulse" />
                    <span>Alert set at ${savedAlerts[p.id]}</span>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => {
                  setActiveAlertProduct(p.id);
                  setTargetPriceInput(String(p.price - (p.predictedPriceDropAmount || 100)));
                }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Bell size={16} />
                <span>Set Price Alert</span>
              </button>
            )}
            {savedAlerts[p.id] && (
               <button 
                onClick={() => {
                  const next = { ...savedAlerts };
                  delete next[p.id];
                  setSavedAlerts(next);
                }}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* MINI CHART SECTION */}
      <div className="pt-3 border-t border-white/10 mt-3">
        <button
          onClick={() => setExpandedCharts(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5"><TrendingDown size={14} /> ML Price Forecast</span>
          {expandedCharts[p.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <PriceForecastChart
          basePrice={p.price}
          productId={p.id}
          savedAlert={savedAlerts[p.id]}
          expanded={!!expandedCharts[p.id]}
        />
      </div>

    </motion.div>
    );
  };

  const getFilteredProducts = () => {
    return MOCK_PRODUCTS.filter(p => {
       if (filterQuery && !p.title.toLowerCase().includes(filterQuery.toLowerCase()) && !p.brand.toLowerCase().includes(filterQuery.toLowerCase())) {
         return false;
       }
       if (filterMinPrice && p.price < Number(filterMinPrice)) return false;
       if (filterMaxPrice && p.price > Number(filterMaxPrice)) return false;
       if (filterMinRating && p.rating < Number(filterMinRating)) return false;
       return true;
    });
  };

  const filteredProducts = getFilteredProducts();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsAnalyzing(true);
    setShowResults(false);
    
    // reset to processing loop
    setAgents(agents.map(a => ({ ...a, status: 'processing', lastLog: 'Initializing...' })));
    setAlerts([{ id: Date.now().toString(), type: 'info', message: `Initiating smart scan for "${searchQuery}"`, timestamp: new Date().toLocaleTimeString() }]);

    try {
      const data = await IntelligenceService.analyzeQuery(searchQuery);
      
      if (data) {
        setIntelligenceData(data);
        setAlerts(prev => [
           { id: Date.now().toString() + '1', type: 'info', message: `Agents invoked: Market Intelligence Agent, Sentiment Analysis Agent, Forecasting Agent`, timestamp: new Date().toLocaleTimeString() },
           { id: Date.now().toString() + '2', type: 'success', message: `Product Intelligence Agent completed workflow in ${1000 + Math.random() * 2000 | 0}ms`, timestamp: new Date().toLocaleTimeString() },
           ...prev
        ]);
        
        // update agent status based on what was returned
        setAgents(agents.map(a => {
           if (['Market Intelligence Agent', 'Sentiment Analysis Agent', 'Forecasting Agent'].includes(a.name) || a.name === 'Orchestrator') {
               return { ...a, status: 'done', lastLog: 'Task completed successfully.' };
           }
           return { ...a, status: 'idle', lastLog: 'Standby' };
        }));
      }
    } catch(err: any) {
        setAlerts(prev => [{ id: Date.now().toString(), type: 'danger', message: `Connection Error: ${err.message}`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
        setAgents(agents.map(a => ({ ...a, status: 'error', lastLog: 'Connection aborted.' })));
    } finally {
      setIsAnalyzing(false);
      setShowResults(true);
    }
  };

  // Remove Simulation effect 
  useEffect(() => {
    // simulation logic removed, backend handles it now.
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen flex flex-col gap-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/50">
            <Activity className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              APOLLO <span className="text-cyan-400 font-mono text-sm border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 rounded-full">v1.2.0</span>
            </h1>
            <p className="text-slate-400 text-sm">Smart Amazon Product Comparison Agent</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96 flex">
          <input 
            type="text" 
            placeholder="Search products, e.g. gaming laptops..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-l-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isAnalyzing}
            className="bg-cyan-500/20 border border-cyan-500/50 border-l-0 text-cyan-400 px-4 rounded-r-lg hover:bg-cyan-500/30 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <Activity size={18} />}
            Scan
          </button>
        </form>

        <div className="flex items-center gap-4 border-l border-slate-700/50 pl-4">
           <div className="text-right hidden xl:block pr-2">
              <div className="text-sm font-medium text-white">{user?.email}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">Administrator</div>
           </div>
           <button 
             onClick={logout}
             title="Logout"
             className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors focus:outline-none"
           >
              <LogOut size={18} />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* LEFT COLUMN: Orchestration & Intelligence */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* MULTI-AGENT MONITOR */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 mb-4 flex items-center gap-2 uppercase">
              <Zap size={16} className="text-purple-400" />
              Agent Orchestration
            </h2>
            <div className="space-y-3">
              {agents.map((agent, i) => (
                <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">{agent.name}</span>
                    {agent.status === 'processing' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                    {agent.status === 'done' && <CheckCircle size={14} className="text-green-500" />}
                    {agent.status === 'idle' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                  </div>
                  <div className="text-xs font-mono text-slate-500 truncate">{agent.lastLog}</div>
                </div>
              ))}
            </div>
          </div>

          {/* REAL-TIME ALERTS */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex-1">
             <h2 className="text-sm font-semibold tracking-wider text-slate-400 mb-4 flex items-center gap-2 uppercase">
              <Activity size={16} className="text-red-400" />
              Real-time Intelligence
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                      alert.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                      alert.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
                      'bg-slate-800/30 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === 'warning' && <AlertTriangle size={16} className="mt-0.5 text-amber-500 shrink-0" />}
                      {alert.type === 'info' && <Activity size={16} className="mt-0.5 text-blue-400 shrink-0" />}
                      {alert.type === 'success' && <CheckCircle size={16} className="mt-0.5 text-green-400 shrink-0" />}
                      <div className="text-sm">{alert.message}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 text-right">{alert.timestamp}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* MAIN COLUMN: Product Grids & Charts */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* PRODUCT COMPARISON GRID */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-white">Market Analysis Results</h2>
              {(showResults || bookmarkedProducts.length > 0) && (
                <button 
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (compareMode) setSelectedForCompare([]);
                  }}
                  className={`px-3 py-1.5 rounded text-sm transition-colors border ${compareMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-semibold' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'} flex items-center gap-2`}
                >
                  <ArrowLeftRight size={16} />
                  {compareMode ? 'Exit Compare Mode' : 'Compare Mode'}
                </button>
              )}
            </div>

            {(showResults || bookmarkedProducts.length > 0) && !isAnalyzing && (
              <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                 <div className="flex-1">
                   <input
                     type="text"
                     placeholder="Filter by name or brand..."
                     className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                     value={filterQuery}
                     onChange={(e) => setFilterQuery(e.target.value)}
                   />
                 </div>
                 <div className="flex gap-3">
                   <input
                     type="number"
                     placeholder="Min $"
                     className="w-24 bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                     value={filterMinPrice}
                     onChange={(e) => setFilterMinPrice(e.target.value)}
                   />
                   <input
                     type="number"
                     placeholder="Max $"
                     className="w-24 bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                     value={filterMaxPrice}
                     onChange={(e) => setFilterMaxPrice(e.target.value)}
                   />
                 </div>
                 <div className="flex gap-2 items-center px-3 border border-slate-700 rounded-lg bg-black/40">
                   <Star size={16} className="text-amber-500" />
                   <select
                     className="bg-transparent text-sm text-white focus:outline-none appearance-none pr-4"
                     value={filterMinRating}
                     onChange={(e) => setFilterMinRating(e.target.value)}
                   >
                     <option value="0" className="bg-slate-900">All Ratings</option>
                     <option value="4" className="bg-slate-900">4.0 & Up</option>
                     <option value="4.5" className="bg-slate-900">4.5 & Up</option>
                     <option value="4.8" className="bg-slate-900">4.8 & Up</option>
                   </select>
                 </div>
              </div>
            )}
            
            {!showResults && !isAnalyzing && (
              bookmarkedProducts.length > 0 ? (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-sm font-semibold tracking-wider text-cyan-400 mb-6 flex items-center gap-2 uppercase">
                    <BookmarkCheck size={16} />
                    Tracked Products Map
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {filteredProducts.filter(p => bookmarkedProducts.includes(p.id)).map((p, idx) => renderProductCard(p, idx, false))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                  <ShieldCheck size={48} className="mb-4 opacity-20" />
                  <p>Systems ready. Enter a product category to begin analysis.</p>
                </div>
              )
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-6">
                 <div className="relative w-24 h-24">
                   <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                   <Activity className="absolute inset-0 m-auto text-cyan-400" size={32} />
                 </div>
                 <div className="text-cyan-400 font-mono text-sm animate-pulse">Running Neural Pipeline...</div>
              </div>
            )}

            {showResults && (
              <>
                {intelligenceData && <IntelligenceSummary data={intelligenceData} />}
                <TrendAlertsManager />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {filteredProducts.map((p, idx) => renderProductCard(p, idx, idx === 0))}
                  </AnimatePresence>
                </div>
              </>
            )}
            
            {compareMode && (showResults || bookmarkedProducts.length > 0) && renderCompareTable()}
          </div>

          {/* BOTTOM: Pricing Charts */}
           <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
             {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-purple-500/10 blur-[100px] pointer-events-none" />
            
            <h2 className="text-lg font-medium text-white mb-6 relative z-10 flex items-center gap-2">
              <TrendingDown size={20} className="text-purple-400" />
              Machine Learning Price Forecast
            </h2>
            
            <div className="h-[250px] w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PRICE_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAsus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAcer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  {savedAlerts['p1'] && (
                    <ReferenceLine y={savedAlerts['p1']} stroke="#00f3ff" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: `ASUS Target: $${savedAlerts['p1']}`, fill: '#00f3ff', fontSize: 10 }} />
                  )}
                  {savedAlerts['p2'] && (
                    <ReferenceLine y={savedAlerts['p2']} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: `Acer Target: $${savedAlerts['p2']}`, fill: '#ef4444', fontSize: 10 }} />
                  )}
                  <Area type="monotone" dataKey="asus" name="ASUS ROG" stroke="#00f3ff" strokeWidth={2} fillOpacity={1} fill="url(#colorAsus)" />
                  <Area type="monotone" dataKey="acer" name="Acer Predator" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAcer)" strokeDasharray={showResults ? "0" : "5 5"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
           </div>

        </div>

      </div>
    </div>
  );
}
