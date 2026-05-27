import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from '../services/authService';
import OWRMSLogo from '../components/OWRMSLogo';

/* ─── Keyframe injection ─────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  @keyframes float1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(40px,-60px) scale(1.08); }
    66%      { transform: translate(-30px,40px) scale(0.95); }
  }
  @keyframes float2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(-50px,30px) scale(1.05); }
    66%      { transform: translate(40px,-50px) scale(0.97); }
  }
  @keyframes float3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(30px,50px) scale(1.1); }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(32px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.6); }
    70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .auth-card { animation: slideUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }

  .auth-input-field {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    padding: 0 12px;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
    caret-color: #818cf8;
  }
  .auth-input-field::placeholder { color: rgba(148,163,184,0.55); }

  /* Override browser autofill white background */
  .auth-input-field:-webkit-autofill,
  .auth-input-field:-webkit-autofill:hover,
  .auth-input-field:-webkit-autofill:focus,
  .auth-input-field:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 100px rgba(30,27,75,0.95) inset !important;
    -webkit-text-fill-color: #e2e8f0 !important;
    caret-color: #818cf8;
    border-radius: 8px;
  }

  .auth-input-wrap {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 0 14px;
    height: 52px;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  }
  .auth-input-wrap:focus-within {
    border-color: rgba(99,102,241,0.8);
    background: rgba(99,102,241,0.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .auth-submit-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%);
    background-size: 200% auto;
    color: #fff;
    letter-spacing: 0.02em;
    transition: transform 0.18s, box-shadow 0.18s, background-position 0.4s;
    box-shadow: 0 4px 20px rgba(99,102,241,0.45);
    margin-top: 6px;
    position: relative;
    overflow: hidden;
  }
  .auth-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(99,102,241,0.55);
    background-position: right center;
  }
  .auth-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .auth-google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    font-size: 0.92rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.22s;
  }
  .auth-google-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.28);
    transform: translateY(-1px);
  }
  .auth-google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-toggle-btn {
    background: none; border: none;
    color: #818cf8; font-weight: 700; cursor: pointer;
    padding: 0; font-size: inherit;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s;
  }
  .auth-toggle-btn:hover { color: #a5b4fc; }

  .auth-divider-line {
    flex: 1; height: 1px;
    background: rgba(255,255,255,0.1);
  }

  .auth-tab {
    flex: 1; padding: 10px;
    border: none; border-radius: 8px;
    font-size: 0.9rem; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.22s;
  }
  .auth-tab.active {
    background: rgba(99,102,241,0.25);
    color: #a5b4fc;
    box-shadow: 0 2px 8px rgba(99,102,241,0.2);
  }
  .auth-tab.inactive {
    background: transparent;
    color: rgba(148,163,184,0.7);
  }
  .auth-tab.inactive:hover { color: #94a3b8; }

  .logo-badge {
    width: 96px; height: 96px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }

  .forgot-link {
    color: #818cf8;
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.2s;
  }
  .forgot-link:hover { color: #a5b4fc; }

  .back-home-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(12px);
    color: rgba(203,213,225,0.9);
    font-size: 0.82rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(.22,.68,0,1.2);
    letter-spacing: 0.01em;
    margin-bottom: 20px;
  }
  .back-home-btn:hover {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.5);
    color: #a5b4fc;
    transform: translateX(-3px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.2);
  }
  .back-home-btn svg {
    transition: transform 0.25s;
  }
  .back-home-btn:hover svg {
    transform: translateX(-3px);
  }

  .close-card-btn {
    position: absolute;
    top: 16px; right: 16px;
    width: 30px; height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(148,163,184,0.6);
    transition: all 0.2s;
  }
  .close-card-btn:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.4);
    color: #f87171;
    transform: rotate(90deg);
  }

  .auth-input-wrap.error {
    border-color: rgba(239,68,68,0.7) !important;
    background: rgba(239,68,68,0.06) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
  }

  .field-error-msg {
    margin-top: 5px;
    font-size: 0.76rem;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 5px;
    animation: slideUp 0.2s ease both;
  }

  .password-strength {
    margin-top: 6px;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    transition: background 0.3s;
  }
  .strength-label {
    font-size: 0.72rem;
    font-weight: 600;
    min-width: 60px;
    text-align: right;
  }
