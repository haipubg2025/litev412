import React from 'react';
import { motion } from 'motion/react';
import { X, Check, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { useStore } from '../store/useStore';

interface NpcUpdateModalProps {
  npc: any;
  npcIndex: number;
  onClose: () => void;
  onApply: (updatedData: any) => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Tên",
  fullName: "Họ và Tên",
  titles: "Danh hiệu / Tước hiệu",
  occupation: "Nghề nghiệp / Thân phận",
  gender: "Giới tính",
  age: "Tuổi tác",
  dob: "Ngày sinh",
  height: "Chiều cao",
  weight: "Cân nặng",
  measurements: "Số đo / Vóc dáng",
  appearance: "Ngoại hình tổng quan",
  appearanceLite: "Ngoại hình (Rút gọn)",
  background: "Tiểu sử / Lai lịch",
  rank: "Cấp bậc / Cảnh giới",
  powers: "Năng lực / Phép thuật",
  skills: "Kỹ năng / Tuyệt chiêu",
  role: "Vai trò trong truyện",
  personality: "Tính cách (Bề ngoài)",
  personalityCore: "Tính cách cốt lõi",
  philosophy: "Triết lý sống / Tín ngưỡng",
  distinguishingFeatures: "Đặc điểm nhận dạng",
  innerSecret: "Bí mật thầm kín",
  relationships: "Quan hệ xã hội",
  relation: "Mối quan hệ",
  status: "Tình trạng",
  impression: "Ấn tượng và suy nghĩ",
  termsOfAddress: "Cách xưng hô (với đối phương)",
  selfAppellation: "Cách tự xưng (với đối phương)",
  description: "Mô tả chi tiết",
  loveViews: "Quan điểm tình yêu",
  experience: "Kinh nghiệm",
  nsfwPersonality: "Tính cách khi NSFW",
  nsfwReactions: "Phản ứng khi NSFW",
  literaryDescription: "Đặc tả văn học",
  goal: "Mục tiêu / Động cơ",
  preferences: "Sở thích",
  sfw: "Sở thích chung (SFW)",
  nsfw: "Sở thích nhạy cảm (NSFW)",
  statusData: "Trạng thái nhân vật",
  type: "Phân loại",
  level: "Cấp độ",
  isPinned: "Ghim nhân vật",
  mood: "Tâm trạng",
  psychological: "Tâm lý",
  physiological: "Sinh lý",
  health: "Sức khỏe",
  condition: "Trạng thái cơ thể",
  solvable: "Khả năng giải quyết",
  duration: "Thời lượng",
  pendingUpdates: "Thay đổi chờ duyệt",
  inventory: "Túi đồ / Hành trang",
  quantity: "Số lượng",
  needs: "Nhu cầu"
};

function AutoResizeTextarea({ value, onChange, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
    const timer1 = setTimeout(adjustHeight, 50);
    const timer2 = setTimeout(adjustHeight, 300);
    const timer3 = setTimeout(adjustHeight, 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        adjustHeight();
        if (onChange) onChange(e);
      }}
      className={`${className || ''} overflow-hidden resize-none`}
      rows={1}
      {...props}
    />
  );
}

