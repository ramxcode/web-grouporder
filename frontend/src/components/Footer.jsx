import { useAuth } from '../contexts/AuthContext';

/**
 * Footer global — tampil di semua halaman
 * Teks & link developer bisa dikonfigurasi via Website Settings
 */
export default function Footer() {
  const { websiteSettings } = useAuth();

  const footerText  = websiteSettings?.footerText  || '© 2026 Zastiply - Made By RAMXCODE';
  const devLink     = websiteSettings?.developerLink || 'https://t.me/minramz';
  const devName     = websiteSettings?.developerName || 'RAMXCODE';

  // Split teks di sekitar nama developer agar bisa dijadikan link
  const parts = footerText.split(devName);

  return (
    <footer className="app-footer">
      <span>
        {parts[0]}
        <a
          href={devLink}
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer-link"
        >
          {devName}
        </a>
        {parts[1]}
      </span>
    </footer>
  );
}
