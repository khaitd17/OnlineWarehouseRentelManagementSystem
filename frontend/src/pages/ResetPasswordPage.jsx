import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSuccessful, setResetSuccessful] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Token không hợp lệ hoặc đã hết hạn.');
        }
    }, [token]);

    const calculateStrength = (pwd) => {
        let strength = 0;
        if (pwd.length >= 8) strength += 25;
        if (/[A-Z]/.test(pwd)) strength += 25;
        if (/[0-9]/.test(pwd)) strength += 25;
        if (/[!@#$%^&*]/.test(pwd)) strength += 25;
        return strength;
    };

    const strength = calculateStrength(password);
    const strengthLabel = strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Excellent';
    const strengthColor = strength <= 25 ? '#ef4444' : strength <= 50 ? '#f59e0b' : strength <= 75 ? '#10b981' : '#0095c7';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        if (password.length < 8) {
            setError('Mật khẩu phải chứa ít nhất 8 ký tự.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.resetPassword(token, password);
            setResetSuccessful(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (resetSuccessful) {
        return (
            <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                            <path d="M40 50C40 45 45 40 50 40C55 40 60 45 60 50C60 55 55 60 50 60C45 60 40 55 40 50Z" stroke="#000" strokeWidth="1.5" />
                            <path d="M60 50H75M75 50L80 45M75 50L80 55" stroke="#000" strokeWidth="1.5" />
                            <path d="M48 60L42 75M52 60L58 75" stroke="#000" strokeWidth="1.5" />
                            <path d="M40 70H60" stroke="#000" strokeWidth="1.5" strokeDasharray="2 2" />
                            <circle cx="50" cy="50" r="15" stroke="#000" strokeWidth="1.5" />
                        </svg>
                    </div>

                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Password changed!</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '40px' }}>
                        You've Successfully Completed Your Password Reset!
                    </p>

                    <button 
                        onClick={() => navigate('/auth')}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#0095c7', color: '#fff', fontWeight: 700, borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '24px', transition: 'all 0.2s' }}
                    >
                        Log in Now
                    </button>

                    <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                         <span>Copyright©2024</span>
                         <span>Privacy Policy</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                         <rect x="35" y="45" width="30" height="20" rx="2" stroke="#000" strokeWidth="1.5" />
                         <path d="M40 45V35C40 30 44 26 50 26C56 26 60 30 60 35V45" stroke="#000" strokeWidth="1.5" />
                         <circle cx="50" cy="55" r="2" fill="#000" />
                    </svg>
                </div>

                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Reset password</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '40px' }}>
                    Please kindly set your new password.
                </p>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>New password</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="········" 
                                required
                                style={{ width: '100%', padding: '14px 20px', border: '1px solid #e2e8f0', borderRadius: '25px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                            />
                            {strength === 100 && (
                                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#0095c7' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                        
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', gap: '4px', height: '6px', marginBottom: '8px' }}>
                                <div style={{ flex: 1, borderRadius: '4px', backgroundColor: strength >= 25 ? strengthColor : '#e2e8f0', transition: 'all 0.3s' }}></div>
                                <div style={{ flex: 1, borderRadius: '4px', backgroundColor: strength >= 50 ? strengthColor : '#e2e8f0', transition: 'all 0.3s' }}></div>
                                <div style={{ flex: 1, borderRadius: '4px', backgroundColor: strength >= 75 ? strengthColor : '#e2e8f0', transition: 'all 0.3s' }}></div>
                                <div style={{ flex: 1, borderRadius: '4px', backgroundColor: strength >= 100 ? strengthColor : '#e2e8f0', transition: 'all 0.3s' }}></div>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Password strength: <span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span></span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Re-enter password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="········" 
                            required
                            style={{ width: '100%', padding: '14px 20px', border: '1px solid #e2e8f0', borderRadius: '25px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !token}
                        style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#94a3b8' : '#0095c7', color: '#fff', fontWeight: 700, borderRadius: '25px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', transition: 'all 0.2s' }}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>

                <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                     <span>Copyright©2024</span>
                     <span>Privacy Policy</span>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
