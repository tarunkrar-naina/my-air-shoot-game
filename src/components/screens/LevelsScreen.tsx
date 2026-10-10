import React from 'react';
import { ScreenType } from '../../types';
import { useGameStore } from '../../store';
import { ArrowLeft, Lock, Star, Coins } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function LevelsScreen({ onNavigate }: Props) {
  const { maxUnlockedLevel, coins, buyLevel } = useGameStore();
  const totalLevels = 200;
  
  // Calculate cost to buy next level (e.g. 50 coins * level number)
  const getLevelCost = (level: number) => level * 50;

  const handleLevelClick = (level: number) => {
    if (level <= maxUnlockedLevel) {
      useGameStore.setState({ currentLevel: level });
      onNavigate('game');
    } else if (level === maxUnlockedLevel + 1) {
      const cost = getLevelCost(level);
      if (confirm(`Buy level ${level} for ${cost} coins?`)) {
        if (!buyLevel(level, cost)) {
          alert("Not enough coins!");
        }
      }
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
      
      {/* Header */}
      <div className="relative z-10 p-4 flex justify-between items-center bg-[#2a1a10]/80 border-b-4 border-[#5c3a21] shadow-xl">
        <button 
          onClick={() => onNavigate('home')}
          className="p-3 bg-[#5c3a21] rounded-xl text-amber-100 hover:bg-[#6c4824] transition-colors border-2 border-[#8b5a2b]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#a3e635] to-[#4d7c0f] tracking-widest uppercase">
          LEVELS
        </h1>
        <div className="flex items-center gap-2 bg-[#3a2a1c] border-2 border-[#5c4a3d] px-4 py-2 rounded-full shadow-inner">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-yellow-400">{coins}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-20 max-w-5xl mx-auto">
          {Array.from({ length: totalLevels }).map((_, idx) => {
            const level = idx + 1;
            const isUnlocked = level <= maxUnlockedLevel;
            const isNextToUnlock = level === maxUnlockedLevel + 1;
            const cost = getLevelCost(level);

            return (
              <button
                key={level}
                onClick={() => handleLevelClick(level)}
                className={`relative aspect-square rounded-xl border-4 flex flex-col items-center justify-center transition-transform active:scale-95 ${
                  isUnlocked 
                    ? "bg-[#6c4824] border-[#8b5a2b] shadow-[0_4px_0_#412914]" 
                    : isNextToUnlock 
                      ? "bg-[#3a2a1c] border-yellow-600 shadow-[0_4px_0_#2a1a10] animate-pulse"
                      : "bg-[#2a1a10] border-[#1a1005] opacity-80"
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-2xl font-black text-amber-100">{level}</span>
                    <div className="flex gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </>
                ) : isNextToUnlock ? (
                  <>
                    <Lock className="w-6 h-6 text-yellow-600 mb-1" />
                    <div className="text-xs font-bold text-yellow-500 flex items-center justify-center bg-black/40 px-2 py-1 rounded-full"><Coins className="w-3 h-3 mr-1 inline"/> {cost}</div>
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6 text-[#5c3a21]" />
                    <span className="text-sm font-bold text-[#5c3a21] mt-1">{level}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
