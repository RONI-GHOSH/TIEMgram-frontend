import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Compass, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const Login = ({ setCurrentView }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const payload = {
      body: {
        email: formData.email,
        password: formData.password,
      },
    };

    try {
      const response = await fetch("https://tiem.digitaligrow.com/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Login successful!");
        if (data.data?.access_token) {
          localStorage.setItem("access_token", data.data.access_token);
          localStorage.setItem("refresh_token", data.data.refresh_token);
          localStorage.setItem("user", JSON.stringify(data.data));
        }
        if (setCurrentView) setCurrentView("home");
        navigate("/home");
      } else {
        if (response.status === 401 && data.message && (data.message.toLowerCase().includes("verify") || data.message.toLowerCase().includes("verified"))) {
          if (setCurrentView) setCurrentView("verify");
          navigate("/verify", { state: { email: formData.email } });
          return;
        }
        setMessage(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend server");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1], // Smooth, stable ease-out
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/campus-bg.jpg')" }}
    >
      
      {/* Modern Transparent Overlay */}
      <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/70 backdrop-blur-[6px] transition-colors duration-300 pointer-events-none" />

      {/* Background Decorative Elements - Stable fixed positioned to avoid scroll jitter */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-96 md:h-96 bg-red-500/20 dark:bg-red-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[500px] md:h-[500px] bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />

      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        onClick={() => setIsDark(!isDark)} 
        className="absolute top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/30 hover:scale-[1.05] transition-all z-50"
      >
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
        </motion.div>
      </motion.button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-white/40 dark:border-zinc-800/50 rounded-[30px] px-8 sm:px-10 py-10 shadow-2xl shadow-red-500/5 dark:shadow-none transition-colors duration-300">
          <div className="text-center">
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 py-2 cursor-pointer transition group" onClick={() => setCurrentView && setCurrentView("home")}>
              <motion.img 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                src="/logo.png" 
                alt="logo" 
                className="w-14 h-14 object-cover rounded-2xl shadow-sm border border-[#f2e4e1] dark:border-zinc-800 transition-transform duration-200" 
              />
              <h1
                className="text-5xl font-extrabold tracking-tight text-black dark:text-white"
                style={{ lineHeight: "1.2" }}
              >
                <span className="text-[#d6333b] transition-colors">TIEM</span>
                <span className="bg-gradient-to-r from-[#ef553e] to-[#f79b42] bg-clip-text text-transparent transition-all">gram</span>
              </h1>
            </motion.div>
            <motion.p variants={itemVariants} className="text-[#6b4b4b] dark:text-zinc-400 mt-4 text-[15px] font-medium leading-7">
              Log in to see photos and videos from your friends.
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <motion.div variants={itemVariants} className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b6666] dark:text-zinc-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full pl-14 pr-5 py-4 bg-[#faf4f3]/80 dark:bg-zinc-950/50 border border-[#ead8d5] dark:border-zinc-800 text-black dark:text-white rounded-2xl outline-none transition-all focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:bg-white dark:focus:bg-zinc-950"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b6666] dark:text-zinc-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full pl-14 pr-20 py-4 bg-[#faf4f3]/80 dark:bg-zinc-950/50 border border-[#ead8d5] dark:border-zinc-800 text-black dark:text-white rounded-2xl outline-none transition-all focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:bg-white dark:focus:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8b6666] dark:text-zinc-500 font-semibold hover:text-red-500 transition-colors text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/20 dark:shadow-red-500/10 disabled:opacity-70 flex items-center justify-center gap-2 transition-transform duration-200"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </motion.button>
            </motion.div>
          </form>

          {message && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center mt-5 text-sm font-semibold ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}
            >
              {message}
            </motion.p>
          )}

          <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-[#f2e4e1] dark:border-zinc-800/80 text-center transition-colors">
            <p className="text-[#6b4b4b] dark:text-zinc-400 text-[15px]">
              Don't have an account?{" "}
              <button type="button" onClick={(e) => { e.preventDefault(); if (setCurrentView) setCurrentView("signup"); navigate("/signup"); }} className="font-bold text-red-500 hover:text-red-600 transition-colors">
                Sign up
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
