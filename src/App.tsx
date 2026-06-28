/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import Gallery from './components/Gallery';
import Settings from './components/Settings';
import WorldCreation from './components/WorldCreation';
import Gameplay from './components/Gameplay';
import Saves from './components/Saves';
import AIStreamOverlay from './components/AIStreamOverlay';
import { useDeviceMode } from './hooks/useDeviceMode';
import { useStore } from './store/useStore';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function InnerApp() {
  const theme = useStore(state => state.theme);
  const fontFamily = useStore(state => state.fontFamily);
  const fontSize = useStore(state => state.fontSize);
  const isMobile = useDeviceMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(isMobile);
  const location = useLocation();
  const navigate = useNavigate();
  const isGameplay = location.pathname === '/gameplay';
  const isDark = theme.group === 'Dark';

  useEffect(() => {
    if (location.pathname === '/' && isMobile) {
      if (location.state && (location.state as any).fromMenu) {
        // Came from sidebar, don't open sidebar
        return;
      }
      setIsMobileMenuOpen(true);
    }
  }, [location.pathname, location.state, isMobile]);

  useEffect(() => {
    if (fontFamily) {
      const linkId = 'dynamic-font';
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`;
    }
  }, [fontFamily]);

  return (
    <div className={`fixed inset-0 w-[100dvw] h-[100dvh] flex overflow-hidden transition-colors duration-1000 ${theme.bgClass} ${theme.group === 'Dark' ? 'dark dark-theme' : ''}`}
         style={{ fontFamily: `"${fontFamily}", sans-serif`, fontSize: `${fontSize}px` }}
         data-theme={theme.id}>
      
      <AIStreamOverlay />

      {!isGameplay && isMobile && (
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`fixed top-4 right-6 z-50 p-2.5 rounded-full backdrop-blur-xl border border-white/10 ${theme.textPrimary}`}
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      )}

      {!isGameplay && !isMobile && (
        <div className="w-[360px] h-full shrink-0 z-10">
          <Sidebar />
        </div>
      )}

      {!isGameplay && isMobile && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-0 z-40 w-full h-full backdrop-blur-lg ${isDark ? 'bg-black/80' : 'bg-amber-950/20'}`}
              id="mobile-sidebar-container"
            >
              <Sidebar onMobileSelect={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <main className="flex-1 h-full relative overflow-hidden z-10">
        <Routes>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              {isMobile && isMobileMenuOpen ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.03)' }}>
                  <div className={`opacity-15 animate-pulse text-xs lg:text-sm tracking-[0.4em] font-extrabold select-none ${isDark ? 'text-white' : theme.textPrimary}`}>
                    MATRIX LITE v4
                    <div className="text-[0.6em] mt-1 space-y-1">
                      <div>MẠT THẾ TÂN SINH</div>
                    </div>
                  </div>
                </div>
              ) : (
                <Gallery theme={theme} />
              )}
            </motion.div>
          } />
          <Route path="/world-creation" element={
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <WorldCreation />
            </motion.div>
          } />
          <Route path="/settings" element={
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <Settings />
            </motion.div>
          } />
          <Route path="/gameplay" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full w-full absolute inset-0 z-20"
            >
              <Gameplay />
            </motion.div>
          } />
          <Route path="/saves" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full w-full absolute inset-0 z-20"
            >
              <Saves />
            </motion.div>
          } />
          <Route path="*" element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center justify-center h-full ${theme.textSecondary}`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Tính năng đang phát triển</h3>
                <p>Chúng tôi đang làm việc chăm chỉ để hoàn thiện phần này.</p>
                <button 
                  onClick={() => navigate('/')}
                  className={`mt-6 px-6 py-2 rounded-full border border-current hover:bg-white/5 transition-colors cursor-pointer`}
                  id="back-home-btn"
                >
                  Quay lại
                </button>
              </div>
            </motion.div>
          } />
        </Routes>
      </main>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <Toaster 
        theme={theme.group === 'Dark' ? 'dark' : 'light'} 
        position="top-left"
        closeButton={true}
        toastOptions={{
          className: `border border-white/10 backdrop-blur-xl ${theme.bgClass} ${theme.textPrimary}`,
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <InnerApp />
      </Router>
    </QueryClientProvider>
  );
}

