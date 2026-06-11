import React, { useState, useEffect } from 'react';
import { Bell, Mail, MonitorSmartphone, Settings2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export interface TrendAlertConfig {
  email: string;
  notifyEmail: boolean;
  notifyBrowser: boolean;
  trendThreshold: number; // e.g., 5, 10, 20
  enabled: boolean;
}

export const TrendAlertsManager = () => {
  const [config, setConfig] = useState<TrendAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('apollo_trend_alerts');
      return saved ? JSON.parse(saved) : {
        email: '',
        notifyEmail: true,
        notifyBrowser: true,
        trendThreshold: 10,
        enabled: false
      };
    } catch {
      return {
        email: '',
        notifyEmail: true,
        notifyBrowser: true,
        trendThreshold: 10,
        enabled: false
      };
    }
  });

  const [expanded, setExpanded] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  useEffect(() => {
    localStorage.setItem('apollo_trend_alerts', JSON.stringify(config));
  }, [config]);

  const handleSave = () => {
    // In a real app, this would register with a push notification service
    // or register an email webhook/subscription.
    if (config.notifyBrowser && 'Notification' in window) {
       if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
       }
    }
    
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
    setExpanded(false);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl mb-8 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.enabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-white font-medium">Trend Score Alerts</h3>
            <p className="text-slate-400 text-sm">Get notified when intelligence trend scores fluctuate</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {config.enabled && (
             <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hidden sm:inline-block">
               Active (Tracking &gt;{config.trendThreshold}%)
             </span>
           )}
           {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-slate-700/50 bg-black/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <input 
                    type="email" 
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    placeholder="agent@apollo-x.ai"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div>
                 <label className="text-sm text-slate-300 font-medium mb-1 block">Trend Fluctuation Threshold</label>
                 <div className="flex items-center gap-3">
                    <input 
                       type="range" 
                       min="5" 
                       max="50" 
                       step="5"
                       value={config.trendThreshold}
                       onChange={(e) => setConfig({ ...config, trendThreshold: parseInt(e.target.value) })}
                       className="flex-1 accent-cyan-500"
                    />
                    <span className="text-cyan-400 font-mono text-sm w-12 text-right">±{config.trendThreshold}%</span>
                 </div>
                 <p className="text-slate-500 text-xs mt-1">Alert when intelligence trend score changes by this percentage.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                 <label className="text-sm text-slate-300 font-medium mb-2 block">Notification Channels</label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-900/50 cursor-pointer hover:border-slate-600 transition-colors">
                       <input 
                          type="checkbox" 
                          checked={config.notifyEmail}
                          onChange={(e) => setConfig({ ...config, notifyEmail: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                       />
                       <Mail size={16} className={config.notifyEmail ? "text-cyan-400" : "text-slate-500"} />
                       <span className="text-sm text-slate-300">Email Alerts</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-900/50 cursor-pointer hover:border-slate-600 transition-colors">
                       <input 
                          type="checkbox" 
                          checked={config.notifyBrowser}
                          onChange={(e) => setConfig({ ...config, notifyBrowser: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                       />
                       <MonitorSmartphone size={16} className={config.notifyBrowser ? "text-cyan-400" : "text-slate-500"} />
                       <span className="text-sm text-slate-300">Browser/Push Notifications</span>
                    </label>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
             <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Master Switch:</span>
                <button
                   onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
             <div className="flex items-center gap-4">
                {showSavedMsg && (
                   <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle2 size={16} /> Saved
                   </span>
                )}
                <button 
                   onClick={handleSave}
                   className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                   <Settings2 size={16} /> Save Preferences
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
