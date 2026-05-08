import { motion } from 'motion/react';
import { Clock, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { CultivationTimeline } from '../data/cultivation_timeline_system';
import { getTimelineSummary } from '../lib/timelineUtils';

interface TimelineHeaderProps {
  timeline: CultivationTimeline;
}

export function TimelineHeader({ timeline }: TimelineHeaderProps) {
  const summary = getTimelineSummary(timeline);
  const activeEvents = timeline.events.filter(e => e.active);

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg backdrop-blur-sm">
      {/* Year & Phase */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Clock size={16} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Thiên Thời</p>
          <p className="text-xs font-bold text-slate-200">{summary.yearStr}</p>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-800" />

      {/* Spirit & Danger */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-blue-400" />
          <div>
            <p className="text-[8px] text-slate-500 uppercase">Linh Khí</p>
            <p className="text-[10px] font-mono text-blue-400">{summary.density}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-rose-400" />
          <div>
            <p className="text-[8px] text-slate-500 uppercase">Nguy Hiểm</p>
            <p className="text-[10px] font-mono text-rose-400">{summary.danger}</p>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-800" />

      {/* Current Phase Badge */}
      <div className="flex flex-col items-center">
        <span className="text-[8px] text-slate-500 uppercase mb-1">Thời Đại</span>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
          timeline.cycle.phase === 'SPIRIT_PEAK' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          timeline.cycle.phase === 'SPIRIT_LOW' ? 'bg-slate-700/30 border-slate-600 text-slate-400' :
          timeline.cycle.phase === 'SPIRIT_DECAY' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
          'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {summary.phaseStr}
        </div>
      </div>

      {activeEvents.length > 0 && (
        <>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles size={14} className="text-amber-400" />
            </motion.div>
            <div className="flex gap-1">
              {activeEvents.slice(0, 2).map((ev, i) => (
                <span key={ev.id} className="text-[9px] px-1.5 py-0.5 bg-amber-500/5 border border-amber-500/10 text-amber-500/70 rounded">
                  {ev.type.replace('_', ' ')}
                </span>
              ))}
              {activeEvents.length > 2 && <span className="text-[9px] text-slate-500">+{activeEvents.length - 2}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
