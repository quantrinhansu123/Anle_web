import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, User as UserIcon } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';
import type { SystemSettings } from '../../types/systemSettings';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await systemSettingsService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch company info:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background flex items-center justify-center px-4 py-10">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-white shadow-xl shadow-blue-500/15 ring-1 ring-blue-100 mb-5 overflow-hidden">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-full h-full object-contain p-2 bg-white" 
                onError={(event) => { event.currentTarget.src = '/anle-logo.png'; }}
              />
            ) : (
              <img src="/print-header.png" alt="An Le logo" className="absolute max-w-none w-[280%] h-auto left-[5%] top-[24%]" />
            )}
          </div>
          <h1 className="text-[clamp(1.25rem,3.5vw,1.875rem)] leading-[1.3] font-black text-foreground tracking-tight">
            ANLE - SUPPLY CHAIN MANAGEMENT<br />CO.,LTD
          </h1>
          <p className="text-muted-foreground text-[18px] font-medium mt-2">Management Information System</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-[560px] mx-auto bg-card rounded-[2.5rem] border border-border shadow-2xl p-10 backdrop-blur-sm dark:bg-card/80">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground text-base">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-[12px] font-bold flex items-center gap-2 animate-in shake duration-300">
                <div className="w-1 h-4 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground/70 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-[#e9f1ff] border border-[#e1e8f2] rounded-full text-base text-foreground font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-foreground/70">Password</label>
                <a href="#" className="text-sm font-bold text-blue-500 hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-[#e9f1ff] border border-[#e1e8f2] rounded-full text-base text-foreground font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white py-5 rounded-full text-lg font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-7 border-t border-border flex flex-col items-center gap-5">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
                <UserIcon size={14} />
              </div>
              <span className="text-base font-bold text-muted-foreground group-hover:text-foreground transition-colors">Admin Portal</span>
            </div>
            <p className="text-sm text-muted-foreground/60 font-medium">© 2026 ANLE - SUPPLY CHAIN MANAGEMENT CO.,LTD. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
