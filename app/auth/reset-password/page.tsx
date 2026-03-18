"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CircleDashed, ArrowRight, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/app/auth/actions";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("token", token);
    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-red-500">Invalid Link</h1>
          <p className="text-slate-500">This password reset link is missing its token.</p>
          <Link href="/auth/login" className="text-blue-500 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-white">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#2C6BED]/[0.08] blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#60A5FA]/[0.06] blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl z-10"
      >
        <div className="relative bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden">
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
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mb-2">New Password</h1>
            <p className="text-sm text-[#6B7280] font-medium tracking-tight">Set a strong password to secure your account</p>
          </div>

          {!success ? (
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
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] py-4 pl-12 pr-10 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2C6BED] focus:bg-white transition-all duration-300"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C6BED] transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                    <span className="text-xl tracking-tight">Reset Password</span>
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="bg-[#E8F0FD] border border-[#2C6BED]/20 text-[#2C6BED] p-10 rounded-[32px] font-bold shadow-sm shadow-blue-500/5">
                <p className="text-2xl mb-3 tracking-tight">Password Updated!</p>
                <p className="text-base text-[#6B7280] font-medium tracking-tight leading-relaxed">Your password has been securely updated. You can now sign in with your new credentials.</p>
              </div>
              <Link href="/auth/login" className="inline-flex items-center gap-3 text-[#2C6BED] hover:text-[#1A56D6] font-black tracking-tight transition-all text-lg group">
                Sign In Now
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </motion.div>
          )}

          <div className="mt-14 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-3 text-[#6B7280] hover:text-[#2C6BED] font-bold transition-all text-base group tracking-tight">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
