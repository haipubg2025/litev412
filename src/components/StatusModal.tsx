import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, PinOff, Plus, Trash2, Edit3, Save, Activity, Heart, Brain, FileText, User, Info, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Smile } from 'lucide-react';
import { useStore } from '../store/useStore';
import LazyImage from './LazyImage';
import { toast } from 'sonner';
import { StatusItem, StatusData } from '../types';

interface StatusModalProps {
  onClose: () => void;
}

const SECTION_LABELS: Record<string, { label: string; icon: any; colorClass: string; capsuleClass: string }> = {
  mood: {
    label: 'Tâm Trạng',
    icon: Smile,
    colorClass: 'text-yellow-400',
    capsuleClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25'
  },
  psychological: { 
    label: 'Tâm Lý', 
    icon: Brain, 
    colorClass: 'text-pink-400', 
    capsuleClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30 hover:bg-pink-500/25' 
  },
  physiological: { 
    label: 'Sinh Lý', 
    icon: Activity, 
    colorClass: 'text-emerald-400', 
    capsuleClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' 
  },
  health: { 
    label: 'Sức Khỏe', 
    icon: Heart, 
    colorClass: 'text-rose-400', 
    capsuleClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25' 
  },
  condition: { 
    label: 'Tình Trạng (Tổng Thể)', 
    icon: FileText, 
    colorClass: 'text-sky-400', 
    capsuleClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25' 
  }
};

const DEFAULT_NEW_ITEM: StatusItem = {
  name: '',
  description: '',
  type: 'temporary',
  solvable: 'solvable',
  duration: ''
};

