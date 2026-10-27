import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Phone, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  KeyRound, 
  RotateCw, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo1.png';

const PHONE_REGEX = /^(09|07)\d{8}$/;

const ForgotPassword = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  // Multi-step states: 'phone' -> 'otp' -> 'new_password' -> 'success'
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [simulatedSms, setSimulatedSms] = useState(null);

  // Timer for resend SMS
  const [resendCountdown, setResendCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendCountdown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendCountdown]);

  const t = {
    en: {
      backCatalog: 'Back to Public Catalog',
      title: 'Reset Password',
      subtitle: 'Recover your account using SMS verification',
      phoneLabel: 'Registered Phone Number',
      phoneHelp: 'Must start with 09 or 07 (10 digits)',
      sendCode: 'Send SMS Verification Code',
      sending: 'Sending SMS...',
      otpSentTo: 'Verification code sent via SMS to',
      changePhone: 'Change Phone',
      otpLabel: 'Enter 6-Digit SMS Code',
      verifyCode: 'Verify SMS Code',
      verifying: 'Verifying...',
      resendIn: 'Resend SMS in',
      resendNow: 'Resend SMS Code',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      passwordHelp: 'Must be at least 4 characters long',
      updatePassword: 'Save New Password',
      updating: 'Updating...',
      passwordMatchError: 'Passwords do not match',
      successTitle: 'Password Reset Complete!',
      successDesc: 'Your password has been updated securely. You can now log in with your new credentials.',
      loginNow: 'Sign In with New Password',
      backToLogin: 'Remember your password?',
      signIn: 'Sign In',
      smsReceived: 'Incoming SMS Alert',
      clickToAutofill: 'Click to auto-fill code',
    },
    am: {
      backCatalog: 'ወደ ዕቃዎች ዝርዝር ተመለስ',
      title: 'የይለፍ ቃል መልሶ ማግኛ',
      subtitle: 'በስልክዎ በሚላክ የኤስኤምኤስ ማረጋገጫ ኮድ ይለፍ ቃልዎን ይቀይሩ',
      phoneLabel: 'የተመዘገቡበት ስልክ ቁጥር',
      phoneHelp: 'በ 09 ወይም 07 መጀመር አለበት (10 አሃዞች)',
      sendCode: 'የኤስኤምኤስ ማረጋገጫ ኮድ ላክ',
      sending: 'በመላክ ላይ...',
      otpSentTo: 'የማረጋገጫ ኮዱ በኤስኤምኤስ የተላከበት ቁጥር:',
      changePhone: 'ስልክ ቀይር',
      otpLabel: 'ባለ 6-አሃዝ የኤስኤምኤስ ኮድ ያስገቡ',
      verifyCode: 'ኮዱን አረጋግጥ',
      verifying: 'በማረጋገጥ ላይ...',
      resendIn: 'እንደገና ለመላክ',
      resendNow: 'ኮዱን እንደገና በSMS ላክ',
      newPasswordLabel: 'አዲስ የይለፍ ቃል',
      confirmPasswordLabel: 'አዲሱን የይለፍ ቃል ደግመው ያስገቡ',
      passwordHelp: 'ቢያንስ 4 ፊደላት ወይም አሃዞች መሆን አለበት',
      updatePassword: 'አዲሱን የይለፍ ቃል መዝግብ',
      updating: 'በማስቀመጥ ላይ...',
      passwordMatchError: 'የይለፍ ቃሎቹ አይመሳሰሉም',
      successTitle: 'የይለፍ ቃልዎ ተቀይሯል!',
      successDesc: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። አሁን በአዲሱ የይለፍ ቃልዎ መግባት ይችላሉ።',
      loginNow: 'በአዲሱ የይለፍ ቃል ይግቡ',
      backToLogin: 'የይለፍ ቃልዎን አስታውሰዋል?',
      signIn: 'ይግቡ',
      smsReceived: 'የደረሰ የኤስኤምኤስ መልዕክት',
      clickToAutofill: 'ኮዱን ወዲያውኑ ለመሙላት እዚህ ይጫኑ',
    }
  };

  const str = t[lang] || t.en;

  // Step 1: Send SMS OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');
    setSimulatedSms(null);

    const cleanPhone = phoneNumber.trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      setError(str.phoneHelp);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password/send-otp', {
        phone_number: cleanPhone
      });

      if (res.data.simulatedOtp) {
        setSimulatedSms({
          code: res.data.simulatedOtp,
          message: `ትንሽBid: Your verification code is ${res.data.simulatedOtp}. Valid for 10 minutes.`
        });
      }

      setSuccessMsg(res.data.message || 'SMS code sent successfully');
      setResendCountdown(60);
      setStep('otp');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send SMS code. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify SMS OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError(lang === 'am' ? 'እባክዎ ባለ 6-አሃዝ ኮድ ያስገቡ' : 'Please enter the 6-digit code received via SMS');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password/verify-otp', {
        phone_number: phoneNumber.trim(),
        otp: cleanOtp
      });

      setResetToken(res.data.resetToken);
      setSuccessMsg(res.data.message || 'Code verified successfully');
      setStep('new_password');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired SMS code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError(str.passwordHelp);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(str.passwordMatchError);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password/reset', {
        phone_number: phoneNumber.trim(),
        resetToken,
        newPassword
      });

      setSuccessMsg(res.data.message || 'Password reset successfully');
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 space-y-4">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-[#16161A] px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-sm transition-all"
      >
        <ArrowLeft size={14} className="text-amber-400" />
        {str.backCatalog}
      </Link>

      <div className="bg-[#16161A] rounded-3xl shadow-2xl p-6 md:p-8 border border-zinc-800/90 space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group focus:outline-none">
            <div className="relative inline-flex items-center justify-center p-2 rounded-2xl bg-[#111113]/80 border border-amber-500/20 shadow-inner group-hover:border-amber-500/40 transition-colors">
              <img 
                src={logoImg} 
                alt="ትንሽBid" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]" 
              />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {str.title}
            </h1>
            <p className="text-xs text-zinc-400">
              {str.subtitle}
            </p>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'phone' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'phone' ? 'bg-zinc-800' : step === 'otp' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'new_password' ? 'bg-amber-400' : step === 'success' ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/40 text-red-300 rounded-2xl text-xs border border-red-800/50 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Global Success / Notice */}
        {successMsg && step !== 'success' && (
          <div className="p-3 bg-emerald-950/40 text-emerald-300 rounded-2xl text-xs border border-emerald-800/50 flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: ENTER PHONE NUMBER ================= */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <MessageSquare size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                {lang === 'am'
                  ? 'የይለፍ ቃልዎን ለመቀየር በስልክዎ የኤስኤምኤስ ማረጋገጫ ኮድ እንልካለን።'
                  : 'SMS verification is required to reset your password. A 6-digit code will be sent to your phone.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {str.phoneLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  autoFocus
                  style={{ fontSize: '16px' }}
                  className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[16px] font-mono font-bold text-white transition-all"
                  placeholder="09xxxxxxxx / 07xxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">{str.phoneHelp}</p>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 10}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  {str.sending}
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  {str.sendCode}
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= STEP 2: ENTER SMS OTP ================= */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Phone info badge with change action */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#111113] border border-zinc-800">
              <div className="flex items-center gap-2 text-xs">
                <Phone size={14} className="text-amber-400" />
                <span className="text-zinc-400">{str.otpSentTo}:</span>
                <span className="font-mono font-bold text-white">{phoneNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                {str.changePhone}
              </button>
            </div>

            {/* Simulated SMS Alert Banner */}
            {simulatedSms && (
              <div className="p-3.5 rounded-2xl bg-[#1E1E24] border border-amber-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    {str.smsReceived}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Just now</span>
                </div>
                <div className="bg-[#111113] p-2.5 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-200">
                  {simulatedSms.message}
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(simulatedSms.code)}
                  className="w-full py-1.5 px-3 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 rounded-xl text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  {str.clickToAutofill} ({simulatedSms.code})
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {str.otpLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  style={{ fontSize: '20px', letterSpacing: '0.25em' }}
                  className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[20px] font-mono font-black text-center text-amber-400 transition-all placeholder:text-zinc-600 placeholder:tracking-normal"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  {str.verifying}
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  {str.verifyCode}
                </>
              )}
            </button>

            {/* Resend SMS Button / Countdown */}
            <div className="text-center pt-2">
              {resendCountdown > 0 ? (
                <span className="text-xs text-zinc-500 font-medium">
                  {str.resendIn} <span className="font-mono font-bold text-zinc-400">{resendCountdown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  <RotateCw size={12} />
                  {str.resendNow}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ================= STEP 3: ENTER NEW PASSWORD ================= */}
        {step === 'new_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>SMS Verified for {phoneNumber}. Enter your new password below.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {str.newPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  style={{ fontSize: '16px' }}
                  className="w-full pl-10 pr-10 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[16px] font-medium text-white transition-all"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">{str.passwordHelp}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {str.confirmPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  style={{ fontSize: '16px' }}
                  className="w-full pl-10 pr-10 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[16px] font-medium text-white transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 4 || newPassword !== confirmPassword}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  {str.updating}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {str.updatePassword}
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= STEP 4: SUCCESS CONFIRMATION ================= */}
        {step === 'success' && (
          <div className="space-y-6 text-center py-2 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {str.successTitle}
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {str.successDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <span>{str.loginNow}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Footer Login Link */}
        <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800/80">
          {str.backToLogin}{' '}
          <Link
            to="/login"
            className="text-amber-400 font-extrabold hover:underline"
          >
            {str.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
