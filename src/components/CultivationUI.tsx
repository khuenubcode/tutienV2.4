import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Activity, 
  Brain, 
  Mountain,
  Flame,
  Info
} from 'lucide-react';
import { PlayerState, CultivationTechnique } from '../types';
import { cn } from '../lib/utils';
import { getTechniqueStats } from '../lib/techniqueStats';

interface ProgressBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  subLabel?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, max, color, subLabel }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-200">{(current || 0).toLocaleString()} / {(max || 0).toLocaleString()}</span>
          {subLabel && <span className="text-[8px] text-slate-600 block uppercase">{subLabel}</span>}
        </div>
      </div>
      <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]", color)}
        />
      </div>
    </div>
  );
};

interface CultivationUIProps {
  state: PlayerState;
  onMeditate: () => void;
  onBreakthrough: () => void;
  onToggleTechnique: (id: string) => void;
}

const CultivationUI: React.FC<CultivationUIProps> = ({ 
  state, 
  onMeditate, 
  onBreakthrough,
  onToggleTechnique
}) => {
  const isTuViFull = state.tuVi >= state.tuViCapacity;
  const activeTech = state.masteredTechniques.find(t => t.isActive) || state.masteredTechniques[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="space-y-1">
          <h2 className="title-font text-3xl text-slate-100 font-bold italic">Nghịch Thiên Tu Đạo</h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Cultivation & Breakthrough Chambers</p>
        </div>
        <div className="flex gap-4">
           <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">Cảnh giới hiện tại</p>
              <p className="text-sm font-serif text-amber-500 italic">{state.realm} - {state.stage}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Main Cultivation Progress */}
          <section className="bg-[#0f1218] border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Zap size={200} />
            </div>
            
            <div className="relative z-10 space-y-8">
              <ProgressBar 
                label="Tu Vi Tích Lũy" 
                current={state.tuVi} 
                max={state.tuViCapacity} 
                color="bg-gradient-to-r from-amber-600 to-amber-400" 
                subLabel="Cần đạt viên mãn để đột phá"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={onMeditate}
                  disabled={!activeTech}
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 p-8 bg-slate-900 border border-slate-800 rounded-2xl group/btn hover:border-amber-500/50 transition-all relative overflow-hidden",
                    !activeTech && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 transition-all",
                    activeTech && "group-hover/btn:scale-110 group-hover/btn:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  )}>
                    <TrendingUp size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest mb-1">Tĩnh Tọa Tu Luyện</h4>
                    <p className="text-[10px] text-slate-500 italic font-serif">
                      {activeTech ? "Hành động này sẽ tiêu tốn thời gian và rèn luyện bản thể dựa trên Công pháp." : "Cần có ít nhất một Công Pháp để bắt đầu tu luyện."}
                    </p>
                  </div>
                  {activeTech && <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </button>

                <button 
                  onClick={onBreakthrough}
                  disabled={!isTuViFull}
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl group/btn transition-all relative overflow-hidden border",
                    isTuViFull 
                      ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]" 
                      : "bg-black/20 border-slate-800 opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                    isTuViFull ? "bg-amber-500 text-black shadow-lg" : "bg-slate-800 text-slate-600"
                  )}>
                    <Flame size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className={cn("text-sm font-black uppercase tracking-widest mb-1", isTuViFull ? "text-amber-400" : "text-slate-500")}>Phá Cảnh Đột Phá</h4>
                    <p className="text-[10px] text-slate-500 italic font-serif">
                      Tỉ lệ thành công: <span className={cn("font-bold", state.breakthroughChance > 50 ? "text-emerald-500" : "text-rose-500")}>{state.breakthroughChance}%</span>
                    </p>
                  </div>
                  {isTuViFull && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                </button>
              </div>
            </div>
          </section>

          {/* Technique Focus Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hiệu Quả Tôi Luyện (Từ Công Pháp)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  name: 'Nhục Thân', 
                  stat: 'Cường Hóa Nhục Thân', 
                  current: state.body, 
                  icon: <Activity size={18} />, 
                  color: 'text-rose-500', 
                  bg: 'bg-rose-500/5', 
                  border: 'border-rose-500/20',
                  isActive: activeTech?.core?.focus === 'Body' || activeTech?.core?.focus === 'Balanced'
                },
                { 
                  name: 'Thần Thức', 
                  stat: 'Rèn Luyện Thần Thức', 
                  current: state.spirit, 
                  icon: <Brain size={18} />, 
                  color: 'text-indigo-500', 
                  bg: 'bg-indigo-500/5', 
                  border: 'border-indigo-500/20',
                  isActive: activeTech?.core?.focus === 'Spirit' || activeTech?.core?.focus === 'Balanced'
                },
                { 
                  name: 'Căn Cơ', 
                  stat: 'Củng Cố Căn Cơ', 
                  current: state.foundation, 
                  icon: <Mountain size={18} />, 
                  color: 'text-emerald-500', 
                  bg: 'bg-emerald-500/5', 
                  border: 'border-emerald-500/20',
                  isActive: activeTech?.core?.focus === 'Foundation' || activeTech?.core?.focus === 'Balanced'
                }
              ].map((item) => (
                <div key={item.name} className={cn(
                  "p-6 border rounded-2xl space-y-4 flex flex-col transition-all", 
                  item.isActive ? cn(item.bg, item.border, "scale-[1.02] shadow-sm") : "bg-black/20 border-white/5 opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center", item.color)}>
                      {item.icon}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-100 uppercase tracking-tighter">{item.name}</h5>
                      <p className="text-[9px] text-slate-500 uppercase font-mono">{item.current}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-serif leading-relaxed h-8">
                    {item.stat}
                  </p>
                  <div className="mt-auto">
                    {item.isActive ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[8px] font-black text-emerald-500 uppercase">Đang rèn luyện</span>
                      </div>
                    ) : (
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Không tập trung</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!activeTech && (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-3">
                 <Info size={16} className="text-rose-500" />
                 <p className="text-[10px] text-rose-500 font-medium">Ngươi chưa có Công Pháp vận hành. Tu luyện sẽ không mang lại hiệu quả tôi luyện bản thể.</p>
              </div>
            )}
          </section>

          {/* Mastered Techniques List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh Sách Công Pháp</h3>
              </div>
              <span className="text-[8px] font-mono text-slate-600 uppercase">Tối đa 1 Công pháp chính & 2 phụ</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {state.masteredTechniques.length > 0 ? (
                state.masteredTechniques.map((tech, idx) => {
                  const stats = getTechniqueStats(tech);
                  const activeTechs = state.masteredTechniques.filter(t => t.isActive);
                  const isActive = tech.isActive;
                  const isMain = isActive && activeTechs[0]?.id === tech.id;
                  
                  return (
                    <div key={tech.id || `tech_${tech.name}_${idx}`} className={cn(
                      "p-4 border rounded-xl transition-all flex flex-col gap-3",
                      isActive ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "bg-black/40 border-white/5 opacity-70"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black",
                            tech.tier === 'Thiên' ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                            tech.tier === 'Địa' ? "bg-purple-500 text-white" :
                            tech.tier === 'Huyền' ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                          )}>
                            {tech.tier[0]}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-100">{tech.name}</h4>
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono uppercase">Lvl {tech.level || 1}</span>
                              {isMain && <span className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black uppercase tracking-widest border border-amber-500/30">Chính</span>}
                              {isActive && !isMain && <span className="text-[7px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-black uppercase tracking-widest border border-blue-500/30">Phụ (30%)</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] text-slate-500 italic font-serif">{tech.path} - {tech.element?.join(', ') || 'Không hệ'}</p>
                              <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${(tech.experience / (tech.level * 100)) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => onToggleTechnique(tech.id)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            tech.isActive ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"
                          )}
                        >
                          {tech.isActive ? "Đang Vận Hành" : "Kích Hoạt"}
                        </button>
                      </div>

                      {/* Display Stat Bonuses */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-bold">Tấn Công</span>
                          <span className="text-[10px] text-rose-400 font-mono">+{((stats.attackMultiplier - 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-bold">Phòng Thủ</span>
                          <span className="text-[10px] text-indigo-400 font-mono">+{((stats.defenseMultiplier - 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-bold">Khí Huyết</span>
                          <span className="text-[10px] text-emerald-400 font-mono">+{((stats.healthMultiplier - 1) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/5 space-y-3">
                        {tech.core?.origin && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">Nguồn gốc</span>
                            <p className="text-[10px] text-slate-400 font-serif leading-relaxed line-clamp-2" title={tech.core.origin}>
                              {tech.core.origin}
                            </p>
                          </div>
                        )}
                        {tech.core?.characteristics && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">Đặc điểm</span>
                            <p className="text-[10px] text-slate-400 font-serif leading-relaxed line-clamp-2" title={tech.core.characteristics}>
                              {tech.core.characteristics}
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 italic font-serif leading-relaxed line-clamp-2" title={tech.core?.description || 'Nội dung tâm pháp huyền bí...'}>
                           "{tech.core?.description || 'Nội dung tâm pháp huyền bí...'}"
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs text-slate-600 font-serif italic">Chưa lĩnh hội được bất kỳ Công Pháp nào.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <div className="bg-[#0f1218] p-6 border border-slate-800 rounded-2xl space-y-6 shadow-inner">
            <h3 className="stat-label flex items-center gap-2 border-b border-white/5 pb-4">
              <Sparkles size={14} className="text-amber-500" />
              Cơ Duyên & Phá Cảnh
            </h3>
            
            <div className="space-y-4">
               <div className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 text-center">Tỉ Lệ Đột Phá Hiện Tại</p>
                  <p className={cn(
                    "text-2xl text-center font-bold font-mono tracking-tighter",
                    state.breakthroughChance > 70 ? "text-emerald-500" : state.breakthroughChance > 40 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {state.breakthroughChance}%
                  </p>
                  <div className="h-1 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${state.breakthroughChance}%` }}
                      className={cn("h-full", state.breakthroughChance > 70 ? "bg-emerald-500" : "bg-amber-500")}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <p className="text-[8px] text-slate-500 uppercase font-black">Xếp hạng</p>
                    <p className="text-[10px] text-slate-200 font-bold">{state.breakthroughChance > 75 ? "Vô Cùng An Toàn" : state.breakthroughChance > 50 ? "Có Thể Thử" : "Cực Kỳ Rủi Ro"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[8px] text-slate-500 uppercase font-black">Rủi ro</p>
                    <p className="text-[10px] text-rose-400 font-bold">{state.breakthroughChance > 50 ? "Thấp" : "Cao"}</p>
                 </div>
               </div>

               <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-blue-400" />
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Thông số tu luyện</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Chu Thiên</p>
                      <p className="text-xs text-emerald-400 font-mono">
                        {state.masteredTechniques[0]?.circulation?.efficiency || 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Linh Căn</p>
                      <p className="text-xs text-blue-400 font-mono">{state.spiritualRoot?.purity || 0}%</p>
                    </div>
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Tâm Cảnh</p>
                      <p className="text-xs text-indigo-400 font-mono">
                        {(1.0 + (state.karma / 1000)).toFixed(0)}x
                      </p>
                    </div>
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Vận Khí</p>
                      <p className="text-xs text-amber-500 font-mono">
                        {state.luck}
                      </p>
                    </div>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-blue-400" />
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Yếu tố ảnh hưởng phá cảnh</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 italic">Căn Cơ (Foundation):</span>
                      <span className="text-emerald-500">+{Math.floor(state.foundation / 10)}%</span>
                    </li>
                    <li className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 italic">Linh Căn (Spiritual Root):</span>
                      <span className="text-blue-500">+{Math.floor((state.spiritualRoot?.purity || 0) / 20)}%</span>
                    </li>
                    <li className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 italic">May mắn (Luck):</span>
                      <span className="text-amber-500">+{Math.floor(state.luck / 5)}%</span>
                    </li>
                  </ul>
               </div>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield size={12} className="text-emerald-500" />
                Cơ Duyên Hiện Tại
             </h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Vận may (Luck):</span>
                  <span className="text-amber-500 font-mono font-bold">{state.luck}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Karma (Nhân quả):</span>
                  <span className={cn("font-mono font-bold", state.karma >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {state.karma}
                  </span>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CultivationUI;
