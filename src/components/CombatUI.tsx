import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, Shield, Zap, Heart, Sparkles, Trophy, Skull, Compass, History, Target,
  Flame, Snowflake, Ghost, ShieldCheck, Activity, Timer
} from 'lucide-react';
import { CombatUnit, CombatState, Skill } from '../types';
import { cn } from '../lib/utils';
import { ElementType } from '../data/element_system';

interface CombatUIProps {
  combatState: CombatState;
  combatLoopUpdate: () => void;
  performRealtimeAttack: (attackerId: string, skillId: string) => void;
  moveCombatant: (unitId: string, position: { x: number, y: number }) => void;
  endCombat: (winnerId?: string) => void;
  closeCombat: () => void;
  updateCombatState: (updater: (prev: any) => any) => void;
  onEscape: () => void;
  onCombatFinished?: (winnerId: string | undefined, logs: string[]) => void;
}

const RARITY_COLORS: Record<string, string> = {
  'COMMON': 'text-slate-400',
  'RARE': 'text-blue-400',
  'EPIC': 'text-purple-400',
  'LEGENDARY': 'text-amber-400',
  'MYTHIC': 'text-rose-500',
};

const ELEMENT_CONFIG: Record<string, { color: string, icon: any, shadow: string, trail: string }> = {
  'KIM': { color: 'text-amber-400', icon: Sparkles, shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]', trail: 'bg-amber-400' },
  'MOC': { color: 'text-emerald-400', icon: Activity, shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]', trail: 'bg-emerald-400' },
  'THUY': { color: 'text-cyan-400', icon: Ghost, shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]', trail: 'bg-cyan-400' },
  'HOA': { color: 'text-rose-500', icon: Flame, shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.6)]', trail: 'bg-rose-500' },
  'THO': { color: 'text-orange-500', icon: Shield, shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]', trail: 'bg-orange-500' },
  'LOI': { color: 'text-purple-400', icon: Zap, shadow: 'shadow-[0_0_15_rgba(168,85,247,0.6)]', trail: 'bg-purple-400' },
  'BANG': { color: 'text-blue-300', icon: Snowflake, shadow: 'shadow-[0_0_15px_rgba(147,197,253,0.6)]', trail: 'bg-blue-300' },
  'PHONG': { color: 'text-teal-300', icon: Compass, shadow: 'shadow-[0_0_15px_rgba(94,234,212,0.6)]', trail: 'bg-teal-300' },
  'VẬT LÝ': { color: 'text-slate-400', icon: Target, shadow: 'shadow-[0_0_15px_rgba(148,163,184,0.6)]', trail: 'bg-slate-400' },
};

