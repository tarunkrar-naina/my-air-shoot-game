import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { ScreenType } from '../../types';
import { ArrowLeft, Coins, Check, Lock, Shield, Zap, Crosshair } from 'lucide-react';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function GunsScreen({ onNavigate }: Props) {
  const { 
    coins, 
    selectedGun, 
    unlockedGuns, 
    selectedSkin, 
    unlockedSkins, 
    selectGun, 
    unlockGun, 
    selectSkin, 
    unlockSkin, 
    soundEnabled 
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'weapons' | 'skins'>('weapons');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Define Weapons list
  const WEAPONS = [
    {
      id: 'ak47',
      name: 'AK-47 Assault Rifle',
      description: 'Classic cold-war heavy automatic firearm. High blast power and reliable automatic burst firing.',
      cost: 0,
      damage: 100,
      fireRate: 85,
      accuracy: 65,
      soundName: 'ak47'
    },
    {
      id: 'deserteagle',
      name: 'Desert Eagle .50AE',
      description: 'The iconic heavy-caliber hand cannon. Massive direct stopping power with high precision semi-auto shots.',
      cost: 350,
      damage: 180,
      fireRate: 35,
      accuracy: 85,
      soundName: 'deagle'
    },
    {
      id: 'm4a1',
      name: 'M4A1 Tactical Carbine',
      description: 'Elite special forces rifle. Extremely fast, low visual recoil, and pinpoint tactical precision.',
      cost: 600,
      damage: 85,
      fireRate: 95,
      accuracy: 92,
      soundName: 'm4a1'
    },
    {
      id: 'plasma',
      name: 'Plasma Arc Rifle',
      description: 'Experimental futuristic weapon. Shoots amplified glowing neon green energy bolts with zero gravity drop.',
      cost: 1000,
      damage: 125,
      fireRate: 70,
      accuracy: 98,
      soundName: 'plasma'
    },
    {
      id: 'awm',
      name: 'AWM Bolt-Action Sniper',
      description: 'Legendary Arctic Warfare heavy caliber sniper rifle. Fires high velocity kinetic bullets with elite pinpoint accuracy.',
      cost: 1400,
      damage: 250,
      fireRate: 20,
      accuracy: 100,
      soundName: 'awm'
    },
    {
      id: 'shotgun',
      name: 'Double Barrel Shotgun',
      description: 'Classic side-by-side break-action hunters shotgun. Devastating close-range blast with multi-shot pellet spreading.',
      cost: 1800,
      damage: 190,
      fireRate: 40,
      accuracy: 50,
      soundName: 'shotgun'
    },
    {
      id: 'minigun',
      name: 'Vaporizer Rotary Minigun',
      description: 'Six barrel high-speed electric Gatling gun. Fires absolute endless hail of bullets to spray the sky.',
      cost: 2500,
      damage: 75,
      fireRate: 99,
      accuracy: 60,
      soundName: 'minigun'
    },
    {
      id: 'rpg',
      name: 'RPG-7 Rocket Launcher',
      description: 'Heavy shoulder-fired rocket explosive launcher. High destruction capability with dynamic area impact blast wave.',
      cost: 3200,
      damage: 300,
      fireRate: 15,
      accuracy: 45,
      soundName: 'rpg'
    },
    {
      id: 'mp5',
      name: 'MP5 Tactical Submachine Gun',
      description: 'Sleek special-ops tactical machine weapon. Incredible close-quarters stability with lightning fast rate of fire.',
      cost: 850,
      damage: 75,
      fireRate: 94,
      accuracy: 85,
      soundName: 'mp5'
    },
    {
      id: 'revolver',
      name: 'Python .357 Chrome Magnum',
      description: 'Polished silver heavy revolver with spinning ammunition cylinder chamber. Ultimate precision headshots.',
      cost: 1100,
      damage: 215,
      fireRate: 30,
      accuracy: 94,
      soundName: 'revolver'
    },
    {
      id: 'm249',
      name: 'M249 Heavy LMG Machine Gun',
      description: 'Endless high-capacity belt-fed squad automatic weapon. Spews heavy metal bullets in non-stop suppressive fire waves.',
      cost: 2100,
      damage: 90,
      fireRate: 98,
      accuracy: 55,
      soundName: 'm249'
    },
    {
      id: 'awp_hyper',
      name: 'M98 Tactical Hyper-Sniper',
      description: 'Ultimate military-grade extreme caliber heavy sniper. Integrated with premium thermal laser targeting lens.',
      cost: 3800,
      damage: 350,
      fireRate: 15,
      accuracy: 100,
      soundName: 'awp_hyper'
    },
    {
      id: 'glock17',
      name: 'Glock-17 Tactical Pistol',
      description: 'Austrian lightweight defense polymer pistol. Snappy, reliable, high accuracy, lightning fast pull speed.',
      cost: 200,
      damage: 80,
      fireRate: 65,
      accuracy: 88,
      soundName: 'glock17'
    },
    {
      id: 'kar98',
      name: 'Kar98k Bolt-Action Rifle',
      description: 'Historical vintage infantry bolt rifle. Exceptional accuracy and heavy stopping power with real wood finish.',
      cost: 1550,
      damage: 220,
      fireRate: 25,
      accuracy: 96,
      soundName: 'kar98'
    },
    {
      id: 'barrett',
      name: 'Barrett M82A1 .50 BMG Heavy Anti-Materiel Rifle',
      description: 'Monstrous supreme caliber military rifle. Unleashes devastating kinetic blast to instantly clear the sky.',
      cost: 4500,
      damage: 480,
      fireRate: 18,
      accuracy: 100,
      soundName: 'barrett'
    },
    {
      id: 'scar_h',
      name: 'SCAR-H Heavy Commando Rifle',
      description: 'Elite heavy caliber special operations combat rifle. Incredibly high automatic bullet stability and deep target impact.',
      cost: 1650,
      damage: 130,
      fireRate: 88,
      accuracy: 82,
      soundName: 'ak47'
    },
    {
      id: 'laser_laser',
      name: 'Sentinel ZX-3 Quantum Beam Laser',
      description: 'Futuristic sub-atomic energy focus emitter. Concentrates a continuous line of glowing green laser focus streams.',
      cost: 3000,
      damage: 80,
      fireRate: 98,
      accuracy: 100,
      soundName: 'plasma'
    },
    {
      id: 'grenade_launcher',
      name: 'XM25 Tactical Airburst Grenade Launcher',
      description: 'Shoulder-fired 25mm high-explosive smart grenade slinger. Projects dramatic explosive shellburst coverage.',
      cost: 5000,
      damage: 420,
      fireRate: 18,
      accuracy: 75,
      soundName: 'rpg'
    }
  ];

  // Define Skins/Themes list
  const SKINS = [
    {
      id: 'classic',
      name: 'Classic Steel & Wood',
      description: 'Raw industrial steel paired with polished rustic forest oak-wood.',
      cost: 0,
      colors: { Stock: '#78350f', Body: '#1e293b', Highlight: '#475569' }
    },
    {
      id: 'gold',
      name: 'Sunset Royal 24K Gold',
      description: 'Engraved pure carat gold casing designed for elite premium rangers.',
      cost: 150,
      colors: { Stock: '#b45309', Body: '#d97706', Highlight: '#f59e0b' }
    },
    {
      id: 'arctic',
      name: 'Arctic Blizzard Camo',
      description: 'Digital snow mountain combat camouflage pattern with ice highlights.',
      cost: 300,
      colors: { Stock: '#e2e8f0', Body: '#cbd5e1', Highlight: '#38bdf8' }
    },
    {
      id: 'magma',
      name: 'Magma Volcanic Flow',
      description: 'Radiant flowing molten lava streams, pulsing bright obsidian fire textures.',
      cost: 450,
      colors: { Stock: '#7f1d1d', Body: '#991b1b', Highlight: '#ea580c' }
    },
    {
      id: 'stealth',
      name: 'Stealth Matte Black',
      description: 'High-tech weightless carbon-fiber plating, tactical combat ready.',
      cost: 500,
      colors: { Stock: '#111827', Body: '#1f2937', Highlight: '#030712' }
    },
    {
      id: 'emerald',
      name: 'Emerald Jade Ranger',
      description: 'Lustrous deep jade crystal finish embedded with raw wild leaf patterns.',
      cost: 700,
      colors: { Stock: '#064e3b', Body: '#047857', Highlight: '#10b981' }
    },
    {
      id: 'plasma',
      name: 'Neon Cyberpunk Plasma',
      description: 'Glowing aesthetic wave of magenta and toxic acid green power elements.',
      cost: 800,
      colors: { Stock: '#c026d3', Body: '#111827', Highlight: '#22c55e' }
    },
    {
      id: 'nebula',
      name: 'Cosmic Starry Nebula',
      description: 'Interstellar spiral galaxy dust casing mixed with glowing neon purple accents.',
      cost: 1100,
      colors: { Stock: '#4c1d95', Body: '#2e1065', Highlight: '#ec4899' }
    },
    {
      id: 'crystal',
      name: 'Crystal Void Amethyst',
      description: 'Pure radiant amethyst block crystal panels with diamond reflection facets.',
      cost: 1500,
      colors: { Stock: '#8b5cf6', Body: '#581c87', Highlight: '#c084fc' }
    }
  ];

  const handleWeaponPurchase = (gun: typeof WEAPONS[0]) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (unlockedGuns.includes(gun.id)) {
      selectGun(gun.id);
      playClickSound();
      setSuccessMsg(`Equipped ${gun.name}!`);
      return;
    }

    if (coins >= gun.cost) {
      const success = unlockGun(gun.id, gun.cost);
      if (success) {
        playUnlockSound();
        setSuccessMsg(`Successfully purchased and equipped ${gun.name}!`);
      } else {
        setErrorMsg('Failed to unlock weapon.');
      }
    } else {
      setErrorMsg(`Not enough coins! You need ${gun.cost - coins} more coins to buy this.`);
    }
  };

  const handleSkinPurchase = (skin: typeof SKINS[0]) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (unlockedSkins.includes(skin.id)) {
      selectSkin(skin.id);
      playClickSound();
      setSuccessMsg(`Applied ${skin.name} Skin!`);
      return;
    }

    if (coins >= skin.cost) {
      const success = unlockSkin(skin.id, skin.cost);
      if (success) {
        playUnlockSound();
        setSuccessMsg(`Successfully unlocked and applied ${skin.name}!`);
      } else {
        setErrorMsg('Failed to unlock theme.');
      }
    } else {
      setErrorMsg(`Not enough coins! You need ${skin.cost - coins} more coins for this skin.`);
    }
  };

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const playUnlockSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Helper to draw beautiful dynamic SVG preview of the gun so it looks realistic
  const renderWeaponVector = (gunId: string, skinColors: typeof SKINS[0]['colors']) => {
    const { Stock, Body, Highlight } = skinColors;

    // Return responsive vector diagram matching the gun configuration
    switch (gunId) {
      case 'deserteagle':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Grip */}
            <rect x="140" y="55" width="28" height="50" rx="4" fill={Stock} transform="rotate(12, 154, 80)" />
            {/* Slide */}
            <rect x="75" y="32" width="105" height="26" rx="2" fill={Body} />
            <rect x="110" y="30" width="70" height="2" fill={Highlight} />
            {/* Realistic barrel tip & sights */}
            <rect x="73" y="35" width="4" height="20" fill="#0f172a" />
            <polygon points="76,32 79,28 82,32" fill="#0f172a" />
            {/* Safety clip and trigger guard */}
            <ellipse cx="132" cy="65" rx="10" ry="8" fill="none" strokeWidth="2.5" stroke="#1e293b" />
            <path d="M 134,62 Q 131,65 129,66" strokeWidth="2" stroke="#0f172a" />
            {/* Text branding */}
            <text x="115" y="48" fill={Highlight} fontSize="6" fontWeight="bold" opacity="0.6">.50 AE EAGLE</text>
            {/* Highlight slide grooves */}
            <line x1="162" y1="36" x2="162" y2="52" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="166" y1="36" x2="166" y2="52" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="170" y1="36" x2="170" y2="52" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        );
      case 'm4a1':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Buttstock */}
            <rect x="155" y="46" width="30" height="15" rx="2" fill={Stock} />
            <path d="M 155,48 L 140,51 L 140,55 L 155,58" fill={Stock} />
            {/* Receiver */}
            <rect x="94" y="43" width="48" height="18" rx="1" fill={Body} />
            <polygon points="105,61 108,74 114,74 114,61" fill={Body} /> {/* Grip */}
            {/* Tactical Magazine */}
            <path d="M 116,61 L 111,84 L 122,84 L 124,61 Z" fill="#0f172a" />
            {/* Scope / Iron sight */}
            <rect x="105" y="38" width="22" height="5" fill="#334155" />
            <rect x="112" y="34" width="8" height="4" fill={Highlight} />
            {/* Barrel & Gas tube */}
            <rect x="52" y="46" width="42" height="11" rx="2" fill={Stock} /> {/* Handguard */}
            <rect x="22" y="49" width="30" height="4" fill={Body} /> {/* Outer barrel */}
            <rect x="16" y="48" width="6" height="6" rx="1" fill="#0f172a" /> {/* Flash hider */}
            <polygon points="45,46 45,40 40,40" fill="#0f172a" /> {/* Sight post */}
          </svg>
        );
      case 'plasma':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Futuristic compact chassis */}
            <rect x="110" y="40" width="65" height="28" rx="8" fill={Body} />
            {/* Glowing fusion cell container */}
            <rect x="125" y="46" width="35" height="14" rx="4" fill="#090d16" />
            <rect x="128" y="49" width="29" height="8" rx="2" fill={Highlight} className="animate-pulse" />
            {/* Stock design fused */}
            <path d="M 175,44 Q 188,40 185,68 Q 172,74 165,68" fill={Stock} />
            {/* Angled barrel emitter */}
            <path d="M 50,46 L 110,43 L 110,59, L 50,56 Z" fill={Stock} />
            <rect x="25" y="48" width="25" height="6" rx="2" fill="#0f172a" />
            {/* Plasma rings */}
            <ellipse cx="44" cy="51" rx="4" ry="12" fill={Highlight} opacity="0.6" />
            <ellipse cx="64" cy="51" rx="4" ry="12" fill={Highlight} opacity="0.6" />
            <ellipse cx="84" cy="51" rx="4" ry="12" fill={Highlight} opacity="0.4" />
            {/* Glowing laser core lines */}
            <line x1="20" y1="51" x2="110" y2="51" stroke={Highlight} strokeWidth="2.5" />
          </svg>
        );
      case 'awm':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Sniper buttstock */}
            <path d="M 182,45 L 186,75 Q 165,75 160,65 L 140,65 L 140,45 Z" fill={Stock} />
            {/* Receiver */}
            <rect x="90" y="45" width="50" height="16" rx="1" fill={Body} />
            <polygon points="105,61 108,74 114,74 114,61" fill={Body} />
            {/* Small tactical clip */}
            <rect x="115" y="61" width="10" height="12" rx="1" fill="#0f172a" />
            {/* Huge long sniper barrel */}
            <rect x="10" y="49" width="80" height="4.5" fill={Body} />
            <rect x="50" y="47" width="40" height="10" rx="2" fill={Stock} /> {/* support handgrip */}
            <rect x="5" y="47" width="5" height="8" rx="1" fill="#1e293b" />
            {/* Massive telescopic sniper scope */}
            <rect x="100" y="32" width="32" height="7" rx="1" fill="#0f172a" />
            <polygon points="98,30 102,32 102,39 98,41" fill={Highlight} />
            <polygon points="132,32 136,30 136,41 132,39" fill={Highlight} />
            <rect x="112" y="39" width="3" height="6" fill="#0f172a" />
            <rect x="122" y="39" width="3" height="6" fill="#0f172a" />
          </svg>
        );
      case 'shotgun':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Classic wood stock */}
            <path d="M 180,45 L 184,78 L 166,78 L 142,56 L 142,45 Z" fill={Stock} />
            {/* Gold/highlight center receiver hinge */}
            <rect x="105" y="45" width="40" height="15" rx="2" fill={Highlight} />
            {/* Double thick metal barrels */}
            <rect x="20" y="45" width="85" height="6" rx="1" fill={Body} />
            <rect x="20" y="52" width="85" height="6" rx="1" fill={Body} />
            {/* Sliding wood hand grip */}
            <rect x="65" y="59" width="28" height="7" rx="2.5" fill={Stock} />
            {/* Trigger hook */}
            <ellipse cx="128" cy="65" rx="8" ry="6" fill="none" strokeWidth="2" stroke="#1e293b" />
          </svg>
        );
      case 'minigun':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Rotary heavy body casing */}
            <rect x="110" y="42" width="55" height="32" rx="4" fill={Body} />
            {/* Heavy cylindrical drum mag */}
            <ellipse cx="137" cy="82" rx="20" ry="14" fill="#0f172a" stroke={Highlight} strokeWidth="2.5" />
            {/* Rotating multi barrel set */}
            <rect x="35" y="44" width="75" height="3" fill="#475569" />
            <rect x="35" y="49" width="75" height="3" fill="#475569" />
            <rect x="35" y="54" width="75" height="3" fill="#475569" />
            <rect x="35" y="59" width="75" height="3" fill="#475569" />
            <rect x="35" y="64" width="75" height="3" fill="#475569" />
            {/* Clamp holding barrels together */}
            <rect x="30" y="42" width="6" height="27" rx="1" fill={Stock} />
            <rect x="65" y="42" width="6" height="27" rx="1" fill={Stock} />
            {/* Heavy carry handle on top */}
            <path d="M 115,42 L 125,28 L 145,28 L 155,42" stroke={Stock} strokeWidth="4" fill="none" />
          </svg>
        );
      case 'rpg':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Heat-resisting wood central covering */}
            <rect x="110" y="45" width="45" height="16" rx="2" fill={Stock} />
            {/* Launch exhaust funnel tube */}
            <rect x="40" y="48" width="135" height="9" fill={Body} />
            <polygon points="175,44 190,40 190,64 175,60" fill="#0f172a" />
            {/* Double action trigger trigger/optics grip */}
            <rect x="115" y="61" width="10" height="22" rx="2" fill={Highlight} />
            <rect x="135" y="61" width="10" height="15" rx="2" fill="#0f172a" />
            {/* Huge Rocket Warhead on front tip */}
            <path d="M 20,43 L 40,43 L 40,61 L 20,61 Z" fill={Body} />
            <path d="M 20,43 L 10,48 Q 0,52 0,52 Q 0,52 10,56 L 20,61" fill={Highlight} />
            {/* Fin ridges */}
            <rect x="40" y="40" width="3" height="24" rx="0.5" fill="#0f172a" />
          </svg>
        );
      case 'rpg':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Heat-resisting wood central covering */}
            <rect x="110" y="45" width="45" height="16" rx="2" fill={Stock} />
            {/* Launch exhaust funnel tube */}
            <rect x="40" y="48" width="135" height="9" fill={Body} />
            <polygon points="175,44 190,40 190,64 175,60" fill="#0f172a" />
            {/* Double action trigger trigger/optics grip */}
            <rect x="115" y="61" width="10" height="22" rx="2" fill={Highlight} />
            <rect x="135" y="61" width="10" height="15" rx="2" fill="#0f172a" />
            {/* Huge Rocket Warhead on front tip */}
            <path d="M 20,43 L 40,43 L 40,61 L 20,61 Z" fill={Body} />
            <path d="M 20,43 L 10,48 Q 0,52 0,52 Q 0,52 10,56 L 20,61" fill={Highlight} />
            {/* Fin ridges */}
            <rect x="40" y="40" width="3" height="24" rx="0.5" fill="#0f172a" />
          </svg>
        );
      case 'mp5':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Retractable Stock */}
            <rect x="160" y="46" width="24" height="4" fill={Stock} />
            <rect x="160" y="55" width="24" height="4" fill={Stock} />
            <path d="M 183,42 L 187,42 L 187,62 L 183,62 Z" fill="#0f172a" />
            {/* Central Receiver */}
            <rect x="100" y="42" width="60" height="20" rx="2" fill={Body} />
            {/* Tactical rail on top */}
            <rect x="105" y="38" width="40" height="4" fill="#0f172a" />
            {/* Pistol Grip */}
            <rect x="120" y="62" width="11" height="18" fill={Stock} transform="rotate(18, 120, 62)" />
            {/* Curved SMG Magazine */}
            <path d="M 108,62 Q 104,78 95,88 L 102,90 Q 112,78 115,62 Z" fill="#0f172a" stroke={Highlight} strokeWidth="1" />
            {/* Ribbed Forehand guard */}
            <rect x="68" y="44" width="32" height="18" rx="4" fill={Stock} />
            <line x1="74" y1="48" x2="74" y2="58" stroke="#0f172a" strokeWidth="2" />
            <line x1="82" y1="48" x2="82" y2="58" stroke="#0f172a" strokeWidth="2" />
            <line x1="90" y1="48" x2="90" y2="58" stroke="#0f172a" strokeWidth="2" />
            {/* Supressive barrel muzzle */}
            <rect x="25" y="48" width="43" height="8" rx="2" fill="#0f172a" /> {/* Silencer */}
            <rect x="64" y="50" width="10" height="4" fill={Body} />
            {/* Tactical reflex sight */}
            <polygon points="120,38 123,32 133,32 136,38" fill={Highlight} opacity="0.8" />
          </svg>
        );
      case 'revolver':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Polished wood/ivory grip */}
            <path d="M 144,53 C 146,55 160,78 156,92 C 152,106 138,104 135,100 C 132,96 135,76 137,60 Z" fill={Stock} />
            <ellipse cx="145" cy="85" rx="4" ry="8" fill="#1e293b" opacity="0.4" />
            {/* Main revolving frame */}
            <rect x="110" y="44" width="34" height="24" rx="2" fill={Body} />
            {/* Cylinder shield and hammer */}
            <path d="M 144,44 L 148,34 L 143,36 Z" fill="#1e293b" /> {/* Hammer */}
            {/* 6-shot cylinder */}
            <rect x="112" y="46" width="22" height="20" rx="3" fill="#0f172a" stroke={Highlight} strokeWidth="1.5" />
            <line x1="112" y1="51" x2="134" y2="51" stroke="#334155" strokeWidth="1" />
            <line x1="112" y1="56" x2="134" y2="56" stroke="#5c3a21" strokeWidth="1" />
            <line x1="112" y1="61" x2="134" y2="61" stroke="#334155" strokeWidth="1" />
            {/* Heavy 6-inch barrel with cooling rib on top */}
            <rect x="42" y="46" width="68" height="11" fill={Body} />
            <rect x="48" y="43" width="56" height="3" fill="#020617" /> {/* Cooling rib */}
            <rect x="36" y="45" width="6" height="13" fill="#1e293b" /> {/* Muzzle block */}
            <polygon points="40,43 43,45 37,45" fill={Highlight} /> {/* Front Sight */}
            {/* Trigger guard */}
            <ellipse cx="118" cy="74" rx="8" ry="7" fill="none" strokeWidth="2.5" stroke="#1e293b" />
            <path d="M 120,71 Q 116,74 114,75" strokeWidth="2" stroke={Body} />
          </svg>
        );
      case 'm249':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Heavy squad buttstock */}
            <path d="M 175,44 L 188,76 L 165,76 L 155,56 L 155,44 Z" fill={Stock} />
            {/* Ammunition feed receiver */}
            <rect x="100" y="40" width="60" height="24" rx="2" fill={Body} />
            {/* Heavy LMG grip */}
            <rect x="122" y="64" width="11" height="18" fill="#1e293b" transform="rotate(20, 122, 64)" />
            {/* Integrated folded Bipod legs */}
            <rect x="40" y="62" width="40" height="3" fill={Stock} transform="rotate(-6, 40, 62)" />
            {/* Large high capacity olive-drab square drum box */}
            <rect x="104" y="64" width="22" height="24" rx="3" fill="#166534" stroke="#14532d" strokeWidth="1.5" />
            <rect x="108" y="68" width="14" height="2" fill={Highlight} />
            {/* Ammunition belt visible link connecting box to receiver */}
            <path d="M 106,64 Q 101,58 102,52" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            {/* Heavy Cooling jacket forend cover */}
            <rect x="62" y="42" width="38" height="18" rx="2" fill={Stock} />
            <circle cx="70" cy="51" r="1.5" fill="#0f172a" />
            <circle cx="80" cy="51" r="1.5" fill="#0f172a" />
            <circle cx="90" cy="51" r="1.5" fill="#0f172a" />
            {/* Machine barrel and flash hider */}
            <rect x="18" y="48" width="44" height="6" fill={Body} />
            <rect x="10" y="46" width="8" height="10" rx="1.5" fill="#020617" /> {/* Flash Hider */}
            {/* Foldable carry handle on top */}
            <path d="M 115,40 Q 128,24 142,40" fill="none" stroke={Highlight} strokeWidth="3.5" />
          </svg>
        );
      case 'awp_hyper':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Premium skeleton buttstock */}
            <path d="M 183,43 L 187,78 Q 165,78 160,65 L 142,65 Q 146,55 142,43 Z" fill={Stock} />
            <circle cx="168" cy="55" r="5" fill="#020617" /> {/* Weight reduction cutout */}
            {/* Heavy Receiver */}
            <rect x="92" y="43" width="54" height="18" rx="1.5" fill="#090d16" />
            <rect x="105" y="47" width="36" height="10" rx="1" fill={Body} />
            {/* High capacity tactical clip */}
            <rect x="116" y="61" width="13" height="15" rx="1.5" fill="#1e293b" stroke={Highlight} strokeWidth="1" />
            {/* Master long sniper barrel with integrated sound dampening block */}
            <rect x="5" y="48" width="87" height="6" fill="#1e293b" />
            <rect x="12" y="45" width="22" height="12" rx="2.5" fill={Highlight} opacity="0.8" /> {/* Obsidian muzzle brake */}
            {/* Sleek tactical handguard */}
            <rect x="42" y="45" width="50" height="14" rx="2" fill={Stock} />
            {/* Premium thermal scope */}
            <rect x="102" y="28" width="36" height="9" rx="1.5" fill="#111827" stroke={Stock} strokeWidth="1" />
            <polygon points="98,25 103,28 103,37 98,40" fill={Highlight} /> {/* Green/Pink laser lens */}
            <polygon points="138,28 143,25 143,40 138,37" fill="#020617" />
            <rect x="117" y="37" width="5" height="6" fill="#111827" />
            {/* Support under barrel laser */}
            <rect x="65" y="59" width="12" height="4" fill="#0f172a" />
            <circle cx="68" cy="61" r="1" fill="#ef4444" className="animate-pulse" />
          </svg>
        );
      case 'kar98':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            <path d="M 180,46 Q 185,74 162,72 L 140,56 L 70,56 L 70,48 L 140,48 Z" fill={Stock} />
            <rect x="100" y="44" width="45" height="10" rx="1" fill={Body} />
            <rect x="145" y="48" width="10" height="5" fill="#0f172a" />
            <rect x="12" y="49" width="60" height="3" fill={Body} />
            <polygon points="12,49 15,44 18,49" fill="#0f172a" />
            <rect x="126" y="50" width="3" height="12" fill={Highlight} transform="rotate(15, 126, 50)" />
            <circle cx="129" cy="62" r="3" fill="#0f172a" />
          </svg>
        );
      case 'glock17':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            <rect x="128" y="52" width="22" height="36" rx="3" fill="#0f172a" transform="rotate(15, 139, 70)" stroke={Stock} strokeWidth="1" />
            <rect x="85" y="38" width="65" height="17" rx="1.5" fill={Body} />
            <rect x="110" y="36" width="40" height="2" fill={Highlight} />
            <path d="M 115,55 Q 115,68 126,68" strokeWidth="2.5" stroke="#0f172a" fill="none" />
            <path d="M 120,58 L 118,63" strokeWidth="1.5" stroke="#ef4444" />
          </svg>
        );
      case 'barrett':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            <path d="M 180,42 L 185,78 L 160,78 L 140,58 L 140,42 Z" fill={Stock} />
            <rect x="165" y="50" width="15" height="12" fill="#0f172a" />
            <rect x="85" y="42" width="60" height="22" rx="1" fill={Body} />
            <rect x="92" y="48" width="6" height="3" rx="0.5" fill="#0f172a" />
            <rect x="102" y="48" width="6" height="3" rx="0.5" fill="#0f172a" />
            <rect x="112" y="48" width="6" height="3" rx="0.5" fill="#0f172a" />
            <rect x="122" y="48" width="6" height="3" rx="0.5" fill="#0f172a" />
            <polygon points="104,64 100,84 116,84 120,64" fill="#0f172a" />
            <rect x="100" y="28" width="38" height="8" rx="1" fill="#0f172a" />
            <polygon points="96,25 101,28 101,36 96,39" fill={Highlight} />
            <polygon points="138,28 143,25 143,39 138,36" fill="#0f172a" />
            <rect x="116" y="36" width="4" height="6" fill="#0f172a" />
            <rect x="10" y="49" width="75" height="5.5" fill={Body} stroke="#0f172a" strokeWidth="0.5" />
            <polygon points="10,41 2,49 2,54 10,62 14,51" fill={Highlight} />
            <rect x="55" y="54.5" width="22" height="3" fill="#0f172a" stroke={Stock} strokeWidth="1" />
          </svg>
        );
      case 'scar_h':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Modular FDE Stock */}
            <rect x="156" y="44" width="28" height="14" rx="2" fill={Stock} />
            <path d="M 156,46 L 140,49 L 140,54 L 156,56" fill={Stock} />
            {/* Upper Receiver & Flat Rails */}
            <rect x="90" y="42" width="62" height="17" fill={Body} />
            <rect x="92" y="38" width="58" height="4" fill="#0f172a" /> {/* Picatinny Top Rail */}
            <rect x="108" y="59" width="10" height="18" fill={Stock} transform="rotate(22, 108, 59)" /> {/* Ergonomic Grip */}
            {/* Thick SCAR magazine */}
            <rect x="114" y="59" width="16" height="22" rx="1.5" fill="#0f172a" transform="rotate(5, 122, 70)" stroke={Highlight} strokeWidth="1" />
            {/* Heavy barrels and active gas blocks */}
            <rect x="52" y="45" width="38" height="11" rx="1.5" fill={Stock} /> {/* Quad Rail Handguard */}
            <rect x="18" y="48" width="34" height="4.5" fill={Body} /> {/* Heavy barrel */}
            <rect x="12" y="46" width="6" height="8.5" rx="1" fill="#020617" /> {/* Flash Hider */}
            {/* Folding tactical sight */}
            <polygon points="46,45 46,39 42,39" fill="#020617" />
          </svg>
        );
      case 'laser_laser':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Quantum Core Frame */}
            <rect x="105" y="38" width="70" height="30" rx="10" fill={Body} />
            {/* Glowing neon green fuel tubes */}
            <rect x="115" y="44" width="50" height="18" rx="4" fill="#052e16" />
            <rect x="120" y="47" width="40" height="12" rx="2.5" fill="#22c55e" className="animate-pulse" />
            {/* High-tech custom laser stock */}
            <path d="M 175,42 Q 192,36 188,72 Q 170,78 162,70" fill={Stock} />
            {/* Triple focal alignment lenses */}
            <rect x="42" y="44" width="63" height="18" fill={Stock} />
            <ellipse cx="38" cy="53" rx="5" ry="12" fill="#22c55e" opacity="0.8" />
            <ellipse cx="60" cy="53" rx="4" ry="12" fill="#22c55e" opacity="0.6" />
            <ellipse cx="82" cy="53" rx="4" ry="12" fill="#22c55e" opacity="0.4" />
            {/* Emitter tip */}
            <rect x="22" y="49" width="16" height="8" rx="2.5" fill="#020617" />
            {/* Laser energy line */}
            <line x1="16" y1="53" x2="105" y2="53" stroke="#22c55e" strokeWidth="3" />
          </svg>
        );
      case 'grenade_launcher':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Thick padded launcher stock */}
            <path d="M 172,40 L 186,75 L 164,75 L 140,56 L 140,40 Z" fill={Stock} />
            {/* Bulky receiver housing */}
            <rect x="94" y="38" width="50" height="24" rx="3" fill={Body} />
            <rect x="110" y="62" width="12" height="16" fill="#0f172a" transform="rotate(15, 110, 62)" /> {/* Grip */}
            {/* Big 40mm Rotary cylinders for multiple grenade shell chambers */}
            <rect x="70" y="42" width="30" height="26" rx="6" fill="#0f172a" stroke={Highlight} strokeWidth="2" />
            <line x1="70" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="1.5" />
            <line x1="70" y1="55" x2="100" y2="55" stroke="#334155" strokeWidth="1.5" />
            <line x1="70" y1="60" x2="100" y2="60" stroke="#334155" strokeWidth="1.5" />
            {/* Short massive superwide 40mm barrel */}
            <rect x="24" y="42" width="46" height="18" rx="2.5" fill={Body} />
            <rect x="14" y="40" width="10" height="22" rx="3" fill="#020617" /> {/* Muzzle sleeve */}
            {/* Top carrying handle and laser target sights */}
            <path d="M 120,38 L 110,24 L 80,24 L 70,38" fill="none" stroke="#1e293b" strokeWidth="3.5" />
          </svg>
        );
      case 'ak47':
      default:
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            {/* Wooden Buttstock */}
            <path d="M 182,45 L 186,80 L 175,80 L 148,56 L 148,45 Z" fill={Stock} />
            {/* Receiver steel */}
            <rect x="95" y="45" width="53" height="15" rx="1" fill={Body} />
            <rect x="114" y="60" width="12" height="14" fill={Stock} transform="rotate(22, 114, 60)" /> {/* Grip */}
            {/* Banana curved magazine */}
            <path d="M 112,60 Q 115,82 125,94 L 132,92 Q 124,78 120,60 Z" fill="#0f172a" />
            {/* Wooden Handguard */}
            <rect x="58" y="48" width="37" height="12" rx="2" fill={Stock} />
            {/* Steel long barrel */}
            <rect x="16" y="50" width="42" height="4.5" fill={Body} />
            <rect x="35" y="46" width="13" height="4" fill="#334155" /> {/* gas block */}
            <polygon points="22,50 22,43 19,43" fill="#0f172a" /> {/* sight */}
            <rect x="12" y="49" width="4" height="6.5" rx="1" fill="#1e293b" /> {/* flash suppressor */}
          </svg>
        );
    }
  };

  const currentSkinColors = SKINS.find(s => s.id === selectedSkin)?.colors || SKINS[0].colors;

  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[#1a1005] bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center text-amber-50 overflow-y-auto px-4 py-6 md:p-8">
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md pointer-events-none"></div>

      {/* Header Panel */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#2a1a10]/95 border-2 border-[#5c3a21] p-4 md:px-8 rounded-3xl w-full max-w-5xl mx-auto shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-3 bg-[#5c3a21]/80 hover:bg-[#8b5a2b] border-2 border-[#8b5a2b] rounded-2xl text-amber-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-50 uppercase tracking-widest leading-none">
              WEAPONS RACK
            </h1>
            <p className="text-amber-100/60 text-xs mt-1 uppercase tracking-wider">
              Equip realistic firepower and unlock glowing custom finishes
            </p>
          </div>
        </div>

        {/* Global Wallet State */}
        <div className="flex items-center gap-2.5 bg-[#4c1d95]/40 border-2 border-[#8b5cf6]/50 px-5 py-2 rounded-2xl shadow-inner animate-pulse">
          <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="font-extrabold text-2xl text-yellow-400 tracking-wide">{coins} <span className="text-xs text-purple-200 uppercase font-black">COINS</span></span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {(errorMsg || successMsg) && (
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-4 px-4">
          {errorMsg && (
            <div className="bg-red-950/90 border-2 border-red-500 rounded-xl p-3 text-red-200 text-sm font-bold text-center animate-bounce">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-xl p-3 text-emerald-200 text-sm font-bold text-center">
              🎉 {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Master Content Platform */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-5xl mx-auto mt-6 flex-1 items-stretch">
        
        {/* Left Column: Live 2D Weapon Visualizer Projection */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-stone-900/90 border-4 border-stone-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Neon digital grid theme */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(147,197,253,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
          
          <div className="text-center w-full">
            <span className="text-[10px] text-[#a3e635] tracking-widest uppercase font-black border border-[#a3e635]/30 px-2.5 py-1 rounded-full bg-stone-950/30">
              Active Projection Preview
            </span>
          </div>

          <div className="w-full h-44 flex items-center justify-center my-6 relative z-10 transition-transform duration-500 hover:scale-105">
            {renderWeaponVector(selectedGun, currentSkinColors)}
          </div>

          {/* Weapon Blueprint Metadata */}
          <div className="bg-stone-950/60 border border-stone-800/80 p-4 rounded-2xl w-full text-center relative z-10">
            <h3 className="text-base font-extrabold text-amber-200 uppercase tracking-wider">
              {WEAPONS.find(w => w.id === selectedGun)?.name}
            </h3>
            <p className="text-stone-400 text-xs mt-1 leading-relaxed">
              Equipped with "<span className="text-amber-100 font-bold">{SKINS.find(s => s.id === selectedSkin)?.name}</span>" Special Skin Finish. Ready to blast.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Weapon Selector & Skin Studio */}
        <div className="lg:col-span-7 flex flex-col bg-[#2e1d11]/85 border-4 border-[#5c3a21] rounded-3xl overflow-hidden shadow-2xl">
          {/* Navigation Toggle TABS */}
          <div className="grid grid-cols-2 border-b-2 border-[#5c3a21] bg-[#1a1005]/40 p-2 gap-2">
            <button 
              onClick={() => { setActiveTab('weapons'); playClickSound(); }}
              className={`py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'weapons' ? 'bg-[#8b5a2b] text-white shadow' : 'bg-transparent text-amber-200 hover:text-white'}`}
            >
              🔫 GUN SELECTION
            </button>
            <button 
              onClick={() => { setActiveTab('skins'); playClickSound(); }}
              className={`py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'skins' ? 'bg-[#8b5a2b] text-white shadow' : 'bg-transparent text-amber-200 hover:text-white'}`}
            >
              🎨 SKIN CUSTOMIZER
            </button>
          </div>

          {/* Tab 1: Weapons Inventory */}
          {activeTab === 'weapons' ? (
            <div className="p-4 md:p-6 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[440px]">
              {WEAPONS.map((gun) => {
                const isUnlocked = unlockedGuns.includes(gun.id);
                const isEquipped = selectedGun === gun.id;

                return (
                  <div 
                    key={gun.id}
                    onClick={() => handleWeaponPurchase(gun)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col md:flex-row items-center gap-4 ${isEquipped ? 'bg-[#4d2f16] border-[#a3e635] shadow-lg' : 'bg-[#1e1107]/70 border-[#5c3a21]/50 hover:border-[#8b5a2b]'}`}
                  >
                    {/* Small Vector graphic representation */}
                    <div className="w-24 h-16 flex items-center justify-center bg-stone-950/40 border border-[#5c3a21]/50 rounded-xl p-1 shrink-0">
                      {renderWeaponVector(gun.id, currentSkinColors)}
                    </div>

                    {/* Stats & Titles */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-1.5 justify-center md:justify-start">
                        <span className="text-base font-black text-amber-100 uppercase tracking-wide">{gun.name}</span>
                        {isEquipped && (
                          <span className="text-[10px] bg-[#a3e635] text-stone-950 font-black px-2 py-0.5 rounded-full uppercase self-center">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-amber-100/65 text-xs mt-1 leading-snug">{gun.description}</p>
                      
                      {/* Detailed weapon attributes */}
                      <div className="grid grid-cols-3 gap-2 mt-2.5">
                        <div className="text-left">
                          <div className="text-[9px] text-stone-400 font-extrabold uppercase flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-orange-400" /> Pow</div>
                          <div className="w-full bg-stone-900/50 h-1.5 rounded-full mt-0.5 overflow-hidden">
                            <div className="bg-orange-500 h-full" style={{ width: `${(gun.damage / 200) * 100}%` }}></div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-[9px] text-stone-400 font-extrabold uppercase flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-yellow-400" /> Rates</div>
                          <div className="w-full bg-stone-900/50 h-1.5 rounded-full mt-0.5 overflow-hidden">
                            <div className="bg-yellow-400 h-full" style={{ width: `${gun.fireRate}%` }}></div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-[9px] text-stone-400 font-extrabold uppercase flex items-center gap-1"><Crosshair className="w-2.5 h-2.5 text-sky-400" /> Acc</div>
                          <div className="w-full bg-stone-900/50 h-1.5 rounded-full mt-0.5 overflow-hidden">
                            <div className="bg-sky-400 h-full" style={{ width: `${gun.accuracy}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Purchase or select action box */}
                    <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                      {isEquipped ? (
                        <div className="w-full py-2 px-4 bg-emerald-950/40 text-[#a3e635] text-xs font-black border border-emerald-500/30 rounded-xl flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ACTIVE
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-full py-2 px-4 bg-amber-900/50 text-amber-200 text-xs font-black border border-amber-700/50 rounded-xl hover:bg-[#8b5a2b] transition-colors flex items-center justify-center gap-1">
                          SELECT
                        </div>
                      ) : (
                        <div className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-black rounded-xl transition-all shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> BUY {gun.cost}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tab 2: Custom Gun Skins Studio */
            <div className="p-4 md:p-6 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[440px]">
              {SKINS.map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isSelected = selectedSkin === skin.id;

                return (
                  <div 
                    key={skin.id}
                    onClick={() => handleSkinPurchase(skin)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col md:flex-row items-center gap-4 ${isSelected ? 'bg-[#4d2f16] border-[#a3e635] shadow-lg' : 'bg-[#1e1107]/70 border-[#5c3a21]/50 hover:border-[#8b5a2b]'}`}
                  >
                    {/* Small color swatches for active skin visual */}
                    <div className="flex gap-1.5 p-2 bg-stone-950/40 rounded-xl shrink-0 border border-[#5c3a21]/50 w-24 h-16 items-center justify-center">
                      <span className="w-3.5 h-7 rounded" style={{ backgroundColor: skin.colors.Stock }} title="Buttstock / Handguard color" />
                      <span className="w-5 h-8 rounded" style={{ backgroundColor: skin.colors.Body }} title="Steel receiver color" />
                      <span className="w-3.5 h-7 rounded" style={{ backgroundColor: skin.colors.Highlight }} title="Special highlights" />
                    </div>

                    {/* Metadata & Skin Details */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-1.5 justify-center md:justify-start">
                        <span className="text-base font-black text-amber-100 uppercase tracking-wide">{skin.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-[#a3e635] text-stone-950 font-black px-2 py-0.5 rounded-full uppercase self-center">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-amber-100/65 text-xs mt-1 leading-snug">{skin.description}</p>
                    </div>

                    {/* Skin shop transaction panel */}
                    <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                      {isSelected ? (
                        <div className="w-full py-2 px-4 bg-emerald-950/40 text-[#a3e635] text-xs font-black border border-emerald-500/30 rounded-xl flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ACTIVE
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-full py-2 px-4 bg-amber-900/50 text-amber-200 text-xs font-black border border-amber-700/50 rounded-xl hover:bg-[#8b5a2b] transition-colors flex items-center justify-center">
                          APPLY SKIN
                        </div>
                      ) : (
                        <div className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-black rounded-xl transition-all shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> BUY {skin.cost}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer info block */}
      <div className="relative z-10 text-center text-[10px] text-amber-100/40 font-bold uppercase tracking-widest max-w-lg mx-auto mt-6">
        Defeat birds in levels to secure gold. Unlock M4A1 and Plasma gun to dominates the sky.
      </div>
    </div>
  );
}