function DataEditor({ data, isDark, onChange, readonly = false }: { data: any, isDark: boolean, onChange?: (val: any) => void, readonly?: boolean }) {
  if (Array.isArray(data)) {
    return <ArrayEditor items={data} isDark={isDark} onChange={onChange} readonly={readonly} />;
  } else if (typeof data === 'object' && data !== null) {
    return <ObjectEditor obj={data} isDark={isDark} onChange={onChange} readonly={readonly} />;
  } else {
    if (readonly) {
      return (
        <div className={`text-sm whitespace-pre-wrap p-2 rounded ${isDark ? 'bg-black/20 text-white/80 border border-white/5' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
          {String(data)}
        </div>
      );
    } else {
      return (
        <AutoResizeTextarea
          value={data === null || data === undefined ? '' : String(data)}
          onChange={(e) => {
            if (onChange) {
              let val: any = e.target.value;
              if (typeof data === 'number') {
                const num = Number(val);
                if (!isNaN(num)) val = num;
              }
              onChange(val);
            }
          }}
          className={`w-full px-2 py-1 text-sm rounded outline-none min-h-[40px] ${isDark ? 'bg-black/40 text-white border-white/10 focus:border-green-500/50' : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-green-500/50'} border`}
        />
      );
    }
  }
}

function ArrayEditor({ items, isDark, onChange, readonly = false }: { items: any[], isDark: boolean, onChange?: (val: any[]) => void, readonly?: boolean }) {
  const arr = Array.isArray(items) ? items : [];
  
  if (arr.length === 0) return <div className="italic opacity-50 text-sm">Không có dữ liệu</div>;

  return (
    <div className="flex flex-col gap-3">
      {arr.map((item, i) => (
        <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${isDark ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`text-[10px] font-bold opacity-50`}>MỤC {i + 1}</div>
          <DataEditor 
            data={item} 
            isDark={isDark} 
            readonly={readonly} 
            onChange={(val) => {
              if (onChange) {
                const newArr = [...arr];
                newArr[i] = val;
                onChange(newArr);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ObjectEditor({ obj, isDark, onChange, readonly = false }: { obj: Record<string, any>, isDark: boolean, onChange?: (val: Record<string, any>) => void, readonly?: boolean }) {
  if (!obj || typeof obj !== 'object') return <div className="italic opacity-50 text-sm">Không có dữ liệu</div>;
  
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1">
          <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{FIELD_LABELS[k] || k}</span>
          <DataEditor 
            data={v} 
            isDark={isDark} 
            readonly={readonly}
            onChange={(val) => {
              if (onChange) {
                onChange({ ...obj, [k]: val });
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function NpcUpdateModal({ npc, npcIndex, onClose, onApply }: NpcUpdateModalProps) {
  const theme = useStore(state => state.theme);
  const isDark = theme.group === 'Dark';

  const [pending, setPending] = React.useState<any>(npc.pendingUpdates || {});
  const [viewMode, setViewMode] = React.useState<'original' | 'updated' | 'both'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'updated' : 'both'
  );

  const handleChange = (key: string, val: any) => {
    setPending({ ...pending, [key]: val });
  };

  const handleRemoveField = (key: string) => {
    const updated = { ...pending };
    delete updated[key];
    setPending(updated);
  };

  const handleApply = () => {
    onApply(pending);
  };

  if (!npc) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md`} onClick={(e) => e.stopPropagation()}>
      <div className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-slate-900/40'}`} onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-screen h-screen flex flex-col overflow-hidden ${
          isDark 
            ? 'bg-[#0f172a]' 
            : 'bg-white text-slate-800'
        }`}
      >
        <div className={`p-4 border-b flex flex-col shrink-0 gap-4 relative z-20 shadow-sm ${isDark ? 'border-white/10 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4 min-h-[40px]">
            <div className="flex-1 flex gap-2 pl-4">
               <button
                 onClick={() => {
                   document.getElementById('npc-update-scroll-container')?.scrollTo({ top: 0, behavior: 'instant' });
                 }}
                 title="Lên đầu"
                 className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
               >
                 <ArrowUpToLine size={20} />
               </button>
               <button
                 onClick={() => {
                   const el = document.getElementById('npc-update-scroll-container');
                   if (el) {
                     el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
                   }
                 }}
                 title="Xuống cuối"
                 className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
               >
                 <ArrowDownToLine size={20} />
               </button>
            </div>
            <div className="flex items-center gap-2 absolute right-4">
              <button
                onClick={handleApply}
                title="Lưu"
                className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors shadow-lg shadow-green-600/20"
              >
                <Check size={24} />
              </button>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200'}`}>
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-2">
            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <button
                onClick={() => setViewMode('original')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  viewMode === 'original'
                    ? isDark ? 'bg-blue-600/30 text-blue-400 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Nội dung gốc
              </button>
              <button
                onClick={() => setViewMode('updated')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  viewMode === 'updated'
                    ? isDark ? 'bg-green-600/30 text-green-400 shadow-sm' : 'bg-green-100 text-green-700 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Nội dung cập nhật
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`hidden md:block px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  viewMode === 'both'
                    ? isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Song song (2 Tab)
              </button>
            </div>
          </div>
        </div>

        <div id="npc-update-scroll-container" className="flex-1 overflow-y-auto flex flex-col p-6 gap-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-20">
            {Object.keys(pending).map((key) => {
              if (key === 'statusData') return null;
              
              const isArray = Array.isArray(npc[key]) || Array.isArray(pending[key]);
              const isObject = (typeof npc[key] === 'object' && npc[key] !== null) || (typeof pending[key] === 'object' && pending[key] !== null);
              
              return (
                <div key={key} className={`flex flex-col md:flex-row gap-6 ${viewMode !== 'both' ? 'md:flex-col' : ''}`}>
                  {/* Cột Gốc */}
                  {(viewMode === 'original' || viewMode === 'both') && (
                  <div className={`flex-1 p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} flex flex-col`}>
                    <span className={`block text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>BẢN GỐC: {FIELD_LABELS[key] || key}</span>
                    <div className={`flex-1`}>
                      {isArray ? (
                        <ArrayEditor items={npc[key] || []} isDark={isDark} readonly />
                      ) : isObject ? (
                        <ObjectEditor obj={npc[key] || {}} isDark={isDark} readonly />
                      ) : (
                        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isDark ? 'text-white/90' : 'text-slate-700'}`}>
                          {npc[key] || <span className="italic opacity-50">Không có dữ liệu</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Cột Cập Nhật */}
                  {(viewMode === 'updated' || viewMode === 'both') && (
                  <div className={`flex-1 p-5 rounded-2xl border relative focus-within:ring-2 ring-green-500/50 shadow-sm ${isDark ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-200'} flex flex-col`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-green-400' : 'text-green-600'}`}>CẬP NHẬT: {FIELD_LABELS[key] || key}</span>
                      <button onClick={() => handleRemoveField(key)} className="text-[10px] bg-red-500/10 text-red-500 font-bold px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">XÓA/BỎ QUA</button>
                    </div>
                    <div className="flex-1">
                      {isArray ? (
                        <ArrayEditor items={pending[key] || []} isDark={isDark} onChange={(val) => handleChange(key, val)} />
                      ) : isObject ? (
                        <ObjectEditor obj={pending[key] || {}} isDark={isDark} onChange={(val) => handleChange(key, val)} />
                      ) : (
                        <AutoResizeTextarea 
                          value={pending[key] || ''}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className={`w-full min-h-[120px] text-sm outline-none bg-transparent whitespace-pre-wrap leading-relaxed ${isDark ? 'text-white' : 'text-slate-700 bg-white border border-green-200 p-3 rounded-lg shadow-inner'}`}
                        />
                      )}
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
            
            {pending.statusData && (
              <div className={`flex flex-col md:flex-row gap-6 ${viewMode !== 'both' ? 'md:flex-col' : ''}`}>
                {(viewMode === 'original' || viewMode === 'both') && (
                <div className={`flex-1 p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} flex flex-col`}>
                  <span className={`block text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>BẢN GỐC: statusData</span>
                  <div className={`flex-1`}>
                    <ObjectEditor obj={npc.statusData || {}} isDark={isDark} readonly />
                  </div>
                </div>
                )}
                
                {(viewMode === 'updated' || viewMode === 'both') && (
                <div className={`flex-1 p-5 rounded-2xl border relative focus-within:ring-2 ring-green-500/50 shadow-sm ${isDark ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-200'} flex flex-col`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-green-400' : 'text-green-600'}`}>CẬP NHẬT: statusData</span>
                    <button onClick={() => handleRemoveField('statusData')} className="text-[10px] bg-red-500/10 text-red-500 font-bold px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">XÓA/BỎ QUA</button>
                  </div>
                  <div className="flex-1">
                    <ObjectEditor obj={pending.statusData || {}} isDark={isDark} onChange={(val) => handleChange('statusData', val)} />
                  </div>
                </div>
                )}
              </div>
            )}

            {Object.keys(pending).length === 0 && (
              <div className="text-center italic opacity-50 p-8 text-lg">Không còn trường nào để cập nhật.</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

