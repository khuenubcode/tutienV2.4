import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerState } from '../types';
import { Zap } from 'lucide-react';

interface MeditationOverlayProps {
  isVisible: boolean;
  state: PlayerState;
}

export const MeditationOverlay: React.FC<MeditationOverlayProps> = ({ isVisible, state }) => {
  const activeTech = state.masteredTechniques?.find(t => t.isActive) || state.masteredTechniques?.[0];
  const techName = activeTech ? activeTech.name : "Vô Danh Công Pháp";
  const purity = state.spiritualRoot?.purity || 10;
  const rootType = state.spiritualRoot?.type || "Phàm";

  // Simple progress animation
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) return 0;
          return p + 2;
        }); // Loop progress
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/80 backdrop-blur-md"
        >
          {/* Particle Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400"
                initial={{
                  x: '50vw',
                  y: '50vh',
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: `${20 + Math.random() * 60}vw`,
                  y: `${20 + Math.random() * 60}vh`,
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Circular Meditating indicator */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/50"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-2 border-emerald-400/30"
              />
              <div className="absolute inset-4 rounded-full border border-blue-400/20" />
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                 <Zap className="text-amber-500 w-12 h-12 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              </div>
            </div>

            <h2 className="title-font text-3xl text-amber-500 font-bold mb-2 tracking-wider">TĨNH TỌA TU LUYỆN</h2>
            <p className="text-slate-300 mb-8 font-mono tracking-widest uppercase text-xs border border-white/10 bg-white/5 px-4 py-2 rounded-full">
              Đang hành công: <span className="text-emerald-400 font-bold ml-1">{techName}</span>
            </p>

            <div className="bg-[#0f1218] border border-slate-800 p-6 rounded-2xl w-80 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Zap size={100} />
               </div>
               
               <div className="relative z-10">
                 <div className="flex justify-between text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">
                   <span>Tiến độ hành công</span>
                   <span className="text-amber-400">Đang luyện hóa...</span>
                 </div>
                 
                 <div className="h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden mb-6">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-800/50">
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Căn Cốt</p>
                     <p className="text-sm font-black text-emerald-400">{rootType} <span className="text-[10px] text-emerald-500/70">({purity}%)</span></p>
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Hiệu Suất</p>
                     <p className="text-sm font-black text-amber-400">+{Math.floor(purity * 2.5)}%</p>
                   </div>
                 </div>
               </div>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-500 font-mono tracking-widest uppercase animate-pulse">
              Đang chờ Thiên Đạo phản hồi...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
