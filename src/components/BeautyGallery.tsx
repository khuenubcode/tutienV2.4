import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, User, Brain, Compass, Star, Camera, MessageCircle } from 'lucide-react';
import { NPC } from '../types';
import { cn } from '../lib/utils';

interface BeautyGalleryProps {
  npcs: NPC[];
  onInteract: (npc: NPC) => void;
  ExpandableSection: React.ComponentType<{ title: string, children: React.ReactNode, defaultOpen?: boolean, icon?: React.ReactNode }>;
}

export const BeautyGallery: React.FC<BeautyGalleryProps> = ({ npcs, onInteract, ExpandableSection }) => {
  const beauties = npcs.filter(npc => npc.gender === 'Nữ');

  if (beauties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
          <Heart className="text-rose-500/40" size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif italic text-rose-200">Chu nhan chưa xuất hiện</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Chưa có hồng nhan tri kỷ nào được ghi nhận trong biên niên sử của ngươi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 border-l-2 border-rose-500/50 pl-4 py-2">
        <h2 className="text-2xl font-serif italic text-rose-100 flex items-center gap-2">
          Giai Nhân Đồ Lục
          <Sparkles size={18} className="text-rose-400" />
        </h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">Archive of the Kingdom's Beauties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beauties.map((beauty) => (
          <BeautyCard 
            key={beauty.id} 
            npc={beauty} 
            onInteract={onInteract}
            ExpandableSection={ExpandableSection}
          />
        ))}
      </div>
    </div>
  );
};

const BeautyCard = ({ npc, onInteract, ExpandableSection }: { 
  npc: NPC, 
  onInteract: (npc: NPC) => void,
  ExpandableSection: React.ComponentType<{ title: string, children: React.ReactNode, defaultOpen?: boolean, icon?: React.ReactNode }>
}) => {
  const nameToUse = (npc.isNameRevealed ? npc.name : npc.temporaryName) || 'Kẻ Lạ';
  
  const getRelLevel = (val: number) => {
    if (val < 100) return { label: 'Người lạ', color: 'text-slate-400', bg: 'bg-slate-500/10' };
    if (val < 300) return { label: 'Quen biết', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (val < 601) return { label: 'Bằng hữu', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (val < 801) return { label: 'Thân thiết', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { label: 'Tri kỷ', color: 'text-rose-400', bg: 'bg-rose-500/10 font-bold' };
  };

  const rel = getRelLevel(npc.relationship);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-[#0f1218] border border-white/5 rounded-2xl overflow-hidden hover:border-rose-500/30 transition-all duration-500"
    >
      {/* Visual Overlay for deceased NPCs */}
      {npc.status === 'dead' && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-grayscale z-20 flex items-center justify-center p-6 text-center">
            <div className="space-y-1">
                <p className="text-rose-500 text-xs font-black uppercase tracking-[0.2em]">Đã Tạ Thế</p>
                <p className="text-white/40 text-[9px] font-mono italic">Hương tiêu ngọc vẫn...</p>
            </div>
        </div>
      )}

      {/* Hero Section / Avatar Area */}
      <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-b from-rose-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-32 h-32 rounded-full border-2 border-rose-500/10 flex items-center justify-center bg-rose-500/5 group-hover:scale-110 transition-transform duration-700">
             <User size={64} className="text-rose-500/20" />
           </div>
        </div>
        
        {/* Elegant Overlays */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0f1218] via-[#0f1218]/80 to-transparent">
           <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <h3 className="text-2xl font-serif italic text-white leading-tight">{nameToUse}</h3>
                   {npc.isNameRevealed && <Star size={14} className="text-amber-400 fill-amber-400/20" />}
                </div>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2 uppercase tracking-widest">
                   {npc.age} tuổi • {npc.realm}
                </p>
              </div>
              <div className={cn("px-3 py-1 rounded-full border border-current/20 text-[10px] uppercase tracking-wider", rel.bg, rel.color)}>
                 {rel.label}
              </div>
           </div>
        </div>

        {/* Floating Tags */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
           {npc.iq !== undefined && (
              <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-cyan-500/20 text-cyan-400 text-[9px] font-mono flex items-center gap-1 shadow-lg">
                 <Brain size={10} /> IQ {npc.iq}
              </div>
           )}
           {npc.powerScore !== undefined && npc.powerScore !== null && (
              <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-emerald-500/20 text-emerald-400 text-[9px] font-mono flex items-center gap-1 shadow-lg">
                 <Star size={10} /> {npc.powerScore.toLocaleString()}
              </div>
           )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 space-y-4">
        {npc.mood && npc.mood !== "??" && (
          <div className="text-[11px] text-slate-400 italic leading-relaxed line-clamp-2 border-l border-rose-500/30 pl-3">
             "{npc.mood}"
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Dục tính</p>
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500" style={{ width: `${npc.libido}%` }} />
              </div>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Hưng phấn</p>
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500" style={{ width: `${npc.lust}%` }} />
              </div>
           </div>
        </div>

        <ExpandableSection title="Chi tiết Giai Nhân" icon={<Camera size={14} className="text-rose-500/50" />}>
           <div className="pt-4 space-y-4 text-[11px]">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-slate-500 uppercase font-bold text-[8px]">Tâm cảnh</p>
                    <p className="text-rose-200">{npc.mindset || '??'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-slate-500 uppercase font-bold text-[8px]">Hào quang</p>
                    <p className="text-rose-200">{npc.aura || '??'}</p>
                 </div>
              </div>
              
              <div className="space-y-1">
                 <p className="text-slate-500 uppercase font-bold text-[8px]">Sở thích bí mật</p>
                 <p className="text-rose-300 italic group-hover:text-rose-100 transition-colors">{npc.fetish || '??'}
                  </p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-slate-500 uppercase font-bold text-[8px]">Màu mắt</p>
                     <p className="text-rose-200">{npc.eyeColor || '??'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-slate-500 uppercase font-bold text-[8px]">Kiểu tóc</p>
                     <p className="text-rose-200">{npc.hairStyle || '??'}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                     <p className="text-slate-500 uppercase font-bold text-[8px]">Trang phục</p>
                     <p className="text-rose-200">{npc.clothing || '??'}</p>
                  </div>
               </div>
              </div>

              {npc.sensitivePoints && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                   <p className="text-rose-400 font-bold mb-1 uppercase text-[8px]">Điểm nhạy cảm</p>
                   <p className="text-slate-300 text-[10px]">{npc.sensitivePoints}</p>
                </div>
              )}
        </ExpandableSection>
      </div>

      {/* Footer / Interaction buttons */}
      <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
         <button 
           onClick={() => onInteract(npc)}
           className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 rounded-lg text-rose-100 text-[10px] uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2"
         >
           <MessageCircle size={14} /> Tương tác
         </button>
      </div>
    </motion.div>
  );
};
