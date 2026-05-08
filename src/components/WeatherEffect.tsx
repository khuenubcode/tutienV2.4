import React from 'react';
import { motion } from 'motion/react';
import { WeatherType } from '../types';

interface WeatherEffectProps {
  type: WeatherType;
}

export const WeatherEffect: React.FC<WeatherEffectProps> = ({ type }) => {
  if (type === 'Nắng') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {type === 'Mưa' && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ top: -20, left: `${Math.random() * 100}%` }}
              animate={{ 
                top: '120%',
                left: `${(parseFloat(`${Math.random() * 100}`) - 5)}%` 
              }}
              transition={{ 
                duration: 0.5 + Math.random() * 0.5, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 2
              }}
              className="absolute w-[1px] h-8 bg-blue-400/30 blur-[0.5px]"
            />
          ))}
        </div>
      )}

      {type === 'Sấm sét' && (
        <div className="absolute inset-0">
          {/* Rain backdrop */}
          <div className="absolute inset-0 bg-black/20" />
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ top: -20, left: `${Math.random() * 100}%` }}
              animate={{ top: '120%' }}
              transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, ease: "linear", delay: Math.random() * 1 }}
              className="absolute w-[1px] h-10 bg-blue-300/40"
            />
          ))}
          {/* Lightning strike */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 0.8, 0] }}
            transition={{ 
              duration: 0.3, 
              repeat: Infinity, 
              repeatDelay: 3 + Math.random() * 5 
            }}
            className="absolute inset-0 bg-white/20 mix-blend-overlay"
          />
        </div>
      )}

      {type === 'Tuyết' && (
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ top: -10, left: `${Math.random() * 100}%` }}
              animate={{ 
                top: '110%',
                left: `${(parseFloat(`${Math.random() * 100}`) + (Math.random() * 10 - 5))}%`,
                rotate: 360
              }}
              transition={{ 
                duration: 3 + Math.random() * 5, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 5
              }}
              className="absolute w-1 h-1 bg-white/60 rounded-full blur-[1px]"
            />
          ))}
        </div>
      )}

      {type === 'Sương mù' && (
        <motion.div 
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-t from-white/10 via-slate-500/5 to-transparent blur-3xl opacity-60" 
        />
      )}

      {type === 'U ám' && (
        <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply" />
      )}
    </div>
  );
};
