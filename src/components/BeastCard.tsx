import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Sword, 
  Zap, 
  Heart, 
  Activity, 
  MapPin, 
  Package, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { StoredBeast } from '../types';
import { cn } from '../lib/utils';

interface BeastCardProps {
  beast: StoredBeast;
  ExpandableSection: any;
  onDuel?: (beast: any) => void;
}

export const BeastCard: React.FC<BeastCardProps> = ({ beast, ExpandableSection, onDuel }) => {
  const rarityColors = {
    common: 'text-slate-400 border-slate-800 bg-slate-900/50',
    rare: 'text-blue-400 border-blue-900/30 bg-blue-950/20',
    elite: 'text-purple-400 border-purple-900/30 bg-purple-950/20',
    boss: 'text-amber-500 border-amber-900/40 bg-amber-950/30'
  };

  const rarityLabels = {
    common: 'Thường',
    rare: 'Hiếm',
    elite: 'Tinh Anh',
    boss: 'Lĩnh Chủ'
  };

  const getElementColor = (element: string) => {
    switch (element.toUpperCase()) {
      case 'KIM': return 'text-yellow-200';
      case 'MỘC': return 'text-emerald-400';
      case 'THỦY': return 'text-blue-400';
      case 'HỎA': return 'text-rose-500';
      case 'THỔ': return 'text-amber-700';
      default: return 'text-slate-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 space-y-4 group transition-all duration-500",
        rarityColors[beast.rarity] || rarityColors.common,
        "hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-white/10"
      )}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-black/40 border border-white/5", getElementColor(beast.element))}>
              {beast.element}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm">
              Level {beast.level}
            </span>
          </div>
          <h3 className="text-xl font-bold title-font text-slate-100 italic group-hover:text-amber-400 transition-colors">{beast.name}</h3>
          <p className="text-[11px] text-slate-500 font-serif">{beast.species} • {rarityLabels[beast.rarity]}</p>
        </div>
        
        <div className="p-2 bg-black/40 rounded-lg border border-white/5">
          <Activity size={20} className="text-emerald-500/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <StatItem icon={<Heart size={12} />} label="Huyết lượng" value={`${beast.stats.hp}/${beast.stats.maxHp}`} color="text-rose-400" />
        <StatItem icon={<Sword size={12} />} label="Lực công" value={beast.stats.atk} color="text-rose-500" />
        <StatItem icon={<Shield size={12} />} label="Phòng thủ" value={beast.stats.def} color="text-indigo-400" />
        <StatItem icon={<Zap size={12} />} label="Tốc độ" value={beast.stats.spd} color="text-amber-400" />
      </div>

      <div className="space-y-2 pt-2 border-t border-white/5 relative z-10">
        <ExpandableSection title="Thuộc tính & Sinh thái" icon={<Info size={14} />}>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Môi trường sống</span>
                <div className="flex flex-wrap gap-1">
                  {beast.habitat.length > 0 ? beast.habitat.map((h, i) => (
                    <span key={i} className="text-[10px] bg-slate-800/50 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">{h}</span>
                  )) : <span className="text-[10px] text-slate-600">Chưa rõ...</span>}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Package size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Chiến lợi phẩm</span>
                <div className="flex flex-wrap gap-1">
                  {beast.drops.length > 0 ? beast.drops.map((d, i) => (
                    <span key={i} className="text-[10px] bg-emerald-900/20 text-emerald-400/80 px-1.5 py-0.5 rounded border border-emerald-500/10 font-mono">{d}</span>
                  )) : <span className="text-[10px] text-slate-600">Chưa rõ...</span>}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tập tính</span>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">{beast.instinct}</p>
              </div>
            </div>
          </div>
        </ExpandableSection>
      </div>

      {!beast.isAlive && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
          <div className="rotate-[-12deg] border-4 border-rose-900/50 px-6 py-2 rounded-xl">
             <span className="text-4xl font-black text-rose-900/80 uppercase tracking-[0.2em] opacity-50">ĐÃ VẪN LẠC</span>
          </div>
        </div>
      )}

      {onDuel && beast.isAlive && (
        <button 
          onClick={() => onDuel(beast)}
          className="w-full py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all group-hover:border-rose-500/50"
        >
          Khiêu Chiến
        </button>
      )}
    </motion.div>
  );
};

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{label}</span>
      </div>
      <div className="text-xs font-mono font-bold text-slate-200">{value}</div>
    </div>
  );
}
