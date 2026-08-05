import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES = {
  '/dashboard':          'Dashboard',
  '/profile':            'User Profile',
  '/financial-profile':  'Financial Profile',
  '/risk-assessment':    'Risk Assessment',
  '/recommendations':    'Recommendations',
  '/banking':            'Banking Module',
  '/mutual-funds':       'Mutual Funds',
  '/stocks':             'Stocks',
  '/gold':               'Gold',
  '/crypto':             'Crypto',
  '/market':             'Market Dashboard',
  '/chatbot':            'AI Chatbot',
  '/news':               'News Sentiment',
  '/settings':           'Settings',
};

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'InvestIQ';

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 flex flex-col">
            <Sidebar
              collapsed={false}
              setCollapsed={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
