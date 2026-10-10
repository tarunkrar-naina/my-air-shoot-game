import React from 'react';
import { ScreenType } from '../../types';
import { useGameStore } from '../../store';
import { Play, Lock, Settings, HelpCircle, LogOut, Coins, Volume2, VolumeX, Crosshair, Music, Gift } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function MainMenu({ onNavigate }: Props) {
  const { coins, maxUnlockedLevel, soundEnabled, toggleSound, musicEnabled, toggleMusic, logout, selectedGun, spinsAvailable } = useGameStore();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 font-sans">
        <div className="flex items-center gap-2 bg-[#3a2a1c]/80 border-2 border-[#5c4a3d] px-4 py-2 rounded-full shadow-lg">
          <Coins className="w-6 h-6 text-yellow-400" />
          <span className="font-black text-xl text-yellow-400">{coins}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-red-900/80 border-2 border-red-700 p-2 rounded-full text-red-200 hover:bg-red-800 transition-colors shadow-lg"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 gap-5">
        <h1 className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-b from-[#a3e635] to-[#4d7c0f] tracking-wider uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center leading-tight">
          Air<br/>Shoot
        </h1>

        {/* Menu Buttons - Wooden Board Style */}
        <button 
          onClick={() => onNavigate('game')}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-2 group-active:translate-y-0 transition-transform"></div>
          <div className="relative w-full py-3.5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#8b5a2b] border-4 border-[#5c3a21] rounded-xl text-2xl font-black text-amber-50 flex items-center justify-center gap-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] group-active:translate-y-2 transition-transform">
            <Play className="fill-amber-50" /> NEW GAME
          </div>
        </button>

        <button 
          onClick={() => onNavigate('levels')}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-2 group-active:translate-y-0 transition-transform"></div>
          <div className="relative w-full py-3.5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#8b5a2b] border-4 border-[#5c3a21] rounded-xl text-2xl font-black text-amber-50 flex justify-between items-center px-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] group-active:translate-y-2 transition-transform">
            <span className="flex items-center gap-2"><Lock className="w-6 h-6 text-amber-200/50" /> LEVELS</span>
            <span className="text-amber-200 text-lg bg-[#5c3a21] px-3 py-1 rounded-md">{maxUnlockedLevel}/200</span>
          </div>
        </button>

        {/* Gun selection button */}
        <button 
          onClick={() => onNavigate('guns')}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-stone-900 rounded-xl translate-y-2 group-active:translate-y-0 transition-transform"></div>
          <div className="relative w-full py-3.5 bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-700 border-4 border-amber-900 rounded-xl text-xl font-black text-yellow-100 flex items-center justify-center gap-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-active:translate-y-2 transition-transform">
            <Crosshair className="w-6 h-6 text-yellow-300 animate-spin-slow" /> WEAPONS RACK
          </div>
        </button>

        {/* Lucky Spin Button with Notification Badge */}
        <button 
          onClick={() => {
            try {
              if (soundEnabled) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
                audio.volume = 0.3;
                audio.play().catch(() => {});
              }
            } catch (e) {}
            onNavigate('spin');
          }}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-[#3f6212] rounded-xl translate-y-2 group-active:translate-y-0 transition-transform"></div>
          <div className="relative w-full py-3.5 bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 border-4 border-green-900 rounded-xl text-xl font-black text-white flex items-center justify-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-active:translate-y-2 transition-transform">
            <Gift className="w-6 h-6 text-yellow-300 animate-bounce" /> LUCKY SPIN WHEEL
            {spinsAvailable > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-bounce border-2 border-amber-100 shadow-md">
                {spinsAvailable} FREE SPIN{spinsAvailable > 1 ? 'S' : ''}!
              </span>
            )}
          </div>
        </button>

        <div className="flex w-full gap-2.5 mt-2">
          {/* SFX sound toggle */}
          <button 
            onClick={toggleSound}
            title="Toggle SFX Sound Effects"
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-1 group-active:translate-y-0 transition-transform"></div>
            <div className="relative w-full py-2.5 bg-[#6c4824] border-4 border-[#412914] rounded-xl text-lg font-bold text-amber-100 flex flex-col items-center justify-center gap-1 group-active:translate-y-1 transition-transform">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              <span className="text-[9px] uppercase font-black tracking-wider leading-none">SFX</span>
            </div>
          </button>

          {/* Music beats toggle */}
          <button 
            onClick={toggleMusic}
            title="Toggle Menu Music Beat"
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-1 group-active:translate-y-0 transition-transform"></div>
            <div className="relative w-full py-2.5 bg-[#6c4824] border-4 border-[#412914] rounded-xl text-lg font-bold text-amber-100 flex flex-col items-center justify-center gap-1 group-active:translate-y-1 transition-transform">
              {musicEnabled ? <Music className="w-5 h-5 text-green-400 animate-pulse" /> : <Music className="w-5 h-5 text-red-400/60" />}
              <span className="text-[9px] uppercase font-black tracking-wider leading-none font-sans">Music</span>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('settings')}
            title="Game Settings"
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-1 group-active:translate-y-0 transition-transform"></div>
            <div className="relative w-full py-2.5 bg-[#6c4824] border-4 border-[#412914] rounded-xl text-lg font-bold text-amber-100 flex flex-col items-center justify-center gap-1 group-active:translate-y-1 transition-transform">
              <Settings className="w-5 h-5 text-amber-200" />
              <span className="text-[9px] uppercase font-black tracking-wider leading-none">Setup</span>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('help')}
            title="How to Play"
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-[#2a1a10] rounded-xl translate-y-1 group-active:translate-y-0 transition-transform"></div>
            <div className="relative w-full py-2.5 bg-[#6c4824] border-4 border-[#412914] rounded-xl text-lg font-bold text-amber-100 flex flex-col items-center justify-center gap-1 group-active:translate-y-1 transition-transform">
              <HelpCircle className="w-5 h-5 text-amber-200" />
              <span className="text-[9px] uppercase font-black tracking-wider leading-none">Help</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
