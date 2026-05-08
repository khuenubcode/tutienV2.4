import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherEffect } from './components/WeatherEffect';
import { 
  Scroll, 
  Sword, 
  User, 
  Zap, 
  Heart, 
  Sparkles, 
  Crown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Map as MapIcon,
  Package,
  Shield,
  Database,
  Hammer,
  Settings,
  Save,
  Download,
  Flame,
  BookOpen,
  LayoutDashboard,
  Compass,
  Mountain,
  Info,
  Lock as LockIcon,
  RotateCcw,
  PawPrint,
  Trophy,
  Award,
  History,
  TrendingUp,
  Activity,
  Layers,
  Component,
  Brain,
  Globe,
  Target
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LINH_CAN, REALMS, BACKGROUNDS, RECIPES } from './data/worldData';
import { generateNextStep, GameResponse, suggestPlot, PlotSuggestion, generateWorldMap, generateWorldEquips, generateWorldTechniques, generateWorldNPCs, generateWorldBeasts, processCombatOutcome } from './services/geminiService';
import { useGameState } from './hooks/useGameState';
import { NPC, Difficulty, Background, InventoryItem, Rarity } from './types';
import { cn, formatLinhCanType, formatLinhCanPurity } from './lib/utils';
import { NPCCard } from './components/NPCCard';
import { BeastCard } from './components/BeastCard';
import * as npcService from './services/npcService';
import * as beastService from './services/beastService';
import { BeautyGallery } from './components/BeautyGallery';
import CultivationUI from './components/CultivationUI';
import { SubTabs, StatDisplay, GameAccordion, Tooltip } from './components/SharedUI';
import { WorldMapComponent } from './components/WorldMapComponent';
import { WORLD_GEO_PROMPT } from './prompts/WolrdMap';
import { getEnrichedEquipment } from './lib/equipmentStats';
import { getEnrichedTechniques } from './lib/techniqueStats';
import CombatUI from './components/CombatUI';
import NavBar, { TabType } from './components/NavBar';
import { TimelineHeader } from './components/TimelineHeader';
import { MeditationOverlay } from './components/MeditationOverlay';
import { BreakthroughModal } from './components/BreakthroughModal';


