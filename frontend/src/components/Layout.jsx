import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay show"
          style={{ display: 'none' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className="main-content"
        style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0', transition: 'margin-left 0.3s ease' }}
      >
        <Header
          onMenuToggle={() => setSidebarOpen(v => !v)}
          sidebarOpen={sidebarOpen}
          title={title}
          subtitle={subtitle}
        />
        <main className="page-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
