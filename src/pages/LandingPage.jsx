import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  ChevronDown,
  User,
  Plus,
  Search,
  Shield,
  Users,
  Bell,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Lock,
  Compass,
  CheckCircle,
  Share2,
  Moon,
  Sun
} from "lucide-react";

// Mock profiles and images matching main app
const MOCK_AVATARS = {
  sonya_leena: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  adam_addisin: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
  julia_designs: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  alex_coder: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
};

const FEATURE_IMAGE = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop";

export default function LandingPage({ setCurrentView }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Theme Toggle Logic
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && document.documentElement.classList.contains("dark"));
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Interactive Simulator States
  const [likesCount, setLikesCount] = useState(128);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [comments, setComments] = useState([
    { username: "alex_coder", text: "Looks amazing! Which tech stack did you guys use? 🔥" },
    { username: "julia_designs", text: "The UI design looks super clean Sonya!" },
  ]);
  const [newComment, setNewComment] = useState("");
  const [floatingHearts, setFloatingHearts] = useState([]);
  const nextHeartId = useRef(0);
  const commentListRef = useRef(null);

  // FAQ Accordion States
  const [activeFaq, setActiveFaq] = useState(null);

  // Newsletter subscription
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Stats Auto-counting simulation
  const [stats, setStats] = useState({ students: 0, posts: 0, departments: 0 });
  const statsSectionRef = useRef(null);
  const hasAnimatedStats = useRef(false);

  useEffect(() => {
    // 1. Stats count-up animation trigger
    const triggerStatsAnimation = () => {
      if (hasAnimatedStats.current) return;
      hasAnimatedStats.current = true;
      const duration = 2000;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress * (2 - progress); // out-quad easing

        setStats({
          students: Math.floor(easeProgress * 2500),
          posts: Math.floor(easeProgress * 18000),
          departments: Math.floor(easeProgress * 12),
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setStats({ students: 2500, posts: 18000, departments: 12 });
        }
      };

      requestAnimationFrame(animate);
    };

    // 2. Intersection observer for scroll reveal effects & stats counter
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === statsSectionRef.current) {
              triggerStatsAnimation();
            }
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -80px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => revealObserver.observe(el));

    if (statsSectionRef.current) {
      revealObserver.observe(statsSectionRef.current);
    }

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  const handleLike = (e) => {
    let x = 50;
    let y = 50;
    
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }

    const newHeart = {
      id: nextHeartId.current++,
      x,
      y,
    };
    setFloatingHearts(prev => [...prev, newHeart]);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 800);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments(prev => [...prev, { username: "you_at_tiem", text: newComment.trim() }]);
    setNewComment("");

    setTimeout(() => {
      if (commentListRef.current) {
        commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!subscribedEmail.trim() || !subscribedEmail.includes("@")) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setSubscribedEmail("");
    }, 5000);
  };

  const faqData = [
    {
      q: "Who can join TIEMgram?",
      a: "TIEMgram is exclusively for students, staff, and faculty of TIEM. Users verify their affiliation during registration to maintain a safe, authentic, and focused campus community."
    },
    {
      q: "Is my personal account private?",
      a: "Yes! You have complete control. You can set your account to private (so only approved followers see your posts), manage notifications, and easily block or report accounts that break campus guidelines."
    },
    {
      q: "Are direct messages encrypted?",
      a: "Yes. TIEMgram keeps student conversations secure. Direct messaging allows you to safely coordinate study groups, collaborate on department tasks, and chat with friends."
    },
    {
      q: "Can I use it on my phone?",
      a: "Absolutely. TIEMgram is built with a mobile-first philosophy. It functions seamlessly as an optimized, responsive web app on iOS, Android, and desktop screens."
    }
  ];

  const goLogin = () => {
    setCurrentView("login");
    navigate("/login");
  };

  const goRegister = () => {
    setCurrentView("signup");
    navigate("/signup");
  };

  const ThemeToggleButton = () => (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-mesh-purple flex flex-col transition-colors duration-300">
      
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 w-full glass shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition">
            <div className="w-10 h-10 relative overflow-hidden rounded-xl shadow-md border border-[#eee2df] dark:border-zinc-800">
              <img
                src="/logo.png"
                alt="TIEMgram Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-black tracking-tight font-heading">
              <span className="text-brand-crimson">TIEM</span>
              <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                gram
              </span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-brand-crimson dark:hover:text-brand-orange transition-colors">Features</a>
            <a href="#simulator" className="hover:text-brand-crimson dark:hover:text-brand-orange transition-colors">Try Simulator</a>
            <a href="#stats" className="hover:text-brand-crimson dark:hover:text-brand-orange transition-colors">Campus Stats</a>
            <a href="#faq" className="hover:text-brand-crimson dark:hover:text-brand-orange transition-colors">FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggleButton />
            <button onClick={goLogin} className="px-5 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 font-semibold text-sm transition-all duration-300">
              Log In
            </button>
            <button onClick={goRegister} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300">
              Register Now
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggleButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-zinc-200/80 dark:border-zinc-800/80 animate-scale-in py-6 px-6 space-y-4 shadow-2xl">
            <nav className="flex flex-col gap-4 font-semibold text-zinc-700 dark:text-zinc-300">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-crimson transition-colors">Features</a>
              <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-crimson transition-colors">Try Simulator</a>
              <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-crimson transition-colors">Campus Stats</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-crimson transition-colors">FAQ</a>
            </nav>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
            <div className="flex flex-col gap-3">
              <button onClick={() => { setMobileMenuOpen(false); goLogin(); }} className="w-full py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40">
                Log In
              </button>
              <button onClick={() => { setMobileMenuOpen(false); goRegister(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange text-white font-bold shadow-md hover:scale-[1.01] active:scale-95 transition">
                Register Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="absolute top-1/4 left-1/4 -z-10 w-72 h-72 rounded-full bg-brand-red/10 blur-[90px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 w-96 h-96 rounded-full bg-brand-orange/10 blur-[110px] animate-pulse-slow" />

        <div className="flex-1 space-y-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 text-brand-crimson dark:text-brand-orange text-xs font-bold tracking-wide uppercase">
            <Sparkles size={14} className="animate-spin-slow" />
            TIEM's Exclusive Student Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
            Connect. Share. Grow.<br />
            <span className="bg-gradient-to-r from-brand-crimson via-brand-red to-brand-orange bg-clip-text text-transparent">
              Your Campus Network
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            Welcome to the digital heart of TIEM. Stay connected with peers, follow department highlights, view schedules, share college milestones, and explore authentic campus life in one secure place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <a
              href="#simulator"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-crimson to-brand-orange text-white font-extrabold text-base shadow-xl hover:shadow-brand-red/25 hover:scale-[1.04] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Interactive Preview
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-base hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:scale-[1.02] active:scale-95 shadow-sm transition-all duration-300 flex items-center justify-center"
            >
              Learn More
            </a>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 text-sm text-zinc-500 dark:text-zinc-500 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Verified Accounts Only</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Department Forums</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Full Dark/Light Theme</span>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center animate-scale-in">
          <div className="relative p-4 md:p-6 w-[340px] md:w-[390px] rounded-[48px] bg-zinc-900 border-[10px] border-zinc-950 dark:border-zinc-800 shadow-2xl overflow-hidden animate-float">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-950 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-900 border border-white/10" />
            </div>

            <div className="rounded-[32px] overflow-hidden bg-[#faf7f7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-[560px] flex flex-col p-4 select-none relative font-sans text-xs border border-white/5">
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-900 mb-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <img src="/logo.png" alt="Logo" className="w-[18px] h-[18px] rounded-md object-cover border border-[#eee2df] dark:border-zinc-800" />
                  <span className="font-heading font-black text-sm tracking-tight"><span className="text-brand-crimson">TIEM</span><span className="text-brand-orange">gram</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-zinc-500" />
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-brand-crimson to-brand-orange" />
                </div>
              </div>

              <div className="flex gap-3 mb-4 overflow-x-hidden pb-1">
                {[
                  { name: "Your Story", img: MOCK_AVATARS.alex_coder, active: false },
                  { name: "sonya_l", img: MOCK_AVATARS.sonya_leena, active: true },
                  { name: "adam_a", img: MOCK_AVATARS.adam_addisin, active: true },
                  { name: "julia_d", img: MOCK_AVATARS.julia_designs, active: true }
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-11 h-11 rounded-full p-[2px] ${s.active ? "bg-gradient-to-tr from-brand-red to-brand-orange" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#faf7f7] dark:border-zinc-950">
                        <img src={s.img} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold scale-95">{s.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden story-ring-active p-[1px]">
                      <img src={MOCK_AVATARS.julia_designs} alt="" className="w-full h-full rounded-full border border-white dark:border-zinc-900 object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200 flex items-center gap-1">julia_designs <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /></p>
                      <p className="text-[9px] text-zinc-400">CSE • Semester 6</p>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-zinc-400" />
                </div>

                <div className="relative h-40 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img src={FEATURE_IMAGE} alt="Mock post" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                    🚀 Hackathon 2026
                  </div>
                </div>

                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 py-1">
                  <div className="flex items-center gap-3.5">
                    <Heart size={15} className="text-brand-crimson fill-brand-crimson" />
                    <MessageCircle size={15} />
                    <Send size={15} />
                  </div>
                  <Bookmark size={15} />
                </div>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-300 leading-normal">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">julia_designs</span> Collaborating with my teammates at the TIEM Hackathon. Building a global student networking app! 💻🔥
                </p>
              </div>

              <div className="flex items-center justify-around pt-3 border-t border-zinc-200 dark:border-zinc-900 mt-2 text-zinc-400 dark:text-zinc-600">
                <span className="text-brand-crimson font-bold">🏠</span>
                <span>🧭</span>
                <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-red to-brand-orange flex items-center justify-center text-white text-[10px] font-bold">+</span>
                <span>💬</span>
                <span>👤</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE FEED SIMULATOR */}
      <section id="simulator" className="py-24 bg-white dark:bg-zinc-900/40 border-y border-zinc-200 dark:border-zinc-900/60 scroll-mt-20 reveal-on-scroll">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-zinc-900 dark:text-white">
              Experience the App in Real Time
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium">
              Don't just take our word for it. Interact with the live feed simulator below to feel the fluid animations and instant college networking interactions of TIEMgram.
            </p>
          </div>

          <div className="max-w-xl mx-auto glass rounded-3xl overflow-hidden shadow-xl border border-[#eee2df] dark:border-zinc-800 animate-scale-in">
            
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full story-ring-active p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-zinc-900">
                    <img src={MOCK_AVATARS.sonya_leena} alt="Sonya avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    sonya_leena
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium">ECE • Year 3 • Semester 5</p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors">
                Follow
              </button>
            </div>

            <div 
              onClick={handleLike}
              className="relative aspect-video w-full cursor-pointer bg-zinc-100 dark:bg-zinc-950 overflow-hidden select-none"
            >
              <img 
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop" 
                alt="Simulator Media" 
                className="w-full h-full object-cover pointer-events-none"
              />
              
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span>💻</span> Labs & Coffee
              </div>

              {floatingHearts.map(heart => (
                <Heart 
                  key={heart.id}
                  size={48}
                  className="absolute text-brand-crimson fill-brand-crimson animate-heart-pop pointer-events-none drop-shadow-lg"
                  style={{
                    left: `${heart.x - 24}px`,
                    top: `${heart.y - 24}px`,
                  }}
                />
              ))}

              <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                  Double Click / Click Image to Like! ❤️
                </span>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-5">
                <button 
                  onClick={handleLike}
                  className="hover:scale-110 active:scale-90 transition-transform flex items-center gap-1.5 group"
                  aria-label="Like"
                >
                  <Heart 
                    size={22} 
                    className={`transition-colors duration-300 ${hasLiked ? "text-brand-crimson fill-brand-crimson scale-110" : "hover:text-brand-crimson"}`} 
                  />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                    {likesCount}
                  </span>
                </button>
                <button 
                  className="hover:scale-110 active:scale-90 transition-transform flex items-center gap-1.5 hover:text-blue-500 group"
                  aria-label="Comment"
                >
                  <MessageCircle size={22} />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                    {comments.length}
                  </span>
                </button>
                <button 
                  className="hover:scale-110 active:scale-90 transition-transform hover:text-brand-orange"
                  aria-label="Share"
                >
                  <Share2 size={22} />
                </button>
              </div>
              <button 
                onClick={() => setHasBookmarked(!hasBookmarked)}
                className="hover:scale-110 active:scale-90 transition-transform"
                aria-label="Bookmark"
              >
                <Bookmark 
                  size={22} 
                  className={`transition-colors ${hasBookmarked ? "text-brand-orange fill-brand-orange" : "hover:text-brand-orange"}`} 
                />
              </button>
            </div>

            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <span className="font-bold text-zinc-950 dark:text-zinc-50 mr-1.5">sonya_leena</span>
                Just coded the final UI components for our college app project! Coffee count is high, bug count is low. We are ready! ☕🚀 #WebDev #TIEMgram #CSLife
              </p>

              <div 
                ref={commentListRef}
                className="max-h-28 overflow-y-auto space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 pr-1 text-xs"
              >
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 animate-scale-in">
                    <p className="text-zinc-600 dark:text-zinc-300 leading-normal">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-1.5">@{c.username}</span>
                      {c.text}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium shrink-0 ml-2">Just now</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="Add a comment on this live simulator..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-brand-crimson dark:focus:border-brand-orange transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-md hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none text-white text-xs font-bold transition-all duration-300"
                >
                  Post
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID SECTION */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 reveal-on-scroll">
        
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 text-brand-crimson dark:text-brand-orange text-xs font-bold tracking-wide uppercase">
            🚀 Fully Loaded Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-zinc-900 dark:text-white">
            Designed Exclusively for Campus Life
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium">
            TIEMgram brings modern social networking structure to your college experience, keeping you connected, informed, and involved in everything TIEM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Users className="text-brand-crimson" size={26} />,
              title: "Department Hubs",
              desc: "Never miss an official update. Find class schedules, department notices, study guides, and lecture discussions tailored to your course.",
              delay: "delay-100",
            },
            {
              icon: <Sparkles className="text-brand-orange" size={26} />,
              title: "Stories & Reels",
              desc: "Share quick, engaging snapshots of your daily campus routine. Highlights let you curate memories of sports days, club events, and labs.",
              delay: "delay-200",
            },
            {
              icon: <Send className="text-emerald-500" size={26} />,
              title: "Direct Conversations",
              desc: "Coordinate semester projects or chat securely. Chat functionality features real-time connections, group coordinates, and media shares.",
              delay: "delay-300",
            },
            {
              icon: <Shield className="text-indigo-500" size={26} />,
              title: "Privacy Controls",
              desc: "Your comfort matters. Support for fully private profiles, customized follower approvals, and block listings keep you in control of your posts.",
              delay: "delay-400",
            },
          ].map((f, i) => (
            <div 
              key={i} 
              className={`glass p-8 rounded-3xl hover-card-glow border border-zinc-200 dark:border-zinc-800 flex flex-col items-start gap-5 shadow-sm reveal-on-scroll ${f.delay}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/50">
                {f.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CAMPUS STATS SECTION */}
      <section id="stats" ref={statsSectionRef} className="py-20 bg-zinc-950 text-white scroll-mt-20 reveal-on-scroll">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center select-none">
          
          <div className="space-y-2.5 md:border-r border-zinc-800 last:border-none">
            <h3 className="text-5xl sm:text-6xl font-black font-heading bg-gradient-to-r from-brand-crimson to-brand-orange bg-clip-text text-transparent">
              {stats.students.toLocaleString()}+
            </h3>
            <p className="text-base text-zinc-300 font-bold uppercase tracking-wider">Active Students</p>
            <p className="text-xs text-zinc-500 font-semibold px-4">Interacting daily from CSE, ECE, ME, and Civil departments.</p>
          </div>

          <div className="space-y-2.5 md:border-r border-zinc-800 last:border-none">
            <h3 className="text-5xl sm:text-6xl font-black font-heading bg-gradient-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">
              {stats.posts.toLocaleString()}+
            </h3>
            <p className="text-base text-zinc-300 font-bold uppercase tracking-wider">Shared Moments</p>
            <p className="text-xs text-zinc-500 font-semibold px-4">Authentic updates, coding project snippets, and event reels.</p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-5xl sm:text-6xl font-black font-heading bg-gradient-to-r from-brand-red to-brand-crimson bg-clip-text text-transparent">
              {stats.departments}+
            </h3>
            <p className="text-base text-zinc-300 font-bold uppercase tracking-wider">Departments Joined</p>
            <p className="text-xs text-zinc-500 font-semibold px-4">Unified together under dedicated groups for focused announcements.</p>
          </div>

        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 reveal-on-scroll">
        
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 text-brand-crimson dark:text-brand-orange text-xs font-bold tracking-wide uppercase">
            💡 Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium">
            Everything you need to know about joining, using, and enjoying TIEMgram.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div 
                key={i}
                className="glass rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-heading font-extrabold text-sm sm:text-base text-zinc-850 dark:text-zinc-150 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-zinc-500 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "rotate-180 text-brand-crimson" : ""}`} 
                  />
                </button>
                
                <div 
                  className={`grid transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "grid-rows-[1fr] opacity-100 border-t border-zinc-150 dark:border-zinc-800" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. LAUNCH & NEWSLETTER FOOTER */}
      <footer className="mt-auto bg-zinc-900 text-zinc-400 border-t border-zinc-800/80 reveal-on-scroll">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-b border-zinc-800/60">
          
          <div className="space-y-4 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-white">
              Stay in the Campus Loop 🎓
            </h3>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto lg:mx-0 font-medium">
              Subscribe to TIEMgram news, club event digests, and system updates. We'll only send the most important highlights once a month.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0">
            {isSubscribed ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 animate-scale-in">
                <CheckCircle size={18} />
                Successfully Subscribed to Campus Newsletter!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter campus email..."
                  required
                  value={subscribedEmail}
                  onChange={(e) => setSubscribedEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-lg text-white text-sm font-bold hover:scale-[1.03] active:scale-95 transition-all duration-300"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition">
            <div className="w-8 h-8 relative overflow-hidden rounded-lg shadow-md border border-zinc-800">
              <img
                src="/logo.png"
                alt="TIEMgram Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-black font-heading">
              <span className="text-brand-crimson">TIEM</span>
              <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                gram
              </span>
            </span>
          </div>

          <div className="flex gap-8 text-xs font-semibold">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Campus Guidelines</a>
          </div>

          <p className="text-xs text-zinc-600 font-medium">
            © {new Date().getFullYear()} TIEMgram. All rights reserved. Created for Tula's Institute of Engineering & Management.
          </p>
        </div>
      </footer>

    </div>
  );
}
