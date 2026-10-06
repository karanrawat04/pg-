import React, { useState } from 'react';
import { api } from '../api/client';
import { AuthUser } from '../types';
import { Mail, KeyRound, ArrowRight, Shield, Building2, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface MobileLoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const MobileLoginScreen: React.FC<MobileLoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'REGISTER'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration State for new PG Owners
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.sendOtp(email.trim(), 'login');
      if (res.success) {
        setOtp(res.previewOtp || '123456'); // Master OTP automatically populated
        setStep('OTP');
      } else {
        setError(res.message || 'No registered account found with this email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(email.trim(), otp.trim());

      if (!res.success) {
        setError(res.message || 'Invalid or expired OTP code.');
        return;
      }

      // Check role isolation: Super Admin cannot enter the mobile app
      if (res.data?.role === 'SUPER_ADMIN') {
        setError('Platform Super Administrators must log into the Admin Web Portal (http://localhost:3001). Mobile app access is restricted.');
        return;
      }

      if (res.isNewUser) {
        setError('No registered resident or PG owner account found. Please register your PG business below or ask your PG owner to onboard you.');
        return;
      }

      if (res.token && res.data) {
        api.setAuth(res.token, res.data);
        onLoginSuccess(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPhone || !regBusinessName || !email) {
      setError('Please fill in all registration fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.registerOwner({
        email: email.trim(),
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        businessName: regBusinessName.trim(),
      });

      if (res.success && res.token && res.data) {
        api.setAuth(res.token, res.data);
        onLoginSuccess(res.data);
      } else {
        setError(res.message || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'radial-gradient(ellipse at top, #111a33 0%, #060913 75%)',
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: '30px 22px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
          }}>
            <Building2 size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            PG Flow Mobile
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            {step === 'REGISTER' ? 'Register New PG Business' : 'Sign In with Email OTP'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#fb7185',
            fontSize: 12.5,
            marginBottom: 16,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {step === 'EMAIL' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Your Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                Residents and PG Owners receive a 6-digit verification code to their email.
              </p>
            </div>

            {/* Quick Test Accounts Presets */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Quick Test Accounts
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Master OTP: <strong>123456</strong></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setEmail('rohit.sharma@example.com')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: email === 'rohit.sharma@example.com' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: email === 'rohit.sharma@example.com' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: '#e2e8f0',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>🏢 <strong>SN Pg Owner</strong> (Rohit)</span>
                  <span style={{ color: '#818cf8', fontSize: 11 }}>rohit.sharma@example.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmail('karan123@gmail.com')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: email === 'karan123@gmail.com' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: email === 'karan123@gmail.com' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: '#e2e8f0',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>🛏️ <strong>SN Pg Resident</strong> (Bed 205-A)</span>
                  <span style={{ color: '#34d399', fontSize: 11 }}>karan123@gmail.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmail('rajesh@starlightliving.in')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: email === 'rajesh@starlightliving.in' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: email === 'rajesh@starlightliving.in' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: '#e2e8f0',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>🏢 <strong>Starlight Owner</strong> (Rajesh)</span>
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>rajesh@starlightliving.in</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Sending Verification Code...' : (
                <>
                  <span>Send Login Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('REGISTER');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                New PG Owner? Register your business →
              </button>
            </div>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 11.5, cursor: 'pointer' }}
                >
                  Change Email
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  required
                  autoFocus
                  className="custom-input"
                  style={{ paddingLeft: 38, letterSpacing: '4px', fontSize: 17, fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  Code sent to <strong>{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#a5b4fc',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Fill Master OTP (123456)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Verifying Code...' : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify & Enter</span>
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
                fontSize: 11.5,
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline',
              }}
            >
              Didn't receive code? Resend email
            </button>
          </form>
        )}

        {step === 'REGISTER' && (
          <form onSubmit={handleRegisterOwner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12,
              color: '#a5b4fc',
            }}>
              ✨ Register your PG Business to start your 14-day free trial.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Business Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                PG Business Name
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  placeholder="e.g. Skyline Luxury Coliving"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Owner Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Phone Number (WhatsApp)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  required
                  className="custom-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
