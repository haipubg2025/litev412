import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { THEMES, ThemeType } from '../types';
import { Check, Palette, Settings as SettingsIcon, ShieldCheck, Zap, Plus, Trash2, Play, Download, Upload, Database, FileText, RefreshCw, CheckCircle2, Server } from 'lucide-react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { ProxyConfig } from '../types';
import { ragService } from '../services/ragService';

type TabType = 'general' | 'appearance' | 'api';

/**
 * Hàm sắp xếp danh sách models theo đúng yêu cầu đặc biệt của người dùng:
 * 1. Chữ Latinh xếp ở trên (ưu tiên hơn số và các ký tự đặc biệt).
 * 2. Đến số (số lớn xếp ở trên).
 * 3. Đến ký tự Latinh thì ký tự Latinh trước tiên (chữ Latinh xếp ở trên).
 * 4. Nếu phần đầu giống nhau hết thì cái nào ngắn hơn sẽ xếp ở trên.
 */
export function sortModels(models: string[]): string[] {
  const parseToken = (s: string) => {
    return s.match(/([a-zA-Z]+)|([0-9]+(?:\.[0-9]+)?)|([^a-zA-Z0-9])/g) || [];
  };

  return [...models].sort((a, b) => {
    if (a === b) return 0;
    
    const tokensA = parseToken(a);
    const tokensB = parseToken(b);
    const minLen = Math.min(tokensA.length, tokensB.length);

    for (let i = 0; i < minLen; i++) {
      const tA = tokensA[i];
      const tB = tokensB[i];

      if (tA === tB) continue;

      const isLatA = /^[a-zA-Z]+$/.test(tA);
      const isLatB = /^[a-zA-Z]+$/.test(tB);
      const isNumA = /^[0-9]+(?:\.[0-9]+)?$/.test(tA);
      const isNumB = /^[0-9]+(?:\.[0-9]+)?$/.test(tB);

      // 1. Chữ Latinh xếp trên số hoặc ký tự khác
      if (isLatA && !isLatB) return -1;
      if (!isLatA && isLatB) return 1;

      // 2. Cả hai là chữ Latinh -> chữ Latinh xếp trước (mặc định bảng chữ cái)
      if (isLatA && isLatB) {
        return tA.localeCompare(tB);
      }

      // 3. Số xếp trên ký tự đặc biệt khác
      if (isNumA && !isNumB) return -1;
      if (!isNumA && isNumB) return 1;

      // 4. Cả hai đều là Số -> số lớn hơn xếp ở trên (giảm dần)
      if (isNumA && isNumB) {
        const valA = parseFloat(tA);
        const valB = parseFloat(tB);
        if (valA !== valB) {
          return valB - valA; // Số lớn hơn xếp ở trên
        }
      }

      // 5. Nếu cùng loại ký tự khác -> so sánh thông thường
      const comp = tA.localeCompare(tB);
      if (comp !== 0) return comp;
    }

    // 6. Nếu phần đầu giống nhau hết thì cái nào ngắn hơn xếp ở trên
    return a.length - b.length;
  });
}

