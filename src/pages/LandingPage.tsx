import React from 'react';
import {
  Zap,
  Lock,
  Cloud,
  Layers,
  Sparkles,
  ChevronRight,
  Github,
  Twitter,
  Mail,
  Check,
  MousePointer2,
  Share2,
  Search,
  Layout
} from 'lucide-react';
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors selection:bg-purple-100 dark:selection:bg-purple-900/40">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center rotate-6 shadow-lg">
              <Layout className="text-white dark:text-zinc-900" size={18} />
            </div>
            <span className="text-xl font-black tracking-tighter italic">JAM</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <button className="text-sm font-bold px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-bold px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:scale-105 active:scale-95 shadow-xl transition-all">
                Get Started
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
            <Sparkles size={12} className="text-purple-500" /> Introducing Block-Based Flow
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-balance">
            Elevate Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 animate-gradient-x">Strategic Thinking</span>
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            A minimalist workspace that brings clarity to your notes.
            Block-based editing meets instant sync for the ultimate creative flow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto px-10 py-5 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-500 hover:shadow-[0_0_40px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2 group">
                Start taking notes <Zap size={20} className="fill-current" />
              </button>
            </SignUpButton>
            <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-bold text-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              View platforms
            </button>
          </div>

          {/* Hero Image Mockup */}
          <div className="relative pt-12">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent z-10" />
            <div className="p-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden">
              <img
                src="/antigravity/brain/47fee5db-7e02-44f0-8e1b-5086eeeaf5ea/jam_hero_dashboard_1768360547758.png"
                alt="JAM App Desktop View"
                className="w-full h-auto rounded-3xl"
              />
            </div>
            {/* Floating Elements (Visual Polish) */}
            <div className="absolute -left-12 top-1/2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-bounce-slow hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600">
                  <Cloud size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sync Status</p>
                  <p className="text-sm font-bold">Instantly Synced</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 bottom-1/4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
                  <Lock size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Security</p>
                  <p className="text-sm font-bold">End-to-End Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: Thinking Styles */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 space-y-6 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 transition-colors">
              <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-lg text-purple-600">
                <Layers size={28} />
              </div>
              <h3 className="text-2xl font-bold">Capture instantly</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                From quick thoughts to deep research. Our block-based system handles everything effortlessly.
              </p>
            </div>
            <div className="p-10 space-y-6 rounded-[2.5rem] bg-purple-600 text-white shadow-2xl shadow-purple-500/20 translate-y-0 md:-translate-y-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                <MousePointer2 size={28} />
              </div>
              <h3 className="text-2xl font-bold">Flow without limits</h3>
              <p className="text-purple-100 leading-relaxed text-sm">
                Rearrange, nest, and link your ideas. JAM adapts to how you think, not the other way around.
              </p>
            </div>
            <div className="p-10 space-y-6 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 transition-colors">
              <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-lg text-blue-600">
                <Share2 size={28} />
              </div>
              <h3 className="text-2xl font-bold">Sync securely</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Your notes are yours alone. With iron-clad auth and instant cloud sync, your data follows you safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlight Section */}
      <section className="py-20 px-6 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Inspire Creative Thinking</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
              Our intuitive block-based editor allows you to mix text, images, and links seamlessly.
              Build personal knowledge bases that grow with you.
            </p>
            <ul className="space-y-4">
              {["Block-based architecture", "Markdown shortcuts", "File & Media support", "Global tags & search"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                    <Check size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <div className="p-2 bg-white dark:bg-zinc-800 rounded-3xl shadow-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img
                src="/antigravity/brain/47fee5db-7e02-44f0-8e1b-5086eeeaf5ea/jam_mobile_mockup_1768360564361.png"
                alt="JAM App Mobile View"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Our Pricing</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Simple plans for every level of thinking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-10 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] space-y-8 flex flex-col">
              <div className="space-y-2 text-left">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Basis</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">$0</span>
                  <span className="text-zinc-400 text-sm font-medium">/mo</span>
                </div>
              </div>
              <ul className="text-left space-y-4 flex-1">
                {["Unlimited notes", "Local storage", "Basic markdown", "Standard support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                    <Check size={14} className="text-zinc-300" /> {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl font-bold transition-all">Start Free</button>
              </SignUpButton>
            </div>

            {/* Pro */}
            <div className="p-10 border-2 border-purple-600 dark:border-purple-500 rounded-[2.5rem] space-y-8 relative flex flex-col scale-105 bg-white dark:bg-zinc-950 shadow-2xl shadow-purple-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="space-y-2 text-left">
                <p className="text-purple-600 font-bold uppercase tracking-widest text-[10px]">Agile</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">$4</span>
                  <span className="text-zinc-400 text-sm font-medium">/mo</span>
                </div>
              </div>
              <ul className="text-left space-y-4 flex-1">
                {["Everything in Free", "Instant Cloud Sync", "Collaborative nodes", "Custom themes", "Priority support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-bold">
                    <Check size={14} className="text-purple-500" /> {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all">Go Pro</button>
              </SignUpButton>
            </div>

            {/* Enterprise */}
            <div className="p-10 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] space-y-8 flex flex-col text-left">
              <div className="space-y-2">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Scale</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">$19</span>
                  <span className="text-zinc-400 text-sm font-medium">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 flex-1">
                {["Enterprise Security", "Unlimited Members", "Custom integrations", "Dedicated Manager"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                    <Check size={14} className="text-zinc-300" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl font-bold transition-all">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center rotate-6 shadow-lg">
                <Layout className="text-white dark:text-zinc-900" size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter italic">JAM</span>
            </div>
            <p className="text-sm text-zinc-500 font-medium max-w-xs leading-relaxed text-balance">
              The minimalist note-taking application designed for the modern thinker.
            </p>
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"><Twitter size={18} /></div>
              <div className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"><Github size={18} /></div>
              <div className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"><Mail size={18} /></div>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <h4 className="font-extrabold uppercase tracking-widest text-[10px] text-zinc-400">Product</h4>
            <ul className="space-y-4 font-medium text-zinc-500">
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Updates</a></li>
            </ul>
          </div>

          <div className="space-y-6 text-sm">
            <h4 className="font-extrabold uppercase tracking-widest text-[10px] text-zinc-400">Company</h4>
            <ul className="space-y-4 font-medium text-zinc-500">
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          <div className="space-y-6 text-sm">
            <h4 className="font-extrabold uppercase tracking-widest text-[10px] text-zinc-400">Legal</h4>
            <ul className="space-y-4 font-medium text-zinc-500">
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 flex flex-col md:flex-row justify-between items-center text-zinc-400 text-xs gap-4 font-medium">
          <p>© 2026 JAM Notes. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Built by Gemini</span>
            <span className="flex items-center gap-1"><Search size={12} /> Privacy Settings</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s linear infinite;
        }
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(5px, -5px); }
        }
        .animate-float {
          animation: float 5s infinite ease-in-out;
        }
        .animate-pulse-slow {
            animation: pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
