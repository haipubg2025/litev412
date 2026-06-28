import React from 'react';
import { useStore } from '../store/useStore';
import { Server } from 'lucide-react';

export const ProxyMatTheTab = () => {
  const currentTheme = useStore((state) => state.theme);

  return (
    <section className="w-full space-y-12">
      <div className="p-8 rounded-[2.5rem] theme-panel border-transparent backdrop-blur-xl">
        <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${currentTheme.textPrimary}`}>
          <Server className="w-6 h-6 text-emerald-400" /> Proxy Mạt Thế
        </h3>
        <div className={`p-4 rounded-2xl theme-input border-transparent gap-4`}>
          <p className={`${currentTheme.textPrimary}`}>
            Tính năng Proxy Mạt Thế đang được phát triển...
          </p>
        </div>
      </div>
    </section>
  );
};