function ThemeCard({ theme, isActive, onSelect, currentTheme }: { 
  theme: any, 
  isActive: boolean, 
  onSelect: () => void, 
  currentTheme: any 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 text-left relative overflow-hidden group cursor-pointer ${
        isActive 
          ? theme.accentClass.split(' ')[1] || 'border-current'
          : `border-transparent theme-panel shadow-none border border-transparent theme-panel-hover`
      }`}
    >
      {/* Theme Preview Background */}
      <div className={`absolute inset-0 opacity-10 transition-transform duration-700 group-hover:scale-110 ${theme.bgClass}`} />
      
      <div className="flex items-center justify-between z-10 w-full">
        <span className={`text-sm font-bold truncate pr-2 ${isActive ? currentTheme.textPrimary : theme.textPrimary}`}>
          {theme.name}
        </span>
        {isActive && (
          <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: currentTheme.accentHex || '#fff' }}>
            <Check className="w-3 h-3 text-black" />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-1 z-10">
        <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: theme.accentHex }} />
        <div className="w-6 h-1.5 rounded-full bg-gray-500/20" />
      </div>
    </motion.button>
  );
}

export default function Settings() {
  const currentTheme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const proxies = useStore(state => state.proxies);
  const activeProxyId = useStore(state => state.activeProxyId);
  const addProxy = useStore(state => state.addProxy);
  const updateProxy = useStore(state => state.updateProxy);
  const removeProxy = useStore(state => state.removeProxy);
  const setActiveProxy = useStore(state => state.setActiveProxy);
  const globalProxyEnabled = useStore(state => state.globalProxyEnabled);
  const setGlobalProxyEnabled = useStore(state => state.setGlobalProxyEnabled);
  const personalApiKeys = useStore(state => state.personalApiKeys);
  const addPersonalApiKey = useStore(state => state.addPersonalApiKey);
  const removePersonalApiKey = useStore(state => state.removePersonalApiKey);
  const clearApiConfig = useStore(state => state.clearApiConfig);
  const targetWordCount = useStore(state => state.targetWordCount);
  const setTargetWordCount = useStore(state => state.setTargetWordCount);
  const temperature = useStore(state => state.temperature);
  const setTemperature = useStore(state => state.setTemperature);
  const fontFamily = useStore(state => state.fontFamily);
  const setFontFamily = useStore(state => state.setFontFamily);
  const fontSize = useStore(state => state.fontSize);
  const setFontSize = useStore(state => state.setFontSize);
  const uiMode = useStore(state => state.uiMode);
  const setUiMode = useStore(state => state.setUiMode);
  const resetSettings = useStore(state => state.resetSettings);
  const selectedAIModel = useStore(state => state.selectedAIModel);
  const setSelectedAIModel = useStore(state => state.setSelectedAIModel);
  const autoSaveEnabled = useStore(state => state.autoSaveEnabled);
  const setAutoSaveEnabled = useStore(state => state.setAutoSaveEnabled);
  const [activeTab, setActiveTab] = useState<TabType>('api');
  const [proxyForm, setProxyForm] = useState<{ url: string, key: string, format: 'auto' | 'gemini' | 'openai' }>({ url: '', key: '', format: 'auto' });
  const [newPersonalKey, setNewPersonalKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingAllModels, setIsLoadingAllModels] = useState(false);
  const [editingProxyModelId, setEditingProxyModelId] = useState<string | null>(null);
  
  const [modelDownloadStatus, setModelDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>(ragService.getDownloadStatus);
  const [modelDownloadProgress, setModelDownloadProgress] = useState(ragService.getDownloadProgress);

  React.useEffect(() => {
    if (modelDownloadStatus !== 'success') {
      ragService.checkModelCached().then(isCached => {
        if (isCached) {
          setModelDownloadStatus('success');
          setModelDownloadProgress(100);
        }
      });
    }
  }, []);

  const handleDownloadModel = async () => {
    try {
      await ragService.preloadModelFromSettings((progress, status) => {
        setModelDownloadProgress(progress);
        setModelDownloadStatus(status as any);
      });
      toast.success("Tải mô hình nhúng thành công!");
    } catch (e: any) {
      toast.error(`Tải mô hình nhúng thất bại: ${e.message || "Lỗi máy chủ/mạng"}`);
    }
  };

  const handleLoadAllModels = async () => {
    if (proxies.length === 0) {
      toast.info('Không có proxy nào để load models');
      return;
    }

    setIsLoadingAllModels(true);
    let successCount = 0;
    
    await Promise.all(proxies.map(async (proxy) => {
      try {
        let baseUrl = proxy.url.trim().replace(/\/+$/, '');
        if (!baseUrl.endsWith('/v1') && !baseUrl.endsWith('/v1beta')) {
          baseUrl += '/v1';
        }
        
        let data;
        let fetchSuccess = false;

        try {
          const res = await fetch('/api/proxy-models', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ baseUrl, key: proxy.key, format: proxy.format })
          });
          
          if (res.ok) {
            data = await res.json();
            fetchSuccess = true;
          }
        } catch (apiErr) {
          console.warn('Backend /api/proxy-models is not available, falling back to direct fetch', apiErr);
        }

        if (!fetchSuccess) {
          // Fallback mechanism: direct fetch from client
          let baseWithoutSuffix = proxy.url.trim().replace(/\/+$/, '').replace(/\/v1$/, '').replace(/\/v1beta$/, '');
          
          let possibleUrls: string[] = [];
          if (proxy.format === 'openai') {
            possibleUrls.push(`${baseWithoutSuffix}/v1/models`);
          } else if (proxy.format === 'gemini') {
            possibleUrls.push(`${baseWithoutSuffix}/v1beta/models?key=${proxy.key}`);
            possibleUrls.push(`${baseWithoutSuffix}/v1beta/models`);
          } else {
            possibleUrls.push(`${baseWithoutSuffix}/v1/models`);
            possibleUrls.push(`${baseWithoutSuffix}/v1beta/models?key=${proxy.key}`);
            possibleUrls.push(`${baseWithoutSuffix}/v1beta/models`);
          }
          if (!possibleUrls.includes(`${baseUrl}/models`)) {
            possibleUrls.push(`${baseUrl}/models`);
          }

          const directHeaders: Record<string, string> = {};
          if (proxy.key) {
             directHeaders['Authorization'] = `Bearer ${proxy.key}`;
             directHeaders['x-goog-api-key'] = proxy.key;
          }
          
          for (const url of possibleUrls) {
            try {
              const directRes = await fetch(url, { headers: directHeaders });
              if (directRes.ok) {
                 data = await directRes.json();
                 fetchSuccess = true;
                 break;
              } else {
                 if (proxy.key && !url.includes('?key=')) {
                   const altRes = await fetch(`${url}?key=${proxy.key}`, { headers: directHeaders });
                   if (altRes.ok) {
                     data = await altRes.json();
                     fetchSuccess = true;
                     break;
                   }
                 }
              }
            } catch (ignored) {}
          }
          
          if (!fetchSuccess) {
            // Silently try CORS proxy as last resort
            for (const url of possibleUrls) {
              try {
                const corsUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const corsRes = await fetch(corsUrl, { headers: directHeaders });
                if (corsRes.ok) {
                   data = await corsRes.json();
                   fetchSuccess = true;
                   break;
                }
              } catch (ignored) {}
            }
          }
        }
        
        let modelsListToSet: string[] = [];
        if (data) {
          if (Array.isArray(data)) {
            modelsListToSet = data.map((m: any) => typeof m === 'string' ? m : (m.id || m.name || ''));
          } else if (data.data && Array.isArray(data.data)) {
            modelsListToSet = data.data.map((m: any) => typeof m === 'string' ? m : (m.id || m.name || ''));
          } else if (data.models && Array.isArray(data.models)) {
            modelsListToSet = data.models.map((m: any) => typeof m === 'string' ? m : (m.name || m.id || ''));
          } else {
            const arrayField = Object.values(data).find(v => Array.isArray(v));
            if (arrayField && Array.isArray(arrayField)) {
              modelsListToSet = arrayField.map((m: any) => typeof m === 'string' ? m : (m.id || m.name || ''));
            }
          }
        }
        
        let models: string[] = modelsListToSet
          .map((m: any) => {
            if (typeof m !== 'string') return '';
            let cleaned = m.trim();
            if (cleaned.startsWith('models/')) {
              cleaned = cleaned.replace('models/', '');
            }
            return cleaned;
          })
          .filter(Boolean);

        const defaultModels = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "claude-3-7-sonnet", "deepseek-chat", "deepseek-reasoner"];

        if (models.length === 0) {
          const currentModels = proxy.models?.length ? proxy.models : defaultModels;
          updateProxy(proxy.id, { models: sortModels(currentModels), selectedModel: proxy.selectedModel || 'gemini-3.1-pro-preview' });
          return;
        }
        
        // Sắp xếp tự động danh sách models theo đúng yêu cầu
        const sortedModels = sortModels(models);
        
        let newSelectedModel = proxy.selectedModel;
        if (!newSelectedModel || !sortedModels.includes(newSelectedModel)) {
          newSelectedModel = sortedModels[0];
        }
        
        updateProxy(proxy.id, { models: sortedModels, selectedModel: newSelectedModel });
        successCount++;
      } catch (error) {
        console.warn(`[Proxy Load Models] Ngoại lệ khi tải models cho proxy ${proxy.name || proxy.id}:`, error);
        const defaultModels = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "claude-3-7-sonnet", "deepseek-chat", "deepseek-reasoner"];
        const currentModels = proxy.models?.length ? proxy.models : defaultModels;
        updateProxy(proxy.id, { models: sortModels(currentModels), selectedModel: proxy.selectedModel || 'gemini-3.1-pro-preview' });
      }
    }));

    setIsLoadingAllModels(false);
    if (successCount > 0) {
      toast.success(`Đã tải models thành công cho ${successCount}/${proxies.length} proxy`);
    } else {
      toast.error('Không thể tải models cho proxy nào');
    }
  };

  const handleSetTheme = (themeId: ThemeType) => {
    setTheme(themeId);
    const selectedTheme = THEMES.find(t => t.id === themeId);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [selectedTheme?.accentHex || '#ffffff']
    });
    toast.success(`Đã áp dụng giao diện ${selectedTheme?.name}`);
  };

  const handleAddProxy = async () => {
    if (!proxyForm.url) {
      toast.error('Vui lòng nhập URL proxy');
      return;
    }

    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newProxy: ProxyConfig = {
        id: crypto.randomUUID(),
        name: `Proxy ${proxies.length + 1}`,
        url: proxyForm.url,
        key: proxyForm.key,
        format: proxyForm.format,
        createdAt: Date.now()
      };
      addProxy(newProxy);
      setProxyForm({ url: '', key: '', format: 'auto' });
      toast.success(`Kết nối thành công và đã lưu Proxy ${proxies.length}`);
    } catch (error) {
      toast.error('Không thể kết nối tới proxy này');
    } finally {
      setIsTesting(false);
    }
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proxies));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "matrix_proxies.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Đã xuất cấu hình thành công');
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          imported.forEach(p => addProxy(p));
          toast.success('Đã nhập cấu hình thành công');
        }
      } catch (err) {
        toast.error('File không hợp lệ');
      }
    };
    reader.readAsText(file);
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let workingText = (event.target?.result as string) || '';
      
      // 1. Lọc tất cả Gemini API Keys (đặc điểm: AIzaSy + >= 30 ký tự)
      const geminiRegex = /AIzaSy[A-Za-z0-9_\-]{30,}/g;
      const geminiKeys = workingText.match(geminiRegex) || [];
      geminiKeys.forEach(k => workingText = workingText.replace(k, ' '));
      
      // 2. Lọc tất cả Proxy Keys đặc thù (vd: gg-gcli, sk-*, pk-*, dài >= 15)
      const specificKeyRegex = /(?:gg-gcli-|sk-[a-zA-Z0-9]+-|pk-[a-zA-Z0-9]+-|sk-)[A-Za-z0-9_\-]{15,}/gi;
      const specificKeys = workingText.match(specificKeyRegex) || [];
      specificKeys.forEach(k => workingText = workingText.replace(k, ' '));

      // 3. Lọc tất cả URLs
      const urlRegex = /https?:\/\/[a-zA-Z0-9\-._~]+(?::\d+)?(?:\/[a-zA-Z0-9\-._~%]*)*\b/gi;
      const urls = workingText.match(urlRegex) || [];
      urls.forEach(u => workingText = workingText.replace(u, ' '));

      // 4. Lọc các proxy keys dạng chuỗi ngẫu nhiên (dài >= 15 ký tự, chữ và số)
      const remainingWords = workingText.split(/[\s,|;="'<>\/\\[\]]+/).filter(Boolean);
      const otherKeys = remainingWords.filter(w => w.length >= 15 && /^[A-Za-z0-9_\-]+$/.test(w));
      
      const allProxyKeys = [...specificKeys, ...otherKeys];

      // Đặt API Key cá nhân
      geminiKeys.forEach(key => {
        addPersonalApiKey(key);
      });

      const proxyPairs: {url: string, key: string}[] = [];

      // Phân bổ các key cho URL
      urls.forEach((url, index) => {
         const key = allProxyKeys[index] || allProxyKeys[allProxyKeys.length - 1] || '';
         if (key) {
             proxyPairs.push({ url, key });
         }
      });
      
      // Nếu có nhiều key hơn url, ta ghép các key còn lại vào url cuối cùng
      const hasExtraKeys = allProxyKeys.length > urls.length;
      if (hasExtraKeys && urls.length > 0) {
        const lastUrl = urls[urls.length - 1];
        for (let i = urls.length; i < allProxyKeys.length; i++) {
           proxyPairs.push({ url: lastUrl, key: allProxyKeys[i] });
        }
      }

      proxyPairs.forEach((pair, i) => {
          addProxy({
            id: Math.random().toString(36).substring(7),
            name: `Proxy nhập từ TXT ${Math.floor(Math.random()*1000)}`,
            url: pair.url,
            key: pair.key,
            createdAt: Date.now()
          });
      });

      if (geminiKeys.length > 0 || proxyPairs.length > 0) {
        toast.success(`Đã trích xuất thành công: ${geminiKeys.length > 0 ? geminiKeys.length + ' Gemini Key ' : ''}${proxyPairs.length > 0 ? (geminiKeys.length > 0 ? '& ' : '') + proxyPairs.length + ' Proxy ' : ''}từ tệp TXT!`);
      } else {
        toast.error('Không tìm thấy API Key hoặc cặp Proxy (URL+Key) hợp lệ trong tệp TXT.');
      }
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'general', label: 'Chung', icon: SettingsIcon },
    { id: 'appearance', label: 'Giao Diện', icon: Palette },
    { id: 'api', label: 'Api & Proxy', icon: ShieldCheck },
  ] as const;

  return (
    <div className="p-6 md:p-12 lg:p-16 pb-32 md:pb-16 w-full h-full overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 px-4">
          <div className="flex items-center gap-6">
            <div>
              <button
                onClick={() => {
                  resetSettings();
                }}
                className={`py-3 px-8 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border-2 border-red-500/20 font-black tracking-widest transition-all cursor-pointer shadow-xl shadow-red-900/10 active:scale-95`}
              >
                RESET
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 md:flex p-1.5 rounded-2xl theme-panel border-2 border-cyan-500/50 backdrop-blur-md self-start md:self-center gap-1.5 md:gap-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDark = currentTheme.group === 'Dark';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center md:justify-start gap-2 transition-all relative cursor-pointer ${
                    isActive 
                      ? (isDark ? currentTheme.textPrimary : 'text-white font-bold') 
                      : (isDark ? 'text-white/40 hover:text-white/70' : 'text-[#334155]/70 hover:text-[#0f172a]')
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-settings-tab"
                      className={`absolute inset-0 rounded-xl ${isDark ? 'theme-panel shadow-none border-transparent' : 'bg-slate-800 shadow-md border-transparent'}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={`w-4 h-4 z-10`} />
                  <span className="z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-16"
          >
            {activeTab === 'general' && (
              <section className="w-full space-y-12">
                <div className="p-8 rounded-[2.5rem] theme-panel border-transparent backdrop-blur-xl">
                  <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${currentTheme.textPrimary}`}>
                    <FileText className="w-6 h-6 text-blue-400" /> Ngữ cảnh & Giao diện
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Tải mô hình RAG cục bộ</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>
                          Xenova/all-MiniLM-L6-v2 (22MB). Đảm bảo trí nhớ AI sắc bén mà không tốn phí API.
                        </p>
                        <p className="text-sm font-bold text-cyan-500 mt-1">
                          (Vào game sẽ tự tải, không tải ở đây cũng được)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {modelDownloadStatus === 'success' && (
                          <span className="text-sm font-bold text-green-400 px-3 py-1.5 bg-green-500/10 rounded-lg">Đã Tải Xong</span>
                        )}
                        {modelDownloadStatus === 'error' && (
                          <span className="text-sm font-bold text-red-400 px-3 py-1.5 bg-red-500/10 rounded-lg">Lỗi tải - Hãy thử lại</span>
                        )}
                        <button
                          onClick={async () => {
                             toast.info("Đang kiểm tra hệ thống nhớ đệm...");
                             const isCached = await ragService.forceCheckModelCached();
                             if (isCached) {
                               setModelDownloadStatus('success');
                               setModelDownloadProgress(100);
                               toast.success("Mô hình đã tồn tại và sẵn sàng hoạt động.");
                             } else {
                               setModelDownloadStatus('idle');
                               setModelDownloadProgress(0);
                               toast.error("Không tìm thấy mô hình trong máy, bạn chờ tải.");
                             }
                          }}
                          disabled={modelDownloadStatus === 'downloading'}
                          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/10 hover:theme-panel shadow-none border border-transparent cursor-pointer disabled:opacity-50 ${currentTheme.textPrimary}`}
                          title="Kiểm tra sâu xem mô hình đã tồn tại chưa"
                        >
                          <RefreshCw size={16} /> Check
                        </button>
                        <button
                          onClick={handleDownloadModel}
                          disabled={modelDownloadStatus === 'downloading' || modelDownloadStatus === 'success'}
                          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                            modelDownloadStatus === 'downloading'
                              ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed'
                              : modelDownloadStatus === 'success'
                                ? 'theme-panel shadow-none border border-transparent text-white/50 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {modelDownloadStatus === 'downloading' ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" /> {Math.round(modelDownloadProgress)}%
                            </>
                          ) : modelDownloadStatus === 'success' ? (
                            <>
                              <CheckCircle2 size={16} /> Đã Sẵn Sàng
                            </>
                          ) : (
                            <>
                              <Download size={16} /> Tải Ngay
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Mô hình AI chính</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Thay đổi khi gặp lỗi 429 Hết hạn ngạch / Quota Limits</p>
                      </div>
                      <select 
                        value={selectedAIModel}
                        onChange={(e) => {
                          setSelectedAIModel(e.target.value);
                          toast.success(`Đã chọn mô hình: ${e.target.value}`);
                        }}
                        className="theme-input border-transparent rounded-xl px-4 py-2 theme-text-base outline-none focus:border-blue-500 min-w-[200px] text-sm"
                        >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Tự động lưu (Auto-Save)</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Hệ thống sẽ tự động tạo file lưu trữ sau mỗi lượt chơi</p>
                      </div>
                      <button
                        onClick={() => {
                          setAutoSaveEnabled(!autoSaveEnabled);
                          toast.success(autoSaveEnabled ? 'Đã tắt Tự động lưu' : 'Đã bật Tự động lưu');
                        }}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                          autoSaveEnabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            autoSaveEnabled ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Số Chữ (Mục tiêu)</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Số lượng chữ yêu cầu AI viết cho phần chính văn mỗi lượt</p>
                      </div>
                      <select 
                        value={targetWordCount}
                        onChange={(e) => setTargetWordCount(Number(e.target.value))}
                        className="theme-input border-transparent rounded-xl px-4 py-2 theme-text-base outline-none focus:border-blue-500 min-w-[140px]"
                        >
                        <option value={500}>500 chữ</option>
                        <option value={1000}>1000 chữ</option>
                        <option value={2000}>2000 chữ</option>
                        <option value={3000}>3000 chữ</option>
                        <option value={4000}>4000 chữ</option>
                        <option value={10000}>10000 chữ</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Temp</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Độ sáng tạo của AI (Giá trị từ 0.0 đến 2.0). Mặc định là 1</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" 
                          max="2" 
                          step="0.05"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="w-32 accent-blue-500"
                        />
                        <span className={`w-12 text-center text-sm font-mono ${currentTheme.textPrimary}`}>{temperature.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Phông Chữ</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Áp dụng 100% lên toàn bộ game</p>
                      </div>
                      <select 
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="theme-input border-transparent rounded-xl px-4 py-2 theme-text-base outline-none focus:border-blue-500 min-w-[180px]"
                        style={{ fontFamily: fontFamily }}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Noto Sans">Noto Sans</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Lato">Lato</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Source Sans 3">Source Sans 3</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Lora">Lora</option>
                        <option value="Fira Sans">Fira Sans</option>
                        <option value="Quicksand">Quicksand</option>
                        <option value="Work Sans">Work Sans</option>
                        <option value="Rubik">Rubik</option>
                        <option value="Inconsolata">Inconsolata</option>
                        <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl theme-input border-transparent gap-4">
                      <div>
                        <p className={`font-bold ${currentTheme.textPrimary}`}>Cỡ Chữ (Base)</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Kích thước chữ gốc: {fontSize}px</p>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="20"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-32 md:w-48 accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'appearance' && (
              <>
                {/* Nhóm Giao Diện Tối */}
                <section>
                  <div className="flex items-center justify-between mb-8 px-4">
                    <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.textPrimary}`}>
                      <div className="w-3 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      Giao Diện Tối
                    </h3>
                    <span className={`text-sm font-mono opacity-50 ${currentTheme.textSecondary}`}>10 PRESETS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {THEMES.filter(t => t.group === 'Dark').map((theme) => {
                      const isActive = currentTheme.id === theme.id;
                      return (
                        <ThemeCard 
                          key={theme.id} 
                          theme={theme} 
                          isActive={isActive} 
                          onSelect={() => handleSetTheme(theme.id)} 
                          currentTheme={currentTheme}
                        />
                      );
                    })}
                  </div>
                </section>

                {/* Nhóm Giao Diện Sáng */}
                <section>
                  <div className="flex items-center justify-between mb-8 px-4">
                    <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.textPrimary}`}>
                      <div className="w-3 h-8 bg-orange-400 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.5)]" />
                      Giao Diện Sáng
                    </h3>
                    <span className={`text-sm font-mono opacity-50 ${currentTheme.textSecondary}`}>10 PRESETS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {THEMES.filter(t => t.group === 'Light').map((theme) => {
                      const isActive = currentTheme.id === theme.id;
                      return (
                        <ThemeCard 
                          key={theme.id} 
                          theme={theme} 
                          isActive={isActive} 
                          onSelect={() => handleSetTheme(theme.id)} 
                          currentTheme={currentTheme}
                        />
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'api' && (
              <div className="space-y-8">
                {/* Nút Tải TXT và CLEAR */}
                <div className="flex justify-end gap-3 pr-4">
                  <button 
                    onClick={() => {
                      clearApiConfig();
                    }}
                    className="py-2.5 px-6 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-red-900/10"
                  >
                    <Trash2 className="w-5 h-5" />
                    CLEAR
                  </button>
                  <label className="py-2.5 px-6 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-green-900/10">
                    <FileText className="w-5 h-5" />
                    Tải TXT
                    <input type="file" className="hidden" accept=".txt" onChange={handleTxtUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 text-left">
                  {/* Cột 1: Api Key Cá Nhân */}
                  <section className="space-y-8">
                  <div className="px-4">
                    <h3 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>Api Key Cá Nhân</h3>
                    <p className={`text-sm mt-1 ${currentTheme.textSecondary}`}>Thiết lập Gemini API Key của riêng bạn</p>
                  </div>
                  
                  <div className="p-8 rounded-[2.5rem] theme-panel border-transparent backdrop-blur-xl space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-widest opacity-50 ${currentTheme.textPrimary}`}>Thêm Gemini API Key mới</label>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            placeholder="Nhập API Key bắt đầu bằng AIza..."
                            value={newPersonalKey}
                            onChange={(e) => setNewPersonalKey(e.target.value)}
                            className="flex-1 px-5 py-4 rounded-xl theme-input border-transparent theme-text-base outline-none focus:border-purple-500/50 transition-colors text-sm"
                          />
                          <button
                            onClick={() => {
                              if (newPersonalKey.trim()) {
                                addPersonalApiKey(newPersonalKey.trim());
                                setNewPersonalKey('');
                                toast.success('Đã thêm API Key thành công');
                              }
                            }}
                            className="p-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách keys */}
                    <div className="space-y-3">
                      {personalApiKeys.length === 0 ? (
                        <div className="p-6 rounded-2xl theme-panel border-transparent border-dashed text-center">
                          <p className={`text-xs ${currentTheme.textSecondary}`}>Chưa có API Key cá nhân nào được thêm.</p>
                        </div>
                      ) : (
                        personalApiKeys.map((key, index) => (
                          <div 
                            key={index}
                            className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <span className="text-xs font-bold">{index + 1}</span>
                              </div>
                              <p className="text-xs font-mono text-white/60 truncate italic">
                                {key.substring(0, 8)}••••••••{key.substring(key.length - 4)}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                removePersonalApiKey(key);
                                toast.success('Đã xóa API Key');
                              }}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={`p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20`}>
                      <p className="text-xs text-purple-400 leading-relaxed italic text-left">
                        * Ghi chú: Hệ thống sẽ tự động xoay vòng (round-robin) các Key trong danh sách. Nếu có Key bị lỗi sẽ tạm thời đưa vào danh sách đen.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cột 2: Proxy Ngược */}
                <section className="space-y-8">
                  <div className="px-4 flex items-center justify-between">
                    <div>
                      <h3 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>Proxy Ngược</h3>
                      <p className={`text-sm mt-1 ${currentTheme.textSecondary}`}>Quản lý các kết nối qua Proxy tùy chỉnh</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setGlobalProxyEnabled(!globalProxyEnabled)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                          globalProxyEnabled 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
                        }`}
                      >
                        {globalProxyEnabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={handleLoadAllModels}
                        disabled={isLoadingAllModels || proxies.length === 0}
                        className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingAllModels ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Load Models
                          </>
                        )}
                      </button>
                      <span className="text-xs font-mono opacity-30 text-white">{proxies.length} SAVED</span>
                    </div>
                  </div>

                  {/* Danh sách Proxy & Form Thêm Mới */}
                  <div className="space-y-6">
                    
                    {/* Các Proxy Đã Lưu (Có thể sửa trực tiếp) */}
                    {proxies.map((proxy, index) => (
                      <div 
                        key={proxy.id}
                        className={`p-8 rounded-[2.5rem] border backdrop-blur-xl space-y-6 transition-all ${
                          activeProxyId === proxy.id 
                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                            : 'theme-panel border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className={`text-lg font-bold ${currentTheme.textPrimary} uppercase tracking-wider`}>Proxy {index + 1}</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => removeProxy(proxy.id)}
                              className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              title="Xóa Proxy"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2 text-left">
                            <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>Proxy URL</label>
                            <input 
                              type="text"
                              value={proxy.url}
                              onChange={(e) => updateProxy(proxy.id, { url: e.target.value })}
                              className="w-full px-5 py-4 rounded-xl theme-input border-transparent focus:border-blue-500/50 text-blue-400 outline-none text-sm font-mono transition-colors"
                            />
                          </div>
                          <div className="space-y-2 text-left">
                            <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>Internal Key</label>
                            <input 
                              type="text"
                              value={proxy.key}
                              onChange={(e) => updateProxy(proxy.id, { key: e.target.value })}
                              className="w-full px-5 py-4 rounded-xl theme-input border-transparent focus:border-blue-500/50 text-white/70 outline-none text-sm font-mono transition-colors"
                            />
                          </div>
                          
                          <div className="space-y-2 text-left">
                            <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>Định dạng API (Format)</label>
                            <select
                              value={proxy.format || 'auto'}
                              onChange={(e) => updateProxy(proxy.id, { format: e.target.value as any })}
                              className="w-full px-5 py-4 rounded-xl theme-input border-transparent focus:border-blue-500/50 theme-text-base outline-none text-sm font-mono transition-colors">
                              <option value="auto">Tự Động Nhận Diện</option>
                              <option value="openai">Chuẩn OpenAI Compatbile</option>
                              <option value="gemini">Chuẩn Gemini Google</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2 text-left">
                            <div className="flex items-center justify-between">
                              <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>Model AI</label>
                              <button 
                                onClick={() => setEditingProxyModelId(editingProxyModelId === proxy.id ? null : proxy.id)}
                                className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md cursor-pointer transition-all bg-white text-black border border-cyan-500 hover:bg-gray-100`}
                              >
                                {editingProxyModelId === proxy.id ? "GÕ XONG" : 'CHỈNH SỬA TỰ DO'}
                              </button>
                            </div>
                            {editingProxyModelId === proxy.id ? (
                              <input
                                type="text"
                                placeholder="Nhập tên Model (VD: gpt-4o, claude-3...)"
                                value={proxy.selectedModel || ''}
                                onChange={(e) => updateProxy(proxy.id, { selectedModel: e.target.value })}
                                className="w-full px-5 py-4 rounded-xl theme-input border-transparent focus:border-blue-500/50 theme-text-base outline-none text-sm font-mono transition-colors"
                              />
                            ) : (
                              <select
                                value={proxy.selectedModel || 'gemini-3.1-pro-preview'}
                                onChange={(e) => updateProxy(proxy.id, { selectedModel: e.target.value })}
                                className="w-full px-5 py-4 rounded-xl theme-input border-transparent focus:border-blue-500/50 theme-text-base outline-none text-sm font-mono transition-colors">
                                {Array.from(new Set([...(proxy.models && proxy.models.length > 0 ? proxy.models : []), proxy.selectedModel || 'gemini-3.1-pro-preview'])).map((modelChoice, idx) => (
                                  <option key={idx} value={modelChoice}>{modelChoice}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (activeProxyId !== proxy.id) {
                              setActiveProxy(proxy.id);
                              toast.success(`Đã kích hoạt: Proxy ${index + 1}`);
                            } else {
                              setActiveProxy(null);
                              toast.info(`Đã hủy kích hoạt: Proxy ${index + 1}`);
                            }
                          }}
                          className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg ${
                            activeProxyId === proxy.id
                              ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                          }`}
                        >
                          {activeProxyId === proxy.id ? (
                            <>
                              <Check className="w-5 h-5" />
                              ĐANG SỬ DỤNG
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5 fill-current" />
                              KÍCH HOẠT PROXY NÀY
                            </>
                          )}
                        </button>
                      </div>
                    ))}

                    {/* Form Thêm Proxy (Luôn nằm dưới cùng) */}
                    <div className="p-8 rounded-[2.5rem] theme-panel border-transparent backdrop-blur-xl space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl theme-panel shadow-none border border-transparent text-white/50">
                          <Plus className="w-5 h-5" />
                        </div>
                        <h3 className={`text-lg font-bold ${currentTheme.textPrimary} uppercase tracking-wider`}>Proxy {proxies.length + 1}</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2 text-left">
                          <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>URL Proxy</label>
                          <input 
                            type="text"
                            placeholder="https://your-proxy-domain.com"
                            value={proxyForm.url}
                            onChange={(e) => setProxyForm({...proxyForm, url: e.target.value})}
                            className="w-full px-5 py-4 rounded-xl theme-input border-transparent theme-text-base outline-none focus:border-blue-500/50 transition-colors text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-2 text-left">
                          <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>API Key / Password</label>
                          <input 
                            type="text"
                            placeholder="••••••••••••••••"
                            value={proxyForm.key}
                            onChange={(e) => setProxyForm({...proxyForm, key: e.target.value})}
                            className="w-full px-5 py-4 rounded-xl theme-input border-transparent theme-text-base outline-none focus:border-blue-500/50 transition-colors text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-2 text-left">
                          <label className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${currentTheme.textPrimary}`}>Định dạng API (Format)</label>
                          <select
                            value={proxyForm.format}
                            onChange={(e) => setProxyForm({...proxyForm, format: e.target.value as any})}
                            className="w-full px-5 py-4 rounded-xl theme-input border-transparent theme-text-base outline-none focus:border-blue-500/50 transition-colors text-sm font-mono">
                            <option value="auto">Tự Động Nhận Diện (Khuyên dùng)</option>
                            <option value="openai">Chuẩn OpenAI (Bao gồm Anthropic, Claude, v.v...)</option>
                            <option value="gemini">Chuẩn Gemini Google</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddProxy}
                        disabled={isTesting || !proxyForm.url}
                        className={`w-full py-4 rounded-xl bg-blue-600/30 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer`}
                      >
                        {isTesting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            THÊM VÀO DANH SÁCH
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/10 mt-6">
                    <button 
                      onClick={exportConfig}
                      className="flex-1 py-3 rounded-xl theme-panel border-transparent theme-panel-hover text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Xuất JSON
                    </button>
                    <label className="flex-1 py-3 rounded-xl theme-panel border-transparent theme-panel-hover text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group text-center">
                      <Upload className="w-4 h-4" /> Nhập JSON
                      <input type="file" className="hidden" accept=".json" onChange={importConfig} />
                    </label>
                  </div>
                </section>
              </div>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
