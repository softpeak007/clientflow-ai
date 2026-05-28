import React, { useState } from 'react';
import { signInWithGoogle, db, auth } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  Info, 
  ShieldAlert, 
  Laptop, 
  UserCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Layers, 
  Sparkles,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Set to false to instantly hide the Quick Test login/prefill panel for a pure production build.
const ENABLE_DEMO_MODE = true;

export default function LoginView() {
  const navigate = useNavigate();
  const { signInAsDemo } = useAuth();
  
  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'client'>('admin');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Quick info about test accounts
  const testAccounts = {
    freelancer: { email: 'freelancer@clientflow.test', password: 'password123' },
    client: { email: 'client@clientflow.test', password: 'password123' }
  };

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Safe signup configuration setting to bypass any onAuthStateChanged race conditions
        localStorage.setItem('pending_signup_role', role);
        
        // Sign up logic
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credentials.user, {
          displayName: displayName || email.split('@')[0]
        });

        // Store role specification in firestore
        try {
          const userRef = doc(db, 'users', credentials.user.uid);
          await setDoc(userRef, {
            uid: credentials.user.uid,
            email: credentials.user.email,
            displayName: displayName || credentials.user.email?.split('@')[0],
            role: role,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Could not write user metadata to Firestore, registered locally:", dbErr);
        }
      } else {
        // Sign in logic
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Credentials auth failed:', err);
      let msg = 'Authentication error. Please verify your internet and format.';
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        msg = 'unauthorized-domain';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email address is already in use.';
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        msg = 'Invalid credentials. Double check your email/password. Try using Quick Demo if you have iframe cookie blocks.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Your password must be at least 6 characters.';
      } else {
        msg = err?.message || msg;
      }
      setError(msg);
    } finally {
       setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to sign in with Google:', err);
      let message = 'An unrecognizable error occurred during Google sign-in.';
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        message = 'unauthorized-domain';
      } else if (err?.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser. Please enable popups for this site or try Demo Mode.';
      } else if (err?.code === 'auth/web-storage-unsupported' || err?.message?.includes('storage')) {
        message = 'Third-party cookies/web storage might be blocked in this iframe. Try Quick Demo Login below!';
      } else {
        message = err?.message || message;
      }
      setError(message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoClick = (role: 'admin' | 'client') => {
    signInAsDemo(role);
    navigate('/');
  };

  // Pre-fills standard input fields and logs in for real Firebase testing
  const handlePrefillTestAndLogin = (accountType: 'freelancer' | 'client') => {
    const creds = testAccounts[accountType];
    setEmail(creds.email);
    setPassword(creds.password);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract geometric background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden p-6 md:p-8 space-y-6 relative z-10 border border-slate-100"
      >
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <div className="w-5 h-5 border-4 border-white rounded"></div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">ClientFlow</h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-widest">Client Operating System (OS)</p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            {error === 'unauthorized-domain' ? (
              <div className="p-5 bg-orange-50/95 rounded-2xl border border-orange-200 text-xs text-slate-700 space-y-3.5 leading-relaxed">
                <div className="flex items-center gap-2.5 text-orange-850 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0" />
                  <span>Authorize Preview Domains in Firebase Console</span>
                </div>
                <div className="space-y-2 mt-2">
                  <p className="font-semibold text-slate-705 leading-normal">
                    <span className="text-orange-900 font-bold">⚠️ Google Sign-In Problem:</span> Firebase authentication is currently rejecting logins because this preview domain is not whitelisted in your Firebase configuration settings yet.
                  </p>
                  
                  <div className="p-3 bg-white/80 rounded-xl border border-orange-100 text-slate-650 space-y-1.5 font-medium">
                    <p className="text-slate-800 font-bold">🛠️ How to fix in 10 seconds (Aise thhek karein):</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                      <li>Open your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Firebase Console</a></li>
                      <li>Go to <strong>Authentication</strong> &rarr; <strong>Settings</strong> tab &rarr; <strong>Authorized domains</strong></li>
                      <li>Click <strong>Add domain</strong> and add these two URLs:</li>
                    </ol>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl font-mono text-[9px] text-slate-700 space-y-1 select-all border border-orange-150">
                    <p>ais-dev-52t4knnnizapo2vm3hsei3-826788053675.asia-southeast1.run.app</p>
                    <p>ais-pre-52t4knnnizapo2vm3hsei3-826788053675.asia-southeast1.run.app</p>
                  </div>

                  <div className="border-t border-orange-150 pt-2.5 mt-2 space-y-2">
                    <p className="text-slate-600 font-bold text-[10.5px]">
                      💡 Instant Bypass (Bina update kiye login karne ke liye upar/neeche Demo use karein):
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDemoClick('admin')}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Instant Bypass Mode: Log In as Demo Freelancer
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-1 text-[10px] text-slate-550 font-bold hover:underline block"
                >
                  Dismiss warning
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex gap-3 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold">Credential Authentication Notice</span>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleCredentialsAuth} className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              {isSignUp ? 'Create Credentials' : 'Sign in using credentials'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {isSignUp ? 'Already member? Sign In' : 'Need account? Sign Up'}
            </button>
          </div>

          {isSignUp && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Your Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-xs transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="freelancer@clientflow.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-xs transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-xs transition-all font-medium"
              />
            </div>
          </div>

          {/* Sign Up Role Choice */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Choose Profile Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    role === 'admin' 
                      ? 'border-blue-600 bg-blue-50/20 text-blue-700' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-650'
                  }`}
                >
                  Freelancer / Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`py-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    role === 'client' 
                      ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-650'
                  }`}
                >
                  Client Portal
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#162a4a] text-white rounded-xl font-bold text-xs tracking-wide uppercase transition-all shadow-md hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Processing Authentication...' : isSignUp ? 'Create Workspace' : 'Sign in to ClientOS'}
          </button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest">
            <span className="bg-white px-4 text-slate-450">Or Connect</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl font-bold text-xs transition-all hover:bg-slate-50/50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          {loadingGoogle ? 'Initializing Sign In...' : 'Verify using Google'}
        </button>

        {/**************** DEMO MODE / QUICK TEST LOGIN PANEL ****************/
        ENABLE_DEMO_MODE && (
          <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-2xl space-y-3.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Demo Mode • Quick Test Login
              </span>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold uppercase">
                Instant
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-normal">
              Instantly preview and test both dashboard portals filled with simulated live projects, invoices, line-item PDF prints, and activity logs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Direct Admin Login */}
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                className="flex items-center gap-3 p-3 rounded-xl border border-blue-200/50 bg-white hover:border-blue-600 hover:bg-blue-50/30 text-slate-800 hover:text-blue-900 transition-all text-left shadow-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block leading-none text-slate-900">1. Freelancer / Admin</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1 font-mono">sarah.freelancer@example.com</span>
                </div>
              </button>

              {/* Direct Client Login */}
              <button
                type="button"
                onClick={() => handleDemoClick('client')}
                className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200/55 bg-white hover:border-emerald-600 hover:bg-emerald-50/30 text-slate-800 hover:text-emerald-950 transition-all text-left shadow-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block leading-none text-slate-900 font-sans">2. Client Portal</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1 font-mono">john.client@example.com</span>
                </div>
              </button>
            </div>

            {/* Quick Pre-fill / Instructions */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-wrap justify-between items-center text-[10px] gap-2">
              <span className="text-slate-400 font-semibold">Test real Firebase Creds manually:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrefillTestAndLogin('freelancer')}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Auto-fill Freelancer Form
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => handlePrefillTestAndLogin('client')}
                  className="text-emerald-600 hover:underline font-bold"
                >
                  Auto-fill Client Form
                </button>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-450 leading-relaxed font-medium">
              💡 <strong>Pro Tip:</strong> Password for both Auto-fill accounts is <strong>password123</strong>. Ideal for testing actual Firebase authentication flows and persistent user sign-ups easily.
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-1">
          <Info className="w-3.5 h-3.5 text-slate-300" />
          Popups can occasionally fail in workspace previews. Clean demo setups guarantee a persistent checkout flow.
        </p>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            By continuing, you establish a professional agreement with <br /> 
            <strong>ClientFlow Corporate Services</strong>. Highly compliant with client sandbox policies.
          </p>
        </div>
      </motion.div>
      
      <p className="mt-6 text-slate-500 text-xs font-bold flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        Authentication Workspace Live • ClientOS 1.0.6
      </p>
    </div>
  );
}


