import React from 'react';
import { motion } from 'motion/react';
import { User, Sword, Heart, Sparkles, ShieldAlert, Zap, Flame, ChevronDown, Brain, Compass, Target, Activity, Star } from 'lucide-react';
import { NPC } from '../types';
import { cn } from '../lib/utils'; 
import { getPersonalityLabel } from '../data/npcPersonalities';

interface NPCCardProps {
  npc: NPC;
  ExpandableSection: React.ComponentType<{ title: string, children: React.ReactNode, defaultOpen?: boolean, icon?: React.ReactNode }>;
  onInteract?: (npc: NPC) => void;
  onDuel?: (npc: NPC) => void;
}

export const NPCCard: React.FC<NPCCardProps> = ({ npc, ExpandableSection, onInteract, onDuel }) => {
  const getRelationshipColor = (val: number) => {
    if (val < 100) return 'text-slate-500';
    if (val < 300) return 'text-blue-400';
    if (val < 601) return 'text-emerald-400';
    if (val < 801) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getRelationshipLabel = (val: number) => {
    if (val < 100) return 'Người lạ';
    if (val < 300) return 'Quen biết';
    if (val < 601) return 'Bằng hữu';
    if (val < 801) return 'Thân thiết';
    return 'Tri kỷ';
  };

  const nameToUse = (npc.isNameRevealed ? npc.name : npc.temporaryName) || 'Kẻ Lạ';
  const initials = nameToUse
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarColor = npc.gender === 'Nữ' 
    ? 'from-rose-500/20 to-purple-600/20 text-rose-300 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
    : 'from-blue-500/20 to-indigo-600/20 text-blue-300 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f1218]/90 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-amber-500/40 transition-all duration-500 shadow-2xl hover:shadow-amber-500/5"
    >
      {/* Header with Avatar and Basic Info */}
      <div className="relative p-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className={cn(
          "absolute -top-16 -right-16 w-48 h-48 blur-[80px] opacity-20 rounded-full",
          npc.gender === 'Nữ' ? "bg-rose-500" : "bg-blue-600"
        )} />
        
        <div className="flex gap-5 items-start relative z-10">
          <div className="relative shrink-0">
             <div className={cn(
               "w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-2xl font-serif font-black bg-gradient-to-br shadow-2xl",
               avatarColor
             )}>
               {initials}
             </div>
             {npc.status === 'dead' && (
               <div className="absolute -bottom-2 -left-2 bg-rose-950 text-rose-500 border border-rose-800 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg">
                 Vẫn Lạc
               </div>
             )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white font-serif italic tracking-tight truncate">
                    {nameToUse}
                  </h3>
                  {npc.isNameRevealed && npc.alias && (
                    <span className="text-[9px] text-amber-500 font-mono uppercase tracking-[0.2em] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                      {npc.alias}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold tracking-wide">
                    <User size={12} className={npc.gender === 'Nữ' ? "text-rose-400" : "text-blue-400"} />
                    {npc.gender} • {npc.age} Tuổi
                  </span>
                  <span className={cn(
                    "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
                    getRelationshipColor(npc.relationship)
                  )}>
                    <Heart size={12} />
                    {getRelationshipLabel(npc.relationship)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                   <p className="text-xs text-emerald-400 font-black italic drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] leading-none mb-1">
                     {npc.realm}
                   </p>
                   <p className="text-[8px] text-emerald-500/60 uppercase font-black tracking-tighter leading-none">
                     {npc.powerLevel}
                   </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Lực Chiến</span>
                <span className="text-xs text-emerald-500 font-mono font-bold">{(npc.powerScore || 0).toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Tâm Cảnh</span>
                <span className="text-xs text-purple-400 font-serif italic">{npc.mindset || '??'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Thông Minh</span>
                <span className="text-xs text-cyan-400 font-mono font-bold">{npc.iq || '??'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                 <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Khí Vận</span>
                 <span className="text-xs text-amber-500 font-mono font-bold">{npc.luck || '??'}</span>
              </div>
            </div>

            {/* Personality Traits Matrix */}
            {npc.personalityTraits && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Star size={10} className="text-amber-500 fill-amber-500/20" />
                    Bản Tính: <span className="text-amber-500">{getPersonalityLabel(npc.personalityTraits)}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    { label: 'Lý Trí', val: npc.personalityTraits.rationality, color: 'bg-cyan-500', low: 'Cảm Tính', high: 'Lý Trí' },
                    { label: 'Dũng Cảm', val: npc.personalityTraits.bravery, color: 'bg-orange-500', low: 'Hèn Nhát', high: 'Gan Lì' },
                    { label: 'Nhân Tính', val: npc.personalityTraits.morality, color: 'bg-emerald-500', low: 'Ma Tính', high: 'Nhân Tính' },
                    { label: 'Tham Vọng', val: npc.personalityTraits.ambition, color: 'bg-purple-500', low: 'An Phận', high: 'Tham Vọng' }
                  ].map((trait, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-tighter text-slate-500">
                        <span className={cn(trait.val < 30 && "text-slate-300")}>{trait.low}</span>
                        <span className={cn(trait.val > 70 && "text-slate-300")}>{trait.high}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className={cn("h-full transition-all shadow-[0_0_8px_rgba(0,0,0,0.5)]", trait.color)} 
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* interaction Area */}
      <div className="px-6 pb-6 space-y-4">
        {(npc.mood && npc.mood !== "??" || npc.currentOpinion && npc.currentOpinion !== "??") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 pt-2 border-t border-white/5">
              {npc.mood && npc.mood !== "??" && (
                <div className="bg-amber-900/10 p-3 rounded-xl border border-amber-900/20 relative group/quote">
                    <span className="absolute -top-2 left-3 bg-[#0f1218] px-1 text-[8px] text-amber-500 uppercase font-black tracking-widest">Tâm trạng</span>
                    <p className="text-amber-200/70 italic text-[10px] leading-relaxed line-clamp-2">"{npc.mood}"</p>
                </div>
              )}
              {npc.currentOpinion && npc.currentOpinion !== "??" && (
                <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-900/20 relative">
                    <span className="absolute -top-2 left-3 bg-[#0f1218] px-1 text-[8px] text-blue-400 uppercase font-black tracking-widest">Nhận định</span>
                    <p className="text-blue-200/50 italic text-[10px] leading-relaxed line-clamp-2">"{npc.currentOpinion}"</p>
                </div>
              )}
          </div>
        )}

        {onInteract && (
           <div className="flex gap-2">
              <button 
                onClick={() => npc.status !== 'dead' && onInteract(npc)}
                disabled={npc.status === 'dead'}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all",
                  npc.status === 'dead' 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                    : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10 active:scale-95"
                )}
              >
                <Zap size={14} fill={npc.status === 'dead' ? "none" : "currentColor"} />
                {npc.status === 'dead' ? 'Đã Tử Vong' : 'Tìm Gặp Tương Tác'}
              </button>
              <button 
                disabled={npc.status === 'dead'}
                className={cn(
                  "w-12 flex items-center justify-center border rounded-xl transition-all group",
                  npc.status === 'dead'
                    ? "bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed opacity-50"
                    : "bg-white/5 hover:bg-rose-500/10 border-white/5 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 active:scale-95"
                )}
                onClick={() => npc.status !== 'dead' && onDuel && onDuel(npc)}
                title="Thách đấu"
              >
                <Sword size={16} className={npc.status !== 'dead' ? "group-hover:rotate-12 transition-transform" : ""} />
              </button>
           </div>
        )}

        <ExpandableSection title="Thuộc Tính Chi Tiết & Dục Vọng" icon={<Heart size={14} />}>
          <div className="space-y-6 pt-4">
            {/* Relationship Progress */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Điểm Thiện Cảm</span>
                        <p className={cn("text-xs font-black uppercase tracking-tight", getRelationshipColor(npc.relationship))}>
                            Cấp độ: {getRelationshipLabel(npc.relationship)}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={cn("text-3xl font-mono font-black leading-none tracking-tighter", getRelationshipColor(npc.relationship))}>
                            {npc.relationship}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono ml-1 font-bold">/1000</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, npc.relationship / 10)}%` }}
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            npc.relationship > 800 ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" : 
                            npc.relationship > 600 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : 
                            npc.relationship > 300 ? "bg-emerald-500" : "bg-blue-600"
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center group/stat hover:border-cyan-500/30 transition-colors">
                <Target size={16} className="text-cyan-500/50 mb-2 group-hover/stat:scale-110 transition-transform" />
                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">C.Xác</p>
                <p className="text-sm text-cyan-400 font-mono font-black leading-none">{npc.accuracy || '??'}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center group/stat hover:border-blue-500/30 transition-colors">
                <Activity size={16} className="text-blue-500/50 mb-2 group-hover/stat:scale-110 transition-transform" />
                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">N.Tránh</p>
                <p className="text-sm text-blue-400 font-mono font-black leading-none">{npc.speed || '??'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center group/stat hover:border-blue-500/30 transition-colors">
                <ShieldAlert size={16} className="text-blue-500/50 mb-2 group-hover/stat:scale-110 transition-transform" />
                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Đạo Tâm</p>
                <p className="text-sm text-blue-400 font-mono font-black leading-none">{npc.willpower}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center group/stat hover:border-rose-500/30 transition-colors">
                <Flame size={16} className="text-rose-500/50 mb-2 group-hover/stat:scale-110 transition-transform" />
                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Dục Tính</p>
                <p className="text-sm text-rose-400 font-mono font-black leading-none">{npc.libido}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center group/stat hover:border-amber-500/30 transition-colors">
                <Zap size={16} className="text-amber-500/50 mb-2 group-hover/stat:scale-110 transition-transform" />
                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Hưng Phấn</p>
                <p className="text-sm text-amber-500 font-mono font-black leading-none">{npc.lust}</p>
              </div>
            </div>

            {npc.fetish && npc.fetish !== "??" && (
              <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl relative group/fetish overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles size={60} className="text-rose-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] text-rose-400 uppercase font-black tracking-[0.25em]">Thầm Kín Khuynh Hướng</p>
                        <Heart size={14} className="text-rose-500/50 animate-pulse" />
                    </div>
                    <p className="text-xs text-rose-200/80 italic font-serif leading-relaxed line-clamp-3">"{npc.fetish}"</p>
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>
      </div>
    </motion.div>
  );
};
