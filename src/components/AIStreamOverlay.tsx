import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal, Cpu, Zap, Activity, ChevronUp, ChevronDown, Edit3, Save, BugPlay } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { robustParseGameplayJSON } from '../utils/jsonRepair';

const StreamText = ({ isDark, scrollRef }: { isDark: boolean, scrollRef: React.RefObject<HTMLDivElement> }) => {
  const fullScreenStreamData = useStore(state => state.fullScreenStreamData);

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [fullScreenStreamData, scrollRef]);

  return (
    <>
      {fullScreenStreamData || (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Cpu size={64} className="animate-spin-slow mb-6" />
            <p className="text-sm tracking-widest uppercase">Waiting for Matrix Lite v4 signal...</p>
        </div>
      )}
      <motion.span
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className={`inline-block w-2 h-5 ml-1 translate-y-1 ${isDark ? 'bg-blue-500' : 'bg-amber-800'}`}
      />
    </>
  );
};

export default function AIStreamOverlay() {
  const isFullScreenStream = useStore(state => state.isFullScreenStream);
  const setFullScreenStream = useStore(state => state.setFullScreenStream);
  const theme = useStore(state => state.theme);
  const isGeneratingStream = useStore(state => state.isGeneratingStream);
  const streamStartTime = useStore(state => state.streamStartTime);
  const fullScreenStreamData = useStore(state => state.fullScreenStreamData);
  const setPendingReparseStreamData = useStore(state => state.setPendingReparseStreamData);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timer, setTimer] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState('');

  // Handle Edit toggle
  const toggleEdit = () => {
    if (!isEditing) {
      setEditedData(fullScreenStreamData);
    }
    setIsEditing(!isEditing);
  };

  const handleCheckErrors = () => {
    const textToCheck = isEditing ? editedData : fullScreenStreamData;
    const { parsedData } = robustParseGameplayJSON(textToCheck);
    if (parsedData) {
      toast.success('JSON hợp lệ! Không phát hiện lỗi cấu trúc gãy.', {
        description: 'Tất cả các ngoặc đã được đóng đúng và cú pháp chuẩn.'
      });
    } else {
      toast.error('Phát hiện lỗi JSON nghiêm trọng!', {
        description: 'Xem chi tiết trong Error Log Panel.'
      });
    }
  };

  const handleApplyData = () => {
    if (!editedData.trim()) {
      toast.error('Dữ liệu rỗng!');
      return;
    }
    setPendingReparseStreamData(editedData);
    setFullScreenStream(false);
    setIsEditing(false);
    toast.success('Đã gửi yêu cầu nạp lại dữ liệu!', {
      description: 'Hệ thống đang tiến hành re-parse...'
    });
  };

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isGeneratingStream && streamStartTime) {
      setTimer(Math.floor((Date.now() - streamStartTime) / 1000));
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - streamStartTime) / 1000));
      }, 1000);
    } else if (!isGeneratingStream && !streamStartTime) {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingStream, streamStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isDark = theme.group === 'Dark';

  return (
    <AnimatePresence>
      {isFullScreenStream && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className={`fixed inset-0 z-[100] flex flex-col font-mono ${
            isDark ? 'bg-black text-white' : 'bg-[#FAF7F0] text-[#3E2723]'
          }`}
          id="ai-full-stream-overlay"
        >
          {/* Background Matrix/Retro Ambient Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
             <div className={`absolute top-0 left-0 w-full h-full ${isDark ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,100,255,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(180,120,40,0.08),transparent_70%)]'}`} />
             <div className={`absolute top-0 left-0 w-full h-full ${isDark ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px]' : 'bg-[linear-gradient(rgba(240,230,210,0)_50%,rgba(139,69,19,0.05)_50%)] bg-[length:100%_2px]'}`} />
          </div>

          {/* Header */}
          <div className={`relative z-10 flex items-center justify-between px-4 md:px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 md:py-4 border-b backdrop-blur-md ${
            isDark ? 'border-white/5 bg-white/5 text-white' : 'border-amber-200 bg-[#FFFDF9]/90 text-[#3E2723]'
          }`}>
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setFullScreenStream(false)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-white/70 hover:text-red-400' 
                    : 'bg-amber-100 border-amber-250 text-[#5C4033] hover:bg-red-500/10 hover:text-red-650 hover:border-red-350'
                }`}
                id="close-stream-btn"
                title="Đóng Stream"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <div className={`h-8 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-amber-200'}`} />

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 text-white/50 hover:text-blue-400' 
                      : 'bg-amber-100 border-amber-250 text-[#5C4033] hover:bg-amber-200/60 hover:text-[#3E2723]'
                  }`}
                  title="Cuộn lên đầu"
                >
                  <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <button 
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 text-white/50 hover:text-blue-400' 
                      : 'bg-amber-100 border-amber-250 text-[#5C4033] hover:bg-amber-200/60 hover:text-[#3E2723]'
                  }`}
                  title="Cuộn xuống cuối"
                >
                  <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isGeneratingStream && (
                <React.Fragment>
                  {isEditing && (
                    <React.Fragment>
                      <button 
                        onClick={handleCheckErrors}
                        className={`px-3 py-1.5 rounded-full border flex items-center gap-2 cursor-pointer transition-colors ${
                          isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20' : 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200'
                        }`}
                        title="Dò lỗi thiếu phẩy, ngoặc..."
                      >
                        <BugPlay size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Dò lỗi JSON</span>
                      </button>
                      <button 
                        onClick={handleApplyData}
                        className={`px-3 py-1.5 rounded-full border flex items-center gap-2 cursor-pointer transition-colors ${
                          isDark ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                        }`}
                        title="Parse lại dữ liệu"
                      >
                        <Save size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Nạp dữ liệu</span>
                      </button>
                    </React.Fragment>
                  )}
                  <button 
                    onClick={toggleEdit}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 cursor-pointer transition-colors ${
                      isEditing 
                        ? (isDark ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200')
                        : (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200')
                    }`}
                  >
                    <Edit3 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{isEditing ? 'Hủy sửa' : 'Chỉnh sửa'}</span>
                  </button>
                  <div className={`h-6 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-amber-200'}`} />
                </React.Fragment>
              )}

              <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${
                isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
              }`}>
                <Activity size={14} className={`animate-pulse ${isDark ? 'text-blue-400' : 'text-amber-850'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-amber-800'}`}>
                  Live {timer > 0 && `| ${formatTime(timer)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div 
            ref={scrollRef}
            className="flex-1 relative z-10 overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-20 pt-2"
          >
            <div className="max-w-5xl mx-auto space-y-8">
               <div className={`text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30 ${
                 isDark ? 'text-blue-50/90' : 'text-[#3E2723]'
               }`}>
                  {isEditing ? (
                    <textarea
                      value={editedData}
                      onChange={(e) => setEditedData(e.target.value)}
                      className={`w-full h-full min-h-[60vh] p-4 rounded-xl border font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-blue-50/90 focus:border-blue-500/50' 
                          : 'bg-white/50 border-amber-200 text-[#3E2723] focus:border-amber-500/50'
                      }`}
                      spellCheck={false}
                    />
                  ) : (
                    <StreamText isDark={isDark} scrollRef={scrollRef} />
                  )}
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
