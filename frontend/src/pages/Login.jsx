import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('seller');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Email/WhatsApp dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const data = await login(identifier, password);
      if (data.success) {
        toast.success(`Selamat datang, ${data.user.name}!`);
        if (data.user.role === 'super_admin' || data.user.role === 'owner') {
          navigate('/owner/dashboard');
        } else if (data.user.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/buyer/dashboard');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali identitas Anda.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <ShoppingBag size={28} />
          </div>
          <h1>WEB REKAPAN GO</h1>
          <p>Sistem Manajemen Group Order</p>
        </div>

        {/* Role Tabs */}
        <div className="login-role-tabs">
          <div
            className={`role-tab ${role === 'seller' ? 'active' : ''}`}
            onClick={() => setRole('seller')}
          >
            👨‍💼 Seller / Admin
          </div>
          <div
            className={`role-tab ${role === 'buyer' ? 'active' : ''}`}
            onClick={() => setRole('buyer')}
          >
            🛍️ Buyer
          </div>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'seller' ? 'Email / Username' : 'Email / Nomor WhatsApp'}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={role === 'seller' ? 'admin@example.com' : 'Email atau nomor WA'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: 12, fontSize: 15, marginTop: 8 }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24, padding: 16, borderRadius: 'var(--radius)',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Demo Credentials
          </p>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Seller:</strong><br />
            Email: admin@webrekapango.com<br />
            Password: admin123<br />
            <br />
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Buyer:</strong><br />
            Email: siti@example.com / Password: buyer123
          </div>
        </div>
      </div>
    </div>
  );
}