`;

/* ─── InputWrapper ─────────────────────────────────────── */
const InputWrapper = ({ icon, children, hasError }) => (
  <div className={`auth-input-wrap${hasError ? ' error' : ''}`}>
    <div style={{ color: hasError ? 'rgba(239,68,68,0.8)' : 'rgba(148,163,184,0.8)', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.25s' }}>
      {icon}
    </div>
    <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  </div>
);

/* ─── SVG icons ─────────────────────────────────────────── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Validation helpers ─────────────────────────────────── */
const VALIDATORS = {
  fullName: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return 'Họ và tên không được để trống.';
    if (trimmed.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.';
    if (trimmed.length > 50) return 'Họ và tên không được vượt quá 50 ký tự.';
    if (!/^[\p{L}\s]+$/u.test(trimmed)) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.';
    const words = trimmed.split(/\s+/);
    if (words.length < 2) return 'Vui lòng nhập đầy đủ họ và tên (ví dụ: Nguyễn Văn A).';
    for (const word of words) {
      if (word.length < 2) return 'Mỗi từ trong tên phải có ít nhất 2 ký tự.';
      if (/(.{2,})\1/i.test(word)) return 'Tên không hợp lệ. Vui lòng nhập tên thật.';
      if (/(.)\1{2,}/i.test(word)) return 'Tên không hợp lệ. Vui lòng nhập tên thật.';
    }
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return 'Số điện thoại không được để trống.';
    const digits = v.replace(/\s/g, '');
    if (!/^(0[3|5|7|8|9])\d{8}$/.test(digits)) return 'Số điện thoại không hợp lệ (VD: 0901234567).';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email không được để trống.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Địa chỉ email không đúng định dạng.';
    if (!v.trim().toLowerCase().endsWith('.com')) return 'Email phải kết thúc bằng .com (VD: example@gmail.com).';
    if (v.trim().length > 100) return 'Email không được vượt quá 100 ký tự.';
    // Kiểm tra domain không phải tên hợp lệ (chỉ có @ và TLD, thiếu domain)
    const domain = v.trim().split('@')[1] || '';
    if (domain.split('.').some(p => p.length === 0)) return 'Tên miền email không hợp lệ.';
    return '';
  },
  password: (v) => {
    if (!v) return 'Mật khẩu không được để trống.';
    if (v.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.';
    if (v.length > 100) return 'Mật khẩu không được vượt quá 100 ký tự.';
    if (!/[A-Z]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).';
    if (!/[a-z]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).';
    if (!/[0-9]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).';
    return '';
  },
  loginEmail: (v) => {
    if (!v.trim()) return 'Email không được để trống.';
    return '';
  },
  loginPassword: (v) => {
    if (!v) return 'Mật khẩu không được để trống.';
    return '';
  },
};

// Danh sách domain email phổ biến & các dạng typo thường gặp
const DOMAIN_SUGGESTIONS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'fpt.edu.vn', 'hcmut.edu.vn', 'live.com',
];

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function getSuggestedDomain(email) {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (DOMAIN_SUGGESTIONS.includes(domain)) return null;
  let best = null, bestDist = 99;
  for (const d of DOMAIN_SUGGESTIONS) {
    const dist = levenshtein(domain, d);
    if (dist < bestDist && dist <= 3) { best = d; bestDist = dist; }
  }
  return best ? `${email.slice(0, at + 1)}${best}` : null;
}

const getPasswordStrength = (v) => {

  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (score <= 1) return { level: 1, label: 'Rất yếu', color: '#ef4444' };
  if (score === 2) return { level: 2, label: 'Yếu', color: '#f97316' };
  if (score === 3) return { level: 3, label: 'Trung bình', color: '#eab308' };
  if (score === 4) return { level: 4, label: 'Mạnh', color: '#22c55e' };
  return { level: 5, label: 'Rất mạnh', color: '#10b981' };
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-error-msg">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </span>
  ) : null;

/* ─── Main Component ─────────────────────────────────────── */
const AuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', roleName: 'USER' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP step state
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];


  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true); setError('');
      try {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } });
        const googleUser = await googleRes.json();
        await authService.googleLogin({ email: googleUser.email, fullName: googleUser.name, googleId: googleUser.sub, avatarUrl: googleUser.picture });
        window.dispatchEvent(new Event('authChange'));
        const user = authService.getCurrentUser();
        const returnUrl = location.state?.returnUrl || new URLSearchParams(location.search).get('returnUrl');
        if (returnUrl) {
          navigate(returnUrl, { replace: true });
        } else if ((user?.role || user?.roleName || '').toUpperCase() === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch { setError('Đăng nhập Google thất bại. Vui lòng thử lại.'); }
      finally { setGoogleLoading(false); }
    },
    onError: () => setError('Đăng nhập Google bị hủy hoặc thất bại.'),
  });

  useEffect(() => {
    if (location.state?.mode === 'login') setIsLogin(true);
    else if (location.state?.mode === 'register') setIsLogin(false);
  }, [location.state]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const validator = !isLogin
        ? VALIDATORS[name]
        : (name === 'email' ? VALIDATORS.loginEmail : name === 'password' ? VALIDATORS.loginPassword : null);
      if (validator) setFieldErrors(prev => ({ ...prev, [name]: validator(value) }));
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const validator = !isLogin
      ? VALIDATORS[name]
      : (name === 'email' ? VALIDATORS.loginEmail : name === 'password' ? VALIDATORS.loginPassword : null);
    if (validator) setFieldErrors(prev => ({ ...prev, [name]: validator(value) }));
  };

  const validateAll = () => {
    if (!isLogin) {
      const errs = {
        fullName: VALIDATORS.fullName(formData.fullName),
        phone: VALIDATORS.phone(formData.phone),
        email: VALIDATORS.email(formData.email),
        password: VALIDATORS.password(formData.password),
      };
      setFieldErrors(errs);
      setTouched({ fullName: true, phone: true, email: true, password: true });
      return Object.values(errs).every(e => !e);
    } else {
      const errs = {
        email: VALIDATORS.loginEmail(formData.email),
        password: VALIDATORS.loginPassword(formData.password),
      };
      setFieldErrors(errs);
      setTouched({ email: true, password: true });
      return Object.values(errs).every(e => !e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true); setError('');
    try {
      const redirectAfterAuth = () => {
        const returnUrl = location.state?.returnUrl || new URLSearchParams(location.search).get('returnUrl');
        if (returnUrl) {
          navigate(returnUrl, { replace: true });
          return;
        }
        const user = authService.getCurrentUser();
        if ((user?.role || user?.roleName || '').toUpperCase() === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      };
      if (isLogin) {
        await authService.login(formData.email, formData.password);
        window.dispatchEvent(new Event('authChange')); redirectAfterAuth();
      } else {
        // REGISTER FLOW: send OTP first
        const res = await fetch('http://localhost:5276/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            roleName: formData.roleName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể gửi OTP.');
        // Switch to OTP step
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError('');
        setResendCooldown(60);
        setStep('otp');
      }
    } catch (err) { 
      if (err.response?.status === 401) {
        setError('Sai email hoặc mật khẩu.');
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'); 
      }
    }
    finally { setLoading(false); }
  };

  // Countdown timer for resend
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''].map((_, i) => digits[i] || '');
      setOtpDigits(newOtp);
      const nextEmpty = newOtp.findIndex((d, i) => i >= digits.length - 1);
      const focusIdx = Math.min(digits.length, 5);
      otpRefs[focusIdx]?.current?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);
    setOtpError('');
    if (digit && index < 5) otpRefs[index + 1]?.current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) { setOtpError('Vui lòng nhập đủ 6 chữ số OTP.'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch('http://localhost:5276/api/auth/verify-otp-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.message || 'OTP không đúng hoặc đã hết hạn.'); return; }
      // Auto login after successful registration
      await authService.login(formData.email, formData.password);
      window.dispatchEvent(new Event('authChange'));
      const returnUrl = location.state?.returnUrl || new URLSearchParams(location.search).get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      } else {
        navigate('/');
      }
    } catch {
      setOtpError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      const res = await fetch('http://localhost:5276/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roleName: formData.roleName,
        }),
      });
      if (res.ok) { setResendCooldown(60); setOtpDigits(['', '', '', '', '', '']); otpRefs[0]?.current?.focus(); }
      else { const d = await res.json(); setOtpError(d.message || 'Không thể gửi lại OTP.'); }
    } catch { setOtpError('Không thể gửi lại OTP.'); }
  };


  return (
    <>
      <style>{STYLES}</style>

      {/* ── Full-page dark background ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
        fontFamily: "'Inter', sans-serif", position: 'relative', padding: '20px',
      }}>

        {/* ── Animated background orbs (absolute, pointer-events none) ── */}
        <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
          <div style={{
            position:'absolute', width:'500px', height:'500px',
            borderRadius:'50%', top:'-120px', left:'-100px',
            background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            animation:'float1 12s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', width:'400px', height:'400px',
            borderRadius:'50%', bottom:'-80px', right:'-60px',
            background:'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)',
            animation:'float2 15s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', width:'300px', height:'300px',
            borderRadius:'50%', top:'50%', left:'60%',
            background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            animation:'float3 10s ease-in-out infinite',
          }}/>
          {/* Grid pattern overlay */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize:'48px 48px',
          }}/>
        </div>

        {/* ── Back to homepage button (above card) ── */}
        <button className="back-home-btn" onClick={() => navigate('/')} style={{ zIndex: 20, position: 'relative' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Về trang chủ
        </button>

        {/* ── Glass Card ── */}
        <div className="auth-card" style={{
          position:'relative', zIndex:20,
          width:'100%', maxWidth:'440px',
          background:'rgba(15,23,42,0.75)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          borderRadius:'24px',
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          padding:'40px 36px 36px',
          boxSizing:'border-box',
        }}>

          {/* Close button (X) */}
          <button className="close-card-btn" onClick={() => navigate('/')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* ── OTP STEP ── */}
          {step === 'otp' ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(124,58,237,0.2))', border:'1.5px solid rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{ margin:'0 0 8px', fontSize:'1.3rem', fontWeight:800, color:'#f1f5f9', textAlign:'center' }}>Xác thực Email</h2>
              <p style={{ margin:'0 0 4px', fontSize:'0.84rem', color:'rgba(148,163,184,0.8)', textAlign:'center' }}>Mã OTP 6 số đã được gửi đến</p>
              <p style={{ margin:'0 0 28px', fontSize:'0.88rem', fontWeight:700, color:'#818cf8', textAlign:'center' }}>{formData.email}</p>
              {/* 6 OTP boxes */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={6} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    style={{
                      width:'48px', height:'58px', textAlign:'center', fontSize:'1.5rem', fontWeight:800, fontFamily:'monospace',
                      background: otpError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                      border:`2px solid ${otpError ? 'rgba(239,68,68,0.6)' : digit ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius:'12px', color:'#e2e8f0', outline:'none', caretColor:'#818cf8', transition:'border-color 0.2s',
                    }}
                  />
                ))}
              </div>
              {otpError && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'#f87171', fontSize:'0.82rem', marginBottom:'14px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {otpError}
                </div>
              )}
              <button onClick={handleVerifyOtp} disabled={otpLoading || otpDigits.join('').length < 6} className="auth-submit-btn" style={{ marginBottom:'16px', width:'100%' }}>
                {otpLoading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Đang xác nhận...
                  </span>
                ) : '✓ Xác nhận OTP'}
              </button>
              <button onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background:'none', border:'none', cursor:resendCooldown>0?'not-allowed':'pointer', color:resendCooldown>0?'rgba(148,163,184,0.4)':'#818cf8', fontSize:'0.84rem', fontWeight:600, fontFamily:'Inter,sans-serif', marginBottom:'10px' }}>
                {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : '↺ Gửi lại OTP'}
              </button>
              <button onClick={() => { setStep('form'); setOtpError(''); setError(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(148,163,184,0.55)', fontSize:'0.82rem', fontFamily:'Inter,sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.color='#94a3b8'} onMouseLeave={e => e.currentTarget.style.color='rgba(148,163,184,0.55)'}>
                ← Quay lại sửa thông tin
              </button>
            </div>
          ) : (<>

          {/* ── Brand ── */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <h1 style={{ margin:'0 0 8px', fontSize:'1.6rem', fontWeight:800, background:'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.01em', lineHeight: 1.3 }}>
              Online Warehouse Rental Management System
            </h1>
            <p style={{ margin:0, fontSize:'0.85rem', color:'rgba(148,163,184,0.75)', letterSpacing:'0.03em' }}>
              Hệ thống quản lí dịch vụ kho
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div style={{
            display:'flex', gap:'6px', marginBottom:'24px',
            background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'4px',
          }}>
            <button className={`auth-tab ${isLogin ? 'active' : 'inactive'}`} onClick={() => { setIsLogin(true); setError(''); }}>
              Đăng nhập
            </button>
            <button className={`auth-tab ${!isLogin ? 'active' : 'inactive'}`} onClick={() => { setIsLogin(false); setError(''); }}>
              Đăng ký
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding:'12px 14px', marginBottom:'16px', borderRadius:'10px',
              background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
              color:'#fca5a5', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Họ và tên</label>
                  <InputWrapper icon={<IconUser />} hasError={!!fieldErrors.fullName}>
                    <input
                      className="auth-input-field"
                      name="fullName" type="text" placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      maxLength={51}
                    />
                  </InputWrapper>
                  <FieldError msg={fieldErrors.fullName} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Số điện thoại</label>
                  <InputWrapper icon={<IconPhone />} hasError={!!fieldErrors.phone}>
                    <input
                      className="auth-input-field"
                      name="phone" type="tel" placeholder="0901234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      maxLength={11}
                    />
                  </InputWrapper>
                  <FieldError msg={fieldErrors.phone} />
                </div>
              </>
            )}

            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Email</label>
              <InputWrapper icon={<IconMail />} hasError={!!fieldErrors.email}>
                <input
                  className="auth-input-field"
                  name="email" type="text" placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  maxLength={101}
                />
              </InputWrapper>
              <FieldError msg={fieldErrors.email} />
              {/* Gợi ý domain khi có typo — chỉ hiện ở form đăng ký */}
              {!isLogin && !fieldErrors.email && formData.email.includes('@') && (() => {
                const suggestion = getSuggestedDomain(formData.email);
                if (!suggestion) return null;
                return (
                  <div style={{ marginTop:'6px', display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#f59e0b', animation:'slideUp 0.2s ease both' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Ý bạn là{' '}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, email: suggestion }))}
                      style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:'#818cf8', fontWeight:700, fontSize:'0.78rem', fontFamily:'Inter,sans-serif', textDecoration:'underline' }}
                    >
                      {suggestion}
                    </button>
                    {' '}?
                  </div>
                );
              })()}
            </div>


            <div>
              <div style={{ marginBottom:'6px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', letterSpacing:'0.04em', textTransform:'uppercase' }}>Mật khẩu</label>
              </div>
              <InputWrapper icon={<IconLock />} hasError={!!fieldErrors.password}>
                <input
                  className="auth-input-field"
                  name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  maxLength={101}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'rgba(148,163,184,0.7)', display:'flex', alignItems:'center',
                  padding:'0 2px', transition:'color 0.2s', flexShrink:0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(148,163,184,0.7)'}
                >
                  {showPassword ? <IconEye /> : <IconEyeOff />}
                </button>
              </InputWrapper>
              <FieldError msg={fieldErrors.password} />
              {!isLogin && formData.password && (() => {
                const s = getPasswordStrength(formData.password);
                const bars = [1,2,3,4,5];
                return (
                  <div className="password-strength">
                    {bars.map(i => (
                      <div key={i} className="strength-bar"
                        style={{ background: i <= s.level ? s.color : 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                    <span className="strength-label" style={{ color: s.color }}>{s.label}</span>
                  </div>
                );
              })()}
            </div>

            {isLogin && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.82rem', color:'rgba(148,163,184,0.8)' }}>
                  <input type="checkbox" style={{ width:'15px', height:'15px', accentColor:'#6366f1', cursor:'pointer' }} />
                  Nhớ tài khoản
                </label>
                <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
            </button>
          </form>

          {/* ── Divider ── */}
          <div style={{ display:'flex', alignItems:'center', margin:'20px 0', gap:'12px' }}>
            <div className="auth-divider-line"/>
            <span style={{ fontSize:'0.78rem', color:'rgba(148,163,184,0.55)', whiteSpace:'nowrap', letterSpacing:'0.04em' }}>HOẶC</span>
            <div className="auth-divider-line"/>
          </div>

          {/* ── Google ── */}
          <button className="auth-google-btn" onClick={() => handleGoogleLogin()} disabled={googleLoading}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" height="18" alt="Google" />
            {googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
          </button>

          {/* ── Footer note ── */}
          <p style={{ marginTop:'24px', textAlign:'center', fontSize:'0.78rem', color:'rgba(100,116,139,0.8)', lineHeight:'1.6' }}>
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <a href="#" style={{ color:'#818cf8', textDecoration:'none' }}>Điều khoản sử dụng</a>
            {' & '}
            <a href="#" style={{ color:'#818cf8', textDecoration:'none' }}>Chính sách bảo mật</a>
            {' '}của chúng tôi.
          </p>
          </>)}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default AuthPage;