// Component con hiển thị chi tiết trạng thái khi click vào viên con nhộng
function DetailPopup({ 
  item, 
  sectionLabel,
  onClose 
}: { 
  item: StatusItem; 
  sectionLabel: string;
  onClose: () => void;
}) {
  const theme = useStore(state => state.theme);
  const isDark = theme.group === 'Dark';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden border ${
          isDark ? 'theme-panel !border-none text-white' : 'bg-white/80 border-black/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        {isDark && (
          <>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl active:scale-90 transition-all z-10 ${
            isDark 
              ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10' 
              : 'bg-black/5 text-amber-805 hover:text-[#0f172a] hover:bg-black/10'
          }`}
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-widest rounded-md ${
            isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/5 border-black/10 text-[#334155]'
          }`}>
            {sectionLabel}
          </span>
        </div>

        <h3 className={`text-xl font-bold mb-4 pr-8 line-clamp-2 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
          {item.name}
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/10 shadow-xs'
          }`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/40' : 'text-[#334155]/70'}`}>Thời hạn</span>
            {item.type === 'permanent' ? (
              <span className="text-xs text-rose-500 font-bold">Vĩnh viễn</span>
            ) : (
              <span className="text-xs text-blue-505 font-bold flex items-center gap-1">
                <Clock size={12} className="shrink-0" /> {item.duration || 'Tạm thời'}
              </span>
            )}
          </div>
          
          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/10 shadow-xs'
          }`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/40' : 'text-[#334155]/70'}`}>Khả năng gỡ</span>
            {item.solvable === 'solvable' ? (
              <span className="text-xs text-emerald-550 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} className="shrink-0" /> Có thể giải quyết
              </span>
            ) : (
              <span className="text-xs text-rose-505 font-bold flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" /> Không thể gỡ
              </span>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-xl border mb-4 max-h-[160px] overflow-y-auto custom-scrollbar ${
          isDark ? 'bg-black/50 border-white/5' : 'bg-white/500/5 border-black/10 shadow-inner'
        }`}>
          <span className={`text-[10px] uppercase font-bold block mb-1.5 tracking-wider ${isDark ? 'text-white/40' : 'text-[#334155]/70'}`}>Mô tả lý giải</span>
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-white/90' : 'text-[#0f172a]'}`}>
            {item.description || 'Không có mô tả chi tiết cho trạng thái này.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusCard({ 
  character, 
  type, 
  index, 
  onPinToggle,
  onUpdateStatus,
  onSelectDetail,
  onDeleteCharacter
}: { 
  character: any; 
  type: 'mc' | 'npc'; 
  index: number; 
  onPinToggle?: () => void;
  onUpdateStatus: (type: 'mc' | 'npc', idx: number, newData: any) => void;
  onSelectDetail: (item: StatusItem, sectionLabel: string) => void;
  onDeleteCharacter?: () => void;
}) {
  const theme = useStore(state => state.theme);
  const isDark = theme.group === 'Dark';
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [localStatus, setLocalStatus] = useState<StatusData>(() => {
    const defaultData = character.statusData || { mood: [], psychological: [], physiological: [], health: [], condition: [] };
    // Sanitize defaultData to remove empty objects
    const cleanObj: any = {};
    ['mood', 'psychological', 'physiological', 'health', 'condition'].forEach((key: string) => {
      if (Array.isArray(defaultData[key as keyof StatusData])) {
        cleanObj[key] = (defaultData[key as keyof StatusData] as any[]).filter(
          (item: any) => item && typeof item === 'object' && item.name && item.name.trim().length > 0
        );
      } else {
        cleanObj[key] = [];
      }
    });
    return cleanObj;
  });
  
  const [newItem, setNewItem] = useState<{ section: keyof StatusData | null, data: StatusItem }>({
    section: null,
    data: { ...DEFAULT_NEW_ITEM }
  });

  // Xác định giới tính để vẽ viền theo màu yêu cầu
  const genderStr = (character.gender || '').toLowerCase();
  const isMale = genderStr.includes('nam') || genderStr.includes('male');
  const isFemale = genderStr.includes('nữ') || genderStr.includes('female');

  let genderBorderClass = isDark 
    ? 'border-white/10 hover:border-white/20 bg-black/75 shadow-lg' 
    : 'border-black/10 hover:border-black/10 bg-white/80 shadow-xs';
  if (isMale) {
    genderBorderClass = isDark
      ? 'border-blue-500/50 bg-gradient-to-b from-blue-950/20 to-black/80 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
      : 'border-blue-300/80 bg-gradient-to-b from-blue-50/40 to-[#FFFDFD] hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.06)]';
  } else if (isFemale) {
    genderBorderClass = isDark
      ? 'border-pink-500/50 bg-gradient-to-b from-pink-950/20 to-black/80 shadow-[0_0_20px_rgba(236,72,153,0.15)]'
      : 'border-pink-300/80 bg-gradient-to-b from-pink-50/40 to-[#FFFDFB] hover:border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.06)]';
  }

  const handleSave = () => {
    onUpdateStatus(type, index, localStatus);
    setIsEditing(false);
    toast.success(`Đã cập nhật trạng thái cho ${character.fullName || character.name}`);
  };

  const handleRemoveItem = (section: keyof StatusData, itemIdx: number) => {
    setLocalStatus((prev: any) => ({
      ...prev,
      [section]: prev[section].filter((_: any, i: number) => i !== itemIdx)
    }));
  };

  const handleAddItem = () => {
    if (newItem.section && newItem.data.name.trim()) {
      setLocalStatus((prev: any) => ({
        ...prev,
        [newItem.section!]: [...(prev[newItem.section!] || []), { ...newItem.data }]
      }));
      setNewItem({ section: null, data: { ...DEFAULT_NEW_ITEM } });
    }
  };

  // Tập hợp tất cả các trạng thái để vẽ capsule ở giao diện gọn nhẹ
  const allStatuses: { sectionKey: keyof StatusData; label: string; item: StatusItem }[] = [];
  (Object.keys(SECTION_LABELS) as (keyof StatusData)[]).forEach(sectKey => {
    const arr = localStatus[sectKey] || [];
    arr.forEach(item => {
      if (item && item.name && item.name.trim().length > 0) {
        allStatuses.push({
          sectionKey: sectKey,
          label: SECTION_LABELS[sectKey].label,
          item
        });
      }
    });
  });

  return (
    <div className={`border rounded-2xl p-4 flex flex-col transition-all duration-300 backdrop-blur-xl group ${genderBorderClass}`}>
      {/* Header gọn nhẹ: Chỉ chứa avatar tỉ lệ 3x4, họ tên phía trên và cụm nút điều khiển to đậm nằm DƯỚI họ tên */}
      <div className="flex gap-3 shrink-0 items-start">
        {character.avatar ? (
          <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20 relative shadow-md bg-zinc-900">
            <LazyImage src={character.avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`w-12 h-16 rounded-xl flex items-center justify-center shrink-0 border ${
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-slate-700'
          }`}>
            <User size={22} />
          </div>
        )}
        
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Họ tên tự động xuống dòng nếu quá dài */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-sm font-bold break-all whitespace-normal leading-snug ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
                {character.fullName || character.name || "Ẩn danh"}
              </h3>
              {type === 'mc' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">MC</span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-[#334155]/70'}`}>
              {allStatuses.length} trạng thái
            </span>
          </div>
          
          {/* Các nút điều khiển to đậm nằm PHÍA DƯỚI phần họ tên nhân vật, dễ dàng thao tác trên màn hình cảm ứng */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {type === 'npc' && onPinToggle && (
              <button 
                onClick={onPinToggle}
                className={`p-2 rounded-xl transition-all border shrink-0 flex items-center justify-center active:scale-95 ${
                  character.isPinned 
                    ? 'bg-white/500/20 text-slate-700 border-amber-500/40 shadow-sm' 
                    : (isDark ? 'bg-white/5 text-white/50 hover:text-white border-white/5' : 'bg-black/5 hover:bg-black/5 text-[#334155] border-black/10 hover:text-[#0f172a]')
                }`}
                title={character.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
              >
                <Pin size={15} strokeWidth={character.isPinned ? 2.5 : 2} />
              </button>
            )}
            
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`p-2 rounded-xl transition-all border shrink-0 flex items-center justify-center active:scale-95 ${
                isEditing 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' 
                  : (isDark ? 'bg-white/5 text-white/50 hover:text-white border-white/5' : 'bg-black/5 hover:bg-black/5 text-[#334155] border-black/10 hover:text-[#0f172a]')
              }`}
              title={isEditing ? "Lưu lại" : "Chỉnh sửa"}
            >
              {isEditing ? <Save size={15} strokeWidth={2.5} /> : <Edit3 size={15} strokeWidth={2} />}
            </button>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-xl transition-all border shrink-0 flex items-center justify-center active:scale-95 ${
                isDark 
                  ? 'bg-white/5 text-white/50 hover:text-white border-white/5' 
                  : 'bg-black/5 hover:bg-black/5 text-[#334155] border-black/10 hover:text-[#0f172a]'
              }`}
              title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
              {isCollapsed ? <ChevronDown size={15} strokeWidth={2.5} /> : <ChevronUp size={15} strokeWidth={2.5} />}
            </button>
            {onDeleteCharacter && (
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa nhân vật ${character.fullName || character.name} khỏi bảng trạng thái không?`)) {
                    onDeleteCharacter();
                  }
                }}
                className="p-2 rounded-xl transition-all border shrink-0 flex items-center justify-center active:scale-95 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                title="Xóa nhân vật"
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nội dung khi CHƯA thu gọn */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Chế độ CHỈNH SỬA đầy đủ dạng cây thư mục và input */}
            {isEditing ? (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {(Object.entries(SECTION_LABELS) as [keyof StatusData, { label: string; icon: any }][]).map(([sectionKey, { label, icon: Icon }]) => {
                  const items = localStatus[sectionKey] || [];
                  return (
                    <div key={sectionKey} className={`rounded-xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/10'}`}>
                      <div className={`px-2.5 py-1.5 flex items-center gap-2 border-b ${isDark ? 'bg-white/10 border-white/5' : 'bg-black/5 border-black/10'}`}>
                        <Icon size={12} className={isDark ? "text-blue-400" : "text-slate-700"} />
                        <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{label}</h4>
                      </div>
                      <div className={`p-2 space-y-2`}>
                        {items.length === 0 && (
                          <div className={`text-[10px] italic p-1 ${isDark ? 'text-white/30' : 'text-[#334155]/50'}`}>Chưa có trạng thái.</div>
                        )}
                        {items.map((item: StatusItem, i: number) => (
                          <div key={i} className={`relative p-2.5 rounded border space-y-2 ${isDark ? 'bg-black/50 border-white/5' : 'bg-white/60 border-black/10'}`}>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                setLocalStatus(prev => {
                                  const newArr = [...prev[sectionKey]];
                                  newArr[i] = { ...newArr[i], name: e.target.value };
                                  return { ...prev, [sectionKey]: newArr };
                                });
                              }}
                              className={`w-full text-[11px] p-1.5 rounded-lg border outline-none focus:border-blue-500/50 ${
                                isDark 
                                  ? 'bg-black/60 text-white border-white/10' 
                                  : 'bg-white/50 text-[#0f172a] border-black/10'
                              }`}
                              placeholder="Tên trạng thái..."
                            />
                            <textarea
                              value={item.description}
                              onChange={(e) => {
                                setLocalStatus(prev => {
                                  const newArr = [...prev[sectionKey]];
                                  newArr[i] = { ...newArr[i], description: e.target.value };
                                  return { ...prev, [sectionKey]: newArr };
                                });
                              }}
                              className={`w-full text-[10px] p-1.5 rounded-lg border outline-none resize-none min-h-[40px] focus:border-blue-500/50 ${
                                isDark 
                                  ? 'bg-black/60 text-white/80 border-white/10' 
                                  : 'bg-white/50 text-[#0f172a]/90 border-black/10'
                              }`}
                              placeholder="Mô tả..."
                            />
                            <div className="flex gap-2">
                              <select
                                value={item.type}
                                onChange={(e) => setLocalStatus(prev => {
                                  const newArr = [...prev[sectionKey]];
                                  newArr[i] = { ...newArr[i], type: e.target.value as 'permanent' | 'temporary' };
                                  return { ...prev, [sectionKey]: newArr };
                                })}
                                className={`text-[10px] p-1.5 rounded-lg border outline-none flex-1 focus:border-blue-500/50 ${
                                  isDark 
                                    ? 'bg-black/60 text-white border-white/10' 
                                    : 'bg-white/50 text-[#0f172a] border-black/10'
                                }`}
                              >
                                <option value="temporary">Tạm thời</option>
                                <option value="permanent">Vĩnh viễn</option>
                              </select>
                              <select
                                value={item.solvable}
                                onChange={(e) => setLocalStatus(prev => {
                                  const newArr = [...prev[sectionKey]];
                                  newArr[i] = { ...newArr[i], solvable: e.target.value as 'solvable' | 'unsolvable' };
                                  return { ...prev, [sectionKey]: newArr };
                                })}
                                className={`text-[10px] p-1.5 rounded-lg border outline-none flex-1 focus:border-blue-500/50 ${
                                  isDark 
                                    ? 'bg-black/60 text-white border-white/10' 
                                    : 'bg-white/50 text-[#0f172a] border-black/10'
                                }`}
                              >
                                <option value="solvable">Có thể gỡ</option>
                                <option value="unsolvable">Không thể gỡ</option>
                              </select>
                            </div>
                            {item.type === 'temporary' && (
                              <input
                                type="text"
                                value={item.duration || ''}
                                onChange={(e) => setLocalStatus(prev => {
                                  const newArr = [...prev[sectionKey]];
                                  newArr[i] = { ...newArr[i], duration: e.target.value };
                                  return { ...prev, [sectionKey]: newArr };
                                })}
                                className={`w-full text-[10px] p-1.5 rounded-lg border outline-none focus:border-blue-500/50 ${
                                  isDark 
                                    ? 'bg-black/60 text-white border-white/10' 
                                    : 'bg-white/50 text-[#0f172a] border-black/10'
                                }`}
                                placeholder="Thời lượng..."
                              />
                            )}
                            <button 
                              onClick={() => handleRemoveItem(sectionKey, i)}
                              className="absolute top-1 right-1 p-1.5 text-rose-400 hover:bg-rose-500/15 rounded-lg"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}

                        {newItem.section === sectionKey ? (
                          <div className={`p-3 rounded-xl border space-y-2 mt-2 text-xs ${
                            isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/500/5 border-black/10'
                          }`}>
                            <input 
                              type="text" 
                              placeholder="Tên..." 
                              value={newItem.data.name} 
                              onChange={e => setNewItem({ ...newItem, data: { ...newItem.data, name: e.target.value } })} 
                              className={`w-full text-xs p-1.5 rounded-lg border outline-none focus:border-blue-500/50 ${
                                isDark 
                                  ? 'bg-black/60 text-white border-white/10' 
                                  : 'bg-white/50 text-[#0f172a] border-black/10'
                              }`} 
                            />
                            <textarea 
                              placeholder="Mô tả..." 
                              value={newItem.data.description} 
                              onChange={e => setNewItem({ ...newItem, data: { ...newItem.data, description: e.target.value } })} 
                              className={`w-full text-[10px] p-1.5 rounded-lg border outline-none min-h-[35px] focus:border-blue-500/50 ${
                                isDark 
                                  ? 'bg-black/60 text-white border-white/10' 
                                  : 'bg-white/50 text-[#0f172a] border-black/10'
                              }`} 
                            />
                            <div className="flex gap-2">
                               <select 
                                 value={newItem.data.type} 
                                 onChange={e => setNewItem({ ...newItem, data: { ...newItem.data, type: e.target.value as any } })} 
                                 className={`text-[10px] p-1.5 rounded-lg border outline-none flex-1 focus:border-blue-500/50 ${
                                   isDark 
                                     ? 'bg-black/60 text-white border-white/10' 
                                     : 'bg-white/50 text-[#0f172a] border-black/10'
                                 }`}
                               >
                                  <option value="temporary">Tạm thời</option>
                                  <option value="permanent">Vĩnh viễn</option>
                               </select>
                               <select 
                                 value={newItem.data.solvable} 
                                 onChange={e => setNewItem({ ...newItem, data: { ...newItem.data, solvable: e.target.value as any } })} 
                                 className={`text-[10px] p-1.5 rounded-lg border outline-none flex-1 focus:border-blue-500/50 ${
                                   isDark 
                                     ? 'bg-black/60 text-white border-white/10' 
                                     : 'bg-white/50 text-[#0f172a] border-black/10'
                                 }`}
                               >
                                  <option value="solvable">Có thể gỡ</option>
                                  <option value="unsolvable">Không thể gỡ</option>
                               </select>
                            </div>
                            {newItem.data.type === 'temporary' && (
                               <input 
                                 type="text" 
                                 placeholder="Thời lượng..." 
                                 value={newItem.data.duration} 
                                 onChange={e => setNewItem({ ...newItem, data: { ...newItem.data, duration: e.target.value } })} 
                                 className={`w-full text-[10px] p-1.5 rounded-lg border outline-none focus:border-blue-500/50 ${
                                   isDark 
                                     ? 'bg-black/60 text-white border-white/10' 
                                     : 'bg-white/50 text-[#0f172a] border-black/10'
                                 }`} 
                               />
                            )}
                            
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button 
                                onClick={() => setNewItem({ section: null, data: { ...DEFAULT_NEW_ITEM } })} 
                                className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-colors ${
                                  isDark 
                                    ? 'text-white/50 hover:text-white bg-white/5' 
                                    : 'text-[#334155]/70 hover:text-[#0f172a] bg-black/10 hover:bg-black/10'
                                }`}
                              >
                                Hủy
                              </button>
                              <button 
                                onClick={handleAddItem} 
                                className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-colors ${
                                  isDark 
                                    ? 'bg-blue-500/50 hover:bg-blue-500/85 text-white' 
                                    : 'bg-slate-800 hover:bg-slate-800 text-white font-bold'
                                }`}
                              >
                                Thêm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setNewItem({ section: sectionKey, data: { ...DEFAULT_NEW_ITEM } })} 
                            className={`w-full py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors active:scale-95 ${
                              isDark 
                                ? 'bg-white/5 hover:bg-white/10 text-white/70' 
                                : 'bg-black/5 hover:bg-black/10 text-[#334155] hover:text-[#0f172a]'
                            }`}
                          >
                            <Plus size={12} /> Thêm {label}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Chế độ XEM BÌNH THƯỜNG: Thu gọn dữ liệu thành các viên con nhộng tuyệt đẹp */
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-black/10'}`}>
                {allStatuses.length === 0 ? (
                  <div className={`text-xs italic py-3 text-center border border-dashed rounded-xl ${
                    isDark ? 'text-white/40 bg-white/[0.02] border-white/5' : 'text-[#334155]/60 bg-white/500/5 border-black/10'
                  }`}>
                    Không có trạng thái nào được thiết lập.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allStatuses.map(({ sectionKey, label, item }, idx) => {
                      const capsuleDesign = SECTION_LABELS[sectionKey];
                      return (
                        <button
                          key={idx}
                          onClick={() => onSelectDetail(item, label)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm select-none ${capsuleDesign.capsuleClass}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StatusModal({ onClose }: StatusModalProps) {
  const theme = useStore(state => state.theme);
  const gameData = useStore(state => state.gameData);
  const setGameData = useStore(state => state.setGameData);
  const [selectedDetail, setSelectedDetail] = useState<{ item: StatusItem; sectionLabel: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDetail) setSelectedDetail(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedDetail]);

  if (!gameData) return null;

  const handleUpdateStatus = (type: 'mc' | 'npc', idx: number, newData: any) => {
    // Clone sâu triệt để để tránh lỗi không mở rộng được đối tượng hay bị block do đóng băng (not extensible)
    const updatedGameData = JSON.parse(JSON.stringify(gameData));
    if (type === 'mc') {
      if (updatedGameData.mcData) {
        updatedGameData.mcData.statusData = newData;
      }
    } else {
      if (updatedGameData.npcs && updatedGameData.npcs[idx]) {
        updatedGameData.npcs[idx].statusData = newData;
      }
    }
    setGameData(updatedGameData);
  };

  const togglePin = (npcIndex: number) => {
    // Clone sâu triệt để để tránh lỗi "Cannot add property isPinned, object is not extensible"
    const updatedGameData = JSON.parse(JSON.stringify(gameData));
    if (updatedGameData.npcs && updatedGameData.npcs[npcIndex]) {
      updatedGameData.npcs[npcIndex].isPinned = !updatedGameData.npcs[npcIndex].isPinned;
    }
    setGameData(updatedGameData);
  };

  const handleDeleteCharacter = (npcIndex: number) => {
    const updatedGameData = JSON.parse(JSON.stringify(gameData));
    if (updatedGameData.npcs) {
      updatedGameData.npcs.splice(npcIndex, 1);
    }
    setGameData(updatedGameData);
    toast.success('Đã xóa nhân vật khỏi bảng');
  };

  const renderedList: { type: 'mc'|'npc'; char: any; index: number; isPinned: boolean }[] = [];
  
  if (gameData.mcData) {
    renderedList.push({ type: 'mc', char: gameData.mcData, index: -1, isPinned: true });
  }

  const npcs = gameData.npcs || [];
  const pinnedNpcs = npcs.map((n: any, i: number) => ({ type: 'npc' as const, char: n, index: i, isPinned: !!n.isPinned })).filter((n: any) => n.isPinned);
  const unpinnedNpcs = npcs.map((n: any, i: number) => ({ type: 'npc' as const, char: n, index: i, isPinned: !!n.isPinned })).filter((n: any) => !n.isPinned);

  const displayList = [...renderedList, ...pinnedNpcs, ...unpinnedNpcs];

  const isDark = theme.group === 'Dark';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col overflow-hidden ${isDark ? "theme-panel !border-none text-white backdrop-blur-2xl" : 'bg-[#FAF7F0]/98 backdrop-blur-md font-sans'}`}
    >
      <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/10 bg-white/60 backdrop-blur-sm'}`}>
        <div className="flex items-center gap-3">
          <Activity className="text-emerald-400 animate-pulse" size={24} />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 tracking-wider">
            BẢNG TRẠNG THÁI NHÂN VẬT
          </h2>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-colors ${
            isDark ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10' : 'bg-black/5 text-[#334155] hover:text-[#0f172a] hover:bg-black/10'
          }`}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {/* Layout cột tự động giãn đều hết không gian, tối ưu hóa màn hình lớn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          <AnimatePresence>
            {displayList.map((item) => (
              <motion.div 
                key={`${item.type}-${item.index}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <StatusCard
                  type={item.type}
                  character={item.char}
                  index={item.index}
                  onPinToggle={item.type === 'npc' ? () => togglePin(item.index) : undefined}
                  onUpdateStatus={handleUpdateStatus}
                  onSelectDetail={(item, label) => setSelectedDetail({ item, sectionLabel: label })}
                  onDeleteCharacter={item.type === 'npc' ? () => handleDeleteCharacter(item.index) : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Popup thông tin chi tiết */}
      <AnimatePresence>
        {selectedDetail && (
          <DetailPopup 
            item={selectedDetail.item} 
            sectionLabel={selectedDetail.sectionLabel} 
            onClose={() => setSelectedDetail(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
