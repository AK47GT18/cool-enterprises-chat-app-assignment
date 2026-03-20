"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, CircleDashed } from "lucide-react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address.";
      }
    } else if (name === "password") {
      if (!value) {
        error = "Password is required.";
      }
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const isEmailValid = validateField("email", email);
    const isPassValid = validateField("password", password);

    if (!isEmailValid || !isPassValid) {
      setLoading(false);
      return;
    }

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3C%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

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
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mb-2">Welcome Back</h1>
            <p className="text-sm text-[#6B7280] font-medium tracking-tight">Continue your journey with the circle</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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
              {/* Email Input Group */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    required
                    name="email"
                    type="email"
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-5 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${
                      validationErrors.email ? "border-red-300 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                    }`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Password Input Group */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] opacity-60">Password</label>
                  <Link href="/auth/forgot-password" title="Recover your password" className="text-[15px] text-[#2C6BED] hover:text-[#1A56D6] font-black tracking-tight transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    required
                    name="password"
                    type="password"
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-5 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${
                      validationErrors.password ? "border-red-300 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                    }`}
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">{validationErrors.password}</p>
                )}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#2C6BED] hover:bg-[#1A56D6] text-white font-black py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] transform"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span className="text-xl tracking-tight">Access Account</span>
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <div className="mt-14 text-center">
            <p className="text-[#6B7280] font-bold text-base tracking-tight">
              New to the circle?{" "}
              <Link href="/auth/register" className="text-[#2C6BED] hover:text-[#1A56D6] transition-all ml-1.5 font-black decoration-2 underline-offset-4 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
