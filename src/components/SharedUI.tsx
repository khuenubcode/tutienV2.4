import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Tooltip: React.FC<{ children: React.ReactNode; content: React.ReactNode }> = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-slate-700 text-[10px] text-slate-200 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SubTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const SubTabs: React.FC<SubTabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-[10px] uppercase font-black tracking-[0.2em] transition-all relative whitespace-nowrap",
            activeTab === tab.id 
              ? "text-amber-400" 
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          {tab.icon && <span className={activeTab === tab.id ? "text-amber-500" : "text-slate-600"}>{tab.icon}</span>}
          {tab.label}
          {activeTab === tab.id && (
            <motion.div 
              layoutId="subtab-active"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            />
          )}
        </button>
      ))}
    </div>
  );
};

interface GameAccordionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const GameAccordion: React.FC<GameAccordionProps> = ({ title, subtitle, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[#0f1218] border border-slate-800 rounded-xl overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-4">
          {icon && <div className="text-amber-500/70 group-hover:text-amber-500 transition-colors">{icon}</div>}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{title}</h4>
            {subtitle && <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{subtitle}</p>}
          </div>
        </div>
        <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-slate-600"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-800/50"
          >
            <div className="p-4 bg-black/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StatDisplayProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  colorClass?: string;
  subValue?: string;
}

export const StatDisplay: React.FC<StatDisplayProps> = ({ label, value, icon, colorClass = "text-slate-200", subValue }) => {
  const displayValue = typeof value === 'number' ? Math.floor(value).toLocaleString() : value;
  
  return (
    <div className="bg-black/20 border border-white/5 p-3 rounded-lg group hover:border-amber-500/20 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">{label}</span>
        {icon && <span className="text-slate-600 group-hover:text-amber-500/50 transition-colors">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-sm font-bold font-mono", colorClass)}>{displayValue}</span>
        {subValue && <span className="text-[9px] text-slate-600 font-mono italic">{subValue}</span>}
      </div>
    </div>
  );
};
