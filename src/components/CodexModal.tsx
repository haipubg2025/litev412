import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Shield, Zap, Sparkles, Sword, User, MapPin, Plus, Trash2, BrainCircuit, Book } from 'lucide-react';
import { useStore } from '../store/useStore';

type CreationTab = 'world' | 'items' | 'creative';

const tabs = [
  { id: 'world', label: 'World', icon: Globe },
  { id: 'items', label: 'Location', icon: MapPin },
  { id: 'creative', label: 'Sáng Tạo', icon: BrainCircuit },
] as const;

function CharacterInput({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  const theme = useStore(state => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const isDark = theme.group === 'Dark';

  return (
    <div className="space-y-2">
      <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${
        isDark ? 'text-white/40' : 'text-[#5C4033]/75 font-semibold'
      }`}>{label}</label>
      <textarea
        ref={textareaRef}
        rows={1}
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { if(localValue !== value) onChange(localValue); }}
        className={`w-full px-4 py-3 rounded-xl outline-none text-sm transition-all font-medium resize-none overflow-hidden ${
          isDark
            ? 'bg-white/5 border border-white/10 text-white focus:border-white/30'
            : 'bg-white border border-amber-200 text-[#3E2723] focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs'
        }`}
      />
    </div>
  );
}

function CharacterTextArea({ 
  label, 
  value, 
  onChange, 
  rows = 1, 
  placeholder = "", 
  variant = "default" 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  rows?: number;
  placeholder?: string;
  variant?: "default" | "large" | "title" | "npc-header"
}) {
  const theme = useStore(state => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const isDark = theme.group === 'Dark';

  const getVariantStyles = () => {
    switch (variant) {
      case "large":
        return "px-8 py-6 rounded-[2rem] text-lg min-h-[120px]";
      case "title":
        return "px-8 py-6 rounded-[2rem] text-2xl font-bold shadow-inner";
      case "npc-header":
        return "px-6 py-4 rounded-2xl text-lg font-bold min-h-[60px]";
      default:
        return "px-6 py-4 rounded-2xl text-sm min-h-[80px]";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${
          isDark ? 'text-white/40' : 'text-[#5C4033]/75 font-semibold'
        }`}>{label}</label>
      )}
      <textarea
        ref={textareaRef}
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { if(localValue !== value) onChange(localValue); }}
        rows={rows}
        placeholder={placeholder}
        className={`w-full outline-none transition-all resize-none font-medium leading-relaxed overflow-hidden scrollbar-hide ${
          isDark
            ? 'bg-white/5 border border-white/10 text-white focus:border-white/30'
            : 'bg-white border border-amber-200 text-[#3E2723] focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs'
        } ${getVariantStyles()}`}
      />
    </div>
  );
}

function LocationArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Array<{ name: string; description: string }>;
  onChange: (val: Array<{ name: string; description: string }>) => void;
}) {
  const theme = useStore((state) => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-[#5C4033]/75 font-semibold"}`}
        >
          {label}
        </label>
      )}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
          >
            <CharacterInput
              label="Tên địa điểm (từ lớn đến nhỏ)"
              value={item.name || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], name: val };
                onChange(newArr);
              }}
            />
            <CharacterTextArea
              label="Mô tả chi tiết"
              value={item.description || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
              }}
            />
            <button
              onClick={() => {
                const newArr = arr.filter((_, idx) => idx !== i);
                onChange(newArr);
              }}
              className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              Xóa địa điểm
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [...arr, { name: "", description: "" }];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === "Dark" ? "border-white/20 hover:bg-white/10 text-white/70" : "border-black/10 hover:bg-black/5 text-[#334155]"} cursor-pointer`}
        >
          + Thêm địa điểm
        </button>
      </div>
    </div>
  );
}

export default function CodexModal({ onClose }: { onClose: () => void }) {
  const theme = useStore(state => state.theme);
  const gameData = useStore(state => state.gameData);
  const setGameData = useStore(state => state.setGameData);
  const [activeTab, setActiveTab] = useState<CreationTab>('world');

  if (!gameData) return null;

  const worldData = gameData.worldData || {};
  const worldDetails = gameData.worldDetails || { places: '' };

  const setWorldData = (val: any) => setGameData({ ...gameData, worldData: val });
  const setWorldDetails = (val: any) => setGameData({ ...gameData, worldDetails: val });

  const isDark = theme.group === 'Dark';

  return (
    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className={`fixed inset-0 z-[100] backdrop-blur-sm flex flex-col w-[100dvw] h-[100dvh] p-0 m-0 overflow-hidden ${isDark ? 'bg-black/80' : 'bg-amber-900/15'}`} onClick={onClose}>
      <div 
        className={`w-full h-full flex flex-col rounded-none border-0 shadow-none overflow-hidden ${
          isDark ? 'theme-panel !border-none text-white' : 'bg-[#FAF7F0]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 flex items-center justify-between shrink-0 border-b ${
          isDark ? 'border-white/10 bg-black/10' : 'border-amber-200/60 bg-[#FFFDF9]/60 backdrop-blur-sm'
        }`}>
          <h2 className={`text-xl font-black uppercase tracking-widest flex items-center gap-2 ${
            isDark ? 'text-amber-400' : 'text-amber-800'
          }`}><Book size={20}/> CODEX THẾ GIỚI</h2>
          <button 
            onClick={onClose} 
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors font-bold text-sm ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 text-white/80' 
                : 'bg-amber-700 hover:bg-amber-800 text-white shadow-md'
            }`}
          >
            ĐÓNG
          </button>
        </div>
        
        {/* Navigation Tabs Row */}
        <div className={`px-4 py-3 shrink-0 overflow-x-auto no-scrollbar border-b ${
          isDark ? 'border-white/5' : 'border-amber-200 bg-[#FAF7F0]'
        }`}>
          <div className={`flex p-1 rounded-xl w-fit ${
            isDark ? 'bg-white/5 border border-white/10' : 'bg-amber-100 border border-amber-200 shadow-inner'
          }`}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as CreationTab)}
                   className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap shrink-0 ${
                     isActive 
                       ? (isDark ? 'text-amber-400' : 'text-blue-605') 
                       : (isDark ? 'text-white/40 hover:text-white/70' : 'text-[#5C4033]/70 hover:text-[#3E2723]')
                   }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-codex-tab"
                      className={`absolute inset-0 rounded-lg md:rounded-xl shadow-xs ${
                        isDark ? 'bg-white/20 border border-white/10 shadow-white/5' : 'bg-[#FFFDFB] border border-amber-150'
                      }`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className="w-3 md:w-4 h-3 md:h-4 z-10" />
                  <span className="z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
           <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {activeTab === 'world' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <section className="space-y-4 lg:col-span-3">
                      <CharacterTextArea label="TÊN THẾ GIỚI" value={worldData.name} onChange={(val) => setWorldData({...worldData, name: val})} placeholder="Nhập tên vùng đất..." variant="title" />
                    </section>
                    <section className="space-y-4 lg:col-span-3">
                      <CharacterTextArea label="ĐỘ KHÓ" value={worldData.difficulty || ''} onChange={(val) => setWorldData({...worldData, difficulty: val})} placeholder="Độ khó chi phối trực tiếp rủi ro hành động..." />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="BỐI CẢNH" value={worldData.background} onChange={(val) => setWorldData({...worldData, background: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="MỐC THỜI GIAN MỞ ĐẦU" value={worldData.starterTimeline} onChange={(val) => setWorldData({...worldData, starterTimeline: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="KỊCH BẢN MỞ ĐẦU" value={worldData.starterScenario} onChange={(val) => setWorldData({...worldData, starterScenario: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="QUY TẮC THẾ GIỚI (LUẬT LỆ, CẤM KỴ, QUY LUẬT VẬN HÀNH)" value={worldData.worldRules} onChange={(val) => setWorldData({...worldData, worldRules: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)" value={worldData.namingConventions} onChange={(val) => setWorldData({...worldData, namingConventions: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterInput label="THỂ LOẠI (GENRE)" value={worldData.genre} onChange={(val) => setWorldData({...worldData, genre: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterInput label="ÂM HƯỞNG CHỦ ĐẠO (MAIN MOOD & AESTHETIC)" value={worldData.mainMood} onChange={(val) => setWorldData({...worldData, mainMood: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterInput label="NHỊP ĐỘ (PACING)" value={worldData.pacing} onChange={(val) => setWorldData({...worldData, pacing: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="ĐỊA LÝ & VÙNG LÃNH THỔ" value={worldData.geography} onChange={(val) => setWorldData({...worldData, geography: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="LỊCH SỬ THẾ GIỚI" value={worldData.worldHistory} onChange={(val) => setWorldData({...worldData, worldHistory: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="VĂN HÓA & PHONG TỤC" value={worldData.culture} onChange={(val) => setWorldData({...worldData, culture: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="KINH TẾ & XÃ HỘI" value={worldData.economy} onChange={(val) => setWorldData({...worldData, economy: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="TÔN GIÁO & TÍN NGƯỠNG" value={worldData.religion} onChange={(val) => setWorldData({...worldData, religion: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="CÁC QUỐC GIA & THẾ LỰC" value={worldData.factions} onChange={(val) => setWorldData({...worldData, factions: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="MỐI QUAN HỆ GIỮA CÁC THẾ LỰC" value={worldData.factionRelations} onChange={(val) => setWorldData({...worldData, factionRelations: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="CÁC YẾU TỐ ĐỘC ĐÁO" value={worldData.uniqueElements} onChange={(val) => setWorldData({...worldData, uniqueElements: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="HỆ THỐNG SỨC MẠNH / LOGIC / ĐIỂM PHÂN BẬC" value={worldData.powerSystem} onChange={(val) => setWorldData({...worldData, powerSystem: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="KIỂM SOÁT LOGIC & CÁC YẾU TỐ LOẠI TRỪ" value={worldData.logicControl} onChange={(val) => setWorldData({...worldData, logicControl: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterTextArea label="VĂN PHONG" value={worldData.writingStyle} onChange={(val) => setWorldData({...worldData, writingStyle: val})} />
                    </section>
                    <section className="space-y-4">
                      <CharacterInput label="NGÔI KỂ" value={worldData.narrativePerspective} onChange={(val) => setWorldData({...worldData, narrativePerspective: val})} />
                    </section>
                  </div>
              )}

              {activeTab === 'items' && (
                <div className="flex flex-col w-full h-full gap-8">
                     <section className="space-y-4">
                        <LocationArrayEditor
                          label="CÁC ĐỊA ĐIỂM (LOCATIONS)"
                          items={worldDetails.locations || []}
                          onChange={(val) => setWorldDetails({ ...worldDetails, locations: val })}
                        />
                     </section>
                     <section className="space-y-4 flex-1 flex flex-col opacity-50">
                        <CharacterTextArea 
                          label="GHI CHÚ ĐỊA ĐIỂM KHÁC (Legacy)" 
                          value={worldDetails.places} 
                          onChange={(val) => setWorldDetails({...worldDetails, places: val})} 
                          placeholder="Mô tả chi tiết các phòng ban, khu vực nhỏ lẻ, môi trường, và địa hình cụ thể..."
                          rows={10}
                        />
                     </section>
                </div>
              )}

              {activeTab === 'creative' && (
                <div className="w-full h-full min-h-[500px] flex flex-col">
                  <section className="flex-1 space-y-4 flex flex-col">
                    <CharacterTextArea 
                      label="QUY TẮC & SÁNG TẠO DO NGƯỜI CHƠI TỰ ĐIỀN (AI SẼ THEO DÕI & ÁP DỤNG)" 
                      value={gameData.creativeRules || ''} 
                      onChange={(val) => setGameData({...gameData, creativeRules: val})} 
                      placeholder="Nhập bất kỳ quy tắc, kịch bản, hay lưu ý nào mà bạn muốn AI luôn phải tuân theo trong thế giới này..."
                      rows={20}
                    />
                  </section>
                </div>
              )}
            </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
