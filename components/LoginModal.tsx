
import React, { useState, useEffect } from 'react';
import { X, Lock, ArrowRight, ShieldCheck, KeyRound, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Theme } from '../types';
import { checkAuthSetup, setupPassword, verifyPassword, isCloudConfigured } from '../services/cloudService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  theme: Theme;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, theme }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  const isCloud = isCloudConfigured();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsLoading(true);
    if (isCloud) {
      // Check cloud status
      const setup = await checkAuthSetup();
      setIsSetupMode(!setup);
    } else {
      // Fallback to local storage
      const stored = localStorage.getItem('lumina_admin_pwd');
      setIsSetupMode(!stored);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSetupMode) {
        // SETUP FLOW
        if (password.length < 4) {
          throw new Error('密码太短');
        }
        if (password !== confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }

        if (isCloud) {
           const success = await setupPassword(password);
           if (!success) throw new Error('云端设置失败，请检查网络');
        } else {
           localStorage.setItem('lumina_admin_pwd', password);
        }
        
        onLoginSuccess();
        onClose();

      } else {
        // LOGIN FLOW
        let isValid = false;
        if (isCloud) {
           isValid = await verifyPassword(password);
        } else {
           const stored = localStorage.getItem('lumina_admin_pwd');
           isValid = password === stored;
        }

        if (isValid) {
          onLoginSuccess();
          onClose();
        } else {
          throw new Error('密码错误');
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  if (!isOpen) return null;

  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-white/50" : "text-black/50";
  const inputBg = isDark ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-white/30 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 focus:bg-black/5 focus:border-black/30 text-black placeholder:text-black/30";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${isDark ? 'bg-black/60 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-md'}`}>
      <GlassCard className={`w-full max-w-sm p-8 ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`} hoverEffect={false} theme={theme}>
        <button onClick={onClose} className={`absolute top-4 right-4 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>
            {isSetupMode ? <ShieldCheck size={24} /> : <Lock size={24} />}
          </div>
          <h2 className={`text-2xl font-serif ${textPrimary}`}>
            {isSetupMode ? '首次设置' : '管理员登录'}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            {isCloud ? <Cloud size={12} className="text-blue-400" /> : <CloudOff size={12} className="text-gray-400" />}
            <p className={`${textSecondary} text-xs`}>
              {isCloud ? '云端同步已启用 (密码永久保存)' : '本地模式 (仅限当前设备)'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound size={16} className={`absolute left-3 top-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
            <input 
              type="password" autoFocus
              placeholder={isSetupMode ? "设置新密码" : "输入密码"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all ${inputBg} disabled:opacity-50`}
            />
          </div>

          {isSetupMode && (
            <div className="relative animate-fade-in">
              <KeyRound size={16} className={`absolute left-3 top-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <input 
                type="password" placeholder="确认新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all ${inputBg} disabled:opacity-50`}
              />
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed
              ${isDark ? 'bg-white text-black' : 'bg-black text-white'}
            `}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isSetupMode ? '设置并登录' : '登录'} 
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>
      </GlassCard>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};
