export default function MaintenancePage({ settings }) {
  const title = settings?.maintenanceTitle || 'Sedang Maintenance';
  const message = settings?.maintenanceMessage || 'Website sedang dalam perbaikan. Silakan coba beberapa saat lagi.';
  const siteName = settings?.siteName || 'WEB REKAPAN GO';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        color: 'white',
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', animation: 'pulse 2s infinite' }}>🔧</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.7, marginBottom: '2rem' }}>{message}</p>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{siteName}</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.25rem' }}>Hubungi admin jika ada pertanyaan</p>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );
}
