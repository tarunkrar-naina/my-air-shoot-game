import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';
import { ScreenType } from '../../types';
import { ArrowLeft, Coins, Gift, Sparkles, Check, Lock, HelpCircle, Trophy } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

const PRIZES = [
  { id: 'coins_100', label: '100 Coins', type: 'coins', value: 100, color: '#7c2d12', icon: '💰' },
  { id: 'deserteagle', label: 'Desert Eagle', type: 'gun', value: 250, color: '#1e293b', icon: '🔫' },
  { id: 'coins_250', label: '250 Coins', type: 'coins', value: 250, color: '#974b00', icon: '🪙' },
  { id: 'gold', label: 'Gold Skin', type: 'skin', value: 150, color: '#d97706', icon: '🎨' },
  { id: 'coins_500', label: '500 Coins', type: 'coins', value: 500, color: '#f59e0b', icon: '💎' },
  { id: 'm4a1', label: 'M4A1 Carbine', type: 'gun', value: 400, color: '#334155', icon: '🔫' },
  { id: 'coins_1000', label: '1000 Coins', type: 'coins', value: 1000, color: '#3f6212', icon: '👑' },
  { id: 'plasma', label: 'Plasma Rifle', type: 'gun', value: 600, color: '#064e3b', icon: '🔋' },
];

