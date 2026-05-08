import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowUpCircle } from 'lucide-react';

interface BreakthroughModalProps {
  message: string;
  onClose: () => void;
}

export const BreakthroughModal: React.FC<BreakthroughModalProps> = ({ message, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border-2 border-amber-500/50 p-8 rounded-3xl max-w-md w-full text-center space-y-6"
        >
          <div className="flex justify-center text-amber-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={64} />
            </motion.div>
          </div>
          <h2 className="title-font text-2xl font-bold text-amber-500">Đột Phá Thành Công!</h2>
          <p className="text-slate-300 font-serif italic text-lg">{message}</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-amber-500 text-black font-black uppercase tracking-widest rounded-full hover:bg-amber-400 transition-colors"
          >
            Tiếp tục hành trình
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
