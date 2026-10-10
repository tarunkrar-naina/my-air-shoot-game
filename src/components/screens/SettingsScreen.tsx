import React from 'react';
import { ScreenType } from '../../types';
import { useGameStore } from '../../store';
import { ArrowLeft, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function SettingsScreen({ onNavigate }: Props) {
  const { 
    controlSensitivity, 
    setControlSensitivity, 
    soundEnabled, 
    toggleSound 
  } = useGameStore();

  return (
    <div className="absolute inset-0 flex flex-col bg-[#2e3b32]">
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Header */}
      <div className="relative z-10 p-4 flex items-center bg-[#2a1a10]/90 border-b-4 border-[#5c3a21] shadow-xl">
        <button 
          onClick={() => onNavigate('home')}
          className="p-3 bg-[#5c3a21] rounded-xl text-amber-100 hover:bg-[#6c4824] transition-colors border-2 border-[#8b5a2b] mr-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#a3e635] to-[#4d7c0f] tracking-widest uppercase">
          OPTIONS
        </h1>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col items-center justify-center pt-6">
        <div className="w-full max-w-md bg-[#3a2a1c] p-6 rounded-3xl border-4 border-[#5c3a21] shadow-2xl space-y-8">
          
          {/* Sensitivity */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <SlidersHorizontal className="w-6 h-6 text-[#a3e635]" />
              <h2 className="text-xl font-black text-amber-100">Sensitivity</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-amber-100/60 font-bold px-2 text-xs uppercase tracking-wider">
                <span>Low</span>
                <span>High</span>
              </div>
              
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={controlSensitivity}
                onChange={(e) => setControlSensitivity(Number(e.target.value))}
                className="w-full h-4 bg-[#1a1005] rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
              />
              
              <div className="text-center text-[#a3e635] font-black text-2xl">
                {controlSensitivity}%
              </div>
              <p className="text-center text-amber-100/50 text-xs mt-1">
                Adjust how fast the crosshair follows your touch or laser target movements.
              </p>
            </div>
          </div>

          <div className="border-t border-[#5c3a21]/50 my-2"></div>

          {/* Audio Adjustments */}
          <div>
            <h2 className="text-xl font-black text-amber-100 mb-4 flex items-center gap-2">
              🔊 Audio Settings
            </h2>
            
            <div className="space-y-3.5">
              {/* SFX Toggle */}
              <div className="flex items-center justify-between bg-[#2a1a10]/50 p-3.5 rounded-2xl border-2 border-[#412914]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-950/50 text-green-400' : 'bg-red-950/50 text-red-400'}`}>
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-100 text-sm">Sound Effects (SFX)</h3>
                    <p className="text-xs text-amber-100/50">Gunshots, bird hits, and coin audio</p>
                  </div>
                </div>
                <button
                  onClick={toggleSound}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${soundEnabled ? 'bg-[#a3e635]' : 'bg-stone-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