export default function LuckySpinScreen({ onNavigate }: Props) {
  const { 
    coins, 
    addCoins,
    spinsAvailable, 
    useSpin, 
    addSpin,
    unlockedGuns, 
    addUnlockedGun,
    unlockedSkins,
    unlockSkin, // (skinId, cost) => bool
    totalLevelsCompletedCount,
    soundEnabled
  } = useGameStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningPrize, setWinningPrize] = useState<typeof PRIZES[0] | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [duplicateCompensated, setDuplicateCompensated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spinTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const playTick = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.03);

      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {}
  };

  const playWinFanfare = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major celebratory chord 
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.08 + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
      });
    } catch (e) {}
  };

  const startSpin = (isPaid: boolean = false) => {
    if (isSpinning) return;
    setErrorMsg(null);

    if (!isPaid && spinsAvailable <= 0) {
      setErrorMsg('No spins available! Win 10 levels or purchase a spin with coins.');
      return;
    }

    if (isPaid && coins < 300) {
      setErrorMsg('Not enough coins! Buying a Lucky Spin costs 300 coins.');
      return;
    }

    // Process payment / deduction
    if (isPaid) {
      useGameStore.setState({ coins: coins - 300 });
    } else {
      useSpin();
    }

    setIsSpinning(true);
    setWinningPrize(null);
    setIsCelebrationOpen(false);

    // Pick a random prize index
    const winningIndex = Math.floor(Math.random() * PRIZES.length);
    const chosenPrize = PRIZES[winningIndex];

    // Calculate rotation: Spin 5 extra times plus angle offset
    const extraRotations = 6 + Math.random() * 2; // 6 to 8 full spins
    const targetRot = Math.round(rotation + extraRotations * 360 - (winningIndex * 45));

    setRotation(targetRot);

    // Simulate tick sounds as it slows down
    let ticks = 0;
    const totalDuration = 4000; // 4 seconds spin time
    const maxTicks = 25;
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Staggered ticks simulating deceleration
    const triggerTick = (tickNum: number) => {
      if (tickNum >= maxTicks) return;
      playTick();
      // Exponentially increasing timer to mimic slowing down
      const delay = Math.pow(tickNum / maxTicks, 2) * 400 + 50;
      spinTimeoutRef.current = window.setTimeout(() => {
        triggerTick(tickNum + 1);
      }, delay);
    };
    triggerTick(0);

    // Conclude spin
    spinTimeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setWinningPrize(chosenPrize);
      setIsCelebrationOpen(true);
      playWinFanfare();

      // Process reward claims & handle duplicates
      let duplicateComp = false;

      if (chosenPrize.type === 'coins') {
        addCoins(chosenPrize.value);
      } else if (chosenPrize.type === 'gun') {
        if (unlockedGuns.includes(chosenPrize.id)) {
          // Already unlocked! Compensate with coins
          addCoins(chosenPrize.value);
          duplicateComp = true;
        } else {
          addUnlockedGun(chosenPrize.id);
        }
      } else if (chosenPrize.type === 'skin') {
        if (unlockedSkins.includes(chosenPrize.id)) {
          // Already unlocked! Compensate with coins
          addCoins(chosenPrize.value);
          duplicateComp = true;
        } else {
          // Force inject unlock of skin safely
          useGameStore.setState({ unlockedSkins: [...unlockedSkins, chosenPrize.id] });
        }
      }

      setDuplicateCompensated(duplicateComp);
    }, totalDuration);
  };

  const getSlicePath = (r: number, startAngle: number, endAngle: number) => {
    const rad1 = (startAngle - 90) * Math.PI / 180;
    const rad2 = (endAngle - 90) * Math.PI / 180;
    const x1 = r * Math.cos(rad1);
    const y1 = r * Math.sin(rad1);
    const x2 = r * Math.cos(rad2);
    const y2 = r * Math.sin(rad2);
    return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  // Next milestones helper
  const levelsToNextSpin = totalLevelsCompletedCount === 0 ? 10 : 10 - (totalLevelsCompletedCount % 10);
  const spinProgressPercent = (totalLevelsCompletedCount % 10) * 10;

  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[#1a1005] bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center text-amber-50 overflow-y-auto px-4 py-6 md:p-8">
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md pointer-events-none"></div>

      {/* Header Panel */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#2a1a10]/95 border-2 border-[#5c3a21] p-4 md:px-8 rounded-3xl w-full max-w-5xl mx-auto shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { playClickSound(); onNavigate('home'); }}
            className="p-3 bg-[#5c3a21]/80 hover:bg-[#8b5a2b] border-2 border-[#8b5a2b] rounded-2xl text-amber-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-50 uppercase tracking-widest leading-none flex items-center gap-2">
              <Gift className="w-7 h-7 text-yellow-500 animate-bounce" /> LUCKY SPIN WHEEL
            </h1>
            <p className="text-amber-100/60 text-xs mt-1 uppercase tracking-wider">
              Earned free every 10 levels completed! Spin to win real weaponry.
            </p>
          </div>
        </div>

        {/* Global Wallet State */}
        <div className="flex items-center gap-3.5 bg-[#4c1d95]/40 border-2 border-[#8b5cf6]/50 px-5 py-2 rounded-2xl shadow-inner">
          <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="font-extrabold text-2xl text-yellow-400 tracking-wide">{coins} <span className="text-xs text-purple-200 uppercase font-black">COINS</span></span>
        </div>
      </div>

      {/* Error Alarm */}
      {errorMsg && (
        <div className="relative z-10 w-full max-w-lg mx-auto mt-4">
          <div className="bg-red-950/90 border-2 border-red-500 rounded-xl p-3 text-red-200 text-sm font-bold text-center animate-bounce">
            ⚠️ {errorMsg}
          </div>
        </div>
      )}

      {/* Main Wheel Grid Display Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl mx-auto mt-6 flex-1 items-center">
        
        {/* Left Aspect: The interactive spinning Wheel container */}
        <div className="md:col-span-7 flex flex-col items-center justify-center py-4 relative">
          
          {/* Outer Ring frame */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-8 border-amber-900 bg-stone-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center p-3">
            
            {/* Triangular pointer arrow sitting at the top */}
            <div className="absolute top-0 left-1/2 -ml-4 -mt-2 z-20 w-8 h-8 flex justify-center items-start pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-yellow-400 stroke-amber-950 stroke-2 text-yellow-400">
                <polygon points="12,18 4,2 20,2" />
              </svg>
            </div>

            {/* Glowing neon ring dots */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#a3e635]/20 animate-spin-slow"></div>

            {/* HTML/SVG Rotator frame */}
            <div 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4000ms cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
              }}
              className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
            >
              <svg viewBox="-100 -100 200 200" className="w-full h-full bg-[#3e2511]">
                <circle cx="0" cy="0" r="98" fill="#3e2511" />
                
                {/* 8 colored decorative segments */}
                {PRIZES.map((prize, idx) => {
                  const angle = idx * 45;
                  return (
                    <g key={prize.id} transform={`rotate(${angle})`}>
                      {/* Slices range exactly from -22.5deg to +22.5deg */}
                      <path 
                        d={getSlicePath(95, -22.5, 22.5)} 
                        fill={prize.color} 
                        stroke="#1a1005" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Text details rotated */}
                      <g transform="translate(0, -62)">
                        {/* Short item text */}
                        <text
                          fill="#ffedd5"
                          fontSize="7"
                          fontWeight="900"
                          textAnchor="middle"
                          className="font-sans uppercase tracking-widest fill-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        >
                          {prize.label.split(' ')[0]}
                        </text>

                        {/* Sub label or icon */}
                        <text
                          y="10"
                          fill="#fef08a"
                          fontSize="5.5"
                          fontWeight="700"
                          textAnchor="middle"
                          className="font-sans uppercase tracking-wider fill-yellow-200"
                        >
                          {prize.label.split(' ').slice(1).join(' ') || prize.icon}
                        </text>
                      </g>

                      {/* Small slice indicator icon */}
                      <text
                        x="0"
                        y="-35"
                        fontSize="14"
                        textAnchor="middle"
                        className="pointer-events-none select-none select-none-all"
                      >
                        {prize.icon}
                      </text>
                    </g>
                  );
                })}

                {/* Inner peg circle rim */}
                <circle cx="0" cy="0" r="14" fill="#1a1005" stroke="#f59e0b" strokeWidth="2" />
              </svg>
            </div>

            {/* Steady golden center cap plate containing spin counts */}
            <div className="absolute z-10 w-16 h-16 bg-[#2a1a10] border-4 border-yellow-500 rounded-full flex flex-col items-center justify-center shadow-lg">
              <span className="text-[10px] font-black leading-none text-yellow-500 uppercase">SPINS</span>
              <span className="text-xl font-extrabold text-amber-50 mt-1 leading-none">{spinsAvailable}</span>
            </div>
          </div>
        </div>

        {/* Right Aspect: Control console & level progress progress meters */}
        <div className="md:col-span-5 flex flex-col gap-5 bg-[#2a1a10]/80 border-4 border-[#5c3a21] p-6 rounded-3xl shadow-xl w-full">
          <h2 className="text-xl font-black text-amber-50 uppercase tracking-widest border-b-2 border-[#5c3a21] pb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#a3e635]" /> Progress Hub
          </h2>

          {/* Level completion tracker container */}
          <div className="bg-[#1e1107] p-4 rounded-2xl border border-[#5c3a21]/50 text-center">
            <div className="flex justify-between text-xs text-amber-100/60 font-bold uppercase tracking-wider mb-2">
              <span>Next Free Spin</span>
              <span>{totalLevelsCompletedCount % 10}/10 Clears</span>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-stone-900 h-4 rounded-full p-0.5 overflow-hidden border border-[#5c3a21]">
              <div 
                style={{ width: `${spinProgressPercent}%` }}
                className="bg-gradient-to-r from-yellow-600 to-[#a3e635] h-full rounded-full transition-all duration-500 relative"
              >
                {/* Stripe reflection */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem] animate-pulse"></div>
              </div>
            </div>

            <p className="text-[11px] text-amber-200/50 uppercase font-bold mt-2.5">
              💡 {levelsToNextSpin > 0 ? `Complete ${levelsToNextSpin} more levels to unlock 1 free spin!` : "You have spins waiting to play!"}
            </p>
          </div>

          <div className="flex flex-col gap-3.5 mt-2">
            
            {/* Button 1: Use Free earned spin */}
            <button 
              disabled={isSpinning || spinsAvailable <= 0}
              onClick={() => { playClickSound(); startSpin(false); }}
              className="relative group w-full disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 bg-[#3f6212] rounded-xl translate-y-1.5 group-active:translate-y-0 transition-transform"></div>
              <div className="relative w-full py-4 bg-gradient-to-b from-[#84cc16] to-[#4d7c0f] border-2 border-[#a3e635] rounded-xl text-lg font-black text-white flex items-center justify-center gap-2 shadow-md group-active:translate-y-1.5 transition-transform uppercase tracking-wider">
                <Sparkles className="w-5 h-5 animate-pulse" /> SPUN FREE ({spinsAvailable})
              </div>
            </button>

            {/* Button 2: Buy spin with 300 Coins */}
            <button 
              disabled={isSpinning}
              onClick={() => { playClickSound(); startSpin(true); }}
              className="relative group w-full"
            >
              <div className="absolute inset-0 bg-[#581c87] rounded-xl translate-y-1.5 group-active:translate-y-0 transition-transform"></div>
              <div className="relative w-full py-3.5 bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] border-2 border-purple-400 rounded-xl text-base font-black text-amber-50 flex items-center justify-center gap-2 shadow-md group-active:translate-y-1.5 transition-transform uppercase tracking-wider">
                <span>🪙 PURCHASE SPIN (300 COINS)</span>
              </div>
            </button>
            
            {/* Dev Helper - Add +1 Spin Cheat to allow instant testing */}
            <button 
              onClick={() => { playClickSound(); addSpin(); }}
              className="py-2 text-[10px] uppercase font-black tracking-widest bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              ⚙️ Tester: Fast-Track +1 Spin
            </button>
          </div>
        </div>
      </div>

      {/* Reward Claim Celebration Modal */}
      {isCelebrationOpen && winningPrize && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-[#3a2a1c] border-4 border-yellow-500 p-8 rounded-3xl max-w-sm w-full text-center relative shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Shiny gold sparkles absolute projections */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500"></div>
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <span className="text-4xl text-center block mb-2">{winningPrize.icon}</span>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 uppercase tracking-widest leading-none">
              CONGRATS!
            </h2>
            <p className="text-amber-100/70 text-xs font-black uppercase mt-1 tracking-widest">
              Landed successfully
            </p>

            {/* Active reward card displaying title & subtitle details */}
            <div className="bg-[#1e1107] border-2 border-[#5c3a21] rounded-2xl p-5 my-6 shadow-inner text-amber-50 font-sans">
              <span className="text-[10px] text-yellow-500 uppercase font-black tracking-widest block mb-1">
                REWARD UNLOCKED
              </span>
              <span className="text-2xl font-black text-yellow-200 block uppercase tracking-wide">
                {winningPrize.label}
              </span>

              {duplicateCompensated ? (
                <div className="text-xs text-orange-400 font-extrabold mt-3 bg-orange-950/40 p-2.5 rounded-xl border border-orange-500/30 leading-snug">
                  🔄 Already owned! Resale compensatory bonus of <span className="text-yellow-400 font-black">{winningPrize.value} Coins</span> has been added to your wallet instead.
                </div>
              ) : (
                <div className="text-xs text-green-400 font-extrabold mt-2 uppercase tracking-wide">
                  ✓ Successfully added to your inventory!
                </div>
              )}
            </div>

            <button 
              onClick={() => { playClickSound(); setIsCelebrationOpen(false); }}
              className="w-full py-4 bg-gradient-to-b from-yellow-500 to-amber-700 hover:from-yellow-400 hover:to-amber-600 text-black font-black text-lg rounded-xl shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all cursor-pointer uppercase tracking-wider"
            >
              CLAIM REWARD 🚀
            </button>
          </div>
        </div>
      )}

      {/* Footer statistics metadata */}
      <span className="relative z-10 text-center text-[10px] text-amber-100/40 font-bold tracking-widest mt-6 uppercase">
        Level-Cleared progression counters: {totalLevelsCompletedCount} total wins registered
      </span>
    </div>
  );
}
