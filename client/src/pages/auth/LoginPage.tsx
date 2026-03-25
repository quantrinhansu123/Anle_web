import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 mb-4 transform hover:scale-105 transition-transform duration-300">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">An Le Solutions</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Management Information System</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2rem] border border-border shadow-2xl p-8 backdrop-blur-sm bg-white/80">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-[13px]">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold flex items-center gap-2 animate-in shake duration-300">
                <div className="w-1 h-4 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-border rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[12px] font-bold text-slate-700">Password</label>
                <a href="#" className="text-[11px] font-bold text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-border rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-2xl text-[15px] font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
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

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <UserIcon size={14} />
              </div>
              <span className="text-[12px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Admin Portal</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">© 2026 An Le Solutions Co., Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
