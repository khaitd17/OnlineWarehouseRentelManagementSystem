import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.forgotPassword(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative' }}>
                             <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                             </svg>
                             <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: '#000', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                             </div>
                        </div>
                    </div>
                    
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Check your email!</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
                        Thanks! An email was sent that will ask you to click on a link to verify that you own this account. If you don't get the email, please contact <span style={{ color: '#0095c7' }}>support@owrms.com</span>
                    </p>

                    <button 
                        onClick={() => window.open('https://mail.google.com', '_blank')}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#0095c7', color: '#fff', fontWeight: 700, borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '20px', transition: 'transform 0.2s' }}
                    >
                        Open email inbox
                    </button>

                    <button 
                        onClick={() => setSubmitted(false)}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
                    >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Resend email
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
                        <rect x="35" y="40" width="30" height="40" stroke="#000" strokeWidth="1.5" />
                        <line x1="35" y1="50" x2="65" y2="50" stroke="#000" strokeWidth="1.5" />
                        <line x1="35" y1="60" x2="65" y2="60" stroke="#000" strokeWidth="1.5" />
                        <path d="M50 40V20M40 25H60" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M45 80L40 90H60L55 80" stroke="#000" strokeWidth="1.5" />
                    </svg>
                </div>

                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Forgot your password?</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '40px' }}>
                    Enter your email so that we can send you password reset link
                </p>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. username@kinety.com" 
                            required 
                            style={{ width: '100%', padding: '14px 20px', border: '1px solid #e2e8f0', borderRadius: '25px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#94a3b8' : '#0095c7', color: '#fff', fontWeight: 700, borderRadius: '25px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', marginBottom: '24px', transition: 'all 0.2s' }}
                    >
                        {loading ? 'Sending...' : 'Send Email'}
                    </button>

                    <Link to="/auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Back to Login
                    </Link>
                </form>

                <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                     <span>Copyright©2024</span>
                     <span>Privacy Policy</span>
                </div>
            </div>
        </div>
    );
};

export default ForgotPage;
