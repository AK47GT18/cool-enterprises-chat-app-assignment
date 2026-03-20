"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Loader2, CircleDashed, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/app/auth/actions";

type Step = 'IDENTIFY' | 'VERIFY' | 'RESET' | 'SUCCESS';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('IDENTIFY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  // STEP 1: Send Code
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const emailInput = formData.get('email') as string;
      setEmail(emailInput);
      
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send code");
      }
      
      setStep('VERIFY');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle Code Input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      setStep('RESET');
    } else {
      setError("Please enter the full 6-digit code.");
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(newPassword)) {
      setValidationError("Min 8 chars, needs 1 letter & 1 number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("token", code.join("")); // The numeric code is the token
      formData.append("password", newPassword);
      
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setStep('SUCCESS');
      }
    } catch (err: any) {
      setError("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Background Blobs */}
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

          <div className="text-center mb-8">
            <motion.div
              layoutId="status-icon"
              className="inline-flex items-center justify-center w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#2C6BED] to-[#60A5FA] mb-4 shadow-[0_8px_20px_rgba(44,107,237,0.2)]"
            >
              {step === 'IDENTIFY' && <CircleDashed className="text-white w-7 h-7 animate-spin-slow" />}
              {step === 'VERIFY' && <ShieldCheck className="text-white w-7 h-7" />}
              {step === 'RESET' && <Lock className="text-white w-7 h-7" />}
              {step === 'SUCCESS' && <CheckCircle2 className="text-white w-7 h-7" />}
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mb-2">
              {step === 'IDENTIFY' && "Reset Password"}
              {step === 'VERIFY' && "Verify Code"}
              {step === 'RESET' && "New Password"}
              {step === 'SUCCESS' && "All Done!"}
            </h1>
            <p className="text-sm text-[#6B7280] font-medium tracking-tight">
              {step === 'IDENTIFY' && "We'll send a recovery code to your email"}
              {step === 'VERIFY' && `Enter the 6-digit code sent to ${email}`}
              {step === 'RESET' && "Set a strong password for your account"}
              {step === 'SUCCESS' && "Your password has been successfully reset"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'IDENTIFY' && (
              <motion.form
                key="identify"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleSendCode}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] py-4 pl-12 pr-5 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2C6BED] focus:bg-white transition-all duration-300"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-[#2C6BED] hover:bg-[#1A56D6] text-white font-black py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] transform"
                >
                  {loading ? <Loader2 className="animate-spin" size={28} /> : (
                    <>
                      <span className="text-xl tracking-tight">Get Code</span>
                      <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'VERIFY' && (
              <motion.form
                key="verify"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleVerifyCode}
                className="space-y-8"
              >
                <div className="flex justify-between gap-2 md:gap-4">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { codeInputs.current[i] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-full h-14 md:h-20 text-center text-2xl md:text-3xl font-black bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] outline-none focus:border-[#2C6BED] focus:bg-white transition-all"
                    />
                  ))}
                </div>

                {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-[#2C6BED] hover:bg-[#1A56D6] text-white font-black py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all"
                >
                  <span className="text-xl tracking-tight">Verify Code</span>
                  <ArrowRight className="w-7 h-7" />
                </button>

                <button 
                  type="button" 
                  onClick={() => setStep('IDENTIFY')}
                  className="w-full text-sm font-bold text-[#6B7280] hover:text-[#2C6BED] transition-colors"
                >
                  Wrong email? Go back
                </button>
              </motion.form>
            )}

            {step === 'RESET' && (
              <motion.form
                key="reset"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleResetPassword}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="Min 8 characters"
                      className={`w-full bg-[#F8FAFC] border rounded-[14px] py-4 pl-12 pr-10 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-300 ${
                        validationError ? "border-red-300 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#2C6BED] focus:bg-white"
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C6BED] transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {validationError && <p className="text-[10px] text-red-500 font-bold ml-1">{validationError}</p>}
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-[#2C6BED] hover:bg-[#1A56D6] text-white font-black py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={28} /> : (
                    <>
                      <span className="text-xl tracking-tight">Save Password</span>
                      <ArrowRight className="w-7 h-7" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'SUCCESS' && (
              <motion.div
                key="success"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-center space-y-8"
              >
                <div className="bg-[#E8F0FD] border border-[#2C6BED]/20 text-[#2C6BED] p-10 rounded-[32px] font-bold shadow-sm shadow-blue-500/5">
                  <p className="text-2xl mb-3 tracking-tight">Password Reset!</p>
                  <p className="text-base text-[#6B7280] font-medium tracking-tight leading-relaxed">You've successfully secured your account. You can now use your new credentials.</p>
                </div>
                <Link href="/auth/login" className="inline-flex items-center gap-3 text-[#2C6BED] hover:text-[#1A56D6] font-black tracking-tight transition-all text-lg group">
                  Sign In Now
                  <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'IDENTIFY' && (
            <div className="mt-14 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-3 text-[#6B7280] hover:text-[#2C6BED] font-bold transition-all text-base group tracking-tight">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
