import React, { useState } from 'react';
import { adminApi } from '../api/client';
import { AdminUser } from '../types';
import { ShieldCheck, Mail, KeyRound, ArrowRight, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminLoginScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('karanroliyal12@gmail.com');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid administrative email.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await adminApi.sendOtp(email.trim());
      if (res.success) {
        if (res.previewOtp) {
          setPreviewOtp(res.previewOtp);
          setOtp(res.previewOtp); // Auto-fill for friction-free dev testing
        }
        setStep('OTP');
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while connecting to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await adminApi.verifyOtp(email.trim(), otp.trim());
      if (res.success && res.token && res.data) {
        if (res.data.role !== 'SUPER_ADMIN') {
          setError('Access Denied: This portal is restricted exclusively to Platform Super Administrators.');
          return;
        }

        adminApi.setAuth(res.token, res.data);
        onLoginSuccess(res.data);
      } else {
        setError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #111827 0%, #060913 70%)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: '36px 32px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            PG Flow Control Center
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
            Super Admin Access & Multi-PG Governance
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fb7185',
            fontSize: 13,
            marginBottom: 20,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karanroliyal12@gmail.com"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 42 }}
                />
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={12} /> Passwordless login via secure email one-time password
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
            >
              {loading ? 'Dispatching OTP...' : (
                <>
                  <span>Send Security Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#cbd5e1' }}>
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer' }}
                >
                  Change Email
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                  className="custom-input"
                  style={{ paddingLeft: 42, letterSpacing: '4px', fontSize: 18, fontWeight: 700 }}
                />
              </div>

              {previewOtp && (
                <div style={{
                  marginTop: 10,
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#a5b4fc',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={14} color="#818cf8" />
                    <span>Instant Dev Preview: <strong>{previewOtp}</strong></span>
                  </span>
                  <span style={{ fontSize: 10.5, color: '#94a3b8' }}>Auto-filled</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
            >
              {loading ? 'Verifying Credentials...' : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Authenticate & Enter Console</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline',
              }}
            >
              Didn't receive code? Resend Email OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
