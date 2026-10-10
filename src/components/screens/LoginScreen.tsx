import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { Mail, Phone, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const login = useGameStore((state) => state.login);

  const handleMethodChange = (newMethod: 'email' | 'phone') => {
    setMethod(newMethod);
    setInputValue('');
    setErrorMsg(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setErrorMsg(null);
    if (method === 'phone') {
      // Keep only numbers
      val = val.replace(/\D/g, '');
      if (val.length > 10) {
        val = val.slice(0, 10);
      }
    }
    setInputValue(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    if (method === 'phone') {
      if (inputValue.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit phone number');
        return;
      }
      login(null, inputValue);
    } else {
      login(inputValue, null);
    }
    onLogin();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-[#4a3b2c]/90 border-4 border-[#3a2a1c] rounded-2xl shadow-2xl flex flex-col items-center">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-[#a3e635] to-[#4d7c0f] tracking-wider uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center">
          Air<br/>Shoot
        </h1>
        <p className="text-amber-200/80 mb-8 text-sm">Join the hunt using your device camera.</p>

        <div className="flex w-full mb-6 bg-[#3a2a1c] rounded-lg p-1">
          <button
            onClick={() => handleMethodChange('email')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
              method === 'email' ? 'bg-[#5c4a3d] text-white shadow-inner' : 'text-amber-200/60 hover:text-white'
            }`}
          >
            <Mail className="inline-block w-4 h-4 mr-2" />
            Email
          </button>
          <button
            onClick={() => handleMethodChange('phone')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
              method === 'phone' ? 'bg-[#5c4a3d] text-white shadow-inner' : 'text-amber-200/60 hover:text-white'
            }`}
          >
            <Phone className="inline-block w-4 h-4 mr-2" />
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <input
              type={method === 'email' ? 'email' : 'tel'}
              placeholder={method === 'email' ? 'Enter your email address...' : 'Enter 10-digit number...'}
              value={inputValue}
              onChange={handleInputChange}
              maxLength={method === 'phone' ? 10 : undefined}
              className={`w-full px-4 py-3 bg-[#2a1a10] border-2 text-amber-50 rounded-xl focus:outline-none transition-colors placeholder:text-amber-50/30 font-bold ${
                method === 'phone' && inputValue.length > 0 && inputValue.length < 10
                  ? 'border-red-500 focus:border-red-400'
                  : method === 'phone' && inputValue.length === 10
                  ? 'border-green-500 focus:border-green-400'
                  : 'border-[#5c4a3d] focus:border-[#a3e635]'
              }`}
              required
            />
            {method === 'phone' && (
              <div className="flex justify-between items-center mt-1 px-1">
                <span className="text-amber-200/50 text-[10px] font-bold uppercase tracking-wider">
                  Mobile Number (केवल 10 अंक)
                </span>
                <span className={`text-[10px] font-black ${inputValue.length === 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {inputValue.length}/10 digits
                </span>
              </div>
            )}
            {errorMsg && (
              <p className="text-red-400 font-bold text-xs mt-1.5 animate-pulse text-left px-1">
                ⚠ {errorMsg}
              </p>
            )}
            {method === 'phone' && inputValue.length > 0 && inputValue.length < 10 && (
              <p className="text-amber-300 text-[11px] font-bold mt-1 text-left px-1">
                * Mobile number must be exactly 10 digits *
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={method === 'phone' && inputValue.length !== 10}
            className={`w-full py-4 bg-gradient-to-b text-white font-black text-xl rounded-xl shadow-[0_4px_0_#3f6212] active:shadow-[0_0px_0_#3f6212] active:translate-y-1 transition-all flex items-center justify-center gap-2 ${
              method === 'phone' && inputValue.length !== 10
                ? 'from-gray-600 to-gray-800 border-gray-900 shadow-[0_4px_0_#1f2937] cursor-not-allowed opacity-50'
                : 'from-[#65a30d] to-[#4d7c0f] hover:from-[#84cc16] hover:to-[#65a30d]'
            }`}
          >
            CONTINUE <ArrowRight className="w-6 h-6" />
          </button>
        </form>

      </div>
    </div>
  );
}