export const CombatUI: React.FC<CombatUIProps> = ({ 
  combatState, 
  combatLoopUpdate,
  performRealtimeAttack,
  moveCombatant,
  endCombat,
  closeCombat,
  onEscape,
  onCombatFinished
}) => {
  const { participants, projectiles, logs, isFinished, winnerId, rewards, rewardsClaimed } = combatState;
  const player = participants.find(p => p.isPlayer);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  
  const arenaRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!arenaRef.current) return;
    const updateSize = () => {
      setDimensions({
        width: arenaRef.current?.clientWidth || 0,
        height: arenaRef.current?.clientHeight || 0,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Core Real-Time Loop
  useEffect(() => {
     let afReq: number;
     const loop = () => {
        combatLoopUpdate();
        afReq = requestAnimationFrame(loop);
     }
     afReq = requestAnimationFrame(loop);
     return () => cancelAnimationFrame(afReq);
  }, [combatLoopUpdate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Handle auto-attacking with the selected skill
  useEffect(() => {
    if (!player || !selectedSkillId || !player.isAlive || isFinished) return;
    
    // Poll every 100ms. useGameState handles cooldown, mana AND range checks.
    const autoAttackInterval = setInterval(() => {
       performRealtimeAttack(player.id, selectedSkillId);
    }, 100);
    
    return () => clearInterval(autoAttackInterval);
  }, [player?.id, player?.isAlive, isFinished, selectedSkillId, performRealtimeAttack]);

  // Handle clicking on enemy to attack (Optional manual override)
  const handleEnemyClick = (e: React.MouseEvent, enemyId: string) => {
     e.stopPropagation();
     if (!player || !selectedSkillId || !player.isAlive || isFinished) return;
     performRealtimeAttack(player.id, selectedSkillId);
  };

  // Auto-select first active skill
  useEffect(() => {
     if (player && player.skills.length > 0 && !selectedSkillId) {
        setSelectedSkillId(player.skills[0].id);
     }
  }, [player?.id, player?.skills?.length, selectedSkillId]);

  if (isFinished) {
    const isPlayerWinner = winnerId === player?.id;
    const isEscape = !winnerId && player && player.hp > 0;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
           className={cn(
            "w-full max-w-xl bg-[#0d1014] border rounded-lg p-6 md:p-10 text-center space-y-6 md:space-y-8 shadow-[0_0_100px_rgba(0,0,0,0.5)]",
             isPlayerWinner ? "border-emerald-500/30" : isEscape ? "border-amber-500/30" : "border-rose-500/30"
           )}
         >
           <div className="space-y-2">
             <div className={cn(
               "inline-flex w-20 h-20 rounded-full border items-center justify-center mb-4",
               isPlayerWinner ? "bg-emerald-500/10 border-emerald-500/30" : isEscape ? "bg-amber-500/10 border-amber-500/30" : "bg-rose-500/10 border-rose-500/30"
             )}>
               {isPlayerWinner ? <Trophy className="text-emerald-500" size={40} /> : isEscape ? <Compass className="text-amber-500" size={40} /> : <Skull className="text-rose-500" size={40} />}
             </div>
             <h1 className={cn(
               "text-3xl font-black tracking-[0.2em] uppercase font-serif",
               isPlayerWinner ? "text-emerald-500" : isEscape ? "text-amber-500" : "text-rose-500"
             )}>
               {isPlayerWinner ? "Đắc Thắng" : isEscape ? "Đào Tẩu" : "Thảm Bại"}
             </h1>
             {isEscape && <p className="text-amber-500/70 text-sm">Giữ được mạng sống, đã là vạn hạnh...</p>}
           </div>

          {isPlayerWinner && rewards && rewards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-center">
                <div className="h-px w-8 bg-emerald-500/30" />
                <span className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest">Chiến Lợi Phẩm</span>
                <div className="h-px w-8 bg-emerald-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 scroll-container">
                {rewards.map((reward, i) => (
                  <div key={i} className="flex flex-col items-start p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className={cn("text-[9px] font-black uppercase mb-1", RARITY_COLORS[reward.rarity.toUpperCase()] || 'text-slate-400')}>
                      {reward.rarity}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{reward.name}</span>
                    <span className="text-[10px] text-slate-500 mt-1">x{reward.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => {
              if (rewardsClaimed || !isPlayerWinner) {
                if (onCombatFinished) onCombatFinished(winnerId, logs);
                closeCombat();
              } else {
                endCombat(winnerId);
              }
            }}
            className={cn(
              "w-full py-4 font-black uppercase tracking-[0.2em] text-sm rounded shadow-lg transition-all",
              isPlayerWinner ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-rose-600 hover:bg-rose-500 text-white"
            )}
          >
            {(rewardsClaimed || !isPlayerWinner) ? "Rời khỏi chiến trường" : "Thu dọn chiến trường"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      animate={screenShake ? { x: [-5, 5, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
      className="fixed inset-0 z-[100] bg-[#050608] flex flex-col overflow-hidden selection:bg-amber-500/30 selection:text-amber-900 font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px] -translate-y-1/2 animate-pulse [animation-delay:1s]" />
      </div>

      {/* Main Arena */}
      <div 
         ref={arenaRef}
         onPointerMove={handleMouseMove}
         className="flex-1 relative overflow-hidden border-b border-white/10 select-none touch-none bg-[#0a0c10]"
      >
         {/* Tactical Grid Overlay */}
         <div className="absolute inset-0 pointer-events-none opacity-10">
           {/* Horizontal Lines */}
           {Array.from({ length: 11 }).map((_, i) => (
             <div 
                key={`h-${i}`} 
                className="absolute w-full h-[1px] bg-white/40" 
                style={{ top: `${i * 10}%` }}
             >
               <span className="absolute -top-3 left-1 text-[7px] font-mono text-slate-400 uppercase tracking-widest">{String.fromCharCode(65 + i)}</span>
             </div>
           ))}
           {/* Vertical Lines */}
           {Array.from({ length: 11 }).map((_, i) => (
             <div 
                key={`v-${i}`} 
                className="absolute h-full w-[1px] bg-white/40" 
                style={{ left: `${i * 10}%` }}
             >
               <span className="absolute top-1 -left-2 text-[7px] font-mono text-slate-400">{i * 10}</span>
             </div>
           ))}
         </div>

         {/* SVG Tactical Layer */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
           <defs>
             <radialGradient id="playerRange" cx="50%" cy="50%" r="50%">
               <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
               <stop offset="70%" stopColor="rgba(16, 185, 129, 0.02)" />
               <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
             </radialGradient>
           </defs>

           {/* Range Rings around player */}
           {player && player.isAlive && (
             <g>
                <circle 
                   cx={`${player.position.x}%`} 
                   cy={`${player.position.y}%`} 
                   r="20%" 
                   fill="url(#playerRange)"
                   className="animate-pulse"
                />
                <circle 
                   cx={`${player.position.x}%`} 
                   cy={`${player.position.y}%`} 
                   r="20%" 
                   fill="none" 
                   stroke="rgba(16, 185, 129, 0.2)" 
                   strokeWidth="1" 
                   strokeDasharray="4,4"
                />

                {/* Movement Path line */}
                {player.targetPosition && (
                  <line 
                    x1={`${player.position.x}%`} 
                    y1={`${player.position.y}%`} 
                    x2={`${player.targetPosition.x}%`} 
                    y2={`${player.targetPosition.y}%`} 
                    stroke="rgba(16, 185, 129, 0.4)" 
                    strokeWidth="1.5" 
                    strokeDasharray="6,3"
                  />
                )}

                {/* Target Line to hovered enemy */}
                {hoverTarget && (
                  (() => {
                    const targetUnit = participants.find(p => p.id === hoverTarget);
                    if (targetUnit) {
                       const dx = targetUnit.position.x - player.position.x;
                       const dy = targetUnit.position.y - player.position.y;
                       const dist = Math.sqrt(dx * dx + dy * dy);
                       const inRange = dist <= 20; 
                       return (
                         <g>
                           <line 
                             x1={`${player.position.x}%`} 
                             y1={`${player.position.y}%`} 
                             x2={`${targetUnit.position.x}%`} 
                             y2={`${targetUnit.position.y}%`} 
                             stroke={inRange ? "rgba(245, 158, 11, 0.5)" : "rgba(244, 63, 94, 0.3)"} 
                             strokeWidth="1" 
                             strokeDasharray="10,5"
                           />
                           <g transform={`translate(${(player.position.x + targetUnit.position.x) / 2 * dimensions.width / 100}, ${(player.position.y + targetUnit.position.y) / 2 * dimensions.height / 100})`}>
                              <rect x="-40" y="-20" width="80" height="15" rx="4" fill="rgba(0,0,0,0.6)" />
                              <text 
                                 textAnchor="middle" 
                                 className="text-[9px] font-mono font-bold uppercase tracking-tighter"
                                 style={{ fill: inRange ? '#fbbf24' : '#f43f5e' }}
                                 y="-9"
                              >
                                {Math.floor(dist)}u • {inRange ? 'Trong Tầm' : 'Quá Xa'}
                              </text>
                           </g>
                         </g>
                       )
                    }
                    return null;
                  })()
                )}
             </g>
           )}
         </svg>

         {/* Render Participants */}
         {participants.map(unit => {
            const hpPercent = (unit.hp / unit.maxHp) * 100;
            const isStunned = unit.activeEffects?.some(e => e.id === 'stun' || e.id === 'freeze');
            const config = ELEMENT_CONFIG[unit.element as string] || ELEMENT_CONFIG['VẬT LÝ'];
            const primaryColorClass = config.color.replace('text-', 'bg-').split(' ')[0] + '/20';
            
            return (
               <React.Fragment key={unit.id}>
                 {/* Movement Marker */}
                 {unit.targetPosition && (
                     <div 
                        className={cn(
                          "absolute w-6 h-6 border-2 border-dashed rounded-full flex items-center justify-center pointer-events-none animate-spin-slow opacity-60",
                          unit.isPlayer ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        )}
                        style={{ left: `${unit.targetPosition.x}%`, top: `${unit.targetPosition.y}%`, transform: 'translate(-50%, -50%)' }}
                     >
                        <div className={cn("w-1.5 h-1.5 rounded-full", unit.isPlayer ? "bg-emerald-400" : "bg-rose-400")} />
                     </div>
                 )}

                 <motion.div
                    onClick={(e) => {
                       if (!unit.isPlayer && unit.isAlive) {
                          handleEnemyClick(e, unit.id);
                       }
                    }}
                    onMouseEnter={() => !unit.isPlayer && setHoverTarget(unit.id)}
                    onMouseLeave={() => !unit.isPlayer && setHoverTarget(null)}
                    className={cn(
                       "absolute w-12 h-12 rounded-full border transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center backdrop-blur-md shadow-2xl z-10 overflow-visible cursor-pointer",
                       primaryColorClass,
                       "border-white/10",
                       unit.isPlayer ? "ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]" : "cursor-crosshair border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.1)]",
                       !unit.isAlive && "opacity-30 grayscale blur-[1px]",
                       hoverTarget === unit.id && "scale-110 ring-2 ring-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.3)]",
                       isStunned && "animate-pulse"
                    )}
                    animate={{ left: `${unit.position.x}%`, top: `${unit.position.y}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                 >
                    {/* Unit Element Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 rounded-full border border-white/10 flex items-center justify-center z-20">
                       <config.icon size={10} className={config.color} />
                    </div>

                    <p className={cn("text-[9px] font-black uppercase tracking-tighter truncate max-w-full px-1", config.color)}>{(unit.name || 'Vô Danh').substring(0, 8)}</p>
                    
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                       {/* Floating HP Bar */}
                       <div className="w-16 h-1.5 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                          <motion.div 
                             className={cn("h-full", unit.isPlayer ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]")}
                             initial={{ width: '100%' }}
                             animate={{ width: `${hpPercent}%` }}
                             transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                          />
                       </div>
                       {/* Floating MP Bar (Player Only) */}
                       {unit.isPlayer && (
                        <div className="w-16 h-1 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(unit.mana / unit.maxMana) * 100}%` }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                          />
                        </div>
                       )}
                    </div>

                    {/* CC Status Overlay */}
                    {isStunned && (
                      <div className="absolute inset-x-0 -bottom-3 flex justify-center z-20">
                         <span className="text-[8px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
                            {unit.activeEffects?.find(e => e.id === 'freeze') ? 'BĂNG PHONG' : 'CHOÁNG'}
                         </span>
                      </div>
                    )}

                    {/* Active Status Effects */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 p-0.5 rounded-full backdrop-blur-sm border border-white/10">
                       {unit.activeEffects && unit.activeEffects.map((eff, idx) => (
                          <div key={`${unit.id}-eff-${idx}`} className="group relative">
                             <div className="p-1 rounded-full bg-black/50">
                               {eff.id === 'burn' && <Flame size={10} className="text-rose-500" />}
                               {eff.id === 'freeze' && <Snowflake size={10} className="text-cyan-300" />}
                               {eff.id === 'stun' && <Zap size={10} className="text-yellow-400" />}
                               {eff.id === 'spd_down' && <Timer size={10} className="text-blue-400" />}
                               {eff.id === 'poison' && <Skull size={10} className="text-emerald-500" />}
                               {eff.id === 'weaken' && <Ghost size={10} className="text-purple-500" />}
                               {eff.id === 'def_up' && <ShieldCheck size={10} className="text-blue-500" />}
                               {eff.id === 'regen' && <Activity size={10} className="text-green-500" />}
                             </div>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 border border-white/10 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                                {eff.name}: {eff.duration}s
                             </div>
                          </div>
                       ))}
                    </div>

                    <span className="absolute -bottom-6 text-[7px] font-mono text-slate-500 px-1 bg-black/40 rounded border border-white/5 whitespace-nowrap">
                      COORD: {Math.floor(unit.position.x)}, {Math.floor(unit.position.y)}
                    </span>

                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="48" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                       <circle 
                          cx="50" cy="50" r="48" 
                          fill="transparent" 
                          stroke="currentColor" 
                          strokeWidth="4" 
                          strokeDasharray="301.59" 
                          strokeDashoffset={301.59 - (301.59 * Math.max(0, hpPercent)) / 100}
                          className="transition-all duration-200"
                       />
                    </svg>
                 </motion.div>
               </React.Fragment>
            );
         })}

         {/* Render Projectiles */}
         <AnimatePresence>
            {projectiles.map(proj => {
               const config = ELEMENT_CONFIG[proj.element as string] || ELEMENT_CONFIG['VẬT LÝ'];
               const ProjectileIcon = config.icon || Sparkles;
               return (
                  <motion.div
                     key={proj.id}
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0, opacity: 0 }}
                     className={cn(
                        "absolute w-4 h-4 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20",
                        config.color,
                        config.shadow
                     )}
                     style={{ left: `${proj.position.x}%`, top: `${proj.position.y}%` }}
                  >
                    <div className={cn("relative w-full h-full flex items-center justify-center bg-black/60 rounded-full border border-white/10")}>
                       <ProjectileIcon className="w-2.5 h-2.5 animate-spin-slow" />
                       <div className={cn("absolute inset-0 rounded-full blur-[4px] opacity-40 animate-ping", config.trail)} />
                    </div>
                  </motion.div>
               )
            })}
         </AnimatePresence>
      </div>

      {/* Footer: Combat Log & Controls */}
      <div className="h-2/5 md:h-64 shrink-0 bg-[#080a0d] flex flex-col md:flex-row overflow-hidden border-t border-white/10">
        <div className="flex-1 border-r border-white/5 p-4 md:p-6 flex flex-col gap-4 overflow-hidden bg-white/[0.01]">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} className="text-amber-500/50" /> Chiến Báo (Realtime)
              </h3>
           </div>
           <div className="flex-1 overflow-y-auto md:pr-4 scroll-container space-y-2 mask-fade-top">
             {logs.slice(-20).reverse().map((log, i) => (
                <div key={i} className="flex gap-2 md:gap-3 items-start group">
                  <div className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-white/10 group-hover:bg-amber-500/50 transition-colors" />
                  <p className={cn(
                    "text-[11px] md:text-[12px] font-serif leading-relaxed italic transition-colors",
                    log.includes('hp') || log.includes('dmg') || log.includes('mất') || log.includes('sát thương') ? "text-rose-400/90" : 
                    log.includes('dùng') || log.includes('triển') ? "text-amber-400/90" : 
                    "text-slate-400/80"
                  )}>
                    {log}
                  </p>
                </div>
             ))}
           </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full md:w-[400px] p-4 md:p-6 flex flex-col bg-black/20 relative z-10 border-t md:border-t-0 border-white/10">
           {player && (
             <div className="mb-4 md:mb-6 grid grid-cols-2 md:grid-cols-1 gap-4">
               <div>
                  <div className="flex justify-between items-center text-[8px] md:text-[9px] uppercase font-black text-slate-500 mb-1 tracking-widest">
                    <span>HP</span>
                    <span className="text-rose-400">{Math.floor(player.hp)}/{Math.floor(player.maxHp)}</span>
                  </div>
                  <div className="h-1 w-full bg-black/50 rounded-full border border-white/5 overflow-hidden">
                    <motion.div 
                       className="h-full bg-rose-500" 
                       animate={{ width: `${(player.hp/player.maxHp)*100}%` }}
                    />
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center text-[8px] md:text-[9px] uppercase font-black text-slate-500 mb-1 tracking-widest">
                    <span>MP</span>
                    <span className="text-cyan-400">{Math.floor(player.mana)}/{Math.floor(player.maxMana)}</span>
                  </div>
                  <div className="h-1 w-full bg-black/50 rounded-full border border-white/5 overflow-hidden">
                    <motion.div 
                       className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                       animate={{ width: `${(player.mana/player.maxMana)*100}%` }}
                    />
                  </div>
               </div>
             </div>
           )}

           <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-white/5" />
              <h3 className="text-[8px] md:text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] whitespace-nowrap">
                 Thần Thông
              </h3>
              <div className="h-px flex-1 bg-white/5" />
           </div>

           <div className="flex-1 overflow-x-auto no-scrollbar flex md:flex-col gap-2 md:space-y-2.5 pb-2">
             {player && player.skills.map(skill => {
                const isSelected = selectedSkillId === skill.id;
                const canAfford = player.mana >= (skill.cost || 0);
                const now = Date.now();
                const cdUntil = player.cooldowns[skill.id] || 0;
                const isOnCd = cdUntil > now;
                const ratio = isOnCd ? Math.min(1, (cdUntil - now) / ((skill.cooldown * 1000) || 1)) : 0;
                
                // Determine visuals
                const isAttack = skill.baseDamage > 0;
                const hasDefEffect = skill.effects?.some(e => ['FORTIFY', 'REGEN'].includes(e.type));
                const Icon = isAttack ? Sword : hasDefEffect ? Shield : Sparkles;
                const colorClass = isAttack ? 'text-rose-400' : hasDefEffect ? 'text-emerald-400' : 'text-amber-400';
                const bgClass = isAttack ? 'bg-rose-500/10' : hasDefEffect ? 'bg-emerald-500/10' : 'bg-amber-500/10';
                
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={cn(
                       "flex-shrink-0 w-32 md:w-full relative overflow-hidden bg-white/[0.03] border p-2 md:p-3 rounded-lg text-left transition-all",
                       isSelected ? `border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]` : "border-white/10",
                       (!canAfford || isOnCd) && "opacity-50 grayscale"
                    )}
                  >
                     {isOnCd && (
                        <div 
                           className="absolute inset-y-0 left-0 bg-white/5"
                           style={{ width: `${ratio * 100}%` }}
                        />
                     )}
                     <div className="flex justify-between items-center relative z-10 gap-2">
                        <div className={cn("p-1.5 rounded-md", bgClass)}>
                          <Icon size={14} className={colorClass} />
                        </div>
                        <div className="flex flex-col flex-1 truncate">
                          <span className="text-[10px] md:text-xs font-bold text-slate-200 truncate">{skill.name}</span>
                          <span className="text-[8px] md:text-[10px] text-cyan-400">{skill.cost} MP</span>
                        </div>
                     </div>
                  </button>
                )
             })}
           </div>

           {!isFinished && (
             <button
               onClick={onEscape}
               className="mt-3 flex items-center justify-center gap-2 py-2 md:py-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all"
             >
               <Compass size={12} className="md:w-3.5 md:h-3.5" /> Chạy trốn
             </button>
           )}
        </div>
      </div>
    </motion.div>
  );
};

export default CombatUI;
