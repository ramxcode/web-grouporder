import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Header
          onMenuToggle={() => setSidebarOpen(v => !v)}
          title={title}
          subtitle={subtitle}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
