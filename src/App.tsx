/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useGameStore } from './store';
import { ScreenType } from './types';
import LoginScreen from './components/screens/LoginScreen';
import MainMenu from './components/screens/MainMenu';
import LevelsScreen from './components/screens/LevelsScreen';
import GameRunner from './components/screens/GameRunner';
import HelpScreen from './components/screens/HelpScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import GunsScreen from './components/screens/GunsScreen';
import LuckySpinScreen from './components/screens/LuckySpinScreen';
import MenuMusic from './components/MenuMusic';

export default function App() {
  const isLoggedIn = useGameStore((state) => state.isLoggedIn);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(isLoggedIn ? 'home' : 'login');

  const navigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  if (!isLoggedIn && currentScreen !== 'login') {
    return <LoginScreen onLogin={() => navigate('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#2e3b32] text-amber-50 font-sans overflow-hidden relative select-none">
      {/* Background Music Synthesizer for Menus */}
      <MenuMusic currentScreen={currentScreen} />

      {/* Screens */}
      {currentScreen === 'login' && <LoginScreen onLogin={() => navigate('home')} />}
      {currentScreen === 'home' && <MainMenu onNavigate={navigate} />}
      {currentScreen === 'levels' && <LevelsScreen onNavigate={navigate} />}
      {currentScreen === 'game' && <GameRunner onNavigate={navigate} />}
      {currentScreen === 'help' && <HelpScreen onNavigate={navigate} />}
      {currentScreen === 'settings' && <SettingsScreen onNavigate={navigate} />}
      {currentScreen === 'guns' && <GunsScreen onNavigate={navigate} />}
      {currentScreen === 'spin' && <LuckySpinScreen onNavigate={navigate} />}
    </div>
  );
}
