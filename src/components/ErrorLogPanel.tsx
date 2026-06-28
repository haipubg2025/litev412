import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, Maximize2, X, Activity, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SystemLogItem } from '../types';

const LogItem = ({ log, isDark, defaultExpanded = false }: { log: SystemLogItem, isDark: boolean, defaultExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className={`mb-2 rounded border ${isDark ? 'border-red-900/30 bg-red-950/20' : 'border-red-200 bg-red-50/50'} overflow-hidden`}>
      <div 
        className={`flex items-start gap-2 p-2 cursor-pointer select-none transition-colors ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-100'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="pt-0.5">
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''} ${isDark ? 'text-red-400' : 'text-red-600'}`} />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex justify-between items-center w-full gap-2">
            <span className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              {log.message.split('\n')[0].substring(0, 80)}
            </span>
            <span className={`text-[9px] shrink-0 ${isDark ? 'text-red-400/50' : 'text-red-700/60'}`}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`p-2 pt-0 text-[10px] sm:text-xs whitespace-pre-wrap break-words ${isDark ? 'text-red-300' : 'text-red-800'}`}>
              {log.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ErrorLogPanel() {
  const theme = useStore(state => state.theme);
  const systemLogs = useStore(state => state.systemLogs);
  const setSystemLogs = useStore(state => state.setSystemLogs);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isDark = theme.group === 'Dark';

  const hasLogs = systemLogs && systemLogs.length > 0;

  // Auto expand when there are new logs
  useEffect(() => {
    if (hasLogs) {
      setIsExpanded(true);
    }
  }, [hasLogs]);

  return (
    <>
      <div className={`w-full border-y backdrop-blur-md overflow-hidden transition-all duration-500 ${
        hasLogs 
          ? (isDark ? 'border-red-500/30 bg-[#150505] hover:border-red-500/50' : 'border-red-300 bg-red-50/75 hover:border-red-400')
          : (isDark ? 'theme-panel !border-l-0 !border-r-0' : 'border-black/10 bg-white/60 hover:border-black/10')
      }`}>
        <div 
          className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold select-none cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
             <div className="relative flex h-2 w-2">
              {hasLogs ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              )}
            </div>
            <span className={`text-[11px] tracking-wider uppercase font-black ${hasLogs ? 'text-red-500' : theme.textSecondary}`}>
              Error & Diagnostics Log {hasLogs ? `(${systemLogs.length})` : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasLogs && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono animate-pulse font-bold ${
                isDark 
                  ? 'bg-red-500/15 border border-red-500/35 text-red-400' 
                  : 'bg-red-100 border border-red-300 text-red-700'
              }`}>
                ERRORS
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-[#334155] group-hover:text-[#0f172a]'}`} />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-[#334155] group-hover:text-[#0f172a]'}`} />
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className={`px-4 pb-4 pt-1 border-t font-mono text-[10px] leading-relaxed relative ${
                isDark ? 'border-white/5' : 'border-black/10'
              }`}>
                {/* Actions row */}
                <div className="flex justify-end gap-1 mb-2">
                  {hasLogs && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSystemLogs(""); }}
                      className="p-1 text-red-550 hover:text-red-650 hover:bg-red-500/20 rounded transition-colors"
                      title="Xóa logs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-[#334155] hover:text-[#0f172a] hover:bg-black/5'
                    }`}
                    title="Phóng to"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-48 overflow-y-auto custom-scrollbar">
                  {hasLogs ? (
                    <div className="flex flex-col gap-1 pr-1">
                      {systemLogs.map((log, idx) => (
                        <LogItem key={log.id} log={log} isDark={isDark} defaultExpanded={idx === 0} />
                      ))}
                    </div>
                  ) : (
                    <div className={`p-2 ${isDark ? 'text-green-400/60' : 'text-emerald-800 font-semibold'}`}>
                      {"> Hệ thống trạng thái bình thường...\n> Không có lỗi phát sinh."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-4xl max-h-full flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
                isDark ? 'border-white/10 bg-black/90' : 'border-red-200 bg-white/80'
              }`}
            >
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-white/10 bg-white/5' : 'border-red-100 bg-red-50/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-800'}`}>Error & Diagnostics Log {hasLogs ? `(${systemLogs.length})` : ''}</h3>
                    <p className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-700/85'}`}>Bộ theo dõi và xử lý lỗi hệ thống chuyên sâu</p>
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  {hasLogs && (
                    <button
                      onClick={() => setSystemLogs("")}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Logs
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-red-100 text-red-700 hover:text-red-900'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${
                isDark ? 'bg-[#0f0404]' : 'bg-red-50/10 shadow-inner'
              }`}>
                <div className="font-mono flex flex-col gap-2">
                  {hasLogs ? (
                    systemLogs.map((log) => (
                      <LogItem key={log.id} log={log} isDark={isDark} defaultExpanded={true} />
                    ))
                  ) : (
                    <div className={`whitespace-pre-wrap ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>
                      {"> Hệ thống trạng thái bình thường...\n> Không có lỗi phát sinh."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
