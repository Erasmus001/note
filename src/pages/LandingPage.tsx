import React, { useState } from "react";
import {
  Zap,
  Lock,
  Sparkles,
  ChevronRight,
  Github,
  Twitter,
  Mail,
  Check,
  MousePointer2,
  Search,
  Layout,
  Plus,
  Minus,
} from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export const LandingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Basis",
      price: isYearly ? 0 : 0,
      description: "For individuals just getting started.",
      features: [
        "Unlimited notes",
        "Local storage",
        "Basic markdown",
        "Standard support",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Agile",
      price: isYearly ? 4 : 6,
      description: "Perfect for power users and small teams.",
      features: [
        "Everything in Free",
        "Instant Cloud Sync",
        "Collaborative nodes",
        "Custom themes",
        "Priority support",
      ],
      cta: "Go Pro",
      highlight: true,
      popular: true,
    },
    {
      name: "Scale",
      price: isYearly ? 19 : 24,
      description: "Advanced tools for growing organizations.",
      features: [
        "Enterprise Security",
        "Unlimited Members",
        "Custom integrations",
        "Dedicated Manager",
        "SLA support",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center rotate-6 shadow-lg group">
              <Layout
                className="text-white group-hover:scale-110 transition-transform"
                size={18}
              />
            </div>
            <span className="text-xl font-bold tracking-tight">JAM</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a
              href="#features"
              className="hover:text-zinc-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-zinc-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="hover:text-zinc-900 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="hover:text-zinc-900 transition-colors"
            >
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="text-sm font-semibold px-4 py-2 hover:bg-zinc-100 rounded-lg transition-colors">
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold px-5 py-2.5 bg-zinc-900 text-white rounded-xl hover:shadow-lg transition-all active:scale-95">
                Get JAM Free
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[12px] font-bold text-blue-600 animate-fade-in">
            <Sparkles size={14} /> The multi-page note app for modern thinkers
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 text-balance leading-[1.1]">
            Organize thoughts, <br />
            <span className="text-blue-600">files, and tools</span> in one place
          </h1>

          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            The minimalist workspace that brings clarity to your chaos.
            Block-based editing, instant sync, and a system that adapts to you.
          </p>

          <div className="space-y-4">
            <SignUpButton mode="modal">
              <button className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all active:scale-[0.98] group inline-flex items-center gap-2">
                Get JAM for free{" "}
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
            <p className="text-sm text-zinc-500 font-medium">
              No credit card required
            </p>
          </div>

          <div className="pt-12 relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full -z-10" />
            <div className="p-3 bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden">
              <img
                src="/antigravity/brain/47fee5db-7e02-44f0-8e1b-5086eeeaf5ea/jam_hero_dashboard_1768360547758.png"
                alt="JAM Workspace"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof */}
      <section className="py-20 border-y border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Trusted by builders at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-2xl font-black italic tracking-tighter">
              PROTO
            </div>
            <div className="text-2xl font-bold tracking-tight">Acme.co</div>
            <div className="text-2xl font-serif">Aura</div>
            <div className="text-2xl font-mono tracking-tighter">GLOBEX</div>
            <div className="text-2xl font-bold">VIBE</div>
          </div>
        </div>
      </section>

      {/* Why JAM / Core Outcomes */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why Teams Love JAM
            </h2>
            <p className="text-zinc-500 text-lg">
              Built for the way you actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Zap className="text-yellow-500" />,
                title: "Instant Capture",
                desc: "Quick thoughts or deep research, our block-based system handles everything effortlessly.",
              },
              {
                icon: <MousePointer2 className="text-blue-500" />,
                title: "User Control",
                desc: "Rearrange, nest, and link your ideas. JAM adapts to your flow, not the other way around.",
              },
              {
                icon: <Lock className="text-green-500" />,
                title: "Finite Control",
                desc: "Your data is yours. End-to-end encryption and iron-clad auth keep your notes private.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 bg-white border border-zinc-200 rounded-3xl space-y-6 hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flexible Plans */}
      <section
        id="pricing"
        className="py-32 px-6 bg-zinc-900 text-white overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] -z-10" />
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Flexible Plans for Every Stage
            </h2>

            <div className="flex items-center justify-center gap-4">
              <span
                className={`text-sm font-bold ${!isYearly ? "text-white" : "text-zinc-500"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="w-14 h-7 bg-zinc-800 border border-zinc-700 rounded-full relative p-1 transition-colors hover:border-zinc-500"
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ${isYearly ? "translate-x-7" : "translate-x-0"}`}
                />
              </button>
              <span
                className={`text-sm font-bold ${isYearly ? "text-white" : "text-zinc-500"}`}
              >
                Yearly
              </span>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-black uppercase rounded-md border border-green-500/30 font-mono tracking-tighter">
                Save 33%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`p-10 rounded-[2.5rem] border ${plan.highlight ? "border-blue-500 bg-zinc-900 shadow-2xl shadow-blue-500/10" : "border-zinc-800 bg-zinc-950"} space-y-8 flex flex-col relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-zinc-500 font-medium">/month</span>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium">
                    {plan.description}
                  </p>
                </div>

                <div className="h-px bg-zinc-800 w-full" />

                <ul className="space-y-4 flex-1">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm font-medium text-zinc-300"
                    >
                      <Check size={16} className="text-blue-500 shrink-0" />{" "}
                      {feature}
                    </li>
                  ))}
                </ul>

                <SignUpButton mode="modal">
                  <button
                    className={`w-full py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.highlight ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-white text-zinc-900"}`}
                  >
                    {plan.cta}
                  </button>
                </SignUpButton>
                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-wider">
                  Switch plans or cancel anytime
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loved by Startups */}
      <section id="testimonials" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Loved by Startups Worldwide
            </h2>
            <p className="text-zinc-500 text-lg">
              The secret weapon for fast-moving teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "JAM has completely transformed how our engineering team document their sprints. The block-based UI is just... *chef's kiss*.",
                author: "Sarah Chen",
                role: "CTO at Nexus",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
              },
              {
                text: "Finally a note app that doesn't get in the way. It's fast, minimal, and the cloud sync is rock solid. Highly recommend.",
                author: "Alex Rivera",
                role: "Product Designer",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
              },
              {
                text: "The ability to mix files, tools, and notes in one view is a game changer for our content planning flow.",
                author: "Jordan Smith",
                role: "Founder of Vibe",
                avatar:
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-8 bg-white border border-zinc-200 rounded-3xl space-y-6 flex flex-col justify-between"
              >
                <p className="text-lg font-medium leading-relaxed">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    className="w-10 h-10 rounded-full bg-zinc-100"
                    alt={t.author}
                  />
                  <div>
                    <h4 className="font-bold text-sm">{t.author}</h4>
                    <p className="text-xs text-zinc-500 font-medium">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Still Got Questions? We Got You
            </h2>
            <p className="text-zinc-500">
              Everything you need to know about JAM.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is there a limit to how many notes I can create?",
                a: "No! All plans, including the Free basis, offer unlimited notes. We believe your creativity shouldn't have a cap.",
              },
              {
                q: "How does the cloud sync work?",
                a: "In the Agile and Scale plans, your notes are instantly synced to our secure cloud. Any change you make is available on all your devices in real-time.",
              },
              {
                q: "Can I export my data?",
                a: "Absolutely. We hate vendor lock-in. You can export your notes to Markdown, PDF, or JSON at any time.",
              },
              {
                q: "Is my data secure?",
                a: "Yes. We use industry-standard encryption for data at rest and in transit. Your private notes are truly private.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-50 transition-colors">
                  <h3 className="font-bold text-lg">{faq.q}</h3>
                  <div className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <Plus size={14} className="group-open:hidden" />
                    <Minus size={14} className="hidden group-open:block" />
                  </div>
                </summary>
                <div className="p-6 pt-0 text-zinc-500 font-medium leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-zinc-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Ready to simplify <br /> your workflow?
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
            Join 10,000+ thinkers building their second brain with JAM. Start
            today for free.
          </p>
          <div className="pt-4 flex flex-col items-center gap-4">
            <SignUpButton mode="modal">
              <button className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:bg-blue-500 transition-all active:scale-95">
                Start for free
              </button>
            </SignUpButton>
            <div className="flex items-center gap-6 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Check size={12} /> Free forever
              </span>
              <span className="flex items-center gap-1">
                <Check size={12} /> No CC required
              </span>
              <span className="flex items-center gap-1">
                <Check size={12} /> Privacy first
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center rotate-6 shadow-lg">
                <Layout className="text-white" size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight">JAM</span>
            </div>
            <p className="text-zinc-500 font-medium max-w-xs leading-relaxed">
              The minimalist note-taking application designed for the modern
              thinker.
            </p>
            <div className="flex items-center gap-4 text-zinc-400">
              <a
                href="#"
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Updates", "Security"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy", "Terms", "Cookie Policy", "Legal Notice"],
            },
          ].map((col, i) => (
            <div key={i} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-16 flex flex-col md:flex-row justify-between items-center text-zinc-400 text-xs font-bold gap-4">
          <p>© 2026 JAM Notes. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="flex items-center gap-1">
              <Search size={12} /> Privacy Settings
            </span>
            <span>Built by Gemini</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
