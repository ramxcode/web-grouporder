import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Icon from '../components/Icon';
import Footer from '../components/Footer';
import logoSvg from '../assets/logo.svg';

/**
 * Login Page — dua tahap:
 * 1. Pilih peran: Admin/Seller ATAU Buyer
 * 2. Masukkan kredensial (divalidasi sesuai peran)
 */
export default function LoginPage() {
  // Step 1: pilih role | Step 2: form
  const [step, setStep]           = useState('choose'); // 'choose' | 'form'
  const [loginAs, setLoginAs]     = useState('');       // 'admin' | 'buyer'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  /* ───── Pilih peran ───── */
  const selectRole = (role) => {
    setLoginAs(role);
    setIdentifier('');
    setPassword('');
    setStep('form');
  };

  /* ───── Submit form ───── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Semua kolom wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const data = await login(identifier, password);
      if (!data.success) { toast.error('Login gagal'); return; }

      const role = data.user.role;
      const isAdminRole = role === 'super_admin' || role === 'owner' || role === 'seller';
      const isBuyerRole = role === 'buyer';

      /* Validasi: admin login tapi masuk sebagai buyer → tolak */
      if (loginAs === 'buyer' && isAdminRole) {
        toast.error('Akun ini bukan akun Buyer. Silakan login sebagai Admin / Seller.');
        return;
      }

      /* Validasi: buyer login tapi pilih admin → tolak */
      if (loginAs === 'admin' && isBuyerRole) {
        toast.error('Akun ini bukan akun Admin. Silakan login sebagai Buyer.');
        return;
      }

      toast.success(`Selamat datang, ${data.user.name}!`);
      if (role === 'super_admin' || role === 'owner') {
        navigate('/owner/dashboard');
      } else if (role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali identitas Anda.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════════════════════════════════
     STEP 1 — Pilih peran
  ═══════════════════════════════════════ */
  if (step === 'choose') {
    return (
      <div className="login-page">
        <div className="login-card login-choose-card">
          {/* Logo */}
          <div className="login-logo">
            <img src={logoSvg} alt="Zastiply" className="login-brand-logo" />
          </div>

          <h2 className="login-choose-title">Masuk sebagai</h2>

          {/* Tombol pilih peran */}
          <div className="login-choose-btns">
            <button
              className="login-choose-btn"
              onClick={() => selectRole('admin')}
            >
              <span className="login-choose-icon-shape admin-shape" />
              <span>Admin / Seller</span>
            </button>

            <button
              className="login-choose-btn"
              onClick={() => selectRole('buyer')}
            >
              <span className="login-choose-icon-shape buyer-shape" />
              <span>Buyer / Member</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  /* ═══════════════════════════════════════
     STEP 2 — Form Login
  ═══════════════════════════════════════ */
  const isAdminLogin = loginAs === 'admin';
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Tombol kembali */}
        <button
          className="login-back-btn"
          onClick={() => setStep('choose')}
        >
          <Icon name="ChevronLeft" size={16} />
          Ganti peran
        </button>

        {/* Header form */}
        <div className="login-logo">
          <div className="login-logo-icon">
            {isAdminLogin
              ? <Icon name="Shield" size={28} />
              : <Icon name="ShoppingBag" size={28} />
            }
          </div>
          <h1>{isAdminLogin ? 'Admin / Seller' : 'Buyer / Member'}</h1>
          <p>
            {isAdminLogin
              ? 'Login dengan akun Admin atau Super Admin'
              : 'Login dengan akun Buyer / Member'}
          </p>
        </div>

        {/* Badge peran */}
        <div className={`login-role-badge ${isAdminLogin ? 'admin' : 'buyer'}`}>
          {isAdminLogin ? '🔐 Area Admin' : '🛍️ Area Buyer'}
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {isAdminLogin ? 'Email / Username' : 'Email / Nomor WhatsApp'}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={isAdminLogin ? 'admin@example.com' : 'Email atau nomor WA'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
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
                {showPass ? <Icon name="EyeOff" size={16} /> : <Icon name="Eye" size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary login-submit-btn ${isAdminLogin ? '' : 'buyer-btn'}`}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
