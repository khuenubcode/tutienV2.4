import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  User, 
  Package, 
  Zap, 
  Users, 
  Heart, 
  Map as MapIcon, 
  FlaskConical, 
  Settings,
  Sword,
  LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'story' | 'profile' | 'inventory' | 'skills' | 'npcs' | 'beauties' | 'map' | 'craft' | 'settings' | 'cultivation' | 'combat';

interface NavItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
  hiddenOnDesktop?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'story', label: 'Hành Trình', icon: BookOpen },
  { id: 'cultivation', label: 'Tu Luyện', icon: Zap },
  { id: 'profile', label: 'Trạng Thái', icon: User, hiddenOnDesktop: true },
  { id: 'inventory', label: 'Hành Trang', icon: Package },
  { id: 'skills', label: 'Công Pháp', icon: Zap },
  { id: 'npcs', label: 'Nhân Vật', icon: Users },
  { id: 'beauties', label: 'Giai Nhân', icon: Heart },
  { id: 'map', label: 'Bản Đồ', icon: MapIcon },
  { id: 'craft', label: 'Luyện Đan', icon: FlaskConical },
  { id: 'settings', label: 'Cài Đặt', icon: Settings },
  { id: 'combat', label: 'Giao Chiến', icon: Sword, hiddenOnDesktop: false }, // Will only show when active
];

interface NavBarProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, onChange, className }) => {
  return (
    <nav className={cn(
      "flex items-center justify-start md:justify-center gap-1 p-1 bg-[#0f1218]/90 backdrop-blur-xl border border-white/5 rounded-xl md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar",
      className
    )}>
      {NAV_ITEMS.filter(item => item.id !== 'combat' || activeTab === 'combat').map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <motion.button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => onChange(item.id)}
            whileHover={{ scale: 1.05, backgroundColor: isActive ? '#eab308' : '#1f2937' }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex items-center justify-center gap-2 h-10 px-3 transition-all duration-300 rounded-xl overflow-hidden whitespace-nowrap",
              isActive 
                ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
                : "bg-gray-800 text-gray-400 hover:text-gray-200",
              item.hiddenOnDesktop && "lg:hidden"
            )}
            animate={{
              width: isActive ? 'auto' : 40,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Icon size={18} className={cn("shrink-0", isActive ? "text-black" : "text-gray-400")} />
            
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="text-[11px] font-black uppercase tracking-widest"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </nav>
  );
};

export default NavBar;
