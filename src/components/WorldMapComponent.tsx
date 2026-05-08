import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapRegion } from '../types';
import { cn } from '../lib/utils';
import { MapIcon, Mountain, TreePine, Waves, Skull, LockIcon, Compass, Sparkles } from 'lucide-react';

interface WorldMapComponentProps {
  mapData: MapRegion[];
  currentLocation: string;
}

const ICONS_BY_TYPE = {
  Continent: Compass,
  City: MapIcon,
  Sect: Sparkles,
  Mountain: Mountain,
  Forest: TreePine,
  River: Waves,
  Sea: Waves,
  Dungeon: Skull,
  ForbiddenZone: Skull,
};

const COLORS_BY_TYPE = {
  Continent: 'text-amber-500 border-amber-500',
  City: 'text-blue-400 border-blue-400',
  Sect: 'text-purple-400 border-purple-400',
  Mountain: 'text-emerald-500 border-emerald-500',
  Forest: 'text-green-500 border-green-500',
  River: 'text-cyan-400 border-cyan-400',
  Sea: 'text-cyan-600 border-cyan-600',
  Dungeon: 'text-rose-500 border-rose-500',
  ForbiddenZone: 'text-rose-600 border-rose-600',
};

export const WorldMapComponent: React.FC<WorldMapComponentProps> = ({ mapData, currentLocation }) => {
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null);

  const bounds = React.useMemo(() => {
    if (!mapData || mapData.length === 0) return null;
    
    // Determine bounds
    const xValues = mapData.map(r => r.positionX || 0);
    const yValues = mapData.map(r => r.positionY || 0);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const rangeX = Math.max(maxX - minX, 100);
    const rangeY = Math.max(maxY - minY, 100);

    // Pad by 10%
    const paddingX = rangeX * 0.1;
    const paddingY = rangeY * 0.1;
    
    const width = rangeX + paddingX * 2;
    const height = rangeY + paddingY * 2;

    return { minX, maxX, minY, maxY, width, height, paddingX, paddingY };
  }, [mapData]);

  const toPercentX = React.useCallback((x: number) => {
    if (!bounds) return 0;
    return ((x - bounds.minX + bounds.paddingX) / bounds.width) * 100;
  }, [bounds]);

  const toPercentY = React.useCallback((y: number) => {
    if (!bounds) return 0;
    return ((y - bounds.minY + bounds.paddingY) / bounds.height) * 100;
  }, [bounds]);

  const regionMap = React.useMemo(() => {
    const map: Record<string, MapRegion> = {};
    mapData.forEach(r => { map[r.id] = r; });
    return map;
  }, [mapData]);

  if (!mapData || mapData.length === 0) {
    return <div className="text-center text-slate-500 p-8">Thiên cơ chưa hiển lộ... (Chưa có bản đồ)</div>;
  }

  return (
    <div className="space-y-6">
      {/* 2D Map Visualization */}
      <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#05070a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {mapData.map(region => {
            const isDiscovered = region.discovered || currentLocation.toLowerCase().includes(region.name.toLowerCase());

            return (region.connectedRegionIds || []).map(connId => {
              const target = regionMap[connId];
              if (!target) return null;
              
              const targetDiscovered = target.discovered || currentLocation.toLowerCase().includes(target.name.toLowerCase());
              
              const x1 = toPercentX(region.positionX || 0);
              const y1 = toPercentY(region.positionY || 0);
              const x2 = toPercentX(target.positionX || 0);
              const y2 = toPercentY(target.positionY || 0);

              return (
                <line 
                  key={`${region.id}-${target.id}`}
                  x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke={isDiscovered && targetDiscovered ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)"}
                  strokeWidth={isDiscovered && targetDiscovered ? "2" : "1"}
                  strokeDasharray={isDiscovered && targetDiscovered ? "none" : "4 4"}
                />
              )
            })
          })}
        </svg>

        {mapData.map(region => {
          const isCurrent = currentLocation.toLowerCase().includes(region.name.toLowerCase()) || 
                           (region.tierId === 'tier_1' && (currentLocation.includes('Phàm Giới') || currentLocation.includes('Thạc Thạch')));
          const isDiscovered = region.discovered || isCurrent;
          const left = toPercentX(region.positionX || 0);
          const top = toPercentY(region.positionY || 0);
          const Icon = ICONS_BY_TYPE[region.type] || Compass;
          const colorClass = COLORS_BY_TYPE[region.type] || 'text-slate-400 border-slate-400';

          return (
            <div 
              key={region.id}
              className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 group z-10", isDiscovered ? "cursor-pointer" : "cursor-not-allowed")}
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => isDiscovered && setSelectedRegion(region)}
            >
              <div className={cn(
                "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
                isCurrent ? "w-12 h-12 border-amber-400 bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.8)] z-30 scale-110" : 
                isDiscovered ? cn("w-8 h-8 bg-[#0a0c0f] hover:scale-110 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]", colorClass) :
                "w-6 h-6 border-slate-800 bg-black/80 opacity-40 grayscale"
              )}>
                {isCurrent && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-amber-300 animate-ping opacity-75" />
                    <div className="absolute inset-0 rounded-full bg-amber-400 animate-pulse opacity-20" />
                  </>
                )}
                {isDiscovered ? <Icon size={isCurrent ? 24 : 14} className={isCurrent ? "text-amber-300 drop-shadow-md" : ""} /> : <span className="text-[10px] font-bold text-slate-500">?</span>}
              </div>

              {/* Tooltip visible on hover or if current */}
              <div className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-black/90 border border-slate-800 text-[10px] whitespace-nowrap pointer-events-none transition-opacity",
                isCurrent ? "opacity-100 font-bold text-amber-400 z-40 border-amber-500/50" : "opacity-0 group-hover:opacity-100 text-slate-300 z-30"
              )}>
                {isDiscovered ? region.name : "Vị Khu Bí Ẩn"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Region Details OR Overview list */}
      <AnimatePresence mode="popLayout">
        {selectedRegion ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0f1218] border border-slate-800 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono">Tầng {selectedRegion.tierId?.replace('tier_', '') || '?'}</span>
                  <span className="text-[10px] text-slate-500 border border-slate-700 px-1 rounded">{selectedRegion.type}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-100">
                  {selectedRegion.discovered || currentLocation.toLowerCase().includes(selectedRegion.name.toLowerCase()) ? selectedRegion.name : "Thiên Cơ Chưa Hiển Lộ"}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRegion(null)}
                className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider underline border-none bg-transparent"
              >
                Đóng
              </button>
            </div>

            {(selectedRegion.discovered || currentLocation.toLowerCase().includes(selectedRegion.name.toLowerCase())) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-4">
                  <p className="text-slate-300 italic">{selectedRegion.description}</p>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Đặc trưng địa lý</span>
                    <p className="text-slate-400 text-xs">{selectedRegion.terrain}</p>
                  </div>
                </div>
                
                <div className="space-y-4 bg-black/30 p-4 rounded-lg border border-slate-800/50">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500 text-xs text-left">Linh Khí</span>
                    <span className="text-emerald-400 text-xs font-mono">{selectedRegion.linhKhi}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500 text-xs text-left">Giới Hạn Tu Vi</span>
                    <span className="text-amber-400 text-xs font-mono">{selectedRegion.cap}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500 text-xs text-left">Độ Nguy Hiểm</span>
                    <span className="text-rose-400 text-xs font-mono">{selectedRegion.difficulty}/10</span>
                  </div>
                  {selectedRegion.commonBeasts && selectedRegion.commonBeasts.length > 0 && (
                    <div className="pt-2">
                      <span className="block text-slate-500 text-[10px] uppercase mb-1">Yêu thú thường kiến</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedRegion.commonBeasts.map((b, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-300 rounded border border-rose-500/20">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div className="py-8 flex items-center justify-center text-slate-500 italic text-sm">
                 Vùng đất này bị che phủ trong sương mù hỗn mang, không thể dòm ngó.
               </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {mapData.map((realm) => {
              const isCurrent = currentLocation.toLowerCase().includes(realm.name.toLowerCase()) || 
                                (realm.tierId === 'tier_1' && (currentLocation.includes('Phàm Giới') || currentLocation.includes('Thanh Thạch Thành')));
              const isDiscovered = realm.discovered || isCurrent;
              
              if (!isDiscovered) {
                return (
                  <div 
                    key={`grid-${realm.id}`}
                    className="p-4 rounded-xl border bg-black/20 border-slate-800/50 opacity-40 grayscale flex flex-col items-center justify-center text-center min-h-[120px]"
                  >
                     <span className="text-xl font-bold text-slate-700 mb-2">?</span>
                     <p className="text-[10px] text-slate-600 italic">Vùng đất chưa khám phá</p>
                  </div>
                );
              }

              return (
                <div 
                  key={`grid-${realm.id}`}
                  onClick={() => setSelectedRegion(realm)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
                    isCurrent ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden" : "bg-[#0a0c0f] border-slate-800 hover:border-slate-600"
                  )}
                >
                  {isCurrent && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />}
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Tầng {realm.tierId?.replace('tier_', '') || '?'}</span>
                     {isCurrent && (
                       <span className="text-[8px] flex items-center gap-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                         Hiện tại
                       </span>
                     )}
                  </div>
                  <h4 className={cn("font-serif font-bold text-lg", isCurrent ? "text-amber-400" : "text-slate-100")}>{realm.name}</h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">{realm.description}</p>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
