import React from 'react';
import { ScreenType } from '../../types';
import { ArrowLeft, Crosshair, Coins, ArrowUpCircle } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function HelpScreen({ onNavigate }: Props) {
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
          HOW TO PLAY
        </h1>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide text-amber-50">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="bg-[#3a2a1c] p-6 rounded-2xl border-4 border-[#5c3a21]">
            <h2 className="text-2xl font-black mb-4 text-[#a3e635] flex items-center gap-2">
              <Crosshair className="w-6 h-6" /> Objective & Hand Gestures
            </h2>
            <p className="text-lg leading-relaxed text-amber-100/90">
              Use your device's camera to find birds flying around you in Augmented Reality. 
              Move your hand in front of the camera to aim the crosshair. To fire, simply **pinch your thumb and index finger together (👌 Thumb Press)** or tap on the screen! This triggers the **Tactical AK-47 Assault Rifle to shoot in Automatic Burst Mode**! Each bird has a health bar. Hit them to reduce their health, and when it drops to zero, the bird will fall and you earn coins!
            </p>
          </div>

          <div className="bg-[#3a2a1c] p-6 rounded-2xl border-4 border-[#5c3a21]">
            <h2 className="text-2xl font-black mb-4 text-yellow-400 flex items-center gap-2">
              <ArrowUpCircle className="w-6 h-6" /> Progression
            </h2>
            <ul className="space-y-3 text-lg text-amber-100/90 list-disc pl-5">
              <li>Level 1 starts with 10-15 birds.</li>
              <li>Complete a level by hunting all required birds.</li>
              <li>Higher levels spawn more birds and increase difficulty.</li>
              <li>Use earned <Coins className="inline w-5 h-5 text-yellow-400"/> to unlock locked levels early!</li>
            </ul>
          </div>

          <div className="bg-[#3a2a1c] p-6 rounded-2xl border-4 border-[#5c3a21]">
            <h2 className="text-2xl font-black mb-4 text-red-400 flex items-center gap-2">
              Troubleshooting
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-amber-100">Camera not working?</h3>
                <p className="text-amber-100/70">Ensure you have granted camera permissions to your browser. Refresh the page and accept the permission prompt.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg text-amber-100">Running slow?</h3>
                <p className="text-amber-100/70">Make sure you are in a well-lit area. Close other browser tabs to free up memory.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg text-amber-100">Lost progress?</h3>
                <p className="text-amber-100/70">Your progress is saved on your device. Ensure you aren't using private/incognito mode.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
