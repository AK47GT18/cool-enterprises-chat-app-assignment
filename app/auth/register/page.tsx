"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, Globe, ShieldCheck, Eye, EyeOff, ArrowRight, CircleDashed, CheckCircle, XCircle } from "lucide-react";
import { signup } from "@/app/auth/actions";
import { validateEmail, validateUsername, validatePassword, getPasswordStrength, PasswordStrength } from "@/lib/validation";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (name: string, value?: string) => {
    let error = "";
    let newPasswordStrength = passwordStrength;

    if (name === "username") {
      const usernameValue = value !== undefined ? value : (document.querySelector('input[name="username"]') as HTMLInputElement)?.value || "";
      const result = validateUsername(usernameValue);
      error = result.valid ? "" : result.error || "";
    } else if (name === "email") {
      const emailValue = value !== undefined ? value : (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
      const result = validateEmail(emailValue);
      error = result.valid ? "" : result.error || "";
    } else if (name === "password") {
      const passwordValue = value !== undefined ? value : (document.querySelector('input[name="password"]') as HTMLInputElement)?.value || "";
      const result = validatePassword(passwordValue);
      error = result.valid ? "" : result.error || "";
      newPasswordStrength = result.strength || null;
    }

    setValidationErrors(prev => ({ ...prev, [name]: error }));
    setPasswordStrength(newPasswordStrength);
    return error === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate all fields
    const isUserValid = validateField("username", username);
    const isEmailValid = validateField("email", email);
    const isPassValid = validateField("password", password);

    // Mark all as touched
    setTouched({ username: true, email: true, password: true });

    if (!isUserValid || !isEmailValid || !isPassValid) {
      setError("Please fix the errors above");
      setLoading(false);
      return;
    }

    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: ReturnType<typeof getPasswordStrength>) => {
    switch (strength.color) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Soft blue ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#2C6BED]/[0.08] blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#60A5FA]/[0.06] blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl z-10"
      >
        <div className="relative bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden">

          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#2C6BED] to-transparent opacity-40" />

          <div className="text-center mb-10">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#2C6BED] to-[#60A5FA] mb-4 shadow-[0_8px_20px_rgba(44,107,237,0.2)]"
            >
              <CircleDashed className="text-white w-7 h-7 animate-spin-slow" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mb-2">Create Account</h1>
            <p className="text-sm text-[#6B7280] font-medium tracking-tight">Join the conversation today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <input type="hidden" name="isPublic" value={String(isPublic)} />
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-lg text-sm font-semibold flex items-center gap-3 overflow-hidden"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              {/* Username Input Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    required
                    name="username"
                    type="text"
                    onChange={handleChange}
                    onBlur={() => handleBlur("username")}
                    placeholder="Choose a username"
                    className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-12 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${touched.username && validationErrors.username
                        ? "border-red-300 focus:border-red-500"
                        : touched.username && !validationErrors.username
                          ? "border-green-300 focus:border-green-500"
                          : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                      }`}
                  />
                  {touched.username && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {validationErrors.username ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  )}
                </div>
                {touched.username && validationErrors.username && (
                  <p className="text-xs text-red-500 font-semibold ml-1">{validationErrors.username}</p>
                )}
                <p className="text-[10px] text-[#9CA3AF] ml-1">3-20 characters, letters, numbers, underscores</p>
              </div>

              {/* Email Input Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    required
                    name="email"
                    type="email"
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@company.com"
                    className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-12 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${touched.email && validationErrors.email
                        ? "border-red-300 focus:border-red-500"
                        : touched.email && !validationErrors.email
                          ? "border-green-300 focus:border-green-500"
                          : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                      }`}
                  />
                  {touched.email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {validationErrors.email ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  )}
                </div>
                {touched.email && validationErrors.email && (
                  <p className="text-xs text-red-500 font-semibold ml-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Password Input Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password")}
                    placeholder="Min 8 characters"
                    className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-10 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${touched.password && validationErrors.password
                        ? "border-red-300 focus:border-red-500"
                        : touched.password && !validationErrors.password
                          ? "border-green-300 focus:border-green-500"
                          : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                      }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C6BED] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.score
                              ? getStrengthColor(passwordStrength)
                              : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs font-semibold ${passwordStrength.color === 'red' ? 'text-red-500' :
                          passwordStrength.color === 'orange' ? 'text-orange-500' :
                            passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                              'text-green-500'
                        }`}>
                        {passwordStrength.label}
                      </p>
                      {passwordStrength.suggestions.length > 0 && (
                        <p className="text-[10px] text-[#9CA3AF]">
                          {passwordStrength.suggestions[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {touched.password && validationErrors.password && (
                  <p className="text-xs text-red-500 font-semibold ml-1">{validationErrors.password}</p>
                )}
              </div>
            </div>

            {/* Visibility Toggle */}
            <button type="button" onClick={() => setIsPublic(!isPublic)}
              className={`w-full flex items-center gap-3 p-4 rounded-[14px] border transition-all duration-300 ${isPublic ? "bg-[#E8F0FD] border-[#2C6BED]/30" : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}>
              <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${isPublic ? "bg-[#2C6BED]" : "bg-[#E2E8F0]"}`}>
                {isPublic ? <Globe size={16} className="text-white" /> : <ShieldCheck size={16} className="text-[#6B7280]" />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-[#111827] tracking-tight">{isPublic ? "Public Profile" : "Private Profile"}</p>
                <p className="text-[11px] text-[#6B7280] mt-0 font-medium leading-tight">{isPublic ? "Anyone can find and message you" : "Only approved contacts can reach you"}</p>
              </div>
              <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 shrink-0 ${isPublic ? "bg-[#2C6BED]" : "bg-[#E2E8F0]"}`}>
                <div className={`absolute top-[2.5px] w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 ${isPublic ? "left-[18px]" : "left-[2.5px]"}`} />
              </div>
            </button>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#2C6BED] hover:bg-[#1A56D6] text-white font-black py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] transform"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span className="text-xl tracking-tight">Create Account</span>
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <div className="mt-14 text-center">
            <p className="text-[#6B7280] font-bold text-base tracking-tight">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#2C6BED] hover:text-[#1A56D6] transition-all ml-1.5 font-black decoration-2 underline-offset-4 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