function ExpandableSection({ title, children, defaultOpen = false, icon }: { title: string, children: React.ReactNode, defaultOpen?: boolean, icon?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-slate-800/50 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-amber-500/70 group-hover:text-amber-500 transition-colors">{icon}</span>}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200 transition-colors">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-slate-600" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoizedNPCCard = React.memo(NPCCard);
const MemoizedWorldMapComponent = React.memo(WorldMapComponent);

export default function App() {
  const { 
    state, 
    initPlayer, 
    updateStats, 
    addHistory, 
    equipItem,
    unequipItem,
    craftItem, 
    resetGame, 
    toggleNsfw,
    updateCustomApiKey,
    updateStoryLength,
    exportGame,
    importGame,
    exitToMenu,
    startCombat,
    endCombat,
    closeCombat,
    updateCombatState,
    combatLoopUpdate,
    performRealtimeAttack,
    moveCombatant,
    attemptEscape,
    meditate,
    toggleTechnique,
    attemptBreakthrough,
    consumeItem,
    startNewArc
  } = useGameState();
  const [currentResponse, setCurrentResponse] = useState<GameResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(true);
  const [worldGenerationProgress, setWorldGenerationProgress] = useState(0);
  const [playerName, setPlayerName] = useState(state.name || '');
  const [playerGender, setPlayerGender] = useState<'Nam' | 'Nữ'>(state.gender || 'Nam');
  const [playerDifficulty, setPlayerDifficulty] = useState<Difficulty>(state.difficulty || 'Thường');
  const [selectedBg, setSelectedBg] = useState<Background | 'random'>(
    BACKGROUNDS.find(b => b.name === state.background) || BACKGROUNDS[0]
  );
  const [selectedLinhCan, setSelectedLinhCan] = useState<string | 'random'>('random');
  const [customApiKey, setCustomApiKey] = useState(state.customApiKey || '');
  const [showKeyInput, setShowKeyInput] = useState(!state.customApiKey);
  const [breakthroughResult, setBreakthroughResult] = useState<{message: string, success: boolean} | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('story');
  const [profileSubTab, setProfileSubTab] = useState('stats');
  const [inventorySubTab, setInventorySubTab] = useState('items');
  const [skillsSubTab, setSkillsSubTab] = useState('techniques');
  const [npcSubTab, setNpcSubTab] = useState('nearby');
  const [suggestions, setSuggestions] = useState<PlotSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isMeditating, setIsMeditating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!state.isInitialized || isFetchingSuggestions) return;
    setIsFetchingSuggestions(true);
    try {
      const plots = await suggestPlot(state);
      setSuggestions(plots);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [state, isFetchingSuggestions]);

  const handleAction = useCallback(async (actionText: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setActiveTab('story');

    try {
      const historyContext = state.history.slice(-5).map(item => ({
        role: 'model',
        content: `Hành động: ${item.actionTaken || 'Khởi đầu'}\n\nDiễn biến: ${item.story}`
      }));

      const response = await generateNextStep(state, actionText, historyContext);
      
      // Handle combat trigger
      if (response.triggersCombat) {
        if (response.enemies && response.enemies.length > 0) {
          startCombat(response.enemies);
        } else {
          // Fallback
          let fallbackEnemy = state.npcs && state.npcs.length > 0
            ? state.npcs.find(n => n.status !== 'dead') || state.npcs[0]
            : {
                id: 'unknown_foe',
                name: 'Kẻ thù bí ẩn',
                element: 'KIM',
                realmLevel: state.realmLevel || 1,
                stats: {
                  health: (state.maxHealth || 100) * 0.8,
                  mana: 50,
                  attack: (state.attack || 15) * 0.8,
                  defense: (state.defense || 10) * 0.8,
                  speed: (state.speed || 10) * 0.8,
                  accuracy: (state.accuracy || 60) * 0.8
                },
                combatSkills: [
                  {
                    id: 'unknown_strike',
                    name: 'Đòn Đánh Bí Ẩn',
                    type: 'ACTIVE',
                    baseDamage: 15,
                    scaling: 100,
                    element: 'VẬT LÝ',
                    cost: 0,
                    cooldown: 0,
                    rarity: 'COMMON'
                  }
                ]
              };
          startCombat([fallbackEnemy]);
        }
        setActiveTab('combat');
      }
      
      if (response.playerUpdates) {
        updateStats(response.playerUpdates);
      }
      
      if (response.currentLocation) {
        updateStats({ locationUpdate: response.currentLocation });
      }
      
      setCurrentResponse(response);
      addHistory(response.story, actionText, response.npcs, response.chronicles, response.weather as any, response.mapData as any, response.newEquipment, response.newTechnique, response.newBeasts, response.timePassed);
    } catch (err) {
      console.error("Action handler failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, state, startCombat, updateStats, addHistory]);

  const handleCombatFinished = useCallback(async (winnerId: string | undefined, logs: string[]) => {
    setIsLoading(true);
    try {
      const player = state.combatState?.participants.find(p => p.isPlayer);
      const enemy = state.combatState?.participants.find(p => !p.isPlayer);
      const enemyName = enemy?.name || "Kẻ địch bí ẩn";
      
      const isPlayerWinner = winnerId && player?.id === winnerId;
      const isEscape = !winnerId && player && player.hp > 0;
      
      let resultText = isPlayerWinner ? "Thắng lợi" : isEscape ? "Bỏ chạy" : "Thất bại";
      let storyContent = "";
      if (isPlayerWinner) {
          storyContent = `Sau một hồi huyết chiến ác liệt với ${enemyName}, ngươi đã giành thắng lợi. Ngươi thở phào nhẹ nhõm, thu dọn chiến lợi phẩm rơi vãi trên mặt đất và vận khí điều tức, khôi phục lại thể lực chuẩn bị cho hành trình tiếp theo.`;
      } else if (isEscape) {
          storyContent = `Tiếp chiêu không nổi ${enemyName}, ngươi đành vận dụng thân pháp tới cực hạn, thành công mạo hiểm thoát khỏi vòng vây. Dù bảo toàn được mạng sống, nhưng linh lực tiêu hao không nhỏ.`;
      } else {
          storyContent = `Ngươi bị ${enemyName} áp đảo hoàn toàn, thương tích đầy mình. Rơi vào vạn tử nhất sinh, ngươi đành thiêu đốt tinh huyết, thi triển nộn thuật để mạo hiểm thoát thân. Tình trạng hiện tại vô cùng nguy kịch!`;
      }

      const combatLogSummary = logs.slice(0, 3).join(", ") + (logs.length > 3 ? "..." : "");

      const mockResponse: GameResponse = {
        story: storyContent,
        actions: (isPlayerWinner || isEscape) ? [
          { id: 1, text: "Tiếp tục khám phá khu vực này" },
          { id: 2, text: "Tìm kiếm tài nguyên chung quanh" },
          { id: 3, text: "Ẩn nấp củng cố tu vi" }
        ] : [
          { id: 1, text: "Điên cuồng bỏ chạy tìm nơi an toàn" },
          { id: 2, text: "Uống đan dược liệu thương khẩn cấp" }
        ],
        playerUpdates: {}
      };

      setCurrentResponse(prev => prev ? { ...prev, ...mockResponse } : mockResponse);
      addHistory(storyContent, `[Chiến Đấu] Với ${enemyName} - Kết quả: ${resultText}. Tóm tắt: ${combatLogSummary}`);
      setActiveTab('story');
      closeCombat();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [state.combatState, addHistory, closeCombat]);

  const handleMeditate = useCallback(async () => {
    setIsMeditating(true);
    const actionText = meditate();
    try {
      await handleAction(actionText);
    } finally {
      setIsMeditating(false);
    }
  }, [handleAction, meditate]);

  const handleBreakthrough = useCallback(async () => {
    const result = attemptBreakthrough();
    const actionText = "[Hành động: Phá Cảnh Đột Phá] Tôi đang ở đỉnh phong cảnh giới, quyết tâm trùng kích xiềng xích, tiến ranh vào tầng thứ cao hơn.";
    await handleAction(actionText);
    if (result.success) {
      setBreakthroughResult(result);
    }
  }, [handleAction, attemptBreakthrough]);

  const handleCraft = useCallback((recipe: any) => {
    craftItem(recipe);
  }, [craftItem]);

  const handleNPCCardInteract = useCallback((npc: NPC) => {
    handleAction(`Ta muốn tìm gặp ${(npc.isNameRevealed ? npc.name : npc.temporaryName)} để tương tác.`);
  }, [handleAction]);

  const handleNPCCardDuel = useCallback((npc: NPC) => {
    startCombat([npc]);
  }, [startCombat]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with state when coming back to menu
  useEffect(() => {
    if (!state.isInitialized) {
      if (state.name && !playerName) setPlayerName(state.name);
      if (state.gender) setPlayerGender(state.gender);
      if (state.background) {
        const bg = BACKGROUNDS.find(b => b.name === state.background);
        if (bg) setSelectedBg(bg);
      }
      if (state.customApiKey) setCustomApiKey(state.customApiKey);
    }
  }, [state.isInitialized]);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (scrollRef.current && activeTab === 'story') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.history, isLoading, activeTab]);

  // Persist NPCs
  useEffect(() => {
    if (state.npcs && state.npcs.length > 0) {
      state.npcs.forEach(npc => {
        const existing = npcService.getNPCLocal(npc.id);
        if (existing) {
          npcService.updateNPCLocal({
            ...existing,
            name: npc.name,
            lastEncountered: new Date().toISOString()
          });
        } else {
          // Mapping from NPC (src/types.ts) to StoredNPC (src/services/npcService.ts)
          const newStored: any = {
            id: npc.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: npc.name,
            gender: npc.gender || 'Bí ẩn',
            personality: npc.personalityTraits || { rationality: 50, bravery: 50, morality: 50, ambition: 50 },
            realm: { name: npc.realm || 'Phàm Nhân', level: npc.powerScore || 0, description: '', stages: [] },
            subRealm: 1,
            costume: npc.currentOutfit || 'Phổ thông',
            spiritRoot: 'Thiên Phú',
            stats: {
              hp: npc.health || 100,
              maxHp: npc.maxHealth || 100,
              atk: npc.attack || 10,
              def: npc.defense || 10,
              spd: npc.speed || 10
            },
            learnedTechniques: [],
            equipment: {},
            inventory: npc.inventory || [],
            relation: npc.relationship || 0,
            isAlive: npc.status !== 'dead',
            lastEncountered: new Date().toISOString()
          };
          npcService.addNPCLocal(newStored);
        }
      });
    }
  }, [state.npcs]);

  // Persist Beasts
  useEffect(() => {
    if (state.worldBeasts && state.worldBeasts.length > 0) {
      state.worldBeasts.forEach((beast: any) => {
        // Find if this beast definition exists in our database to get more info
        const newStoredBeast: any = {
          id: beast.id || `beast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: beast.name,
          species: beast.species || 'Yêu thú',
          level: beast.level || 1,
          rarity: beast.rarity || 'common',
          element: beast.element || 'THỔ',
          stats: {
            hp: beast.stats?.health || 100,
            maxHp: beast.stats?.maxHealth || 100,
            atk: beast.stats?.attack || 10,
            def: beast.stats?.defense || 5,
            spd: beast.stats?.speed || 10,
            mana: beast.stats?.mana || 50,
            maxMana: beast.stats?.maxMana || 50
          },
          instinct: beast.instinct || 'Aggressive',
          isAlive: beast.status !== 'dead',
          lastEncountered: new Date().toISOString(),
          drops: beast.drops || [],
          habitat: beast.habitat || []
        };
        beastService.addBeastLocal(newStoredBeast);
      });
    }
  }, [state.worldBeasts]);

  // Death Logic
  const isDead = state.isInitialized && state.health <= 0;

  if (isGeneratingWorld) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c0f] selection:bg-amber-500/30">
         <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-[800px] h-[800px] border border-amber-500/10 rounded-full border-dashed"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-[600px] h-[600px] border-2 border-emerald-500/10 rounded-full border-dotted absolute"
            />
         </div>
         <div className="relative z-10 flex flex-col items-center max-w-md w-full">
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
               <Globe className="text-amber-500 w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-amber-500 tracking-widest uppercase mb-2">Đang Diễn Hóa Thiên Địa</h2>
            <p className="text-slate-400 text-sm mb-8 text-center font-serif italic">
               "Hỗn độn sơ khai, phân chia thiên địa. Tụ linh khí thành sơn mạch, hóa nguyên lực thành hồ hải..."
            </p>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-full p-1 mb-2">
               <motion.div 
                 className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full"
                 animate={{ width: `${worldGenerationProgress}%` }}
               />
            </div>
            <div className="flex justify-between w-full text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
               <span>Tiến trình</span>
               <span>{worldGenerationProgress}%</span>
            </div>
            <div className="mt-8 text-[10px] text-amber-500/50 animate-pulse uppercase tracking-[0.3em]">
               Vui lòng chờ Tôn Giả...
            </div>
         </div>
      </div>
    );
  }

  if (state.isCombat && state.combatState) {
    return (
      <CombatUI 
        combatState={state.combatState}
        endCombat={endCombat}
        closeCombat={closeCombat}
        updateCombatState={updateCombatState}
        combatLoopUpdate={combatLoopUpdate}
        performRealtimeAttack={performRealtimeAttack}
        moveCombatant={moveCombatant}
        onEscape={attemptEscape}
        onCombatFinished={handleCombatFinished}
      />
    );
  }

  if (isDead) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050608] z-[100] fixed inset-0">
        <div className="absolute inset-0 bg-radial-gradient from-rose-900/10 to-transparent" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg bg-[#0d1014] border border-rose-900/30 shadow-[0_0_100px_rgba(244,63,94,0.1)] rounded-lg p-10 text-center space-y-8"
        >
          <div className="space-y-2">
            <div className="inline-flex w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 items-center justify-center mb-4">
              <ShieldAlert className="text-rose-500" size={40} />
            </div>
            <h1 className="text-3xl font-black text-rose-500 tracking-[0.2em] uppercase font-serif">Vẫn Lạc</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Consciousness Dissolving...</p>
          </div>

          <div className="p-6 bg-rose-900/5 border border-rose-900/10 rounded-sm space-y-4">
            <p className="text-slate-300 italic text-sm leading-relaxed">
              "Trần gian chớp mắt, trăm năm như mộng. Đạo quả tan biến, linh hồn quy hư..."
            </p>
            <p className="text-xs text-slate-500">
              Bạn đã hy sinh trong quá trình tu luyện. Thức hải sụp đổ, luân hồi chuyển thế.
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={resetGame}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded shadow-lg shadow-rose-900/20 transition-all"
            >
              Vào Lại Luân Hồi (Reset)
            </button>
            <button 
              onClick={exitToMenu}
              className="w-full py-3 bg-transparent border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Thoát ra màn hình chính
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showKeyInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c0f] selection:bg-amber-500/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md bg-[#0f1218] border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)] rounded-lg p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-2">
              <Sparkles className="text-amber-500" size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-wider uppercase font-serif">Kết Nối Thiên Cơ</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Gemini API Key Required</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-sm">
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                Để hành trình được tiếp diễn, bạn cần cung cấp một chiếc "Chìa Khóa Thiên Cơ" (Gemini API Key). 
                Dữ liệu này sẽ được lưu trữ an toàn tại Thức Hải (Local Storage) của bạn.
              </p>
            </div>

            <div className="space-y-2">
              <label className="stat-label block opacity-70">Gemini API Key</label>
              <input 
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#0d1014] border border-slate-800 p-4 rounded text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm placeholder:text-slate-700"
              />
            </div>

            <button 
              onClick={() => {
                const sanitizedKey = customApiKey.replace(/[^\x20-\x7E]/g, "").trim();
                if (sanitizedKey) {
                  updateCustomApiKey(sanitizedKey);
                  setShowKeyInput(false);
                }
              }}
              disabled={!customApiKey.trim()}
              className="w-full py-4 bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black uppercase tracking-[0.2em] text-xs rounded shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              Khai Mở Thiên Cơ
            </button>

            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 pt-2">
               <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-amber-500/60 hover:text-amber-500 underline transition-colors"
               >
                 Lấy API Key tại đây
               </a>
               {state.customApiKey && (
                 <button 
                  onClick={() => setShowKeyInput(false)}
                  className="text-[10px] text-slate-600 hover:text-slate-400 underline transition-colors"
                 >
                   Dùng key cũ
                 </button>
               )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleStartGame = async () => {
    if (!playerName.trim()) return;

    // Weighted selection logic based on difficulty
    const generateInitialAttributes = (diff: Difficulty, chosenLinhCan: string | 'random') => {
      let selectedLinhCan = '';
      const purity = Math.floor(Math.random() * 40) + 30; // Base purity 30-70%
      
      if (chosenLinhCan === 'random') {
        if (diff === 'Dễ') {
          const highTierLinhCan = LINH_CAN.filter(l => l.includes('(Đơn)') || l.includes('(Dị)') || l.includes('(Chí Cao)'));
          selectedLinhCan = highTierLinhCan[Math.floor(Math.random() * highTierLinhCan.length)];
        } else if (diff === 'Thường') {
          selectedLinhCan = LINH_CAN[Math.floor(Math.random() * LINH_CAN.length)];
        } else if (diff === 'Khó') {
          const poorTierLinhCan = LINH_CAN.filter(l => l.includes('(Tạp)') || l.includes('(Phế)'));
          const chance = Math.random();
          selectedLinhCan = chance < 0.7 ? poorTierLinhCan[Math.floor(Math.random() * poorTierLinhCan.length)] : LINH_CAN[Math.floor(Math.random() * LINH_CAN.length)];
        } else { // Hồng Hoang
          const worstLinhCan = LINH_CAN.filter(l => l.includes('(Phế)') || l.includes('(Hư)'));
          selectedLinhCan = Math.random() < 0.8 ? worstLinhCan[Math.floor(Math.random() * worstLinhCan.length)] : LINH_CAN[Math.floor(Math.random() * LINH_CAN.length)];
        }
      } else {
        // Find the specific single element linh can
        const matched = LINH_CAN.find(l => l.startsWith(chosenLinhCan) && l.includes('(Đơn)'));
        selectedLinhCan = matched || chosenLinhCan;
      }

      let talentOptions = [
        { name: 'Ngoại cốt hiếm thấy', tier: 'High' },
        { name: 'Ngộ tính cực cao', tier: 'High' },
        { name: 'Đan điền dị biệt', tier: 'Medium' },
        { name: 'Khí vận chi tử', tier: 'God' },
        { name: 'Tâm cảnh kiên định', tier: 'Medium' },
        { name: 'Cốt cách bình thường', tier: 'Low' },
        { name: 'Kinh mạch bế tắc', tier: 'Poor' },
        { name: 'Lục căn không tịnh', tier: 'Poor' },
        { name: 'Thiếu niên nghèo khó', tier: 'Low' }
      ];

      let selectedTalent = '';
      if (diff === 'Dễ') {
        const highTierTalents = talentOptions.filter(t => t.tier === 'High' || t.tier === 'God');
        selectedTalent = highTierTalents[Math.floor(Math.random() * highTierTalents.length)].name;
      } else if (diff === 'Thường') {
        const midTierTalents = talentOptions.filter(t => t.tier !== 'Poor');
        selectedTalent = midTierTalents[Math.floor(Math.random() * midTierTalents.length)].name;
      } else if (diff === 'Khó') {
        const poorTalents = talentOptions.filter(t => t.tier === 'Low' || t.tier === 'Poor');
        selectedTalent = Math.random() < 0.6 ? poorTalents[Math.floor(Math.random() * poorTalents.length)].name : talentOptions[Math.floor(Math.random() * talentOptions.length)].name;
      } else {
        const worstTalents = talentOptions.filter(t => t.tier === 'Poor');
        selectedTalent = Math.random() < 0.8 ? worstTalents[Math.floor(Math.random() * worstTalents.length)].name : talentOptions[Math.floor(Math.random() * talentOptions.length)].name;
      }

      return { selectedLinhCan, selectedTalent, purity };
    };

    const { selectedLinhCan: linhCan, selectedTalent: talent, purity } = generateInitialAttributes(playerDifficulty, selectedLinhCan);

    const mapLinhCanToElement = (lc: string): any => {
      if (lc.includes('Kim')) return 'KIM';
      if (lc.includes('Mộc')) return 'MOC';
      if (lc.includes('Thủy')) return 'THUY';
      if (lc.includes('Hỏa')) return 'HOA';
      if (lc.includes('Thổ')) return 'THO';
      if (lc.includes('Lôi')) return 'LOI';
      if (lc.includes('Phong')) return 'PHONG';
      if (lc.includes('Băng')) return 'BANG';
      if (lc.includes('Hỗn Độn')) return 'HU_VO';
      return 'KIM';
    };

    const lowLevelLocations = [
      'Phàm Giới (Thanh Thạch Thành)',
      'Phàm Giới (Khu Ổ Chuột)',
      'Nam Hoang Vực (Hoang Thôn hẻo lánh)',
      'Đảo Ngoại Hải (Ngư Thôn)',
      'Bắc Nguyên (Bộ Lạc Du Mục)',
      'Tây Vực (Sa Mạc Quán Trọ)'
    ];

    let actualBackgroundName = '';
    let actualInventory = [];
    let actualFactions = {};
    let actualLocation = '';

    if (selectedBg === 'random') {
      const randomPrefixes = ['Kẻ bị trục xuất khỏi', 'Thiên tài sa sút của', 'Đứa trẻ mồ côi tại', 'Kẻ lang thang từ', 'Truyền nhân thất lạc của'];
      const randomPlaces = ['Cổ Gia', 'Thánh Địa', 'Vô Danh Sơn', 'Kiếm Phái', 'Mật Cảnh'];
      actualBackgroundName = `${randomPrefixes[Math.floor(Math.random() * randomPrefixes.length)]} ${randomPlaces[Math.floor(Math.random() * randomPlaces.length)]}`;
      actualInventory = [{ id: 'old_coin', name: 'Đồng Tiền Cổ', type: 'TREASURE', rarity: 'Phàm' as Rarity, description: 'Vật kỷ vật duy nhất còn sót lại.', amount: 1 }];
      actualFactions = { 'Giang Hồ': 10 };
      actualLocation = lowLevelLocations[Math.floor(Math.random() * lowLevelLocations.length)];
    } else {
      actualBackgroundName = selectedBg.name;
      actualInventory = [...selectedBg.startingItems];
      actualFactions = { ...selectedBg.startingReputation };
      
      const mapBackgroundToLocation = (bgId: string): string => {
        switch (bgId) {
          case 'orphan': return 'Phàm Giới (Khu Ổ Chuột)';
          case 'noble': return 'Trung Linh Vực (Vinh Hoa Thành)';
          case 'wanderer': return 'Nam Hoang Vực (Hoang Thôn hẻo lánh)';
          default: return 'Phàm Giới (Thanh Thạch Thành)';
        }
      };
      actualLocation = mapBackgroundToLocation(selectedBg.id);
    }

    const initialState = {
      name: playerName,
      gender: playerGender,
      difficulty: playerDifficulty,
      linhCan,
      element: mapLinhCanToElement(linhCan),
      spiritualRoot: {
        type: formatLinhCanType(linhCan),
        purity: purity
      },
      background: actualBackgroundName,
      talent,
      inventory: actualInventory,
      factionsReputation: actualFactions,
      history: [],
      npcs: [],
      tuVi: 0,
      realmLevel: 0,
      currentLocation: actualLocation,
      customApiKey: customApiKey
    };

    setIsGeneratingWorld(true);
    setWorldGenerationProgress(0);
    
    // Simulate some fancy progress words
    const progressInterval = setInterval(() => {
       setWorldGenerationProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 1;
       });
    }, 150);

    let mapData: any[] = [];
    let worldEquipments: any[] = [];
    let worldTechniques: any[] = [];
    let worldNPCs: any[] = [];
    let worldBeasts: any[] = [];
    
    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Safer, sequential generation to avoid hitting quota on one batch taking everything down
    const mandatoryTasks: { name: string; fn: any; batches: number; batchSize: number }[] = [
      { name: 'mapData', fn: generateWorldMap, batches: 1, batchSize: 0 },
    ];
    
    // Deferrable tasks handled on-demand during gameplay
    const allTasks = [...mandatoryTasks];

    try {
      for (const task of allTasks) {
        let combinedResults: any[] = [];
        for (let i = 0; i < task.batches; i++) {
          try {
            const result = task.name === 'mapData' 
              ? await task.fn(customApiKey, true) 
              : await task.fn(customApiKey, task.batchSize);
            
            if (Array.isArray(result)) {
              combinedResults = combinedResults.concat(result);
            } else if (result) {
              combinedResults.push(result);
            }
            
            // Add a delay between requests to be nice to the API
            await delay(2000);
          } catch (e) {
            console.error(`World generation batch ${i} for ${task.name} failed:`, e);
            // Continue if a batch fails, app can still partially initialize
          }
        }
        
        if (task.name === 'mapData') mapData = combinedResults;
        else if (task.name === 'equipments') worldEquipments = combinedResults;
        else if (task.name === 'techniques') worldTechniques = combinedResults;
        else if (task.name === 'NPCs') worldNPCs = combinedResults;
        else if (task.name === 'beasts') worldBeasts = combinedResults;
      }
      
      console.log(`Generated Map: ${mapData?.length}, Equips: ${worldEquipments?.length}, Techs: ${worldTechniques?.length}, NPCs: ${worldNPCs?.length}, Beasts: ${worldBeasts?.length}`);
      clearInterval(progressInterval);
      setWorldGenerationProgress(100);
      
      const finalInitialState = {
        ...initialState,
        mapData,
        worldEquipments,
        worldTechniques,
        worldNPCs,
        worldBeasts
      };
  
      initPlayer(finalInitialState);
      setIsGeneratingWorld(false);
      setIsLoading(true);
      
      const response = await generateNextStep({ ...state, ...finalInitialState }, "Bắt đầu cuộc hành trình", []);
      if (response.playerUpdates) {
        updateStats(response.playerUpdates);
      }
      setCurrentResponse(response);
      addHistory(response.story, undefined, response.npcs, response.chronicles, response.weather as any, response.mapData as any, response.newEquipment, response.newTechnique, response.newBeasts, response.timePassed);
    } catch (err) {
      console.error("World initialization failed:", err);
    } finally {
      setIsLoading(false);
      setIsGeneratingWorld(false);
      clearInterval(progressInterval);
    }
  };

  if (!state.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c0f] selection:bg-amber-500/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-4xl bg-[#0f1218] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[600px]"
        >
          {/* Left Panel: Character Creation */}
          <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-amber-500 text-2xl font-bold">☯</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-wider uppercase font-serif">Khởi Tạo Thiên Cơ</h1>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">Character Initialization Protocol</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="stat-label block mb-2 opacity-70">Thánh Danh (Name)</label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nhập tên tu sĩ..."
                  className="w-full bg-[#0d1014] border border-slate-800 p-4 rounded text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all font-serif italic text-xl placeholder:text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="stat-label block mb-2 opacity-70">Đạo Thể (Gender)</label>
                  <div className="flex bg-[#0d1014] p-1 rounded border border-slate-800">
                    <button 
                      onClick={() => setPlayerGender('Nam')}
                      className={cn(
                        "flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all hover:bg-amber-500/10",
                        playerGender === 'Nam' ? "bg-amber-500 text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Nam
                    </button>
                    <button 
                      onClick={() => setPlayerGender('Nữ')}
                      className={cn(
                        "flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all hover:bg-rose-500/10",
                        playerGender === 'Nữ' ? "bg-rose-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Nữ
                    </button>
                  </div>
                </div>
                <div>
                  <label className="stat-label block mb-2 opacity-70">Độ Khó (Difficulty)</label>
                  <select 
                    value={playerDifficulty}
                    onChange={(e) => setPlayerDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-[#0d1014] border border-slate-800 p-2.5 rounded text-xs font-bold uppercase tracking-widest text-slate-300 focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                  >
                    <option value="Dễ">Dễ (Hào quang)</option>
                    <option value="Thường">Thường (Tu sĩ)</option>
                    <option value="Khó">Khó (Phàm nhân)</option>
                    <option value="Hồng Hoang">Hồng Hoang (Tử địa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="stat-label block mb-2 opacity-70">Linh Căn (Spiritual Root)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'random'].map((type) => {
                    const isRandom = type === 'random';
                    const isSelected = selectedLinhCan === type;
                    const colors: Record<string, string> = {
                      'Kim': 'text-amber-200 border-amber-200/20 hover:border-amber-200/50',
                      'Mộc': 'text-emerald-400 border-emerald-400/20 hover:border-emerald-400/50',
                      'Thủy': 'text-blue-400 border-blue-400/20 hover:border-blue-400/50',
                      'Hỏa': 'text-rose-500 border-rose-500/20 hover:border-rose-500/50',
                      'Thổ': 'text-amber-700 border-amber-700/20 hover:border-amber-700/50',
                      'random': 'text-slate-400 border-slate-800 hover:border-slate-600'
                    };
                    const selectedColors: Record<string, string> = {
                      'Kim': 'bg-amber-200/10 border-amber-200/50 text-amber-200',
                      'Mộc': 'bg-emerald-400/10 border-emerald-400/50 text-emerald-400',
                      'Thủy': 'bg-blue-400/10 border-blue-400/50 text-blue-400',
                      'Hỏa': 'bg-rose-500/10 border-rose-500/50 text-rose-500',
                      'Thổ': 'bg-amber-700/10 border-amber-700/50 text-amber-700',
                      'random': 'bg-slate-700/20 border-white/30 text-white'
                    };

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedLinhCan(type)}
                        className={cn(
                          "py-2 rounded border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center hover:scale-105 active:scale-95",
                          isSelected ? selectedColors[type] : colors[type]
                        )}
                        title={isRandom ? "Ngẫu nhiên (có cơ hội ra linh căn hiếm)" : `${type} Linh Căn`}
                      >
                        {isRandom ? '???' : type}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-600 mt-2 italic font-serif">
                  * Phẩm chất (Độ thuần) sẽ được phân định ngẫu nhiên dựa trên thiên cơ.
                </p>
              </div>


              {state.name && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-amber-500/70 font-mono uppercase">Phát hiện thức hải</p>
                    <p className="text-sm font-serif text-amber-200">Ký ức: {state.name}</p>
                  </div>
                  <button 
                    onClick={() => {
                      initPlayer({});
                      setActiveTab('story');
                    }}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30 rounded transition-all"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}

              <div className="pt-4">
                <button 
                  onClick={async () => {
                    await handleStartGame();
                    setActiveTab('story');
                  }}
                  disabled={!playerName.trim() || isLoading}
                  className="w-full group relative overflow-hidden py-5 bg-amber-500 disabled:bg-slate-800 disabled:opacity-50 text-black font-black uppercase tracking-[0.3em] text-sm rounded shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isLoading ? (
                    <Sparkles className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={18} fill="currentColor" />
                      <span>{state.name ? "Chuyển sinh (Reset)" : "Khởi tạo thế giới"}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    console.log("Button clicked, triggering file input");
                    fileInputRef.current?.click();
                  }}
                  className="w-full mt-3 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  <span>Nhập Save File</span>
                </button>
                <p className="text-[9px] text-slate-600 text-center mt-3 font-mono">WARNING: INITIALIZING A NEW WORLD WILL DISSOLVE CURRENT REALITY</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Background Selection */}
          <div className="w-full md:w-[350px] bg-black/30 p-8 flex flex-col">
            <h2 className="stat-label mb-6 flex items-center justify-between">
              <span>Xuất Thân (Origin)</span>
              <span className="text-amber-500/50 text-[9px]">Select 1</span>
            </h2>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 scroll-container">
              <button
                onClick={() => setSelectedBg('random')}
                className={cn(
                  "w-full text-left p-4 rounded border transition-all relative overflow-hidden group mb-4 hover:scale-[1.02] active:scale-[0.98]",
                  selectedBg === 'random' 
                    ? "bg-emerald-500/10 border-emerald-500/50" 
                    : "bg-[#0d1014] border-slate-800 hover:border-slate-700"
                )}
              >
                {selectedBg === 'random' && (
                  <motion.div layoutId="bg-glow" className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                )}
                <div className="flex items-center justify-between mb-1">
                  <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors", 
                    selectedBg === 'random' ? "text-emerald-500" : "text-slate-500 group-hover:text-slate-300")}>
                    🎲 Ngẫu Nhiên
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">Thiên Đạo sẽ tự chọn một vị trí ngẫu nhiên cho bạn.</p>
              </button>

              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg)}
                  className={cn(
                    "w-full text-left p-4 rounded border transition-all relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]",
                    selectedBg !== 'random' && selectedBg.id === bg.id 
                      ? "bg-amber-500/10 border-amber-500/50" 
                      : "bg-[#0d1014] border-slate-800 hover:border-slate-700"
                  )}
                >
                  {selectedBg !== 'random' && selectedBg.id === bg.id && (
                    <motion.div layoutId="bg-glow" className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors", 
                      selectedBg !== 'random' && selectedBg.id === bg.id ? "text-amber-500" : "text-slate-500 group-hover:text-slate-300")}>
                      {bg.name}
                    </p>
                    {selectedBg !== 'random' && selectedBg.id === bg.id && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]"></div>}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2">{bg?.description}</p>
                </button>
              ))}
            </div>

            {selectedBg && selectedBg !== 'random' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1 opacity-10">
                  <ShieldAlert size={40} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-amber-500 uppercase font-black mb-1 flex items-center gap-2">
                    <Flame size={10} /> {selectedBg.passive}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-snug">
                    <span className="text-slate-400 font-bold">Khởi đầu:</span> {selectedBg.startingItems.join(', ')}
                  </p>
                </div>
              </motion.div>
            )}
            {selectedBg === 'random' && (
              <div className="mt-6 p-4 bg-emerald-900/10 border border-emerald-900/30 rounded">
                <p className="text-[10px] text-emerald-500 uppercase font-bold mb-1 italic">Hệ thống Thiên Đạo</p>
                <p className="text-[9px] text-slate-500">Mọi chỉ số và kỹ năng khởi đầu sẽ được phân định ngẫu nhiên dựa trên khí vận của bạn.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <MeditationOverlay isVisible={isMeditating} state={state} />
      
      {breakthroughResult && (
        <BreakthroughModal 
          message={breakthroughResult.message}
          onClose={() => setBreakthroughResult(null)}
        />
      )}

      <div className="h-screen flex flex-col bg-[#0a0c0f] text-slate-300 overflow-hidden">
      {/* Header */}
      <header className="h-14 md:h-16 border-b border-slate-800 bg-[#0f1218] flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center cursor-pointer shrink-0" onClick={() => setActiveTab('story')}>
            <span className="text-amber-500 text-xl font-bold">☯</span>
          </div>
          <div className="hidden sm:block overflow-hidden">
            <h1 className="text-xs md:text-sm font-bold text-slate-100 tracking-wider uppercase truncate">Thiên Đạo Diễn Hóa</h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] truncate">{state.name.toUpperCase()} | Realm: {state.realmLevel}</p>
          </div>
        </div>

        <NavBar activeTab={activeTab} onChange={setActiveTab} />

        <div className="hidden lg:flex">
          <TimelineHeader timeline={state.timeline} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Left: Character Info */}
        <aside className="hidden lg:flex w-64 border-r border-slate-800 bg-[#0d1014] p-5 flex-col gap-8 overflow-y-auto scroll-container shrink-0">
          <section>
            <h2 className="stat-label mb-4 tracking-widest">Hồ Sơ Tu Sĩ</h2>
            <div className="space-y-4">
              <div className="bg-[#0f1218] p-3 rounded border border-slate-800">
                <p className="text-[9px] text-slate-500 font-mono mb-1">DANH TỰ / ĐẠO THỂ</p>
                <p className="text-base font-serif text-amber-200">{state.name} ({state.gender})</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] text-blue-400 font-mono font-bold uppercase">
                     {formatLinhCanType(state.linhCan)}
                   </div>
                   <div className="text-[9px] text-slate-500 font-mono italic">Element</div>
                </div>
              </div>
              <div className="bg-[#0f1218] p-3 rounded border border-slate-800">
                <p className="text-[9px] text-slate-500 font-mono mb-1">VỊ TRÍ</p>
                <p className="text-xs text-amber-500/80 font-mono">{state.currentLocation.toUpperCase()}</p>
              </div>
              <div className="bg-[#0f1218] p-3 rounded border border-slate-800">
                <p className="text-[9px] text-slate-500 font-mono mb-1 uppercase">Cảnh giới / Tu Vi</p>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-base font-serif text-amber-500 leading-tight">{state.realm}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-slate-400">Tiến độ tu hành</span>
                    <span className="text-amber-500">{Math.floor((state.tuVi / state.tuViCapacity) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(state.tuVi / state.tuViCapacity) * 100}%` }}
                      className="h-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="stat-label mb-4 tracking-widest">Tư Chất Thể Bản</h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div 
                className="bg-[#0f1218] p-2 rounded border border-slate-800 text-center hover:border-slate-600 cursor-help transition-colors"
                title="Thể Chất: Tăng lượng cực lớn Sinh lực, Thủ và Sát thương chí mạng. Đồng thời tăng nhẹ Tốc độ."
              >
                <p className="text-[7px] text-slate-500 uppercase">Thể</p>
                <p className="text-xs font-bold text-slate-200">{state.body}</p>
              </div>
              <div 
                className="bg-[#0f1218] p-2 rounded border border-slate-800 text-center hover:border-slate-600 cursor-help transition-colors"
                title="Thần Thức: Tăng lượng lớn Linh lực, Chính xác, Chí mạng. Đồng thời tăng mạnh Tốc độ và Công."
              >
                <p className="text-[7px] text-slate-500 uppercase">Thần</p>
                <p className="text-xs font-bold text-slate-200">{state.spirit}</p>
              </div>
              <div 
                className="bg-[#0f1218] p-2 rounded border border-slate-800 text-center hover:border-slate-600 cursor-help transition-colors"
                title="Căn Cơ: Ổn định Sinh lực, Linh lực, Thủ cũng như Chính xác, Chí mạng. Tăng mạnh Tỷ lệ đột phá."
              >
                <p className="text-[7px] text-slate-500 uppercase">Căn</p>
                <p className="text-xs font-bold text-slate-200">{state.foundation}</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-[11px]">
              <li className="flex justify-between">
                <span className="text-slate-500">Linh Căn:</span> 
                <span className="text-blue-400 font-medium text-right">
                  {state.linhCan ? (
                    <>
                      {formatLinhCanType(state.linhCan)} 
                      <span className="text-[9px] opacity-60 ml-1">
                        ({formatLinhCanPurity(state.linhCan, state.spiritualRoot?.purity)})
                      </span>
                    </>
                  ) : "Chưa định"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Độ thuần:</span> 
                <span className="text-blue-400/70 font-medium">{state.spiritualRoot?.purity}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Danh vọng:</span> 
                <span className="text-emerald-400 font-medium">{(state.reputation || 0).toLocaleString()}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Nhân quả:</span> 
                <span className={cn("font-medium", state.karma >= 0 ? "text-emerald-400" : "text-rose-400")}>{state.karma}</span>
              </li>
              <li className="flex justify-between pt-2 border-t border-slate-800/50">
                <span className="text-slate-500">Xuất Thân:</span> 
                <span className="text-slate-300 font-medium truncate max-w-[110px]" title={state.background}>{state.background}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Thiên Phú:</span> 
                <span className="text-emerald-400 font-medium truncate ml-2 max-w-[110px]" title={state.talent}>{state.talent}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Độ Khó:</span> 
                <span className={cn("font-medium", 
                  state.difficulty === 'Dễ' ? "text-emerald-400" :
                  state.difficulty === 'Thường' ? "text-blue-400" :
                  state.difficulty === 'Khó' ? "text-amber-400" : "text-rose-500 font-bold"
                )}>{state.difficulty}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="stat-label mb-4 tracking-widest">Tuyệt Học & Phụ Trợ</h2>
            <div className="space-y-2">
              {state.skills?.length > 0 ? state.skills.map((s, idx) => (
                <div key={idx} className="group relative">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 p-1.5 border border-slate-800/50 rounded bg-black/20">
                    <Sparkles size={10} className="text-emerald-500" />
                    <span>{s.name}</span>
                  </div>
                  <div className="absolute left-full ml-2 top-0 w-48 p-2 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    <p className="line-clamp-4" title={s?.description}>{s?.description}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-600 italic">Chưa lĩnh ngộ kỹ năng nào...</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="stat-label mb-4 tracking-widest">Tài Sản Quy Mô</h2>
            <div className="space-y-2">
              {state.assets?.length > 0 ? state.assets.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-amber-500/80 p-1.5 border border-amber-900/20 rounded bg-amber-900/5">
                  <Crown size={10} />
                  <span>{a.name}</span>
                </div>
              )) : (
                <p className="text-[10px] text-slate-600 italic">Sản nghiệp trống không...</p>
              )}
            </div>
          </section>

          <section className="mt-auto">
            <h2 className="stat-label mb-4 tracking-widest">Phe Phái</h2>
            <div className="space-y-3">
              {Object.entries(state.factionsReputation || {}).length > 0 ? (
                Object.entries(state.factionsReputation || {}).map(([faction, rep]) => (
                  <div key={faction} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">{faction}</span>
                    <span className={cn("font-bold px-2 py-0.5 rounded", 
                      rep > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>
                      {rep > 0 ? `+${rep}` : rep}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-600 italic">Chưa kết giao phe phái nào...</p>
              )}
            </div>
          </section>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-[#080a0d] overflow-hidden relative">
          <WeatherEffect type={state.weather} />
          <AnimatePresence mode="wait">
            {activeTab === 'story' && (
              <motion.div 
                key="story"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="h-auto md:h-10 border-b border-slate-800/50 flex flex-col md:flex-row items-start md:items-center px-4 md:px-6 py-2 md:py-0 gap-2 md:gap-4 shrink-0 bg-[#0d1014]/50 justify-between">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[8px] md:text-[9px] rounded text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <MapIcon size={10} /> {state.currentLocation || state.realm}
                    </span>
                    {state.isNsfwEnabled && (
                      <span className="px-2 py-0.5 bg-rose-900/10 text-[8px] md:text-[9px] rounded text-rose-500 border border-rose-900/30 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={10} /> Unbound
                      </span>
                    )}
                    {currentResponse?.successChance !== undefined && (
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] md:text-[9px] rounded border font-mono uppercase tracking-wider flex items-center gap-1.5",
                        currentResponse.successChance > 70 ? "bg-emerald-900/10 text-emerald-500 border-emerald-900/30" :
                        currentResponse.successChance > 40 ? "bg-amber-900/10 text-amber-500 border-amber-900/30" :
                        "bg-rose-900/10 text-rose-500 border-rose-900/30"
                      )}>
                        <Sparkles size={10} /> {currentResponse.successChance}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end">
                    <button 
                      onClick={fetchSuggestions}
                      disabled={isFetchingSuggestions}
                      className={cn(
                        "text-[8px] md:text-[9px] font-mono uppercase tracking-widest transition-all flex items-center gap-1.5",
                        isFetchingSuggestions ? "text-amber-500/50 animate-pulse" : "text-amber-500 hover:text-amber-400"
                      )}
                    >
                      <Sparkles size={10} className={cn(isFetchingSuggestions && "animate-spin")} />
                      {isFetchingSuggestions ? "Cảm ứng..." : "Thiên Cơ"}
                    </button>
                    <button 
                      onClick={resetGame}
                      className="text-[8px] md:text-[9px] text-slate-600 hover:text-rose-500 font-mono uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 p-4 md:p-12 overflow-y-auto scroll-container">
                  <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
                    {state.history.map((item, idx) => (
                      <div key={idx} className="space-y-6">
                        {item.actionTaken && !item.actionTaken.startsWith('[SYSTEM LOG') && !item.actionTaken.startsWith('[System') && (
                          <div className="flex justify-end">
                            <div className="bg-slate-900 border border-slate-800 px-3 md:px-4 py-1 md:py-1.5 rounded text-amber-500/80 text-[9px] md:text-[10px] font-mono uppercase tracking-widest max-w-[80%] text-right overflow-hidden text-ellipsis">
                              {item.actionTaken}
                            </div>
                          </div>
                        )}
                        <div className="story-text space-y-4 md:space-y-6">
                           {item.metadata && (
                             <div className="flex flex-wrap gap-2 mb-4">
                               {item.metadata.learnedTechnique && (
                                 <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                   <Sparkles size={10} className="text-purple-400" />
                                   <span className="text-[8px] md:text-[9px] text-purple-400 font-bold uppercase tracking-widest whitespace-nowrap">Ngộ Đạo: {item.metadata.learnedTechnique}</span>
                                 </div>
                               )}
                               {item.metadata.foundEquipment && (
                                 <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                   <Trophy size={10} className="text-amber-400" />
                                   <span className="text-[8px] md:text-[9px] text-amber-400 font-bold uppercase tracking-widest whitespace-nowrap">Kỳ Ngộ: {item.metadata.foundEquipment}</span>
                                 </div>
                               )}
                               {item.metadata.realmUpgrade && (
                                 <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                   <TrendingUp size={10} className="text-emerald-400" />
                                   <span className="text-[8px] md:text-[9px] text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap">Đột Phá: {item.metadata.realmUpgrade}</span>
                                 </div>
                               )}
                             </div>
                           )}
                           {(() => {
                             const formattedStory = item.story
                               .replace(/^(\*?\*?\[.*?\]\*?\*?:\s*.*?)$/gm, '\n\n$1\n\n')
                               .replace(/\n{3,}/g, '\n\n')
                               .trim();
                             
                             return formattedStory.split('\n\n').map((paragraph, pIdx) => {
                               const trimmedPara = paragraph.trim();
                               const dialogueMatch = trimmedPara.match(/^\[(.*?)\]:\s*(.*)$/si) || trimmedPara.match(/^\*\*\[(.*?)\]\*\*:\s*(.*)$/si);
                               
                               if (dialogueMatch) {
                                  const [_, tag, content] = dialogueMatch;
                                  let cleanedTag = tag
                                    .replace(/^(npc_\w+|mc_player)\s*[-:]?\s*/i, '')
                                    .replace(/\*/g, '')
                                    .trim();
                                  
                                  if (cleanedTag.includes('-')) {
                                    const parts = cleanedTag.split('-').map(s => s.trim());
                                    cleanedTag = parts[parts.length - 1] || cleanedTag;
                                  }

                                  // Remove duplicate halves
                                  const words = cleanedTag.split(/\s+/);
                                  if (words.length > 0 && words.length % 2 === 0) {
                                      const halfLen = words.length / 2;
                                      const firstHalf = words.slice(0, halfLen).join(' ');
                                      const secondHalf = words.slice(halfLen).join(' ');
                                      if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
                                          cleanedTag = firstHalf;
                                      }
                                  }

                                  const isSystem = cleanedTag.toUpperCase() === "HỆ THỐNG" || cleanedTag.toUpperCase() === "THÔNG BÁO";
                                  const isMC = cleanedTag.includes("mc_player") || cleanedTag.includes("Bạn") || cleanedTag.match(/^Ta$|^Mình$/i);
                                  
                                  let displayContent = content.trim();
                                  
                                  const contentPrefixMatch = displayContent.match(/^(\*?\*?[^*:\n]+\*?\*?)\s*:\s*(.*)/s);
                                  if (contentPrefixMatch) {
                                    const prefixName = contentPrefixMatch[1].replace(/\*/g, '').trim();
                                    if (
                                        prefixName.toLowerCase().includes(cleanedTag.toLowerCase()) || 
                                        cleanedTag.toLowerCase().includes(prefixName.toLowerCase()) || 
                                        prefixName.split(/\s+/).length <= 5
                                    ) {
                                      displayContent = contentPrefixMatch[2].trim();
                                    }
                                  }

                                  return (
                                    <div key={pIdx} className={cn(
                                      "p-3 md:p-4 rounded border-l-2 bg-slate-900/30",
                                      isSystem ? "border-blue-500/50" : 
                                      isMC ? "border-emerald-500/50" : "border-amber-500/50"
                                    )}>
                                      <span className={cn(
                                        "text-[9px] md:text-[10px] font-mono uppercase font-bold block mb-1",
                                        isSystem ? "text-blue-400" : isMC ? "text-emerald-400" : "text-amber-500"
                                      )}>
                                        {cleanedTag}
                                      </span>
                                      <div className="text-slate-300 leading-relaxed text-xs md:text-sm lg:text-base whitespace-pre-wrap italic">
                                        {displayContent}
                                      </div>
                                    </div>
                                  );
                               }
                               return (
                                 <div key={pIdx} className="leading-relaxed text-slate-300 whitespace-pre-wrap text-[14px] md:text-[17px]">
                                   <ReactMarkdown>{paragraph}</ReactMarkdown>
                                 </div>
                               );
                             });
                           })()}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-amber-500/60 font-mono text-[10px] md:text-xs uppercase tracking-widest animate-pulse italic pb-8">
                        <Sparkles size={14} />
                        <span>Đang diễn hóa...</span>
                      </div>
                    )}

                    {/* Plot Suggestions Overlay */}
                    <AnimatePresence>
                      {suggestions.length > 0 && isActionsVisible && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="p-4 md:p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl md:rounded-2xl space-y-4 md:space-y-6 mt-8 relative group"
                        >
                          <button 
                            onClick={() => setSuggestions([])}
                            className="absolute top-4 right-4 p-1 hover:bg-amber-500/20 rounded-full transition-colors"
                          >
                            <RotateCcw size={14} className="text-amber-500/50" />
                          </button>

                          <div className="flex items-center gap-3">
                            <Brain className="text-amber-500" size={18} />
                            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">Cảm Ứng Thiên Cơ</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {suggestions.map((plot, i) => (
                              <div key={i} className="p-3 md:p-4 bg-black/40 border border-amber-500/10 rounded-xl space-y-2 md:space-y-3 hover:border-amber-500/30 transition-all">
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "px-1.5 md:px-2 py-0.5 rounded-[4px] text-[7px] md:text-[8px] font-black uppercase tracking-widest",
                                    plot.type === 'Main' ? "bg-amber-500 text-black" :
                                    plot.type === 'Side' ? "bg-blue-500 text-white" :
                                    plot.type === 'Secret' ? "bg-purple-500 text-white" : "bg-emerald-500 text-white"
                                  )}>
                                    {plot.type}
                                  </span>
                                  <span className="text-[8px] md:text-[9px] text-slate-500 font-mono">#{i + 1}</span>
                                </div>
                                <h4 className="text-[11px] md:text-sm font-bold text-slate-200">{plot.title}</h4>
                                <p className="text-[10px] md:text-[11px] text-slate-400 leading-relaxed italic line-clamp-3">{plot.description}</p>
                                <button 
                                  onClick={() => {
                                    handleAction(`[Thiên Cơ Dẫn Lối]: Ta quyết định theo đuổi manh mối: ${plot.title}. ${plot.description}`);
                                    setSuggestions([]);
                                  }}
                                  className="w-full py-1.5 md:py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] border border-amber-500/20 rounded transition-all mt-1 md:mt-2"
                                >
                                  Dấn Thân
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className={cn(
                  "border-t border-slate-800 bg-[#0d1014] shrink-0 transition-all duration-500 relative",
                  isActionsVisible ? "min-h-[12rem] md:min-h-[14rem] p-4 md:p-6" : "min-h-0 h-10 p-0"
                )}>
                  {/* Visibility Toggle Button */}
                  <button 
                    onClick={() => setIsActionsVisible(!isActionsVisible)}
                    className={cn(
                      "absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:border-amber-500/50 hover:text-amber-500 z-50 flex items-center gap-2",
                      isActionsVisible ? "text-slate-500" : "text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    )}
                  >
                    {isActionsVisible ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                    {isActionsVisible ? "Thu Gọn Hành Động" : "Mở Rộng Hành Động"}
                    {!isActionsVisible && suggestions.length > 0 && (
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </button>

                  <div className={cn(
                    "max-w-3xl mx-auto w-full space-y-4 transition-all duration-500",
                    isActionsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none hidden"
                  )}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      <AnimatePresence mode="wait">
                        {!isLoading && currentResponse?.actions.map((action, i) => (
                          <motion.button
                            key={action.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleAction(action.text)}
                            className="flex items-center gap-2 md:gap-4 p-2.5 md:p-3 rounded bg-[#0f1218] border border-slate-800 hover:border-amber-500/50 group transition-all text-left"
                          >
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center font-mono text-[10px] md:text-xs group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-500 transition-colors shrink-0">
                              {action.id}
                            </span>
                            <span className="text-[11px] md:text-[13px] leading-snug text-slate-300 group-hover:text-slate-100 transition-colors line-clamp-2">{action.text}</span>
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Custom Action Input */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Hoặc tự điền hành động..."
                          className="flex-1 bg-black/40 border border-slate-800 rounded px-4 py-2.5 md:py-3 text-[13px] text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isLoading && e.currentTarget.value.trim()) {
                              handleAction(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input.value.trim() && !isLoading) {
                              handleAction(input.value);
                              input.value = '';
                            }
                          }}
                          disabled={isLoading}
                          className="px-6 py-2.5 md:py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-black text-xs font-bold rounded transition-colors uppercase tracking-wider whitespace-nowrap"
                        >
                          {isLoading ? "Chờ..." : "Gửi"}
                        </button>
                      </div>
                  </div>
                </div>

                {/* Removed Minimap */}
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex-1 p-4 md:p-8 overflow-y-auto scroll-container bg-[#080a0d]"
              >
                <div className="max-w-6xl mx-auto space-y-10">
                  <header className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-mono tracking-widest mb-2">
                      <Compass size={12} className="animate-spin-slow" />
                      Thiên Địa Đồ Chí
                    </div>
                    <h2 className="text-4xl font-bold font-serif text-slate-100 italic tracking-tight">Cửu Châu Lục Địa</h2>
                    <p className="text-slate-500 text-sm font-serif max-w-lg mx-auto italic">
                      Dữ liệu địa lý được trích xuất từ Thiên Đạo, phản ánh quy luật của vạn vật.
                    </p>
                  </header>

                  <MemoizedWorldMapComponent mapData={state.mapData || []} currentLocation={state.currentLocation} />

                  <footer className="pt-10 border-t border-slate-800/50">
                    <div className="bg-slate-900/20 p-6 rounded-2xl border border-slate-800/50 flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Info size={24} className="text-amber-500" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-sm font-bold text-slate-200 mb-1">Mật thư từ Thiên Cơ Các</h4>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          "Bản đồ này phản ánh nhận thức của ngươi về thế giới. Khi ngươi mạnh hơn hoặc đi xa hơn, Thiên Cơ sẽ tự động diễn hóa tên gọi và bí mật của từng lục địa."
                        </p>
                      </div>
                    </div>
                  </footer>
                </div>
              </motion.div>
            )}

            {activeTab === 'cultivation' && (
              <motion.div 
                key="cultivation"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-6 md:p-12 overflow-y-auto h-full scroll-container bg-[#080a0d]"
              >
                <CultivationUI 
                  state={state}
                  onMeditate={handleMeditate}
                  onBreakthrough={handleBreakthrough}
                  onToggleTechnique={toggleTechnique}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-6 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-3xl mx-auto space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <h2 className="title-font text-3xl text-slate-100 font-bold italic">Thức Hải Minh Ký</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Player Consciousness Archive</p>
                    </div>
                  </div>

                  <SubTabs 
                    tabs={[
                      { id: 'stats', label: 'Căn Bản', icon: <Activity size={14} /> },
                      { id: 'combat', label: 'Chiến Lực', icon: <Sword size={14} /> },
                      { id: 'origin', label: 'Cội Nguồn', icon: <History size={14} /> },
                      { id: 'hidden', label: 'Ẩn Quy Luật', icon: <LockIcon size={14} /> }
                    ]}
                    activeTab={profileSubTab}
                    onChange={setProfileSubTab}
                  />

                  <AnimatePresence mode="wait">
                    {profileSubTab === 'stats' && (
                      <motion.div 
                        key="stats"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <StatDisplay label="Danh tự" value={state.name} icon={<User size={14} />} subValue={state.gender} />
                          <StatDisplay label="Vị trí" value={state.currentLocation} icon={<MapIcon size={14} />} colorClass="text-amber-500" />
                          <StatDisplay label="Cảnh giới" value={state.realm} icon={<TrendingUp size={14} />} colorClass="text-amber-400" />
                          <StatDisplay label="Độ khó" value={state.difficulty} icon={<ShieldAlert size={14} />} colorClass={cn(
                            state.difficulty === 'Dễ' ? "text-emerald-400" :
                            state.difficulty === 'Thường' ? "text-blue-400" :
                            state.difficulty === 'Khó' ? "text-amber-400" : "text-rose-500"
                          )} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1">
                            <ProgressBar label="Khí huyết" current={state.health} max={state.maxHealth} color="bg-rose-500" />
                          </div>
                          <div className="md:col-span-1">
                            <ProgressBar label="Linh lực" current={state.mana} max={state.maxMana} color="bg-blue-500" />
                          </div>
                          <div className="md:col-span-1">
                            <ProgressBar label="Tấn công" current={state.attack} max={state.powerScore} color="bg-amber-500" />
                          </div>
                          <div className="md:col-span-1">
                            <ProgressBar label="Phòng thủ" current={state.defense} max={state.powerScore} color="bg-indigo-500" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileSubTab === 'origin' && (
                      <motion.div 
                        key="origin"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        <GameAccordion title="Thư tịch xuất thân" subtitle={state.background} icon={<BookOpen size={16} />} defaultOpen>
                          <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            Ngươi mang theo ký ức về {state.background}, một quá khứ định hình nên con đường tu luyện của ngươi hôm nay.
                          </p>
                        </GameAccordion>

                        <GameAccordion title="Thiên Đạo Hiện Trạng" subtitle="Trạng thái thực tại" icon={<History size={16} />}>
                          <div className="p-4 bg-black/40 border border-slate-800/50 rounded-sm overflow-hidden">
                            <div className="markdown-body-system text-xs text-slate-300 leading-relaxed font-serif">
                              {state.chronicles ? (
                                <ReactMarkdown>
                                  {state.chronicles}
                                </ReactMarkdown>
                              ) : (
                                <p className="italic text-slate-600">Thiên cơ mờ mịt, chưa có bản tóm lược...</p>
                              )}
                            </div>
                          </div>
                        </GameAccordion>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <StatDisplay 
                             label="Linh căn" 
                             value={formatLinhCanType(state.linhCan)} 
                             subValue={formatLinhCanPurity(state.linhCan, state.spiritualRoot?.purity)} 
                             icon={<Layers size={14} />} 
                           />
                           <StatDisplay label="Nhân quả" value={state.karma} icon={<History size={14} />} colorClass={state.karma >= 0 ? "text-emerald-400" : "text-rose-400"} />
                           <StatDisplay label="Danh vọng" value={(state.reputation || 0).toLocaleString()} icon={<Award size={14} />} colorClass="text-emerald-400" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'npcs' && (
              <motion.div 
                key="npcs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <h2 className="title-font text-3xl text-slate-100 font-bold italic">Danh Sách Nhân Vật</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Knowledge of the World</p>
                    </div>
                    <SubTabs 
                      tabs={[
                        { id: 'nearby', label: 'Lân Cận', icon: <Compass size={14} /> },
                        { id: 'world', label: 'Đã Gặp', icon: <Globe size={14} /> },
                        { id: 'beasts', label: 'Yêu Thú', icon: <PawPrint size={14} /> }
                      ]}
                      activeTab={npcSubTab}
                      onChange={setNpcSubTab}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {npcSubTab === 'nearby' ? (
                      <>
                        {state.npcs?.map((npc, i) => (
                          <MemoizedNPCCard 
                            key={npc.id || i} 
                            npc={npc} 
                            ExpandableSection={ExpandableSection} 
                            onInteract={handleNPCCardInteract}
                            onDuel={handleNPCCardDuel}
                          />
                        ))}
                        {(state.npcs?.length || 0) === 0 && (
                          <div className="col-span-2 py-20 text-center text-slate-700 italic">
                            Không có nhân vật nào ở gần đây.
                          </div>
                        )}
                      </>
                    ) : npcSubTab === 'beasts' ? (
                      <>
                        {beastService.getBeastsLocal().map((beast, i) => (
                          <BeastCard 
                            key={beast.id || i}
                            beast={beast}
                            ExpandableSection={ExpandableSection}
                            onDuel={(b) => {
                              const enemy: any = {
                                id: b.id,
                                name: b.name,
                                isBeast: true,
                                element: b.element,
                                realmLevel: b.level,
                                stats: {
                                  health: b.stats.hp,
                                  maxHealth: b.stats.maxHp,
                                  attack: b.stats.atk,
                                  defense: b.stats.def,
                                  speed: b.stats.spd,
                                  mana: b.stats.mana,
                                  maxMana: b.stats.maxMana,
                                  accuracy: 80
                                },
                                combatSkills: []
                              };
                              startCombat([enemy]);
                              setActiveTab('combat');
                            }}
                          />
                        ))}
                        {beastService.getBeastsLocal().length === 0 && (
                          <div className="col-span-2 py-20 text-center text-slate-700 italic">
                            Chưa có thông tin về yêu thú nào được ghi chép lại.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {npcService.getNPCsLocal().map((storedNpc, i) => {
                          // Convert StoredNPC to NPC interface for the card
                          const npc: any = {
                            id: storedNpc.id,
                            name: storedNpc.name,
                            temporaryName: storedNpc.name,
                            isNameRevealed: true,
                            gender: storedNpc.gender,
                            realm: storedNpc.realm.name,
                            powerLevel: storedNpc.realm.name,
                            status: storedNpc.isAlive ? 'alive' : 'dead',
                            relationship: storedNpc.relation,
                            personalityTraits: storedNpc.personality,
                            personality: 'Đã lưu trữ',
                            innerSelf: 'Thông tin trong tàng kinh các.',
                            background: 'Đã gặp gỡ trong hành trình.',
                            faction: 'Tự do',
                            alignment: 'Trung Lập',
                            inventory: storedNpc.inventory,
                            health: storedNpc.stats.hp,
                            maxHealth: storedNpc.stats.maxHp,
                            attack: storedNpc.stats.atk,
                            defense: storedNpc.stats.def,
                            speed: storedNpc.stats.spd,
                            age: 0,
                            style: '',
                            virginity: 'Unknown',
                            currentOutfit: storedNpc.costume,
                            libido: 0,
                            willpower: 0,
                            lust: 0,
                            fetish: '',
                            sexualPreferences: [],
                            sexualArchetype: '',
                            physicalLust: '',
                            soulAmbition: '',
                            shortTermGoal: '',
                            longTermDream: '',
                            mood: 'Bình thường',
                            impression: 'Người quen',
                            currentOpinion: 'Bình thường',
                            witnessedEvents: [],
                            knowledgeBase: [],
                            conditions: [],
                            network: [],
                            type: 'Người quen',
                            skills: [],
                            voice: '',
                            aura: '',
                            physiologicalResponse: '',
                            readinessState: '',
                            signaturePose: '',
                            sensitivePoints: '',
                            secrets: ''
                          };
                          return (
                            <MemoizedNPCCard 
                              key={npc.id || i} 
                              npc={npc} 
                              ExpandableSection={ExpandableSection} 
                              onInteract={handleNPCCardInteract}
                              onDuel={handleNPCCardDuel}
                            />
                          );
                        })}
                        {npcService.getNPCsLocal().length === 0 && (
                          <div className="col-span-2 py-20 text-center text-slate-700 italic">
                            Ngươi chưa gặp gỡ ai trong cuộc hành trình này.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'beauties' && (
              <motion.div 
                key="beauties"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <BeautyGallery 
                  npcs={state.npcs}
                  ExpandableSection={ExpandableSection}
                  onInteract={(npc) => {
                    handleAction(`Ta muốn tìm gặp ${(npc.isNameRevealed ? npc.name : npc.temporaryName)} để trò chuyện.`);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-5xl mx-auto space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <h2 className="title-font text-3xl text-slate-100 font-bold italic">Hành Trang & Tài Bảo</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Treasury & Divine Assets</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                      <SubTabs 
                        tabs={[
                          { id: 'items', label: 'Vật Phẩm', icon: <Package size={14} /> },
                          { id: 'equipment', label: 'Linh Bảo', icon: <Sparkles size={14} /> },
                          { id: 'resources', label: 'Tài Nguyên', icon: <Database size={14} /> }
                        ]}
                        activeTab={inventorySubTab}
                        onChange={setInventorySubTab}
                      />

                      <AnimatePresence mode="wait">
                        {inventorySubTab === 'items' && (
                          <motion.div 
                            key="items"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3"
                          >
                            {(state.inventory || []).map((item, i) => item ? (
                              <div key={i} className="aspect-square bg-[#0f1218] border border-slate-800 rounded flex flex-col items-center justify-center p-2 group hover:border-amber-500/50 transition-all cursor-pointer relative" onClick={() => setSelectedItem(item)}>
                                <span className="text-2xl mb-1">{item.name?.includes('Đan') ? '🧪' : item.name?.includes('Phù') ? '📜' : '🛡️'}</span>
                                <span className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-tighter leading-tight line-clamp-2 break-all">{item.name ? (item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name) : 'Vật phẩm'}</span>
                                <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 text-[9px] text-slate-200 text-center transition-opacity rounded z-20 overflow-y-auto scroll-container" title={item?.description || 'Không có mô tả'}>
                                  <div className="line-clamp-4">
                                    {item?.description || 'Không có mô tả'}
                                  </div>
                                </div>
                              </div>
                            ) : null)}
                            {[...Array(Math.max(0, 16 - (state.inventory?.length || 0)))].map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square bg-[#0d1014] border border-slate-900 border-dashed rounded opacity-20" />
                            ))}
                          </motion.div>
                        )}

                        {inventorySubTab === 'equipment' && (
                          <motion.div 
                            key="equipment"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {state.equipment?.length > 0 ? (
                              getEnrichedEquipment(state.equipment)
                                .sort((a, b) => b.metrics.tierRank - a.metrics.tierRank)
                                .map((item, i) => {
                                  const isEquipped = Object.values(state.equippedItems || {}).some(e => e?.name === item.name);
                                  return (
                                    <div key={i} className={cn(
                                      "p-4 rounded-xl border transition-all group relative overflow-hidden",
                                      isEquipped ? "bg-amber-500/5 border-amber-500/30" : cn("bg-[#0d1014] hover:border-slate-700", item.metrics.rarityBorder),
                                      !isEquipped && item.metrics.rarityBg
                                    )}>
                                      {/* Rarity Glow Effect */}
                                      <div className={cn("absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-20 pointer-events-none rounded-full", item.metrics.rarityGlow)} />
                                      
                                      <div className="flex justify-between items-start mb-3 gap-2 relative z-10">
                                        <div className="min-w-0 flex-1">
                                          <h4 
                                            title={`Tấn Công: ${item.stats?.attack || 0}\nPhòng Thủ: ${item.stats?.defense || 0}\nMáu: ${item.stats?.health || 0}\nLinh Lực: ${item.stats?.mana || 0}`}
                                            className={cn("text-xs font-bold uppercase truncate", isEquipped ? "text-amber-400" : (item.metrics.rarityColor || "text-slate-100"))}>{item.name}</h4>
                                          <div className="flex gap-2 items-center mt-1">
                                            <span className={cn("text-[8px] font-black uppercase bg-black/60 px-2 py-0.5 rounded border-b-2", item.metrics.rarityColor, item.metrics.rarityBorder, item.metrics.rarityBg)}>
                                              {item.rarity || 'Phàm'}
                                            </span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase">{item.tier}</span>
                                            <span className="text-[8px] text-cyan-600 font-bold uppercase">{item.type}</span>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            if (isEquipped) {
                                              const type = item.type?.toLowerCase() || '';
                                              let slot: 'weapon' | 'armor' | 'accessory' = 'accessory';
                                              if (type.includes('kiếm') || type.includes('đao') || type.includes('vũ khí')) slot = 'weapon';
                                              else if (type.includes('giáp') || type.includes('y phục')) slot = 'armor';
                                              unequipItem(slot);
                                            } else {
                                              equipItem(item);
                                            }
                                          }}
                                          className={cn(
                                            "px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm",
                                            isEquipped ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                          )}
                                        >
                                          {isEquipped ? "Tháo" : "Mặc"}
                                        </button>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 relative z-10">
                                        {item.stats?.attack && <span className="text-[10px] font-mono text-rose-400/80 flex items-center gap-1"><Sword size={10} /> +{item.stats.attack}</span>}
                                        {item.stats?.defense && <span className="text-[10px] font-mono text-indigo-400/80 flex items-center gap-1"><Shield size={10} /> +{item.stats.defense}</span>}
                                        {item.stats?.health && <span className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1"><Heart size={10} /> +{item.stats.health}</span>}
                                        {item.stats?.mana && <span className="text-[10px] font-mono text-blue-400/80 flex items-center gap-1"><Zap size={10} /> +{item.stats.mana}</span>}
                                      </div>
                                      
                                      <div className="p-2 bg-black/40 rounded text-[10px] text-slate-500 italic border border-white/5 line-clamp-1 relative z-10">
                                        {item.main_effect}
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <div className="col-span-full py-20 text-center bg-black/20 rounded-2xl border border-dashed border-slate-800 text-slate-600 italic">
                                Ngươi chưa tìm thấy linh bảo nào...
                              </div>
                            )}
                          </motion.div>
                        )}

                        {inventorySubTab === 'resources' && (
                          <motion.div 
                            key="resources"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                          >
                             {Object.entries(state.resources || {}).length > 0 ? (
                                Object.entries(state.resources || {}).map(([res, amount]) => (
                                  <div key={res} className="flex justify-between items-center bg-[#0d1014] p-4 border border-slate-800 rounded-xl group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-500/5 rounded-lg border border-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Database size={16} />
                                      </div>
                                      <span className="text-xs text-slate-200 font-bold uppercase tracking-wider">{res}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-mono text-amber-500 font-bold">{(amount || 0).toLocaleString()}</span>
                                      <p className="text-[8px] text-slate-600 uppercase font-mono">Tài nguyên</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full py-20 text-center text-slate-600 italic">Không có tài nguyên...</div>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <aside className="space-y-6">
                      <div className="bg-[#0f1218] p-6 border border-slate-800 rounded-2xl shadow-xl">
                        <h3 className="stat-label mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                          <User size={14} className="text-amber-500" />
                          Trang Phục Hiện Tại
                        </h3>
                        <div className="space-y-4">
                          {[
                            { label: 'Vũ khí', slot: 'weapon' as const, icon: <Sword size={16} /> },
                            { label: 'Pháp y', slot: 'armor' as const, icon: <Shield size={16} /> },
                            { label: 'Phụ trợ', slot: 'accessory' as const, icon: <Sparkles size={16} /> }
                          ].map((s) => (
                            <div key={s.slot} className="relative group">
                              <div className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border transition-all",
                                (state.equippedItems as any)[s.slot] ? "bg-amber-500/5 border-amber-500/20" : "bg-black/20 border-slate-800/50 opacity-50"
                              )}>
                                <div className="w-12 h-12 rounded-xl bg-black border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors">
                                  {(state.equippedItems as any)[s.slot] ? <span className="text-2xl">✨</span> : s.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-[0.2em] mb-0.5 block">{s.label}</span>
                                  <span className={cn("text-[11px] font-bold block truncate", (state.equippedItems as any)[s.slot] ? "text-amber-400" : "text-slate-600 italic")}>
                                    {(state.equippedItems as any)[s.slot] ? (state.equippedItems as any)[s.slot].name : "Trống"}
                                  </span>
                                </div>
                                {(state.equippedItems as any)[s.slot] && (
                                  <button 
                                    onClick={() => unequipItem(s.slot)}
                                    className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                                    title="Tháo xuống"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                           <div className="flex items-center gap-2 mb-3">
                              <Info size={14} className="text-amber-500" />
                              <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Ghi chú</h4>
                           </div>
                           <p className="text-[11px] text-slate-500 leading-relaxed italic font-serif">
                              "Mọi vật phẩm đều mang theo linh tính. Việc trang bị đúng linh bảo có thể gia tăng lực chiến đáng kể cho tu sĩ."
                           </p>
                        </div>
                      </aside>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'skills' && (
              <motion.div 
                key="skills"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-5xl mx-auto space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <h2 className="title-font text-3xl text-slate-100 font-bold italic">Công Pháp & Tuyệt Chiêu</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Divine Manuals & Combat Arts</p>
                    </div>
                  </div>

                  <SubTabs 
                    tabs={[
                      { id: 'techniques', label: 'Tâm Pháp (Manuals)', icon: <BookOpen size={14} /> },
                      { id: 'combat', label: 'Chiêu Thức (Skills)', icon: <Zap size={14} /> }
                    ]}
                    activeTab={skillsSubTab}
                    onChange={setSkillsSubTab}
                  />

                  <AnimatePresence mode="wait">
                    {skillsSubTab === 'techniques' && (
                      <motion.div 
                        key="techniques"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        {state.masteredTechniques?.length > 0 ? (
                          state.masteredTechniques.map((tech, i) => (
                            <div key={i} className="group relative w-full rounded-2xl bg-gradient-to-b from-[#12151b] to-[#0a0d11] p-[1px] shadow-lg transition-all duration-500 hover:shadow-amber-500/10 hover:from-amber-900/20 hover:to-[#0a0d11]">
                              <div className="relative h-full w-full rounded-[15px] bg-[#0d1014] p-5 flex flex-col gap-5 overflow-hidden">
                                {/* Background emblem */}
                                <div className="absolute -right-8 -top-8 text-slate-800/10 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-amber-500/5">
                                  <BookOpen strokeWidth={1} size={160} />
                                </div>
                                
                                {/* Header */}
                                <div className="relative z-10 flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <h4 className="font-serif text-lg md:text-xl font-bold text-slate-200 group-hover:text-amber-400 transition-colors drop-shadow-md">
                                      {tech.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {tech.tier && (() => {
                                        const tierText = String(tech.tier);
                                        const displayTier = ['Đạo', 'Thiên', 'Địa', 'Huyền', 'Linh', 'Phàm'].find(t => tierText.includes(t)) || tierText.split(' ')[0] || '?';
                                        return (
                                          <span className={cn(
                                            "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border max-w-[100px] truncate",
                                            displayTier === 'Thiên' || displayTier === 'Đạo' ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                                            displayTier === 'Địa' ? "border-purple-500/30 text-purple-400 bg-purple-500/10" :
                                            "border-slate-500/30 text-slate-400 bg-slate-500/10"
                                          )} title={tierText}>
                                            {displayTier} GIAI
                                          </span>
                                        );
                                      })()}
                                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-blue-400/80 transition-colors">
                                        {tech.path} {tech.circulation?.type ? `· ${tech.circulation.type}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Content - Compact layout with hover expansion */}
                                <div className="relative z-10 flex-1 rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col justify-center gap-3">
                                  {tech.core?.origin && (
                                    <div className="flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-2">
                                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/70">
                                        Nguồn Gốc
                                      </span>
                                      <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-serif italic line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                                        {tech.core.origin}
                                      </p>
                                    </div>
                                  )}

                                  {(tech.core?.characteristics || tech.core?.description || !tech.core?.origin) && (
                                     <div className="flex flex-col gap-1 border-l-2 border-amber-500/30 pl-2">
                                       <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/70">
                                         Đặc Điểm / Khẩu Quyết
                                       </span>
                                       <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-serif line-clamp-2 md:line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                         {tech.core?.characteristics || tech.core?.description || 'Bí tịch huyền ảo, ngôn từ khó tả...'}
                                       </p>
                                     </div>
                                  )}
                                </div>

                                {/* Footer Stats */}
                                <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto pt-2">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                      Độ Thông Thạo
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1 flex-1 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                                          style={{ width: `${Math.min(100, Math.max(0, tech.mastery?.refinement || 0))}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono text-amber-500">
                                        {tech.mastery?.refinement || 0}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1.5 items-end">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                      Hiệu Suất Linh Nguyên
                                    </span>
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                      <TrendingUp size={12} className="opacity-80" />
                                      <span className="text-xs font-mono font-bold">
                                        {tech.circulation?.efficiency || 0}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-32 text-center bg-black/20 rounded-3xl border border-dashed border-slate-800/50">
                             <BookOpen size={40} className="mx-auto mb-4 text-slate-800" />
                             <p className="text-slate-600 italic font-serif">Ngươi chưa tham ngộ bất kỳ tâm pháp nào...</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {skillsSubTab === 'combat' && (
                      <motion.div 
                        key="combat"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                         {state.combatSkills?.length > 0 ? (
                          state.combatSkills.map((skill, i) => (
                            <div key={i} className="bg-[#0a0d11] border border-slate-800 rounded-2xl p-6 group hover:border-blue-500/30 transition-all flex flex-col gap-5">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                  <Zap size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight group-hover:text-blue-400 transition-colors truncate">{skill.name}</h4>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[8px] font-black text-slate-600 bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-widest">{skill.targetType}</span>
                                      {skill.originTechnique && (
                                        <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest truncate max-w-[100px]">
                                          {skill.originTechnique}
                                        </span>
                                      )}
                                   </div>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-500 leading-relaxed font-serif italic line-clamp-2" title={skill?.description}>
                                {skill?.description}
                              </p>

                              <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest">Sát thương / Tỉ lệ</span>
                                    <p className="text-[10px] font-mono text-rose-400 font-bold">{skill.baseDamage} ({skill.scaling}%)</p>
                                 </div>
                                 <div className="space-y-1">
                                    <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest">Tiêu hao / Chờ</span>
                                    <p className="text-[10px] font-mono text-blue-400 font-bold">{skill.cost}MP / {skill.cooldown}s</p>
                                 </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-32 text-center bg-black/20 rounded-3xl border border-dashed border-slate-800/50">
                             <Zap size={40} className="mx-auto mb-4 text-slate-800" />
                             <p className="text-slate-600 italic font-serif">Chưa lĩnh hội tuyệt kỹ chiến đấu...</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'craft' && (
              <motion.div 
                key="craft"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="flex items-end justify-between border-b border-slate-800 pb-4">
                    <h2 className="title-font text-3xl text-slate-100 font-bold italic">Luyện Đan & Chế Pháp</h2>
                    <p className="text-xs text-slate-500 font-mono">RECIPES KNOWN: {state.knownRecipes?.length || 0}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {RECIPES.map((recipe) => {
                      const materials = recipe.materials || {};
                      const canCraft = Object.entries(materials).every(([res, amount]) => ((state.resources || {})[res] || 0) >= amount);
                      return (
                        <div key={recipe.id} className={cn("bg-[#0d1014] border p-6 rounded flex flex-col", canCraft ? "border-amber-500/30" : "border-slate-800 opacity-60")}>
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{recipe.name}</h4>
                            <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">LV.1</span>
                          </div>
                          <p className="text-[11px] text-slate-500 italic mb-6 leading-relaxed">{recipe?.description}</p>
                          <div className="space-y-2 mb-8 flex-1">
                            {Object.entries(materials).map(([res, amount]) => (
                              <div key={res} className="flex justify-between text-[10px] font-mono">
                                <span className={cn( ((state.resources || {})[res] || 0) >= amount ? "text-slate-400" : "text-rose-500" )}>{res}:</span>
                                <span>{(state.resources || {})[res] || 0} / {amount}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleCraft(recipe)}
                            disabled={!canCraft}
                            className={cn(
                              "w-full py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                              canCraft 
                                ? "bg-amber-500 text-black hover:bg-amber-400" 
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            )}
                          >
                            Bắt đầu luyện
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 md:p-12 overflow-y-auto h-full scroll-container"
              >
                <div className="max-w-xl mx-auto space-y-10">
                  <div className="border-b border-slate-800 pb-4">
                    <h2 className="title-font text-3xl text-slate-100 font-bold italic">Thiết Lập Thiên Đạo</h2>
                  </div>

                  <section className="space-y-6">
                    <h3 className="stat-label">Thiên Đạo Hiện Trạng (System State)</h3>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Trạng thái thực tại</p>
                      <div className="bg-black/40 p-4 border border-slate-800/50 rounded-sm overflow-hidden">
                        <div className="markdown-body-system text-xs text-slate-300 leading-relaxed font-serif">
                          {state.chronicles ? (
                            <ReactMarkdown>
                              {state.chronicles}
                            </ReactMarkdown>
                          ) : (
                            <p className="italic text-slate-600">Thiên cơ mờ mịt, chưa có bản tóm lược...</p>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-600 font-mono italic">
                        * Bảng trạng thái này giúp Thiên Đạo (AI) duy trì tính nhất quán cực cao của thực tại. Nó được cập nhật tự động sau mỗi hành động quan trọng.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                      
                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-amber-950/30 rounded-lg border border-amber-900/30">
                             <RotateCcw size={14} className="text-amber-500" />
                           </div>
                           <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Hệ Thống Arc Cốt Truyện</h4>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="animate-pulse w-1.5 h-1.5 rounded-full bg-amber-500" />
                           <span className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-tighter">
                             {state.currentArcName || 'Khởi Đầu'}
                           </span>
                         </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed font-serif pl-1 border-l-2 border-amber-900/30 py-1 italic relative z-10">
                        "Khi một chặng đường khép lại, Thiên Đạo sẽ nén lại vạn nghìn ký ức, chỉ giữ lại chân lý thực tại để khai mở chương mới." 
                        <br/>
                        <span className="text-[10px] text-slate-500 font-sans not-italic mt-1 block">
                          Reset Arc giúp giảm nhiễu bộ nhớ AI, tập trung vào <strong>Trạng Thái Thực Tại</strong>.
                        </span>
                      </p>

                      <div className="flex gap-2 relative z-10">
                         <div className="relative flex-1">
                           <input 
                             id="next-arc-input"
                             type="text" 
                             placeholder="Nhập tên chương tiếp theo..."
                             className="w-full bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-serif italic"
                           />
                         </div>
                         <button 
                           onClick={() => {
                             const input = document.getElementById('next-arc-input') as HTMLInputElement;
                             const name = input.value.trim();
                             if (name) {
                               if (window.confirm(`Xác nhận kết thúc Arc "${state.currentArcName || 'Khởi Đầu'}" và bắt đầu Arc "${name}"? Thiên Đạo sẽ nén lại ký ức cũ.`)) {
                                 startNewArc(name);
                                 input.value = '';
                               }
                             }
                           }}
                           className="px-5 py-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-amber-950/20 transition-all active:scale-95"
                         >
                           Khai Chương
                         </button>
                      </div>

                      {state.archivedArcs && state.archivedArcs.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5 relative z-10">
                           <div className="flex items-center gap-2 mb-1">
                             <History size={10} className="text-slate-600" />
                             <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Hồi ức đã lưu ({state.archivedArcs.length})</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {state.archivedArcs.map((arc, i) => (
                               <div key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-500 hover:text-amber-500/70 hover:border-amber-900/30 transition-colors cursor-default font-serif italic">
                                 {arc.arcName}
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="stat-label">Hệ thống tàng trữ (Persistence)</h3>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded flex flex-col gap-4">
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        Thiên đạo tự động ghi nhớ mọi hành động của bạn qua từng nhịp thở. Ký ức được lưu trữ bền vững trong thức hải (browser cache).
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={exportGame}
                          className="py-3 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold uppercase tracking-widest hover:border-amber-500/50 transition-all flex items-center justify-center gap-2"
                        >
                          <Save size={12} /> Xuất file Save
                        </button>
                        <button 
                          onClick={() => {
                            console.log("Second button clicked, triggering file input");
                            fileInputRef.current?.click();
                          }}
                          className="py-3 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold uppercase tracking-widest hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={12} /> Nhập file Save
                        </button>
                      </div>

                      <button 
                        onClick={resetGame}
                        className="w-full py-3 border border-rose-900/50 bg-rose-900/10 text-rose-500 hover:bg-rose-900/20 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldAlert size={14} /> Tái Sinh (Xóa sạch truyện & Khởi tạo luân hồi mới)
                      </button>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-slate-800">
                    <h3 className="stat-label">Hệ thống Diễn Hóa (Gemini API)</h3>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded flex flex-col gap-4">
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        Bạn có thể sử dụng API Key Gemini cá nhân để tăng tốc độ phản hồi và mở rộng giới hạn diễn hóa. Nếu để trống, hệ thống sẽ sử dụng chìa khóa Thiên Đạo mặc định.
                      </p>
                      <input 
                        type="password" 
                        value={customApiKey}
                        onChange={(e) => {
                          setCustomApiKey(e.target.value);
                          updateCustomApiKey(e.target.value);
                        }}
                        placeholder="Nhập Gemini API Key của bạn..."
                        className="w-full bg-[#0d1014] border border-slate-800 p-3 rounded text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors font-mono text-sm"
                      />
                      {customApiKey && (
                        <p className="text-[9px] text-emerald-500/80 font-mono italic">✓ Đã áp dụng chìa khóa cá nhân.</p>
                      )}
                    </div>
                  </section>


                  <section className="space-y-6 pt-10 border-t border-slate-800">
                    <h3 className="stat-label">Tùy biến Diễn Hóa</h3>
                    <div className="flex items-center justify-between p-4 bg-[#0d1014] border border-slate-800 rounded">
                      <div>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Flame size={14} className={state.isNsfwEnabled ? "text-rose-500" : "text-slate-500"} /> 
                          Thế giới không xiềng xích
                        </p>
                        <p className="text-[10px] text-slate-500 italic">Cho phép AI diễn hóa các tình tiết lãng mạn và trưởng thành hơn.</p>
                      </div>
                      <button 
                        onClick={toggleNsfw}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          state.isNsfwEnabled ? "bg-rose-500" : "bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                          state.isNsfwEnabled ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="space-y-4 p-4 bg-[#0d1014] border border-slate-800 rounded">
                      <div>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <BookOpen size={14} className="text-amber-500" />
                          Độ dài văn bản
                        </p>
                        <p className="text-[10px] text-slate-500 italic">Điều chỉnh độ chi tiết của cốt truyện được tạo ra bởi AI.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Ngắn', 'Bình thường', 'Dài'] as const).map((len) => (
                          <button
                            key={len}
                            onClick={() => updateStoryLength(len)}
                            className={cn(
                              "py-2 px-3 rounded text-[10px] font-bold uppercase tracking-widest border transition-all",
                              state.storyLength === len 
                                ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600"
                            )}
                          >
                            {len}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded text-[11px] text-amber-600 italic text-center">
                    Cảnh báo: Việc thay đổi các thiết lập này có thể làm thay đổi hoàn toàn quỹ đạo của thiên đạo diễn hóa.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              importGame(e.target.files[0]);
              e.target.value = ''; // Reset input
            }
          }}
        />
        {/* Right Sidebar: Health & Resources Mini */}
        <aside className="hidden xl:flex w-64 border-l border-slate-800 bg-[#0d1014] p-5 flex-col gap-8 shrink-0 overflow-y-auto scroll-container">
          <section>
            <h2 className="stat-label mb-4 tracking-widest">Trình trạng Entity</h2>
            <div className="space-y-4">
              <ProgressBar label="Khí huyết" current={state.health} max={state.maxHealth} color="bg-rose-500" />
              <ProgressBar label="Linh lực" current={state.mana} max={state.maxMana} color="bg-blue-500" />
              <ProgressBar label="Công kích" current={state.attack} max={state.powerScore} color="bg-amber-500" />
              <ProgressBar label="Phòng thủ" current={state.defense} max={state.powerScore} color="bg-indigo-500" />
            </div>
          </section>

          <section>
            <h2 className="stat-label mb-4 tracking-widest">Túi Tài Nguyên</h2>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(state.resources || {}).slice(0, 8).map((res, i) => (
                <div key={i} className="aspect-square bg-[#0f1218] border border-slate-800 rounded-sm flex items-center justify-center transition-colors hover:border-slate-700 relative group overflow-hidden">
                  <div className="w-1 h-full bg-blue-500 absolute left-0" />
                  <span className="text-[9px] font-mono font-bold text-amber-500">{(state.resources || {})[res]}</span>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-80 flex items-center justify-center p-1 text-[7px] text-white text-center leading-tight">
                    {res}
                  </div>
                </div>
              ))}
              {[...Array(Math.max(0, 8 - Object.keys(state.resources || {}).length))].map((_, i) => (
                <div key={`empty-res-${i}`} className="aspect-square bg-[#0f1218] border border-slate-900 rounded-sm" />
              ))}
            </div>
          </section>

          <section>
            <h2 className="stat-label mb-4 tracking-widest">Bản Đồ Cửu Châu</h2>
            <button 
              onClick={() => setActiveTab('map')}
              className="w-full p-3 border border-slate-800 rounded bg-[#0f1218] text-center space-y-2 group hover:border-amber-500/30 transition-all text-left"
            >
              <div className="text-amber-500/70 group-hover:text-amber-500 font-mono text-[9px] uppercase tracking-tighter transition-colors">
                [VỊ TRÍ: {state.currentLocation.toUpperCase()}]
              </div>
              <div className="w-full h-24 bg-slate-900 border border-slate-800 rounded overflow-hidden relative grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-80">
                <img src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=400" alt="Map" className="object-cover h-full w-full opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapIcon size={24} className="text-slate-700 animate-pulse group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
              <div className="text-center">
                <span className="text-[8px] text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Nhấp để xem chi toàn cảnh</span>
              </div>
            </button>
          </section>

          <section className="mt-auto border-t border-slate-800/50 pt-5">
            <h2 className="stat-label mb-2 tracking-widest font-mono">Heavenly Logs</h2>
            <div className="text-[9px] font-mono text-slate-600 space-y-1">
              <div>[ENTITY: {state.name.slice(0, 3).toUpperCase()}-992]</div>
              <div>[KARMA: {state.karma}]</div>
              <div>[NSFW: {state.isNsfwEnabled ? 'ACTIVE' : 'LOCKED'}]</div>
              <div className="text-emerald-900/50 animate-pulse text-[8px] uppercase mt-2">Connecting to heavenly network...</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#0f1218] border border-slate-700 rounded-xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-100">{selectedItem.name}</h3>
            <p className="text-slate-400 text-sm">{selectedItem.description}</p>
            {selectedItem.type === 'CONSUMABLE' && (
              <button 
                onClick={() => { consumeItem(selectedItem.id); setSelectedItem(null); }}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase rounded text-sm transition-colors"
              >
                Sử dụng
              </button>
            )}
            <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase rounded text-sm transition-colors"
                >
                Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}


function ProgressBar({ label, current, max, color, hideValue }: { label: string, current: number, max: number, color: string, hideValue?: boolean }) {
  const displayMax = Math.max(current, max);
  const percentage = displayMax > 0 ? Math.max(0, Math.min(100, (current / displayMax) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
        <span className="text-slate-500">{label}</span>
        {!hideValue && <span className="text-slate-300">{Math.floor(current)}/{Math.floor(displayMax)}</span>}
      </div>
      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full transition-all duration-500", color)}
        />
      </div>
    </div>
  );
}

