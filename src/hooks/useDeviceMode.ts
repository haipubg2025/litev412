import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useDeviceMode() {
  const uiMode = useStore(state => state.uiMode);
  const [isMobile, setIsMobile] = useState(() => {
    if (uiMode === 'mobile') return true;
    if (uiMode === 'pc') return false;
    return window.innerWidth < 768; // auto
  });

  useEffect(() => {
    if (uiMode !== 'auto') {
      setIsMobile(uiMode === 'mobile');
      return;
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount just in case
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [uiMode]);

  return isMobile;
}
