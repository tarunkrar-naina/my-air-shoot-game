import React, { useEffect, useRef, useState } from 'react';
import { ScreenType } from '../../types';
import { useGameStore } from '../../store';
import { ArrowLeft, Crosshair, Target, CameraOff, Music, Volume2, VolumeX } from 'lucide-react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

interface Bird {
  id: number;
  x: number;
  y: number;
  speedX: number;
  vy: number;
  health: number;
  maxHealth: number;
  state: 'flying' | 'falling' | 'dead';
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function GameRunner({ onNavigate }: Props) {
  const { currentLevel, addCoins, completeLevel, soundEnabled, toggleSound, musicEnabled, toggleMusic, controlSensitivity, selectedGun, selectedSkin, totalLevelsCompletedCount } = useGameStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [birdsRemaining, setBirdsRemaining] = useState(10 + currentLevel * 5);
  const [gameOver, setGameOver] = useState(false);
  const [levelWon, setLevelWon] = useState(false);
  const [controlMode, setControlMode] = useState<'undecided' | 'camera' | 'touch'>('undecided');
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const landmarkerRef = useRef<HandLandmarker>();
  const birdImgRef = useRef<HTMLImageElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Next level sequence
  const handleNextLevel = () => {
    const nextLvl = currentLevel + 1;
    // Save completion progress
    completeLevel(currentLevel);
    // Write new level in store
    useGameStore.setState({ currentLevel: nextLvl });

    // Reset local state elements
    setBirdsRemaining(10 + nextLvl * 5);
    setLevelWon(false);
    setGameOver(false);

    // Refresh core loop tracking items
    gameState.current.birds = [];
    gameState.current.bullets = [];
    gameState.current.particles = [];
    gameState.current.birdsSpawned = 0;
    gameState.current.totalBirdsToSpawn = 10 + nextLvl * 5;
    gameState.current.kills = 0;
    gameState.current.isFiring = false;
    gameState.current.isTriggerHeld = false;
    gameState.current.isFiringPinch = false;
    gameState.current.recoil = 0;
    gameState.current.birdSoundTimer = 1850;
    gameState.current.triggerPressedLastFrame = false;
  };
  
  // Initialize sounds
  const playSoundEffect = (type: 'shoot' | 'hit' | 'win') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'shoot') {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        // Custom parameters per weapon to make gunshots sound completely real and powerful
        let noiseGainVal = 0.45;
        let noiseDecay = 0.25;
        let bandpassFreq = 500;
        let bandpassQ = 1.0;
        
        let oscType: OscillatorType = 'triangle';
        let oscStartFreq = 120;
        let oscEndFreq = 35; // Audible range punchy sweep endpoint
        let oscGainVal = 0.4;
        let oscDecay = 0.3;

        let clickGainVal = 0.15;
        let clickDecay = 0.02;

        let tailGainVal = 0.05;
        let tailDecay = 0.6;

        // Dynamic echo & landscape feedback parameter overrides
        let delayTime = 0.18;
        let feedbackVal = 0.45;
        let echoFreq = 800;

        switch (selectedGun) {
          case 'deserteagle':
            noiseGainVal = 0.76;
            noiseDecay = 0.28;
            bandpassFreq = 380; // Deeper boom
            oscType = 'sawtooth';
            oscStartFreq = 85;
            oscGainVal = 0.78;
            oscDecay = 0.32;
            clickGainVal = 0.38; // Heavy click
            delayTime = 0.22;
            feedbackVal = 0.52;
            echoFreq = 600;
            break;
          case 'm4a1':
            noiseGainVal = 0.54;
            noiseDecay = 0.16;
            bandpassFreq = 480; // High quality mid-low focus
            oscType = 'sawtooth';
            oscStartFreq = 140;
            oscGainVal = 0.52;
            oscDecay = 0.18;
            clickGainVal = 0.28;
            delayTime = 0.15;
            feedbackVal = 0.42;
            echoFreq = 850;
            break;
          case 'plasma':
            noiseGainVal = 0.35;
            noiseDecay = 0.25;
            bandpassFreq = 950;
            oscType = 'sine';
            oscStartFreq = 650;
            oscEndFreq = 120;
            oscGainVal = 0.55;
            oscDecay = 0.22;
            clickGainVal = 0.12;
            delayTime = 0.18;
            feedbackVal = 0.42;
            echoFreq = 1400;
            break;
          case 'awm':
            noiseGainVal = 0.88;
            noiseDecay = 0.58;
            bandpassFreq = 300; // Ultra heavy low-pass gas ejection
            oscType = 'sawtooth';
            oscStartFreq = 60;
            oscGainVal = 0.85;
            oscDecay = 0.65;
            clickGainVal = 0.48; // Crisp cocking mechanical feedback
            tailGainVal = 0.18;
            tailDecay = 0.9;
            delayTime = 0.28;
            feedbackVal = 0.62;
            echoFreq = 480;
            break;
          case 'shotgun':
            noiseGainVal = 0.92;
            noiseDecay = 0.42;
            bandpassFreq = 220;
            bandpassQ = 0.6;
            oscType = 'sawtooth';
            oscStartFreq = 95;
            oscGainVal = 0.85;
            oscDecay = 0.42;
            clickGainVal = 0.55;
            clickDecay = 0.04;
            tailGainVal = 0.15;
            tailDecay = 0.6;
            delayTime = 0.24;
            feedbackVal = 0.54;
            echoFreq = 600;
            break;
          case 'minigun':
            noiseGainVal = 0.38;
            noiseDecay = 0.11;
            bandpassFreq = 600;
            oscType = 'sawtooth';
            oscStartFreq = 180;
            oscGainVal = 0.36;
            oscDecay = 0.1;
            clickGainVal = 0.22;
            clickDecay = 0.01;
            delayTime = 0.12;
            feedbackVal = 0.35;
            echoFreq = 1100;
            break;
          case 'rpg':
            noiseGainVal = 0.98;
            noiseDecay = 0.92;
            bandpassFreq = 160; // Deep rocket sound
            oscType = 'sawtooth';
            oscStartFreq = 45;
            oscEndFreq = 4;
            oscGainVal = 0.95;
            oscDecay = 0.95;
            clickGainVal = 0.45;
            tailGainVal = 0.35;
            tailDecay = 1.5;
            delayTime = 0.35;
            feedbackVal = 0.65;
            echoFreq = 350;
            break;
          case 'mp5':
            noiseGainVal = 0.48;
            noiseDecay = 0.14;
            bandpassFreq = 650;
            oscType = 'sawtooth';
            oscStartFreq = 160;
            oscGainVal = 0.44;
            oscDecay = 0.14;
            clickGainVal = 0.22;
            delayTime = 0.14;
            feedbackVal = 0.38;
            echoFreq = 1000;
            break;
          case 'revolver':
            noiseGainVal = 0.72;
            noiseDecay = 0.35;
            bandpassFreq = 400;
            oscType = 'sawtooth';
            oscStartFreq = 95;
            oscGainVal = 0.75;
            oscDecay = 0.38;
            clickGainVal = 0.42;
            delayTime = 0.23;
            feedbackVal = 0.5;
            echoFreq = 700;
            break;
          case 'm249':
            noiseGainVal = 0.62;
            noiseDecay = 0.2;
            bandpassFreq = 500;
            oscType = 'sawtooth';
            oscStartFreq = 110;
            oscGainVal = 0.58;
            oscDecay = 0.2;
            clickGainVal = 0.35;
            delayTime = 0.17;
            feedbackVal = 0.45;
            echoFreq = 850;
            break;
          case 'awp_hyper':
            noiseGainVal = 0.85;
            noiseDecay = 0.65;
            bandpassFreq = 420;
            oscType = 'sawtooth';
            oscStartFreq = 50;
            oscEndFreq = 20;
            oscGainVal = 0.88;
            oscDecay = 0.72;
            clickGainVal = 0.52;
            clickDecay = 0.03;
            tailGainVal = 0.22;
            tailDecay = 1.25;
            delayTime = 0.32;
            feedbackVal = 0.6;
            echoFreq = 550;
            break;
          case 'kar98':
            noiseGainVal = 0.76;
            noiseDecay = 0.52;
            bandpassFreq = 350;
            oscType = 'sawtooth';
            oscStartFreq = 75;
            oscGainVal = 0.78;
            oscDecay = 0.55;
            clickGainVal = 0.42;
            delayTime = 0.26;
            feedbackVal = 0.55;
            echoFreq = 500;
            break;
          case 'glock17':
            noiseGainVal = 0.44;
            noiseDecay = 0.16;
            bandpassFreq = 680;
            oscType = 'sawtooth';
            oscStartFreq = 180;
            oscGainVal = 0.42;
            oscDecay = 0.15;
            clickGainVal = 0.24;
            delayTime = 0.15;
            feedbackVal = 0.35;
            echoFreq = 1100;
            break;
          case 'barrett':
            noiseGainVal = 1.0;
            noiseDecay = 0.95;
            bandpassFreq = 110; // Cinematic monstrous punch sub
            bandpassQ = 0.5;
            oscType = 'sawtooth';
            oscStartFreq = 32;
            oscEndFreq = 12;
            oscGainVal = 1.0;
            oscDecay = 1.1;
            clickGainVal = 0.72; // Extremely heavy bolt impact click
            clickDecay = 0.06;
            tailGainVal = 0.45;
            tailDecay = 1.8;
            delayTime = 0.38;
            feedbackVal = 0.68;
            echoFreq = 320;
            break;
          case 'scar_h':
            noiseGainVal = 0.68;
            noiseDecay = 0.24;
            bandpassFreq = 440;
            oscType = 'sawtooth';
            oscStartFreq = 100;
            oscEndFreq = 35;
            oscGainVal = 0.65;
            oscDecay = 0.24;
            clickGainVal = 0.38;
            delayTime = 0.14;
            feedbackVal = 0.4;
            echoFreq = 700;
            break;
          case 'laser_laser':
            noiseGainVal = 0.25;
            noiseDecay = 0.2;
            bandpassFreq = 1100;
            oscType = 'sine';
            oscStartFreq = 820;
            oscEndFreq = 280;
            oscGainVal = 0.45;
            oscDecay = 0.14;
            clickGainVal = 0.04;
            delayTime = 0.12;
            feedbackVal = 0.25;
            echoFreq = 1400;
            break;
          case 'grenade_launcher':
            noiseGainVal = 0.92;
            noiseDecay = 0.68;
            bandpassFreq = 220;
            oscType = 'sawtooth';
            oscStartFreq = 140;
            oscEndFreq = 30;
            oscGainVal = 0.88;
            oscDecay = 0.75;
            clickGainVal = 0.42;
            tailGainVal = 0.25;
            tailDecay = 1.25;
            delayTime = 0.28;
            feedbackVal = 0.62;
            echoFreq = 450;
            break;
          default: // ak47
            noiseGainVal = 0.58; // Robust explosion volume
            noiseDecay = 0.22;
            bandpassFreq = 440; // Lowered for deep body
            oscType = 'sawtooth'; // Gritty real military feel
            oscStartFreq = 120;
            oscGainVal = 0.58;
            oscDecay = 0.25;
            clickGainVal = 0.35;
            delayTime = 0.18;
            feedbackVal = 0.48;
            echoFreq = 750;
            break;
        }

        // Shared buffer for the random white noise transients
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        // Create an input bus for all elements of this shot
        const dryGain = ctx.createGain();
        dryGain.gain.setValueAtTime(1.0, now);
        dryGain.connect(ctx.destination);

        // Build the Echo/Delay feedback circuit (Eko effect)
        const delayNode = ctx.createDelay(3.0);
        delayNode.delayTime.setValueAtTime(delayTime, now);

        const feedbackGain = ctx.createGain();
        feedbackGain.gain.setValueAtTime(feedbackVal, now);
        // Ramp down feedback to prevent infinite resonance loops
        feedbackGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        const echoFilter = ctx.createBiquadFilter();
        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(echoFreq, now);

        // Echo Feedback architecture
        delayNode.connect(echoFilter);
        echoFilter.connect(feedbackGain);
        feedbackGain.connect(delayNode);

        // Route wet echoes to final speakers
        delayNode.connect(ctx.destination);

        // 1. Gas Expansion / Explosive Burst
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(bandpassFreq, now);
        noiseFilter.Q.setValueAtTime(bandpassQ, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(noiseGainVal, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDecay);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dryGain);
        noiseGain.connect(delayNode);
        noiseNode.start(now);

        // 2. Heavy low-frequency body punch/bass rumble
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();

        bassOsc.type = oscType;
        bassOsc.frequency.setValueAtTime(oscStartFreq, now);
        bassOsc.frequency.exponentialRampToValueAtTime(oscEndFreq, now + oscDecay);

        bassGain.gain.setValueAtTime(oscGainVal, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + oscDecay);

        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(180, now);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(dryGain);
        bassGain.connect(delayNode);
        
        bassOsc.start(now);
        bassOsc.stop(now + oscDecay);

        // 3. Crisp mechanical click/metal pin collision
        const clickNode = ctx.createBufferSource();
        clickNode.buffer = buffer;

        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.setValueAtTime(2200, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(clickGainVal, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + clickDecay);

        clickNode.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(dryGain);
        clickGain.connect(delayNode);
        clickNode.start(now);

        // 4. Subtle forest eco/reverberation feedback tail
        const tailNode = ctx.createBufferSource();
        tailNode.buffer = buffer;

        const tailFilter = ctx.createBiquadFilter();
        tailFilter.type = 'lowpass';
        tailFilter.frequency.setValueAtTime(450, now);

        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(tailGainVal, now);
        tailGain.gain.exponentialRampToValueAtTime(0.0001, now + tailDecay);

        tailNode.connect(tailFilter);
        tailFilter.connect(tailGain);
        tailGain.connect(dryGain);
        tailGain.connect(delayNode);
        tailNode.start(now);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'win') {
        osc.type = 'sine';
        const notes = [380, 480, 580, 780];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          noteGain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.15);
          noteOsc.start(ctx.currentTime + idx * 0.1);
          noteOsc.stop(ctx.currentTime + idx * 0.1 + 0.15);
        });
      }
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  };
  
  const playBirdSound = (type: 'chirp' | 'flap') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chirp') {
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 200, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.16);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'flap') {
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      console.warn("Bird Sound error", e);
    }
  };
  
  // Game state refs (to avoid re-renders on game loop)
  const gameState = useRef({
    birds: [] as Bird[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    lastFrameTime: 0,
    birdsSpawned: 0,
    totalBirdsToSpawn: 10 + currentLevel * 5,
    spawnTimer: 0,
    kills: 0,
    pointerX: window.innerWidth / 2,
    pointerY: window.innerHeight / 2,
    isFiring: false,
    fireTimer: 0,
    recoil: 0,
    handLandmarks: null as any,
    isFiringPinch: false,
    isTriggerHeld: false,
    triggerHoldTime: 0,
    birdSoundTimer: 1800,
    triggerPressedLastFrame: false,
    rawHistoryX: [] as number[],
    rawHistoryY: [] as number[]
  });

  // Request Camera & Setup Hand Tracking
  useEffect(() => {
    // Load Bird Image
    const img = new Image();
    img.src = 'https://images.unsplash.com/photo-1552728089-57e3f88f8d68?q=80&w=256&h=256&auto=format&fit=crop';
    img.onload = () => { birdImgRef.current = img; };

    if (controlMode !== 'camera') {
      setIsLoadingCamera(false);
      return;
    }

    const setupTracking = async () => {
      setCameraError(null);
      setIsLoadingCamera(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setIsLoadingCamera(false);
          }
        }
      } catch (err: any) {
        console.error("Error setting up camera/tracking:", err);
        setCameraError(err.message || String(err));
        setIsLoadingCamera(false);
      }
    };
    setupTracking();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [retryCount, controlMode]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!gameState.current.lastFrameTime) gameState.current.lastFrameTime = timestamp;
      const deltaTime = timestamp - gameState.current.lastFrameTime;
      gameState.current.lastFrameTime = timestamp;

      if (controlMode !== 'undecided') {
        update(deltaTime);
      }
      draw(ctx, canvas.width, canvas.height);

      if (!gameOver && !levelWon) {
        // Run Hand Tracking Prediction
        if (controlMode === 'camera' && landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
            if (results.landmarks && results.landmarks.length > 0) {
              const hand = results.landmarks[0];
              gameState.current.handLandmarks = hand; // Save for drawing skeleton

              const indexFinger = hand[8]; // Index finger tip
              const thumbTip = hand[4];    // Thumb tip
              const middleFinger = hand[12]; // Middle finger tip
              
              // Map to screen (smoothly with adaptive range scaling)
              const rawTargetX = (1 - indexFinger.x) * canvas.width;
              const rawTargetY = indexFinger.y * canvas.height;
              
              // Dynamic calibration expansion out from center for less mechanical hand fatigue
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const scaleFactor = 1.35; // Expand pointer range by 35%
              const targetX = centerX + (rawTargetX - centerX) * scaleFactor;
              const targetY = centerY + (rawTargetY - centerY) * scaleFactor;

              // Slide history for rolling coordinates averaging
              if (!gameState.current.rawHistoryX) {
                gameState.current.rawHistoryX = [];
                gameState.current.rawHistoryY = [];
              }
              gameState.current.rawHistoryX.push(targetX);
              gameState.current.rawHistoryY.push(targetY);
              if (gameState.current.rawHistoryX.length > 4) {
                gameState.current.rawHistoryX.shift();
                gameState.current.rawHistoryY.shift();
              }

              // Compute stable rolling central target
              const averageTargetX = gameState.current.rawHistoryX.reduce((a, b) => a + b, 0) / gameState.current.rawHistoryX.length;
              const averageTargetY = gameState.current.rawHistoryY.reduce((a, b) => a + b, 0) / gameState.current.rawHistoryY.length;

              const dx = averageTargetX - gameState.current.pointerX;
              const dy = averageTargetY - gameState.current.pointerY;

              // Gesture Detection: Firing triggers on (👌 Thumb Pinch) OR (👍 Raised Thumb / Thumbs-Up)
              const distThumbIndex = Math.hypot(thumbTip.x - indexFinger.x, thumbTip.y - indexFinger.y);
              const distThumbMiddle = Math.hypot(thumbTip.x - middleFinger.x, thumbTip.y - middleFinger.y);
              const isThumbPinching = distThumbIndex < 0.055 || distThumbMiddle < 0.05;

              // Thumb points vertically up relative to the knuckles and index/middle fingers
              const isThumbUp = (thumbTip.y < hand[3].y) && 
                                (thumbTip.y < hand[5].y - 0.02) && 
                                (thumbTip.y < indexFinger.y - 0.02) && 
                                (thumbTip.y < middleFinger.y - 0.02);

              const isFfTriggered = isThumbPinching || isThumbUp;

              if (isFfTriggered) {
                gameState.current.isTriggerHeld = true;
                gameState.current.isFiringPinch = true;
              } else {
                gameState.current.isTriggerHeld = false;
                gameState.current.isFiringPinch = false;
              }

              // Responsive, sensitivity-multiplied interpolation rate
              const sens = controlSensitivity / 100;
              // Snappy aiming tracking weight with improved baseline response for high-speed fluid target locking
              const weight = isFfTriggered ? 1.0 : (0.24 + (sens * 0.46));
              
              gameState.current.pointerX += dx * weight;
              gameState.current.pointerY += dy * weight;

              // Constrain crosshair inside canvas limits
              gameState.current.pointerX = Math.max(10, Math.min(canvas.width - 10, gameState.current.pointerX));
              gameState.current.pointerY = Math.max(10, Math.min(canvas.height - 10, gameState.current.pointerY));
            } else {
              gameState.current.handLandmarks = null;
              gameState.current.rawHistoryX = [];
              gameState.current.rawHistoryY = [];
            }
          } catch(e) {}
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver, levelWon, controlMode]);

  const update = (dt: number) => {
    const state = gameState.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Specced Gun profile
    const specs: { [key: string]: { damage: number, fireRate: number, recoil: number, speed: number, singleShot?: boolean, isShotgun?: boolean, isRpg?: boolean } } = {
      ak47: { damage: 60, fireRate: 110, recoil: 18, speed: 20 },
      deserteagle: { damage: 180, fireRate: 480, recoil: 32, speed: 22, singleShot: true },
      m4a1: { damage: 45, fireRate: 85, recoil: 9, speed: 22 },
      plasma: { damage: 70, fireRate: 130, recoil: 4, speed: 26 },
      awm: { damage: 300, fireRate: 1400, recoil: 48, speed: 32, singleShot: true },
      shotgun: { damage: 65, fireRate: 800, recoil: 40, speed: 18, singleShot: true, isShotgun: true },
      minigun: { damage: 40, fireRate: 45, recoil: 11, speed: 24 },
      rpg: { damage: 350, fireRate: 1800, recoil: 55, speed: 15, singleShot: true, isRpg: true },
      mp5: { damage: 50, fireRate: 75, recoil: 8, speed: 23 },
      revolver: { damage: 215, fireRate: 600, recoil: 38, speed: 21, singleShot: true },
      m249: { damage: 80, fireRate: 60, recoil: 21, speed: 22 },
      awp_hyper: { damage: 450, fireRate: 1550, recoil: 58, speed: 36, singleShot: true },
      kar98: { damage: 200, fireRate: 1200, recoil: 42, speed: 28, singleShot: true },
      glock17: { damage: 35, fireRate: 200, recoil: 6, speed: 18, singleShot: true },
      barrett: { damage: 500, fireRate: 1700, recoil: 64, speed: 38, singleShot: true },
      scar_h: { damage: 85, fireRate: 110, recoil: 14, speed: 22 },
      laser_laser: { damage: 55, fireRate: 40, recoil: 2, speed: 30 },
      grenade_launcher: { damage: 420, fireRate: 1600, recoil: 50, speed: 14, singleShot: true, isRpg: true }
    };
    const spec = specs[selectedGun] || specs.ak47;

    // Recoil decay
    if (state.recoil > 0) {
      state.recoil = Math.max(0, state.recoil - dt * 0.045);
    }

    // High velocity automatic or semi-automatic modes
    if (state.isTriggerHeld) {
      state.isFiring = true;
    } else {
      state.isFiring = false;
    }

    // Bird sounds trigger periodically for active flying birds
    if (state.birds.filter(b => b.state === 'flying').length > 0) {
      state.birdSoundTimer -= dt;
      if (state.birdSoundTimer <= 0) {
        const isChirp = Math.random() > 0.45;
        playBirdSound(isChirp ? 'chirp' : 'flap');
        state.birdSoundTimer = 1600 + Math.random() * 2200;
      }
    }

    // Fire bullet
    state.fireTimer -= dt;
    
    if (state.isTriggerHeld) {
      state.triggerHoldTime += dt;
    } else {
      state.triggerHoldTime = 0;
    }

    // Check single shot or held fire mode transitions
    const isTriggerJustPressed = state.isTriggerHeld && !state.triggerPressedLastFrame;
    if (isTriggerJustPressed) {
      state.fireTimer = 0; // Reset fire timer to instantly fire on every single manual click/tap!
    }
    // Fully automatic guns fire smoothly when held, while singleShot guns require separate taps.
    // To prevent multi-bullet discharges on quick taps, we implement a 260ms auto-fire holding threshold.
    const triggerAction = spec.singleShot
      ? isTriggerJustPressed
      : (isTriggerJustPressed || (state.isTriggerHeld && state.triggerHoldTime > 260));
    state.triggerPressedLastFrame = state.isTriggerHeld;

    if (triggerAction && state.fireTimer <= 0) {
      const startX = canvas.width / 2;
      const startY = canvas.height;
      const angle = Math.atan2(state.pointerY - startY, state.pointerX - startX);
      const speed = spec.speed;

      if (spec.isShotgun) {
        // Double barrel shotgun multi-pellet spread
        for (let p = -2; p <= 2; p++) {
          const spreadAngle = angle + p * 0.084;
          state.bullets.push({
            x: startX,
            y: startY,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            lifetime: 1000
          });
        }
      } else {
        // Standard kinetic, sniper or explosive single projectile
        state.bullets.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          lifetime: 1000
        });
      }

      state.fireTimer = spec.fireRate;
      state.recoil = spec.recoil;
      playSoundEffect('shoot');
      
      // Semi automatic re-press check reset
      if (spec.singleShot) {
        state.isTriggerHeld = false;
        state.isFiringPinch = false;
      }
    }

    // Update bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.lifetime -= dt;
      if (b.lifetime <= 0 || b.y < 0 || b.x < 0 || b.x > canvas.width) {
        state.bullets.splice(i, 1);
      }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity for particles
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // Spawn birds
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.birdsSpawned < state.totalBirdsToSpawn) {
      const startLeft = Math.random() > 0.5;
      const baseY = canvas.height * 0.1 + Math.random() * (canvas.height * 0.5);
      state.birds.push({
        id: Math.random(),
        x: startLeft ? -50 : canvas.width + 50,
        y: baseY,
        speedX: (startLeft ? 1 : -1) * (1.8 + Math.random() * 1.8 + Math.min(6, currentLevel * 0.1)),
        vy: 0,
        health: 50,
        maxHealth: 50,
        state: 'flying'
      });
      state.birdsSpawned++;
      state.spawnTimer = 800 + Math.random() * 1000;
    }

    // Update birds & collisions
    for (let i = state.birds.length - 1; i >= 0; i--) {
      const bird = state.birds[i];
      
      if (bird.state === 'flying') {
        bird.x += bird.speedX;
        bird.y += Math.sin(timestamp * 0.003 + bird.id) * 2; // subtle bob
        
        // Check collisions with bullets (generous radius for smooth hand tracking alignment)
        const birdRadius = 48;
        const damageAmount = specs[selectedGun]?.damage || 60;

        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          const dist = Math.hypot(bird.x - b.x, bird.y - b.y);
          if (dist < birdRadius) {
            bird.health -= damageAmount;
            state.bullets.splice(j, 1);
            
            // Spawn feather particles
            for(let p = 0; p < 5; p++) {
              state.particles.push({
                x: bird.x,
                y: bird.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2,
                life: 500 + Math.random() * 500,
                maxLife: 1000,
                color: Math.random() > 0.5 ? '#6b4226' : '#4a2b10'
              });
            }

            // RPG Rocket Launcher radial explosion damage check
            if (spec.isRpg) {
              // Spawn massive volcanic explosion particles
              for (let f = 0; f < 30; f++) {
                state.particles.push({
                  x: bird.x,
                  y: bird.y,
                  vx: (Math.random() - 0.5) * 15,
                  vy: (Math.random() - 0.5) * 15 - 3,
                  life: 600 + Math.random() * 600,
                  maxLife: 1200,
                  color: Math.random() > 0.45 ? (Math.random() > 0.5 ? '#f97316' : '#ef4444') : '#facc15'
                });
              }

              // Splash area of effect (AoE) checks
              for (let otherI = state.birds.length - 1; otherI >= 0; otherI--) {
                const splashBird = state.birds[otherI];
                if (splashBird.state === 'flying' && splashBird.id !== bird.id) {
                  const splashDist = Math.hypot(splashBird.x - bird.x, splashBird.y - bird.y);
                  if (splashDist < 180) { // 180 pixels splash radius
                    splashBird.health -= damageAmount;
                    if (splashBird.health <= 0) {
                      splashBird.state = 'falling';
                      splashBird.vy = -3.5; // push up slightly from blast force
                      playSoundEffect('hit');
                    }
                  }
                }
              }
            }

            if (bird.health <= 0) {
              bird.state = 'falling';
              bird.vy = 0;
              playSoundEffect('hit');

              // Increment kills and update HUD immediately for snappy feedback!
              state.kills++;
              setBirdsRemaining(Math.max(0, state.totalBirdsToSpawn - state.kills));

              if (state.kills >= state.totalBirdsToSpawn) {
                setLevelWon(true);
                completeLevel(currentLevel);
                playSoundEffect('win');
              }
            }
          }
        }
        
        // Remove if off screen
        if ((bird.speedX > 0 && bird.x > canvas.width + 100) || 
            (bird.speedX < 0 && bird.x < -100)) {
          state.birds.splice(i, 1);
          // Recycle: Decrement spawned count so spawner replaces this bird in the level!
          state.birdsSpawned = Math.max(0, state.birdsSpawned - 1);
        }
      } else if (bird.state === 'falling') {
        bird.vy += 0.5; // gravity
        bird.y += bird.vy;
        bird.x += bird.speedX * 0.5;
        if (bird.y > canvas.height + 50) {
          state.birds.splice(i, 1);
          addCoins(10);
        }
      }
    }
  };

  let timestamp = 0; // for bobbing effect outside update params scope

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const state = gameState.current;

    // Draw birds
    state.birds.forEach(bird => {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      if (bird.speedX < 0) ctx.scale(-1, 1);
      
      if (bird.state === 'falling') {
        ctx.rotate(Math.PI);
      }

      // Gorgeous biological flying bird with realistic wing flapping animation
      const flap = Math.sin(Date.now() * 0.015 + bird.id);
      
      // Shadow for realistic depth
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 6;

      // 1. Tail Feathers
      ctx.fillStyle = '#1e293b'; // Slate grey tail
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-32, -9);
      ctx.lineTo(-28, 0);
      ctx.lineTo(-32, 9);
      ctx.closePath();
      ctx.fill();

      // 2. Main Body with feathered texture gradients
      const bodyGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
      bodyGrad.addColorStop(0, '#334155');
      bodyGrad.addColorStop(1, '#0f172a'); // Midnight colored body
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Chest Highlight
      ctx.fillStyle = '#b45309'; // Rich gold/amber chest accent
      ctx.beginPath();
      ctx.ellipse(6, 3, 11, 7, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // 4. White Eagle Head Hood
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(18, -4, 9, 0, Math.PI * 2);
      ctx.fill();

      // 5. Beak
      ctx.fillStyle = '#fbbf24'; // Sharp yellow beak
      ctx.beginPath();
      ctx.moveTo(24, -6);
      ctx.lineTo(34, -3);
      ctx.lineTo(22, 1);
      ctx.closePath();
      ctx.fill();

      // 6. Sharp Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(17, -6, 2, 0, Math.PI * 2);
      ctx.fill();

      // 7. Flapping Wings (Double Layer Primary & COVERTS feathers)
      ctx.save();
      ctx.translate(-2, -4);
      if (bird.state === 'flying') {
        ctx.rotate(flap * 0.85); // Wing pivot flapping
      } else {
        ctx.rotate(Math.PI / 2.5); // Collapse wings downwards on death
      }

      // Primary Feathers
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, -18, 10, 22, -Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();

      // Coverts Highlight layer
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(0, -14, 6, 15, -Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();

      // Draw health bar
      if (bird.state === 'flying' && bird.health < bird.maxHealth) {
        ctx.fillStyle = 'red';
        ctx.fillRect(bird.x - 20, bird.y - 30, 40, 5);
        ctx.fillStyle = '#a3e635';
        ctx.fillRect(bird.x - 20, bird.y - 30, 40 * (bird.health / bird.maxHealth), 5);
      }
    });

    // Draw bullets
    const currentThemeColors = {
      classic: { Stock: '#78350f', Body: '#1e293b', Highlight: '#475569', Laser: '#fbbf24' },
      gold: { Stock: '#b45309', Body: '#d97706', Highlight: '#f59e0b', Laser: '#f59e0b' },
      arctic: { Stock: '#e2e8f0', Body: '#cbd5e1', Highlight: '#38bdf8', Laser: '#38bdf8' },
      stealth: { Stock: '#111827', Body: '#1f2937', Highlight: '#030712', Laser: '#ef4444' },
      plasma: { Stock: '#c026d3', Body: '#111827', Highlight: '#22c55e', Laser: '#22c55e' }
    }[selectedSkin as 'classic'|'gold'|'arctic'|'stealth'|'plasma'] || { Stock: '#78350f', Body: '#1e293b', Highlight: '#475569', Laser: '#fbbf24' };

    state.bullets.forEach(b => {
      ctx.save();
      if (selectedGun === 'plasma' || selectedGun === 'laser_laser') {
        ctx.strokeStyle = selectedGun === 'laser_laser' ? '#22c55e' : currentThemeColors.Laser;
        ctx.shadowColor = selectedGun === 'laser_laser' ? '#22c55e' : currentThemeColors.Laser;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#fbbf24';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2.5;
      }
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      // Draw short tracer vector along velocity
      ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
      ctx.stroke();
      
      // Core bright bullet cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, (selectedGun === 'plasma' || selectedGun === 'laser_laser') ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw particles
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Hand Tracking Skeleton Overlay inside PIP box if available
    if (state.handLandmarks && !cameraError) {
      ctx.save();
      const pipWidth = width < 768 ? 176 : 224; // matches w-44 (176px) vs w-56 (224px)
      const pipHeight = width < 768 ? 128 : 160; // matches h-32 (128px) vs h-40 (160px)
      const pipPadding = 24; // bottom-6 and right-6 is 24px
      const pipX = width - pipWidth - pipPadding;
      const pipY = height - pipHeight - pipPadding;

      // Draw subtle green diagnostic glow background behind skeleton
      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(pipX, pipY, pipWidth, pipHeight - 28);

      // Define finger joint connection paths
      const fingers = [
        [0, 1, 2, 3, 4],       // Thumb
        [0, 5, 6, 7, 8],       // Index
        [9, 10, 11, 12],       // Middle
        [13, 14, 15, 16],      // Ring
        [0, 17, 18, 19, 20]    // Pinky
      ];
      
      const palmBaseList = [5, 9, 13, 17, 5];

      ctx.strokeStyle = state.isFiringPinch ? 'rgba(239, 68, 68, 0.85)' : 'rgba(163, 230, 53, 0.75)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = state.isFiringPinch ? '#ef4444' : '#a3e635';

      // Draw finger paths
      fingers.forEach((finger) => {
        ctx.beginPath();
        finger.forEach((ptIdx, index) => {
          const pt = state.handLandmarks[ptIdx];
          const px = pipX + (1 - pt.x) * pipWidth;
          const py = pipY + pt.y * (pipHeight - 28);
          if (index === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
      });

      // Draw palm skeleton connection loop
      ctx.beginPath();
      palmBaseList.forEach((ptIdx, index) => {
        const pt = state.handLandmarks[ptIdx];
        const px = pipX + (1 - pt.x) * pipWidth;
        const py = pipY + pt.y * (pipHeight - 28);
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      // Connect wrist to middle knuckle
      const wrist = state.handLandmarks[0];
      const wPx = pipX + (1 - wrist.x) * pipWidth;
      const wPy = pipY + wrist.y * (pipHeight - 28);
      const mKnuckle = state.handLandmarks[9];
      const mKnuckleX = pipX + (1 - mKnuckle.x) * pipWidth;
      const mKnuckleY = pipY + mKnuckle.y * (pipHeight - 28);
      ctx.moveTo(wPx, wPy);
      ctx.lineTo(mKnuckleX, mKnuckleY);
      ctx.stroke();

      // Draw finger joint node markers
      state.handLandmarks.forEach((pt: any, idx: number) => {
        const px = pipX + (1 - pt.x) * pipWidth;
        const py = pipY + pt.y * (pipHeight - 28);
        
        if (idx === 8 || idx === 4) {
          ctx.fillStyle = state.isFiringPinch ? '#ef4444' : '#fbbf24'; // Red when pinching else Gold
          ctx.shadowColor = state.isFiringPinch ? '#ef4444' : '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#a3e635';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // Pinch Firing status label near crosshair pointer for direct vision feedback
    if (state.isFiringPinch) {
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#000000';
      const gunLabel = {
        ak47: '🔥 AK-47 ASSAULT RIFLE',
        deserteagle: '🔥 DESERT EAGLE .50AE',
        m4a1: '🔥 M4A1 COMBAT CARBINE',
        plasma: '⚡ PLASMA SYNAPSE CHARGE'
      }[selectedGun as 'ak47'|'deserteagle'|'m4a1'|'plasma'] || '🔥 WEAPON DISCHARGE';
      ctx.fillText(gunLabel, state.pointerX, state.pointerY - 35);
      ctx.restore();
    }

    // Dynamic Skin Finishes colors
    const colors = {
      classic: { Stock: '#78350f', Body: '#1e293b', Highlight: '#475569', Laser: '#fbbf24', muzzle: '#ea580c' },
      gold: { Stock: '#b45309', Body: '#d97706', Highlight: '#f59e0b', Laser: '#f59e0b', muzzle: '#f59e0b' },
      arctic: { Stock: '#f1f5f9', Body: '#cbd5e1', Highlight: '#38bdf8', Laser: '#38bdf8', muzzle: '#0ea5e9' },
      stealth: { Stock: '#111827', Body: '#1f2937', Highlight: '#374151', Laser: '#ef4444', muzzle: '#f43f5e' },
      plasma: { Stock: '#c026d3', Body: '#111827', Highlight: '#22c55e', Laser: '#22c55e', muzzle: '#22c55e' }
    }[selectedSkin as 'classic'|'gold'|'arctic'|'stealth'|'plasma'] || { Stock: '#78350f', Body: '#1e293b', Highlight: '#475569', Laser: '#fbbf24', muzzle: '#ea580c' };

    // Draw Vector Weapon
    ctx.save();
    ctx.translate(width / 2, height + state.recoil);
    const angle = Math.atan2(state.pointerY - height, state.pointerX - width / 2);
    ctx.rotate(angle + Math.PI / 2);
    
    // Ambient shadows
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;

    // Define muzzle position for correct flash offsets
    let muzzleY = -170;

    if (selectedGun === 'deserteagle') {
      muzzleY = -75;
      
      // 1. Heavy Grip
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-10, 45);
      ctx.lineTo(-13, 10);
      ctx.lineTo(11, 10);
      ctx.lineTo(8, 45);
      ctx.closePath();
      ctx.fill();

      // Grip detail
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, 18, 7, 20);

      // 2. Iron Slide & Lower Frame
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-11, -70, 22, 80);

      // 3. Highlight Grooves along top chamber slide
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-9, -65, 3, 40);
      ctx.fillRect(6, -65, 3, 40);

      // 4. Trigger guard
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(6, -10, 8, 0, Math.PI, false);
      ctx.stroke();

      // Bevel back hammer
      ctx.fillStyle = '#475569';
      ctx.fillRect(-6, 8, 12, 4);

    } else if (selectedGun === 'm4a1') {
      muzzleY = -182;

      // 1. Sleek Tactical Buttstock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-9, 45);
      ctx.lineTo(-12, 12);
      ctx.lineTo(12, 12);
      ctx.lineTo(9, 45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-7, 30, 14, 15);

      // 2. High-Tech Lower and Upper Receiver
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-9, -58, 18, 70);

      // Grip 
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-5, 12);
      ctx.lineTo(-7, 30);
      ctx.lineTo(3, 30);
      ctx.lineTo(5, 12);
      ctx.closePath();
      ctx.fill();

      // 3. Straight Combat Magazine
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-8, -25, 6, 40);

      // 4. Scope Sight Block
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -64, 12, 8); // Base
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-4, -76, 8, 14); // Holographic glass sight
      
      // 5. Tactical Ribbed Handguard
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-8, -125, 16, 62, 4);
      ctx.fill();

      // Horizontal grooves on handguard
      ctx.fillStyle = '#020617';
      for (let g = -118; g <= -75; g += 10) {
        ctx.fillRect(-6, g, 12, 4);
      }

      // 6. Long Precise Carbon Barrel
      const m4barrelGrad = ctx.createLinearGradient(-2, 0, 2, 0);
      m4barrelGrad.addColorStop(0, colors.Body);
      m4barrelGrad.addColorStop(0.5, '#475569');
      m4barrelGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = m4barrelGrad;
      ctx.fillRect(-2, -180, 4, 55);

      // Front sight post
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -172, 6, 8);

    } else if (selectedGun === 'plasma') {
      muzzleY = -160;

      // 1. Futuristic Curved stock
      ctx.fillStyle = colors.Body;
      ctx.beginPath();
      ctx.roundRect(-10, 10, 20, 35, 6);
      ctx.fill();

      // Neon highlight cells inside stock
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-4, 16, 8, 20);

      // 2. Main High-Frequency Plasma receiver
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -75, 24, 85);

      // Glass charging Chamber tube with raw plasma inside!
      const glassGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      glassGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
      glassGrad.addColorStop(0.5, colors.Laser);
      glassGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.roundRect(-6, -65, 12, 50, 4);
      ctx.fill();

      // Cyber Grip
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-5, 10, 10, 22);

      // 3. Glowing Condenser Rings
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-9, -115, 18, 35);

      // Elliptical Plasma rings extending forward
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.ellipse(0, -95, 14, 5, 0, 0, Math.PI*2);
      ctx.ellipse(0, -110, 12, 4, 0, 0, Math.PI*2);
      ctx.fill();

      // 4. Arc focus emitters
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-3, -158, 6, 38);

      // Sideway focus spikes
      ctx.strokeStyle = colors.Highlight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -145);
      ctx.lineTo(-12, -162);
      ctx.moveTo(8, -145);
      ctx.lineTo(12, -162);
      ctx.stroke();

    } else if (selectedGun === 'awm') {
      muzzleY = -230;

      // 1. Sleek Sniper skeleton stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-9, 45);
      ctx.lineTo(-14, 12);
      ctx.lineTo(14, 12);
      ctx.lineTo(9, 45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 25, 10, 15); // cut-out

      // 2. Heavy steel Bolt Action receiver block
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-10, -78, 20, 92);

      // Tactile bolt handle
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(8, -35, 12, 4);
      ctx.beginPath();
      ctx.arc(19, -33, 4, 0, Math.PI * 2);
      ctx.fill();

      // Ammo Clip
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-7, -15, 14, 25);

      // 3. High magnification sniper Scope
      ctx.fillStyle = '#020617';
      ctx.fillRect(-7, -84, 14, 12); // Mounts
      ctx.fillRect(-5, -110, 10, 26); // Scope tube
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-8, -114, 16, 4); // lens front
      ctx.fillRect(-7, -84, 14, 2); // lens back

      // Bipod folded
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-4, -135, 8, 12);

      // 4. Ultra long custom carbon barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-2, -225, 4, 147);

      // Outer active compensator muzzle brake
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-4.5, -230, 9, 8);

    } else if (selectedGun === 'shotgun') {
      muzzleY = -125;

      // 1. Forest Oak-wood Buttstock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-11, 45);
      ctx.lineTo(-14, 10);
      ctx.lineTo(14, 10);
      ctx.lineTo(11, 45);
      ctx.closePath();
      ctx.fill();

      // Pistol slide grip curves
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, 36, 20, 6);

      // 2. Heavy Engraved Steel receiver panel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-9, -52, 18, 64);
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-10, -28, 2, 28);
      ctx.fillRect(8, -28, 2, 28);

      // Double trigger guard
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(2, 5, 8, 0, Math.PI);
      ctx.stroke();

      // 3. Slide reloading Forester forearm grip
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-9.5, -78, 19, 32, 4);
      ctx.fill();

      // Forearm rib grooves
      ctx.fillStyle = '#111827';
      ctx.fillRect(-8, -72, 16, 2);
      ctx.fillRect(-8, -66, 16, 2);
      ctx.fillRect(-8, -60, 16, 2);

      // 4. Side-by-side Dual heavy steel shotgun barrels
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-4.5, -122, 4.5, 45); // Left barrel
      ctx.fillRect(0.5, -122, 4.5, 45); // Right barrel

      // Sighting bead
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -123, 1.5, 0, Math.PI*2);
      ctx.fill();

    } else if (selectedGun === 'minigun') {
      muzzleY = -145;

      // 1. Heavy drum chassis container back
      ctx.fillStyle = colors.Body;
      ctx.beginPath();
      ctx.roundRect(-22, -18, 44, 40, 8);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -18, 15, 0, Math.PI*2);
      ctx.fill();

      // Ammunition round belt
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-18, 12, 6, 18);

      // Heavy spade grip on back
      ctx.strokeStyle = colors.Stock;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-16, 22);
      ctx.lineTo(-24, 38);
      ctx.lineTo(24, 38);
      ctx.lineTo(16, 22);
      ctx.stroke();

      // 2. Rotating Gatling gun chamber
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-13, -65, 26, 48);

      // 3. Multi-barrel cluster clamped rings
      ctx.fillStyle = '#475569';
      // Barrels
      ctx.fillRect(-8, -140, 2.5, 75);
      ctx.fillRect(-4, -140, 2.5, 75);
      ctx.fillRect(0, -140, 2.5, 75);
      ctx.fillRect(4, -140, 2.5, 75);
      ctx.fillRect(8, -140, 2.5, 75);

      // Compression clamps
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-10.5, -108, 21, 6);
      ctx.fillRect(-10.5, -138, 21, 6);

    } else if (selectedGun === 'rpg') {
      muzzleY = -120;

      // 1. Rear exhaust vent funnel
      ctx.fillStyle = colors.Body;
      ctx.beginPath();
      ctx.moveTo(-6, 24);
      ctx.lineTo(-14, 45);
      ctx.lineTo(14, 45);
      ctx.lineTo(6, 24);
      ctx.closePath();
      ctx.fill();

      // 2. Central launch tube wrap insulated wood
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-8, -52, 16, 76, 3);
      ctx.fill();

      // Double active grip panel
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-5, 4, 10, 16);

      // Sighting optics bracket
      ctx.fillStyle = '#020617';
      ctx.fillRect(-12, -35, 5, 12);
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-16, -42, 6, 8);

      // 3. Forward launch tube steel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-5, -84, 10, 32);

      // 4. Huge Rocket Propelled Grenade Warhead
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.moveTo(-4, -84);
      ctx.lineTo(-11, -94);
      ctx.lineTo(-11, -114);
      ctx.lineTo(0, -120); // nose tip
      ctx.lineTo(11, -114);
      ctx.lineTo(11, -94);
      ctx.lineTo(4, -84);
      ctx.closePath();
      ctx.fill();

      // Rocket stabilization fins visible on base
      ctx.fillStyle = '#475569';
      ctx.fillRect(-13, -92, 2.5, 12);
      ctx.fillRect(10.5, -92, 2.5, 12);

    } else if (selectedGun === 'mp5') {
      muzzleY = -140;

      // Stock bars
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-6, 12, 3, 28);
      ctx.fillRect(3, 12, 3, 28);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 38, 16, 6);

      // MP5 central chassis
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-8.5, -55, 17, 68);

      // Ammo link curvature clip (curved magazine)
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.moveTo(-6, -20);
      ctx.quadraticCurveTo(-14, -8, -17, 14);
      ctx.lineTo(-10, 16);
      ctx.quadraticCurveTo(-7, -2, 0, -20);
      ctx.closePath();
      ctx.fill();

      // Hand grip
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(-6, 26);
      ctx.lineTo(2, 26);
      ctx.lineTo(4, 10);
      ctx.closePath();
      ctx.fill();

      // Tactical front guard
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-8, -94, 16, 40, 5);
      ctx.fill();

      // Integrated long silence muzzle barrel
      ctx.fillStyle = '#020617';
      ctx.fillRect(-4.5, -138, 9, 45); // Suppressor casing
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-3.5, -140, 7, 2);

      // Top optics reflex sight
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, -64, 10, 7);
      ctx.strokeStyle = colors.Highlight;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-3.5, -72, 7, 8);

    } else if (selectedGun === 'revolver') {
      muzzleY = -90;

      // High-grade wood rustic grip
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-8, 36);
      ctx.lineTo(-12, 10);
      ctx.lineTo(8, 10);
      ctx.lineTo(4, 36);
      ctx.closePath();
      ctx.fill();

      // Frame with heavy cylinder chamber
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-10, -56, 20, 68);

      // Spinning Cylinder
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(-7.5, -45, 15, 34, 4);
      ctx.fill();

      ctx.fillStyle = colors.Highlight; // cylinder chamber highlights
      ctx.fillRect(-5.5, -41, 2, 26);
      ctx.fillRect(3.5, -41, 2, 26);

      // Heavy 6-inch rib chrome barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-3.5, -87, 7, 32);

      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-4.5, -89, 9, 3); // tip sighting posts

    } else if (selectedGun === 'm249') {
      muzzleY = -185;

      // Heavy duty bipod stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-11, 44);
      ctx.lineTo(-14, 10);
      ctx.lineTo(14, 10);
      ctx.lineTo(11, 44);
      ctx.closePath();
      ctx.fill();

      // Main box magazine feeds
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-12, -72, 24, 84);

      // Green canvas box mag
      ctx.fillStyle = '#166534'; // olive drab box
      ctx.beginPath();
      ctx.roundRect(-8, -32, 18, 28, 4);
      ctx.fill();

      // Golden bullets belt connected
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-15, -42, 8, 10);

      // Heavy ventilation forend
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-10, -125, 20, 54);

      // Machine barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-3, -182, 6, 58);
      ctx.fillStyle = '#020617';
      ctx.fillRect(-5, -185, 10, 4);

    } else if (selectedGun === 'awp_hyper') {
      muzzleY = -245;

      // Advanced composite skeleton stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-10, 48);
      ctx.lineTo(-15, 14);
      ctx.lineTo(15, 14);
      ctx.lineTo(10, 48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 30, 4, 0, Math.PI * 2);
      ctx.fill();

      // Precision steel frame upper receiver
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-11, -85, 22, 100);

      // Holographic highlight strips
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-10, -42, 2, 45);
      ctx.fillRect(8, -42, 2, 45);

      // Heavy modular high precision magazine
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-7.5, -20, 15, 28);

      // Extreme thermal camera hunting lens scope
      ctx.fillStyle = '#111827';
      ctx.fillRect(-5, -114, 10, 30); // support mounts
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.arc(0, -100, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -98, 2, 0, Math.PI * 2);
      ctx.fill();

      // Hyper metallic thermal suppressor muzzle brake
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-2.5, -238, 5, 154);

      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-5.5, -244, 11, 8); // heavy hyper muzzle brake

    } else if (selectedGun === 'kar98') {
      muzzleY = -210;

      // 1. Sleek authentic vintage wooden body
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-8, 45);
      ctx.lineTo(-12, 10);
      ctx.lineTo(12, 10);
      ctx.lineTo(8, 45);
      ctx.closePath();
      ctx.fill();

      // Long wooden shaft forearm
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-7, -135, 14, 145, 3);
      ctx.fill();

      // 2. Iron receiver block
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-8, -75, 16, 85);

      // Bolt handle
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(8, -40, 10, 3.5);
      ctx.beginPath();
      ctx.arc(17, -38, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ultra thin steel vintage barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-2, -205, 4, 130);

      // Sighting post
      ctx.fillStyle = '#1e2937';
      ctx.fillRect(-3, -200, 6, 6);

    } else if (selectedGun === 'glock17') {
      muzzleY = -72;

      // 1. Polymer grip
      ctx.fillStyle = '#111827'; // Dark polymer
      ctx.beginPath();
      ctx.moveTo(-8, 40);
      ctx.lineTo(-11, 10);
      ctx.lineTo(9, 10);
      ctx.lineTo(7, 40);
      ctx.closePath();
      ctx.fill();

      // Glock slide
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-9, -68, 18, 78);

      // Bevel & slide details
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-7, -62, 3, 40);
      ctx.fillRect(4, -62, 3, 40);

      // Trigger safety guard
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(5, -10, 7, 0, Math.PI, false);
      ctx.stroke();

      // Red laser indicator under-barrel
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -50, 1.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (selectedGun === 'barrett') {
      muzzleY = -250;

      // 1. Massive tactical support stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-11, 46);
      ctx.lineTo(-15, 12);
      ctx.lineTo(15, 12);
      ctx.lineTo(11, 46);
      ctx.closePath();
      ctx.fill();

      // Recoil pad
      ctx.fillStyle = '#020617';
      ctx.fillRect(-12, 34, 24, 12);

      // 2. Extra thick heavy receiver body with cooling slots
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-12.5, -92, 25, 104);

      // Cooling vents
      ctx.fillStyle = '#020617';
      ctx.fillRect(-4, -75, 8, 10);
      ctx.fillRect(-4, -55, 8, 10);
      ctx.fillRect(-4, -35, 8, 10);

      // 3. Massive .50 BMG Straight metal magazine
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-9, -30, 8, 45);

      // Heavy combat bolt handle
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(10, -50, 12, 4);

      // 4. Large Sniper Scope
      ctx.fillStyle = '#020617';
      ctx.fillRect(-7.5, -98, 15, 12); // mounts
      ctx.fillRect(-5.5, -125, 11, 28); // tube
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-8.5, -129, 17, 5); // big lens
      ctx.fillRect(-7.5, -98, 15, 3); // small lens

      // 5. Huge primary sniper barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-3.5, -242, 7, 150);

      // Large arrowhead compensator muzzle brake
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.moveTo(-9.5, -242);
      ctx.lineTo(-14, -250);
      ctx.lineTo(14, -250);
      ctx.lineTo(9.5, -242);
      ctx.closePath();
      ctx.fill();

    } else if (selectedGun === 'scar_h') {
      muzzleY = -182;

      // 1. SCAR Desert Stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-10, 45);
      ctx.lineTo(-13, 12);
      ctx.lineTo(13, 12);
      ctx.lineTo(10, 45);
      ctx.closePath();
      ctx.fill();

      // Stock Bevel
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-8, 30, 16, 15);

      // 2. SCAR Receiver Body
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-11, -80, 22, 92);

      // Picatinny top rail
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12, -78, 24, 4);

      // Ergonomic grip
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-6, 12, 11, 20);

      // Heavy magazine
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7.5, -34, 15, 34);

      // 3. Handguard 
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-9, -135, 18, 55);

      // 4. Barrel & hider
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-3.5, -174, 7, 40);

      ctx.fillStyle = '#020617';
      ctx.fillRect(-5.5, -182, 11, 8);

    } else if (selectedGun === 'laser_laser') {
      muzzleY = -150;

      // 1. High Tech Frame
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-12.5, -80, 25, 95);

      // 2. Quantum Green Core
      ctx.fillStyle = '#052e16';
      ctx.fillRect(-7, -65, 14, 40);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-4, -60, 8, 30); // glowing neon green core

      // Stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-9, 45);
      ctx.lineTo(-11, 15);
      ctx.lineTo(11, 15);
      ctx.lineTo(9, 45);
      ctx.closePath();
      ctx.fill();

      // Triple Alignment rings
      ctx.fillStyle = colors.Stock;
      ctx.fillRect(-10.5, -125, 21, 45);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -100, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Emitter lens
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-5.5, -145, 11, 20);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -146, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (selectedGun === 'grenade_launcher') {
      muzzleY = -140;

      // Heavy padded Stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-12, 45);
      ctx.lineTo(-15, 12);
      ctx.lineTo(15, 12);
      ctx.lineTo(12, 45);
      ctx.closePath();
      ctx.fill();

      // Bulky receiver
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-14, -60, 28, 72);

      // Pistol grip
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, 12, 11, 22);

      // Huge 40mm Rotary cylinder chamber
      ctx.fillStyle = '#020617';
      ctx.fillRect(-15, -104, 30, 44);
      // Chamber grooves
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-13, -100, 3, 36);
      ctx.fillRect(-2, -100, 4, 36);
      ctx.fillRect(10, -100, 3, 36);

      // Short superwide barrel
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-9.5, -135, 19, 31);

      // Muzzle sleeve
      ctx.fillStyle = '#020617';
      ctx.fillRect(-12.5, -144, 25, 10);

    } else {
      // ak47 drawing (Classic Heavy Assault Rifle with Active Cosmetic Theme)
      muzzleY = -174;

      // Wooden Custom Stock
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-12, 45);
      ctx.lineTo(-15, 10);
      ctx.lineTo(15, 10);
      ctx.lineTo(12, 45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-11, 40, 22, 5);

      // Receiver steel body
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-10, -55, 20, 65);

      // Pistol grip
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.moveTo(-5, 10);
      ctx.lineTo(-8, 32);
      ctx.lineTo(2, 32);
      ctx.lineTo(4, 10);
      ctx.closePath();
      ctx.fill();

      // Trigger guard
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(3, -10, 7, 0, Math.PI);
      ctx.stroke();

      // Steel curved Magazine
      ctx.fillStyle = colors.Highlight;
      ctx.beginPath();
      ctx.moveTo(-8, -25);
      ctx.quadraticCurveTo(-22, -10, -26, 20);
      ctx.lineTo(-15, 23);
      ctx.quadraticCurveTo(-11, -3, -1, -25);
      ctx.closePath();
      ctx.fill();

      // Handguard
      ctx.fillStyle = colors.Stock;
      ctx.beginPath();
      ctx.roundRect(-9, -98, 18, 43, 3);
      ctx.fill();

      // Barrel shaft & sights
      ctx.fillStyle = colors.Body;
      ctx.fillRect(-2.5, -168, 5, 70);
      ctx.fillStyle = colors.Highlight;
      ctx.fillRect(-5, -114, 10, 16); // gas block

      // Outer muzzle suppressor slant tip
      ctx.fillStyle = colors.Body;
      ctx.beginPath();
      ctx.moveTo(-2, -168);
      ctx.lineTo(-2, -174);
      ctx.lineTo(2, -172.5);
      ctx.lineTo(2, -168);
      ctx.closePath();
      ctx.fill();
    }

    // Awesome Spiky Weapon Muzzle Flash on recoil firing sequence!
    if (state.recoil > 4) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = colors.muzzle;
      
      // Outer bright neon sparks or standard muzzle star spikes
      ctx.fillStyle = colors.muzzle;
      ctx.beginPath();
      const spikes = selectedGun === 'plasma' ? 10 : 8;
      const outerRad = selectedGun === 'plasma' ? 36 : 28;
      const innerRad = 8;
      let rot = (Math.PI / 2) * 3;
      let stepAngle = Math.PI / spikes;

      ctx.moveTo(0, muzzleY - outerRad);
      for (let i = 0; i < spikes * 2; i++) {
        let r = (i % 2 === 0) ? outerRad : innerRad;
        let xPt = Math.cos(rot) * r;
        let yPt = muzzleY + Math.sin(rot) * r;
        ctx.lineTo(xPt, yPt);
        rot += stepAngle;
      }
      ctx.closePath();
      ctx.fill();

      // Core white hot/yellow flash
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, muzzleY, selectedGun === 'plasma' ? 14 : 11, 0, Math.PI * 2);
      ctx.fill();

      // Smoke puff vectors
      ctx.fillStyle = selectedGun === 'plasma' ? 'rgba(34,197,94,0.2)' : 'rgba(235, 235, 235, 0.45)';
      ctx.beginPath();
      ctx.arc(-11, muzzleY - 6, 6, 0, Math.PI * 2);
      ctx.arc(11, muzzleY - 8, 5.5, 0, Math.PI * 2);
      ctx.arc(0, muzzleY - 14, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Draw crosshair
    const recoilOffset = state.recoil * 2;
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.pointerX, state.pointerY, 20 + recoilOffset, 0, Math.PI * 2);
    ctx.moveTo(state.pointerX - 30 - recoilOffset, state.pointerY);
    ctx.lineTo(state.pointerX + 30 + recoilOffset, state.pointerY);
    ctx.moveTo(state.pointerX, state.pointerY - 30 - recoilOffset);
    ctx.lineTo(state.pointerX, state.pointerY + 30 + recoilOffset);
    ctx.stroke();
    
    // Inner dot
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.beginPath();
    ctx.arc(state.pointerX, state.pointerY, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    gameState.current.pointerX = e.clientX;
    gameState.current.pointerY = e.clientY;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    gameState.current.pointerX = e.clientX;
    gameState.current.pointerY = e.clientY;
    gameState.current.isTriggerHeld = true;
    gameState.current.isFiring = true;
  };

  const handlePointerUp = () => {
    gameState.current.isTriggerHeld = false;
  };

  return (
    <div 
      className="absolute inset-0 bg-[#0f172a] touch-none overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Pristine, high-fidelity dark misty Forest Background as the separate game display */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-stone-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-transparent to-stone-950/80"></div>
      </div>

      {/* Game Canvas Overlay (where birds fly, bullets trace, particle feed, and rifle displays) */}
      <canvas
         ref={canvasRef}
         className="absolute inset-0 w-full h-full z-10"
      />

      {/* Control Mode Selection Modal (Shown before starting to play) */}
      {controlMode === 'undecided' && (
        <div className="absolute inset-0 z-50 bg-[#1a1005]/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#3a2a1c] border-4 border-[#5c3a21] p-8 rounded-3xl max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
            {/* Ambient visual glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-3xl font-black text-amber-50 mb-3 uppercase tracking-wide flex items-center justify-center gap-2">
              <Crosshair className="w-8 h-8 text-[#a3e635] animate-pulse" /> Air Shoot
            </h2>
            <p className="text-amber-100/80 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Choose your control interface to begin hunt. Webcam mode tracks your hand finger movements smoothly!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Webcam Controls (Real-time Hand Tracking) */}
              <button 
                onClick={() => {
                  setControlMode('camera');
                  setIsLoadingCamera(true);
                }}
                className="group relative flex flex-col items-center justify-between p-6 bg-[#1f2937]/90 hover:bg-[#1f2937] border-2 border-emerald-500/40 hover:border-emerald-500 rounded-2xl text-center cursor-pointer transition-all hover:scale-[1.03] active:scale-95 shadow-lg"
              >
                <div className="w-12 h-12 bg-emerald-950/75 border-2 border-emerald-500 rounded-xl flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  📹
                </div>
                <div className="w-full">
                  <h3 className="text-base font-black text-emerald-400 uppercase tracking-wider mb-1">Webcam Control</h3>
                  <p className="text-xs text-stone-300 leading-normal">
                    Aim with hands & <span className="text-emerald-300 font-bold">Pinch thumb + index finger (👌)</span> for heavy AK-47 burst!
                  </p>
                </div>
              </button>

              {/* Option 2: Pure Mouse/Touch Swipe Controls */}
              <button 
                onClick={() => {
                  setControlMode('touch');
                }}
                className="group relative flex flex-col items-center justify-between p-6 bg-[#1f2937]/90 hover:bg-[#1f2937] border-2 border-amber-500/30 hover:border-amber-500 rounded-2xl text-center cursor-pointer transition-all hover:scale-[1.03] active:scale-95 shadow-lg"
              >
                <div className="w-12 h-12 bg-amber-950/75 border-2 border-amber-500 rounded-xl flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  👆
                </div>
                <div className="w-full">
                  <h3 className="text-base font-black text-amber-400 uppercase tracking-wider mb-1">Touch & Mouse</h3>
                  <p className="text-xs text-stone-300 leading-normal">
                    Move cursor/swipe fingers to aim, and <span className="text-amber-300 font-bold">tap anywhere</span> to shoot.
                  </p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => onNavigate('home')}
              className="mt-8 py-2 px-6 text-stone-400 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors pointer-events-auto cursor-pointer"
            >
              ← Back to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Bottom right corner: Sleek, sci-fi bordered physical camera feed box with mirrored layout */}
      {controlMode === 'camera' && !cameraError && (
        <div 
          className="absolute bottom-6 right-6 z-20 w-44 h-32 md:w-56 md:h-40 rounded-2xl border-4 border-[#5c3a21] bg-[#1a1005]/90 overflow-hidden shadow-2xl flex flex-col justify-end pointer-events-none"
          style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 15px rgba(163,230,53,0.1)' }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 scale-x-[-1]"
          />
          
          {/* Diagnostic Corner Targets */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#a3e635] opacity-60"></div>
          <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-[#a3e635] opacity-60"></div>
          <div className="absolute bottom-9 left-2 w-2 h-2 border-b-2 border-l-2 border-[#a3e635] opacity-60"></div>
          <div className="absolute bottom-9 right-2 w-2 h-2 border-b-2 border-r-2 border-[#a3e635] opacity-60"></div>

          {/* Clean tactical status label */}
          <div className="relative z-10 bg-stone-900/90 border-t border-stone-800 px-2 py-1.5 text-[10px] text-amber-200/90 font-black tracking-wider text-center uppercase flex items-center justify-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoadingCamera ? 'bg-amber-400 animate-pulse' : (gameState.current.handLandmarks ? 'bg-emerald-500 animate-ping' : 'bg-red-500')}`}></span>
            {isLoadingCamera ? 'LOADING CAMERA...' : (gameState.current.handLandmarks ? 'HAND RECOGNIZED' : 'ALIGN GESTURE')}
          </div>
        </div>
      )}

      {/* Small clean floating camera state indicator, instead of full black screen blocking loading page */}
      {controlMode === 'camera' && isLoadingCamera && !cameraError && (
        <div className="absolute bottom-6 left-6 z-20 bg-stone-900/85 backdrop-blur-md px-4 py-3 rounded-xl text-amber-200 border border-stone-700/50 flex items-center gap-2.5 text-xs font-bold shadow-lg animate-pulse pointer-events-none">
          <div className="w-3 h-3 bg-[#a3e635] rounded-full animate-ping"></div>
          Webcam hand-control tracking starting...
        </div>
      )}

      {/* Camera / Permission Error Overlay Modal */}
      {controlMode === 'camera' && cameraError && (
        <div className="absolute inset-0 z-50 bg-[#2a1a10]/95 backdrop-blur-md flex items-center justify-center pointer-events-auto">
          <div className="bg-[#3a2a1c] border-4 border-[#5c3a21] p-8 rounded-3xl max-w-md w-full mx-4 flex flex-col items-center shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-900/50 border-2 border-red-500 rounded-full flex items-center justify-center mb-4 text-red-100">
              <CameraOff className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-amber-50 mb-2 uppercase tracking-wide">Webcam Access Denied</h2>
            <p className="text-amber-100/80 text-sm mb-6 leading-relaxed">
              We need **Camera permissions** to access hand tracking for gesture controls. Please allow camera permissions, or choose to play with direct mouse/touch drags instead!
            </p>
            <div className="bg-[#1a1005] p-3 rounded-xl text-left text-xs font-mono text-amber-200/50 mb-6 w-full overflow-x-auto whitespace-pre-wrap">
              Error Details: {cameraError}
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => {
                  setCameraError(null);
                  setIsLoadingCamera(true);
                  setRetryCount(prev => prev + 1);
                }}
                className="w-full py-3 bg-[#65a30d] hover:bg-[#84cc16] text-white font-black text-lg rounded-xl shadow-[0_4px_0_#3f6212] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                RETRY CAMERA FEED
              </button>
              <button 
                onClick={() => {
                  setCameraError(null);
                  setControlMode('touch');
                }}
                className="w-full py-3 bg-[#8b5a2b] hover:bg-[#a97541] text-amber-100 font-black text-lg rounded-xl shadow-[0_4px_0_#5c3a21] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                PLAY WITH TOUCH/MOUSE
              </button>
              <button 
                onClick={() => onNavigate('home')}
                className="w-full py-2 text-amber-200/70 hover:text-white text-sm font-bold mt-2 cursor-pointer"
              >
                Back to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      {controlMode !== 'undecided' && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => onNavigate('home')}
              className="p-3 bg-[#5c3a21]/80 backdrop-blur rounded-xl text-amber-100 border-2 border-[#8b5a2b] cursor-pointer hover:bg-[#6c4824] transition-all"
              title="Back to Main Menu"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={toggleSound}
              className={`p-3 backdrop-blur rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center ${
                soundEnabled 
                  ? 'bg-emerald-950/80 text-green-400 border-emerald-600 hover:bg-emerald-920/80' 
                  : 'bg-red-950/80 text-red-400 border-red-800 hover:bg-red-920/80'
              }`}
              title="Toggle SFX Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="flex gap-2 pointer-events-auto items-stretch">
            <div className="bg-[#2a1a10]/80 backdrop-blur border-2 border-[#5c3a21] px-6 py-2 rounded-xl text-center">
              <div className="text-amber-100/70 font-bold text-sm uppercase tracking-wider">Level {currentLevel}</div>
              <div className="text-3xl font-black text-[#a3e635] flex items-center gap-2">
                <Target className="w-6 h-6" /> {birdsRemaining}
              </div>
            </div>
            
            <button
              id="skip-level-btn"
              onClick={() => {
                setLevelWon(true);
                completeLevel(currentLevel);
                playSoundEffect('win');
              }}
              className="px-4 py-2 bg-gradient-to-b from-[#eab308] to-[#92400e] hover:from-yellow-400 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-yellow-300 shadow-md active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              ⭐ Complete Level
            </button>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {levelWon && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto font-sans">
          <div className="bg-[#3a2a1c] border-4 border-[#5c3a21] p-8 rounded-3xl max-w-sm w-full mx-4 flex flex-col items-center shadow-2xl relative overflow-hidden">
            {/* Glowing Victory background shine */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#a3e635] to-[#4d7c0f] mb-1.5 uppercase tracking-wide">Victory!</h2>
            <p className="text-amber-100 text-base mb-6 font-bold uppercase tracking-wider">Level {currentLevel} Cleared</p>
            
            <div className="bg-[#2a1a10] w-full p-4 rounded-2xl text-center border-2 border-[#5c3a21] mb-6 shadow-inner">
              <span className="text-[10px] text-amber-200/50 uppercase font-black tracking-widest block mb-1">REWARD</span>
              <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1.5">
                +100 Coins 🎉
              </span>
            </div>

            {totalLevelsCompletedCount > 0 && totalLevelsCompletedCount % 10 === 0 && (
              <div className="bg-[#4c1d95]/75 border-2 border-purple-400 p-3 rounded-2xl text-center mb-6 animate-pulse w-full">
                <span className="text-[10px] text-purple-200 uppercase font-black tracking-widest block font-sans">BONUS UNLOCKED</span>
                <span className="text-sm font-black text-yellow-300 flex items-center justify-center gap-1 uppercase">
                  🎉 10 LEVELS CLEARED!
                </span>
                <span className="text-[11px] text-white font-bold block mt-0.5">You earned 1 FREE LUCKY SPIN! 🎁</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5 w-full font-sans">
              {totalLevelsCompletedCount > 0 && totalLevelsCompletedCount % 10 === 0 && (
                <button 
                  onClick={() => onNavigate('spin')}
                  className="w-full py-3.5 bg-gradient-to-b from-purple-600 to-indigo-800 border-2 border-purple-400 text-white font-extrabold rounded-xl active:translate-y-0.5 transition-all cursor-pointer text-center uppercase tracking-wider text-xs shadow-md"
                >
                  🔮 USE LUCKY SPIN NOW
                </button>
              )}

              {currentLevel < 200 ? (
                <button 
                  onClick={handleNextLevel}
                  className="w-full py-4 bg-gradient-to-b from-[#84cc16] to-[#4d7c0f] hover:from-[#a3e635] hover:to-[#65a30d] text-white font-black text-xl rounded-xl shadow-[0_4px_0_#3f6212] active:translate-y-1 active:shadow-none transition-all cursor-pointer text-center uppercase tracking-wider block"
                >
                  🚀 NEXT LEVEL
                </button>
              ) : (
                <div className="text-center font-black text-yellow-500 bg-stone-950/40 p-2.5 rounded-xl border border-yellow-600/30 text-xs mb-1">
                  🏆 FINAL LEVEL COMPLETED!
                </div>
              )}

              <button 
                onClick={() => onNavigate('levels')}
                className="w-full py-3 bg-[#5c3a21] hover:bg-[#8b5a2b] border-2 border-[#8b5a2b] text-amber-100 font-bold rounded-xl active:translate-y-0.5 transition-colors cursor-pointer text-center"
              >
                LEVEL SELECTION MAP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
