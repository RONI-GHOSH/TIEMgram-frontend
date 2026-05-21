import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";

const VerifyOTP = ({ setCurrentView }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const payload = {
      body: {
        email: email,
        otp: otp,
      },
    };

    try {
      const response = await fetch("https://tiem.digitaligrow.com/api/v1/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Normalize token keys (support snake_case, camelCase, and different payload shapes)
        const accessToken = data?.data?.access_token || data?.access_token || data?.data?.accessToken || data?.accessToken || data?.data?.token || data?.token;
        const refreshToken = data?.data?.refresh_token || data?.refresh_token || data?.data?.refreshToken || data?.refreshToken;
        const userObj = data?.data?.user || data?.user || data?.data || null;

        if (accessToken) localStorage.setItem("access_token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        if (userObj) localStorage.setItem("user", typeof userObj === 'string' ? userObj : JSON.stringify(userObj));

        setIsSuccess(true);
        setMessage("Email verified successfully! Redirecting...");

        // If we got tokens, go directly to home
        if (accessToken) {
          setTimeout(() => {
            if (setCurrentView) setCurrentView("home");
            navigate("/home");
          }, 1000);
        } else {
          // Fallback: no tokens provided, go to login
          setMessage("Email verified successfully. Please login.");
        }
      } else {
        setMessage(data.message || "Verification failed. Please check your OTP.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f7] to-[#fff1ee] dark:from-zinc-900 dark:to-zinc-900 flex items-center justify-center px-4 py-10 transition-colors">
      <div className="w-full max-w-[460px]">
        <div className="bg-white dark:bg-zinc-900 border border-[#f2e4e1] dark:border-zinc-800 rounded-[30px] px-10 py-10 shadow-2xl shadow-red-100/40 dark:shadow-none transition-colors">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-zinc-800/40 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <h1
              className="text-3xl font-extrabold py-2 bg-gradient-to-r from-red-700 via-red-500 to-orange-400 bg-clip-text text-transparent"
            >
              Verify Your Email
            </h1>
            <p className="text-[#6b4b4b] dark:text-zinc-300 mt-2 text-[15px] font-medium leading-7">
              We've sent an OTP to <br/><span className="font-bold text-red-500">{email || "your email address"}</span>
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
              <div className="relative">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b6666] dark:text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                  className="w-full pl-14 pr-5 py-4 bg-[#faf4f3] dark:bg-zinc-900/60 border border-[#ead8d5] dark:border-zinc-800 rounded-xl outline-none transition-colors focus:border-red-300 dark:focus:border-red-500 text-center tracking-widest text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !otp}
                className="w-full mt-5 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 hover:scale-[1.02] transition-all duration-300 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-200/50 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          ) : (
            <div className="mt-8 text-center">
              <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Show login button only if no tokens were returned */}
              {!localStorage.getItem("access_token") && (
                <button
                  onClick={() => { if (setCurrentView) setCurrentView("login"); navigate("/login"); }}
                  className="w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 hover:scale-[1.02] transition-all duration-300 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-200/50"
                >
                  Go to Login
                </button>
              )}
            </div>
          )}

          {message && (
            <p className={`text-center mt-5 font-semibold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          {!isSuccess && (
            <div className="mt-8 pt-6 border-t border-[#f2e4e1] text-center">
              <p className="text-[#6b4b4b] text-[15px]">
                Back to{" "}
                 <button onClick={() => { if (setCurrentView) setCurrentView("login"); navigate("/login"); }} className="font-bold text-red-500 hover:text-red-600 transition-colors">
                  Login
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
