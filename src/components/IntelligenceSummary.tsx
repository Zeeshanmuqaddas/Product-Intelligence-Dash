import React from 'react';
import { TrendingUp, Trophy, Star, Target } from 'lucide-react';
import type { IntelligenceResponse } from '../services/IntelligenceService';

export const IntelligenceSummary = ({ data }: { data: IntelligenceResponse }) => {
  if (!data) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 text-white mb-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4">
        <Trophy className="text-cyan-400" size={24} />
        <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Intelligence Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Value */}
        <div className="bg-black/40 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-green-400" size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Best Value Option</h3>
          </div>
          {data.best_value ? (
             <div>
                <div className="font-medium text-lg mb-1">{data.best_value.product_name || 'N/A'}</div>
                <div className="text-sm text-slate-400">{data.best_value.reasoning || data.best_value.description || 'Optimal balance of price, ratings, and features.'}</div>
             </div>
          ) : (
            <div className="text-sm text-slate-500">No data available</div>
          )}
        </div>

        {/* Highest Rated */}
        <div className="bg-black/40 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-amber-400" size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Highest Rated</h3>
          </div>
          {data.highest_rated ? (
             <div>
                <div className="font-medium text-lg mb-1">{data.highest_rated.product_name || 'N/A'}</div>
                <div className="text-sm text-slate-400">{data.highest_rated.reasoning || data.highest_rated.description || 'Product with strongest customer satisfaction.'}</div>
             </div>
          ) : (
            <div className="text-sm text-slate-500">No data available</div>
          )}
        </div>

        {/* Trending Product */}
        <div className="bg-black/40 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-pink-400" size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Trending Top Pick</h3>
          </div>
          {data.trending_product ? (
             <div>
                <div className="font-medium text-lg mb-1">{data.trending_product.product_name || 'N/A'}</div>
                <div className="text-sm text-slate-400">{data.trending_product.reasoning || data.trending_product.description || 'Fastest growing market interest.'}</div>
             </div>
          ) : (
            <div className="text-sm text-slate-500">No data available</div>
          )}
        </div>
      </div>

      {data.recommendation && (
        <div className="bg-cyan-900/10 border border-cyan-800/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300 mb-2">Executive Summary</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {typeof data.recommendation === 'string' ? data.recommendation : data.recommendation.executive_summary || data.recommendation.summary || JSON.stringify(data.recommendation, null, 2)}
          </p>
        </div>
      )}

      {data.marketplace_rankings && data.marketplace_rankings.length > 0 && (
         <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Marketplace Rankings</h3>
            <div className="flex flex-wrap gap-2">
               {data.marketplace_rankings.map((rank: any, idx: number) => (
                  <div key={idx} className="bg-black/40 border border-slate-700/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                     <span className="text-slate-400">#{idx + 1}</span>
                     <span className="font-medium text-slate-200">{rank.platform || rank.name || rank.marketplace || 'Platform'}</span>
                     <span className="text-slate-500 text-xs ml-1">{rank.score ? `Score: ${rank.score}` : ''}</span>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};
