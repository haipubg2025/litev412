import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  PanelLeft,
  PanelRight,
  Send,
  ArrowUp,
  ArrowDown,
  User,
  Sparkles,
  Loader2,
  Copy,
  Save,
  Download,
  ImageIcon,
  Book,
  BrainCircuit,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ListTodo,
  Edit3,
  Clock,
  MapPin,
  Maximize2,
  Trash2,
  RotateCcw,
  Activity,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Palette,
  Flame,
  ArrowUpToLine,
  ArrowDownToLine,
  CloudSun,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useDeviceMode } from "../hooks/useDeviceMode";
import { toast } from "sonner";
import { aiService } from "../services/aiService";
import { ragService } from "../services/ragService";
import Settings from "./Settings";
import {
  generateSysLog,
  cleanErrorMessage,
  normalizeUsage,
} from "../utils/errorHandler";
import CharacterModal from "./CharacterModal";
import CodexModal from "./CodexModal";
import GalleryModal from "./GalleryModal";
import StatusModal from "./StatusModal";
import LazyImage from "./LazyImage";
import { getGameplaySystemInstruction } from "../utils/gameplaySystemInstruction";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import NPCBuilderModal from "./NPCBuilderModal";
import {
  robustParseGameplayJSON,
  cleanRawOutputText,
  safeParseJSON,
} from "../utils/jsonRepair";

const formatCodexData = (obj: any, excludeKeys: string[] = []) => {
  if (!obj) return "Không có thông tin.";
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (excludeKeys.includes(key)) continue;
    if (value) {
      const formattedKey = key
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toUpperCase();
      
      if (key === "locations" && Array.isArray(value)) {
        const locationText = value.map((loc: any) => `- **${loc.name}**: ${loc.description}`).join("\n");
        if (locationText) {
           lines.push(`[ ${formattedKey} ]\n${locationText}`);
        }
      } else if (typeof value === "string" && value.trim() !== "") {
        lines.push(`[ ${formattedKey} ]\n${value.trim()}`);
      } else if (typeof value === "object") {
        lines.push(`[ ${formattedKey} ]\n${JSON.stringify(value)}`);
      }
    }
  }
  return lines.length > 0 ? lines.join("\n\n") : "Không có thông tin.";
};

const formatNPCsCodex = (npcs: any[], mcLocation?: string, userInput?: string) => {
  if (!npcs || !npcs.length) return "Không có NPC nào.";

  const fullDataNPCs: any[] = [];
  const partialDataNPCs: any[] = [];
  const miniDataNPCs: any[] = [];

  const lowerInput = (userInput || "").toLowerCase();
  const lowerMcLocation = (mcLocation || "").toLowerCase();

  const radioKeywords = ["gọi", "liên lạc", "nhớ", "nghĩ", "vô tuyến", "điện thoại", "nhắn tin", "truyền tin", "hệ thống", "system"];

  npcs.forEach((npc) => {
    const lowerNpcName = (npc.name || "").toLowerCase();
    const lowerNpcFullName = (npc.fullName || "").toLowerCase();
    const lowerNpcLocation = typeof npc.location === 'string' ? npc.location.toLowerCase() : "";

    // "Hệ Thống" or system NPCs usually follow MC or are ubiquitous. 
    // We can just keep them in fullData if they don't have location or their name implies system
    if (lowerNpcName.includes("hệ thống") || lowerNpcFullName.includes("hệ thống")) {
      fullDataNPCs.push(npc);
      return;
    }

    const isMentionedInInput = 
      (lowerNpcName && lowerInput.includes(lowerNpcName)) || 
      (lowerNpcFullName && lowerInput.includes(lowerNpcFullName));
    
    // Determine if locations match or overlap significantly
    const isSameLocation = 
      (lowerMcLocation && lowerNpcLocation && 
        (lowerMcLocation.includes(lowerNpcLocation) || lowerNpcLocation.includes(lowerMcLocation))) ||
      (lowerMcLocation === lowerNpcLocation) || 
      (!lowerNpcLocation); // If NPC has no location, maybe treat as full or mini. Let's say if no location, maybe they are concept/system. We handled system above, so if no location, maybe just mini.

    if (isSameLocation || isMentionedInInput) {
      if (isSameLocation || (isMentionedInInput && !radioKeywords.some(kw => lowerInput.includes(kw)))) {
         // Nhóm 1: "Trong Tầm Mắt"
         fullDataNPCs.push(npc);
      } else {
         // Nhóm 2: "Liên Lạc Vô Tuyến / Ký Ức"
         partialDataNPCs.push(npc);
      }
    } else {
      // Nhóm 3: "Ngoài Vùng Phủ Sóng"
      miniDataNPCs.push(npc);
    }
  });

  const formatNPC = (npc: any, type: 'full' | 'partial', idx: number) => {
    const lines = [`NPC ${idx + 1}:`];
    const allowedKeys = type === 'partial' 
      ? ['name', 'fullName', 'location', 'personalityCore', 'background', 'statusData', 'relationships']
      : Object.keys(npc);

    for (const [key, value] of Object.entries(npc)) {
      if (["id", "avatar", "isPinned", "appearance"].includes(key)) continue;
      if (type === 'partial' && !allowedKeys.includes(key)) continue;

      if (value) {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .trim()
          .toUpperCase();
        if (typeof value === "string" && value.trim() !== "") {
          lines.push(`  + ${formattedKey}: ${value.trim()}`);
        } else if (typeof value === "object") {
          lines.push(`  + ${formattedKey}: ${JSON.stringify(value)}`);
        }
      }
    }
    return lines.join("\n");
  };

  let output = "";

  // TỔNG HỢP DANH SÁCH TẤT CẢ NPC HIỆN CÓ
  output += "--- TỔNG HỢP DANH SÁCH TẤT CẢ NPC HIỆN CÓ TRONG THẾ GIỚI ---\n";
  output += npcs.map(npc => `- ${npc.fullName || npc.name || "Unknown"} (Vai trò: ${npc.occupation || "Không rõ"})`).join("\n");
  output += "\n\n";

  let overallIdx = 0;

  if (fullDataNPCs.length > 0) {
    output += "--- NHÓM 1: TRONG TẦM MẮT (DỮ LIỆU ĐẦY ĐỦ) ---\n";
    fullDataNPCs.forEach((npc) => {
      output += formatNPC(npc, 'full', overallIdx++) + "\n\n";
    });
  }

  if (partialDataNPCs.length > 0) {
    output += "--- NHÓM 2: LIÊN LẠC / KÝ ỨC (DỮ LIỆU RÚT GỌN) ---\n";
    partialDataNPCs.forEach((npc) => {
      output += formatNPC(npc, 'partial', overallIdx++) + "\n\n";
    });
  }

  if (miniDataNPCs.length > 0) {
    output += "--- NHÓM 3: NGOÀI VÙNG PHỦ SÓNG (DỮ LIỆU SIÊU NHỎ) ---\n";
    const miniArray = miniDataNPCs.map(npc => {
      // Get a brief status summary
      let briefStatus = "Bình thường";
      if (npc.statusData) {
        if (Array.isArray(npc.statusData.health) && npc.statusData.health.length > 0) briefStatus = npc.statusData.health[0].name;
        else if (Array.isArray(npc.statusData.condition) && npc.statusData.condition.length > 0) briefStatus = npc.statusData.condition[0].name;
        else if (Array.isArray(npc.statusData.physiological) && npc.statusData.physiological.length > 0) briefStatus = npc.statusData.physiological[0].name;
        else if (Array.isArray(npc.statusData.psychological) && npc.statusData.psychological.length > 0) briefStatus = npc.statusData.psychological[0].name;
      }
      return {
        name: npc.name || npc.fullName || "Unknown",
        location: npc.location || "Unknown",
        status: briefStatus
      };
    });
    output += JSON.stringify(miniArray, null, 2) + "\n\n";
  }

  return output.trim();
};

const LocalTimer = ({ isGenerating, processingTime }: { isGenerating: boolean, processingTime: number }) => {
  const [timer, setTimer] = useState(0);

  const formatTimeStr = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const updateTimer = () => {
      setTimer(performance.now() - startTime);
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    if (isGenerating) {
      startTime = performance.now();
      setTimer(0);
      animationFrameId = requestAnimationFrame(updateTimer);
    } else {
      setTimer(0);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isGenerating]);

  return <>{formatTimeStr(isGenerating ? timer : processingTime)}</>;
};

export interface ActionInputRef {
  clear: () => void;
  setText: (text: string) => void;
}

const ActionInput = forwardRef<ActionInputRef, { isGenerating: boolean, theme: any, onSend: (text: string) => void }>(({ isGenerating, theme, onSend }, ref) => {
  const [inputAction, setInputAction] = useState("");

  useImperativeHandle(ref, () => ({
    clear: () => setInputAction(""),
    setText: (text: string) => setInputAction(text)
  }));

  const handleSend = () => {
    if (!inputAction.trim() || isGenerating) return;
    onSend(inputAction.trim());
    setInputAction("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto relative group">
      <textarea
        value={inputAction}
        onChange={(e) => setInputAction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={
          isGenerating
            ? "Matrix Lite v4 đang vận hành..."
            : "Hành động tiếp theo của bạn (hỗ trợ xuống dòng bằng Shift+Enter)..."
        }
        className={`w-full theme-input border-transparent focus:border-blue-500/50 rounded-xl py-4 pl-4 pr-14 theme-text-base placeholder:text-slate-500 dark-theme:placeholder:text-white/30 outline-none resize-none min-h-[60px] max-h-[150px] custom-scrollbar focus:ring-1 focus:ring-blue-500/30 transition-all font-medium disabled:opacity-50 ${
          theme.group === "Dark"
            ? "focus:bg-black/60"
            : "bg-white text-[#0f172a]"
        }`}
        rows={
          inputAction.split("\n").length > 1
            ? Math.min(inputAction.split("\n").length, 5)
            : 1
        }
        disabled={isGenerating}
      />
      <button
        onClick={handleSend}
        disabled={!inputAction.trim() || isGenerating}
        className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 theme-text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 cursor-pointer"
      >
        <Send
          size={18}
          className={"translate-x-0.5 " + (isGenerating ? "opacity-50" : "")}
        />
      </button>
    </div>
  );
});

const StreamLogViewer = ({ theme, isExpanded, expandedLog }: { theme: any, isExpanded?: boolean, expandedLog?: "reasoning" | "error" | null }) => {
  const fullScreenStreamData = useStore((state) => state.fullScreenStreamData);
  const streamScrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (streamScrollRef.current) {
      streamScrollRef.current.scrollTop = streamScrollRef.current.scrollHeight;
    }
  }, [fullScreenStreamData]);

  const rawText = fullScreenStreamData || "Matrix Lite x Annie xin chào cou nhé dấu<3\nĐang chờ dữ liệu...";
  const lines = rawText.split('\n');

  const renderLines = (textClass: string) => (
    <div className={`font-mono text-xs leading-relaxed break-words ${textClass}`}>
      {lines.map((line, idx) => (
        <div key={idx} className="flex gap-4 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1">
          <span className="select-none opacity-30 text-right w-6 shrink-0">{idx + 1}</span>
          <span className="whitespace-pre-wrap flex-1">{line || ' '}</span>
        </div>
      ))}
    </div>
  );

  if (isExpanded) {
    return renderLines(expandedLog === "error" ? "text-red-400/80" : "text-green-400/80");
  }

  return (
    <div
      ref={streamScrollRef}
      className={`flex-1 min-h-[200px] shrink-0 p-4 overflow-y-auto custom-scrollbar scroll-smooth ${theme.group === "Light" ? "border border-black/10 rounded-xl m-2 shadow-inner bg-white/50" : "theme-panel !border-none"}`}
    >
      {renderLines(theme.group === "Dark" ? "text-green-400/80" : "text-[#0f172a] font-medium")}
    </div>
  );
};

const autoColorizeQuotes = (text: string, useColorEnabled: boolean) => {
  if (!text || !useColorEnabled) return text;
  const parts = text.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<')) continue;
    // Replace "..." or “...” or «...»
    parts[i] = parts[i].replace(/(["“«])([^"”»\n]+)(["”»])/g, '$1<span class="dialogue-text">$2</span>$3');
  }
  return parts.join('');
};

export default function Gameplay() {
  const theme = useStore((state) => state.theme);
  const gameData = useStore((state) => state.gameData);
  const setGameData = useStore((state) => state.setGameData);
  const updateStreamData = useStore((state) => state.updateStreamData);
  const setIsGeneratingStream = useStore((state) => state.setIsGeneratingStream);
  const messages = useStore((state) => state.messages);
  const setMessages = useStore((state) => state.setMessages);
  const saveCurrentGame = useStore((state) => state.saveCurrentGame);
  const autoSaveCurrentGame = useStore((state) => state.autoSaveCurrentGame);
  const resumeLatestGame = useStore((state) => state.resumeLatestGame);
  const useColorEnabled = useStore((state) => state.useColorEnabled);
  const setUseColorEnabled = useStore((state) => state.setUseColorEnabled);
  const targetWordCount = useStore((state) => state.targetWordCount);
  const temperature = useStore((state) => state.temperature);
  const playerRules = useStore((state) => state.playerRules);
  const setPlayerRules = useStore((state) => state.setPlayerRules);
  const systemLogs = useStore((state) => state.systemLogs);
  const setSystemLogs = useStore((state) => state.setSystemLogs);
  const memoryFullTurnsCount = useStore((state) => state.memoryFullTurnsCount);
  const memoryLogsCount = useStore((state) => state.memoryLogsCount);
  const setMemoryFullTurnsCount = useStore((state) => state.setMemoryFullTurnsCount);
  const setMemoryLogsCount = useStore((state) => state.setMemoryLogsCount);
  const navigate = useNavigate();
  const isMobile = useDeviceMode();
  const [leftOpen, setLeftOpen] = useState(!isMobile);
  const [rightOpen, setRightOpen] = useState(!isMobile);
  const [expandedLog, setExpandedLog] = useState<"reasoning" | "error" | null>(
    null,
  );
  const expandedLogScrollRef = useRef<HTMLDivElement>(null);

  const scrollExpandedLogToTop = () => {
    if (expandedLogScrollRef.current) {
      expandedLogScrollRef.current.scrollTop = 0;
    }
  };

  const scrollExpandedLogToBottom = () => {
    if (expandedLogScrollRef.current) {
      expandedLogScrollRef.current.scrollTop = expandedLogScrollRef.current.scrollHeight;
    }
  };

  // Update panel states when device mode changes
  useEffect(() => {
    setLeftOpen(!isMobile);
    setRightOpen(!isMobile);
  }, [isMobile]);
  const actionInputRef = useRef<ActionInputRef>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDramatic, setIsDramatic] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeDuration, setSummarizeDuration] = useState(0);
  
  const [isSuggestionsLocked, setIsSuggestionsLocked] = useState(false);
  const [collapsedSuggestions, setCollapsedSuggestions] = useState<Record<string, boolean>>({});

  const getHeaderBtnClass = (
    colorType:
      | "green"
      | "amber"
      | "blue"
      | "emerald"
      | "indigo"
      | "teal"
      | "pink"
      | "purple"
      | "gray"
      | "orange"
      | "cyan"
      | "rose",
  ) => {
    const isDark = theme.group === "Dark";
    switch (colorType) {
      case "green":
        return isDark
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-green-600 hover:bg-green-700 text-white shadow-sm";
      case "amber":
        return isDark
          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
          : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm";
      case "blue":
        return isDark
          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
      case "emerald":
        return isDark
          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm";
      case "indigo":
        return isDark
          ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm";
      case "teal":
        return isDark
          ? "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"
          : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm";
      case "pink":
        return isDark
          ? "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
          : "bg-pink-600 hover:bg-pink-700 text-white shadow-sm";
      case "purple":
        return isDark
          ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
          : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm";
      case "orange":
        return isDark
          ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          : "bg-orange-600 hover:bg-orange-700 text-white shadow-sm";
      case "cyan":
        return isDark
          ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm";
      case "rose":
        return isDark
          ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
          : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm";
      default:
        return isDark
          ? "bg-white/10 text-white/80 hover:bg-white/20"
          : "bg-slate-600 hover:bg-slate-700 text-white shadow-sm";
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSummarizing) {
      setSummarizeDuration(0);
      interval = setInterval(() => {
        setSummarizeDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setSummarizeDuration(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSummarizing]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init RAG
  useEffect(() => {
    let isMounted = true;
    toast.promise(ragService.init(), {
      loading: "Đang tải bộ nhớ RAG (chạy AI Local)...",
      success: "Khởi tạo bộ nhớ RAG cục bộ thành công!",
      error: "Lỗi tải mô hình RAG.",
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // States for new modals
  const [showCodex, setShowCodex] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [memoryActiveTab, setMemoryActiveTab] = useState<
    "settings" | "logs" | "state"
  >("settings");
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMC, setShowMC] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showNPCBuilder, setShowNPCBuilder] = useState(false);
  const [selectedNPCIndex, setSelectedNPCIndex] = useState<number | null>(null);

  // Stats & Timers
  const [currentStats, setCurrentStats] = useState({
    processingTime: 0,
    wordCount: 0,
    tokensIn: 0,
    tokensOut: 0,
    tokensTotal: 0,
  });

  const lastAiMsg = React.useMemo(() => {
    const aiMsgs = messages.filter((m: any) => m.sender === "ai");
    return aiMsgs[aiMsgs.length - 1];
  }, [messages]);

  useEffect(() => {
    if (!isGenerating && lastAiMsg?.stats) {
      setCurrentStats(lastAiMsg.stats);
    }
  }, [isGenerating, lastAiMsg]);

  // Turns
  const turns = React.useMemo(() => {
    const list: any[] = [];
    let currentTurn: any = {};
    let turnIndex = 0;

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.sender === "user") {
        currentTurn.userMsg = m;
      } else if (m.sender === "ai" || m.sender === "system") {
        currentTurn.aiMsg = m;
        currentTurn.index = turnIndex++;
        currentTurn.id = m.id;
        list.push({ ...currentTurn });
        currentTurn = {};
      }
    }
    // Handle waiting state
    if (currentTurn.userMsg && !currentTurn.aiMsg) {
      currentTurn.index = turnIndex;
      currentTurn.id = currentTurn.userMsg.id;
      list.push({ ...currentTurn });
    }
    return list;
  }, [messages]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const totalPages = Math.max(1, turns.length - 1);

  useEffect(() => {
    setCurrentPage(Math.max(1, turns.length - 1));
  }, [turns.length]);

  const getPageTurns = (page: number) => {
    if (page === 1) {
      return turns.slice(0, 2);
    }
    const idx = page;
    if (idx >= 0 && idx < turns.length) {
      return [turns[idx]];
    }
    return [];
  };

  // Modals
  const hasInitialized = useRef(false);

  const pendingReparseStreamData = useStore(state => state.pendingReparseStreamData);
  const setPendingReparseStreamData = useStore(state => state.setPendingReparseStreamData);

  useEffect(() => {
    if (pendingReparseStreamData) {
      const handleReparse = async () => {
        try {
          setIsGenerating(true);
          const fullText = pendingReparseStreamData;
          setPendingReparseStreamData(null); // Clear immediately to prevent loop

          const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai' || m.sender === 'system');
          if (!lastAiMsg) {
             toast.error("Không tìm thấy lượt AI cuối cùng để reparse.");
             setIsGenerating(false);
             return;
          }

          const aiMsgId = lastAiMsg.id;

          // Thực hiện parsing lại
          const { parsedData } = robustParseGameplayJSON(fullText);

          if (parsedData) {
            // Cập nhật state giống như khi stream xong
            const sanitizeStatusData = (statusObj: any) => {
              if (!statusObj) return undefined;
              const cleanObj: any = {};
              ['mood', 'psychological', 'physiological', 'health', 'condition'].forEach((key: string) => {
                if (Array.isArray(statusObj[key])) {
                  cleanObj[key] = statusObj[key].filter((item: any) => item && typeof item === 'object' && item.name && item.name.trim().length > 0);
                }
              });
              return cleanObj;
            };

            let currentState = useStore.getState();
            if (currentState.gameData) {
              let newData = JSON.parse(JSON.stringify(currentState.gameData));
              let hasUpdate = false;

              if (newData.mcData.statusData) newData.mcData.statusData = sanitizeStatusData(newData.mcData.statusData);
              if (Array.isArray(newData.npcs)) {
                 newData.npcs.forEach((npc: any) => {
                    if (npc.statusData) npc.statusData = sanitizeStatusData(npc.statusData);
                 });
              }

              // Apply MC & NPC Updates
              if (parsedData.mcUpdates && typeof parsedData.mcUpdates === "object") {
                const cMc = { ...parsedData.mcUpdates };
                ['ghi_chu', 'VÍ DỤ TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP', 'TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP UPDATE', 'IN_THIS_JSON_OUTPUT'].forEach(k => delete cMc[k]);
                const inventoryAliases = ['Túi', 'túi', 'Túi đồ', 'Túi Đồ', 'tui_do', 'túi đồ', 'items', 'Inventory', 'tuis', 'Tài sản', 'tài sản'];
                for (const alias of inventoryAliases) {
                  if (cMc[alias] !== undefined) {
                    if (!cMc.inventory) cMc.inventory = cMc[alias];
                    delete cMc[alias];
                  }
                }
                newData.mcData = { ...newData.mcData, ...cMc, id: newData.mcData.id, name: newData.mcData.name };
                if (cMc.statusData) newData.mcData.statusData = sanitizeStatusData(cMc.statusData);
                hasUpdate = true;
              }

              if (parsedData.npcUpdates && typeof parsedData.npcUpdates === "object") {
                Object.entries(parsedData.npcUpdates).forEach(([npcId, updates]: [string, any]) => {
                  const idx = newData.npcs.findIndex((n: any) => n.id === npcId || n.name === npcId);
                  if (idx !== -1) {
                    const cNpc = { ...updates };
                    ['ghi_chu', 'VÍ DỤ TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP', 'TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP UPDATE', 'IN_THIS_JSON_OUTPUT'].forEach(k => delete cNpc[k]);
                    const inventoryAliases = ['Túi', 'túi', 'Túi đồ', 'Túi Đồ', 'tui_do', 'túi đồ', 'items', 'Inventory', 'tuis', 'Tài sản', 'tài sản'];
                    for (const alias of inventoryAliases) {
                      if (cNpc[alias] !== undefined) {
                        if (!cNpc.inventory) cNpc.inventory = cNpc[alias];
                        delete cNpc[alias];
                      }
                    }
                    newData.npcs[idx] = { ...newData.npcs[idx], ...cNpc, id: newData.npcs[idx].id, name: newData.npcs[idx].name };
                    if (cNpc.statusData) newData.npcs[idx].statusData = sanitizeStatusData(cNpc.statusData);
                    hasUpdate = true;
                  }
                });
              }

              if (hasUpdate) currentState.setGameData(newData);
            }

            const assembledText = Array.isArray(parsedData.storyParts) ? parsedData.storyParts.join("\n\n") : (parsedData.storyParts || "");

            setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? {
                ...msg,
                isStreaming: false,
                fullStreamLog: fullText,
                outline: parsedData.outline,
                mainText: assembledText,
                suggestedActions: (Array.isArray(parsedData.suggestedActions) ? parsedData.suggestedActions : 
                                  (Array.isArray(parsedData.options) ? parsedData.options : 
                                  (Array.isArray(parsedData.choices) ? parsedData.choices : 
                                  (typeof parsedData.suggestedActions === 'object' && parsedData.suggestedActions !== null ? Object.values(parsedData.suggestedActions) : [])))) as any[],
                worldTime: parsedData.worldTime,
                weather: parsedData.weather,
                mcLocation: parsedData.mcLocation,
                npcLocations: parsedData.npcLocations,
              } : msg
            ));
            
            useStore.getState().updateStreamData(fullText);

            // Ghi nhớ vector sau khi reparse
            try {
              const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user' && Number(m.id.replace('_u', '')) < Number(aiMsgId));
              const userAction = lastUserMsg ? lastUserMsg.content : "Bắt đầu";
              const weatherStr = parsedData.weather ? ` (${parsedData.weather})` : "";
              const logMsg = `Lượt ${turns.length}:\nBối cảnh: ${parsedData.mcLocation || "Không xác định"} lúc ${parsedData.worldTime || ""}${weatherStr}\nHành động MC: ${userAction}\nKhái quát: ${parsedData.outline || ""}\nChi tiết: ${assembledText.substring(0, 1000)}`;
              await ragService.addMemory(gameData.id, logMsg, false);
            } catch (e) {
              console.error("Lỗi khi thêm bộ nhớ RAG (Reparse):", e);
            }

            // Tự động lưu game
            try {
              useStore.getState().autoSaveCurrentGame();
            } catch (e) {
              console.error("Lỗi tự động lưu game (Reparse):", e);
            }

            toast.success("Đã nạp lại dữ liệu thành công!");
          } else {
             toast.error("Lỗi JSON: Không thể phân tích dữ liệu đã sửa.");
          }
        } catch (error) {
          console.error("Lỗi khi reparse:", error);
          toast.error("Có lỗi xảy ra khi nạp lại dữ liệu!");
        } finally {
          setIsGenerating(false);
        }
      };
      
      handleReparse();
    }
  }, [pendingReparseStreamData]);

  useEffect(() => {
    if (!gameData) {
      toast.error("Không tìm thấy dữ liệu trò chơi, vui lòng tạo mới!");
      navigate("/world-creation");
      return;
    }

    // Nếu chưa có tin nhắn nào, tự động sinh lượt đầu tiên
    // Chỉ chạy đúng 1 lần nhờ hasInitialized
    if (messages.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      generateTurn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "instant") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const scrollToTop = (behavior: ScrollBehavior = "instant") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior });
    }
  };

  const scrollToTurn = (id: string, behavior: ScrollBehavior = "instant") => {
    setTimeout(() => {
      const el = document.getElementById(`turn-${id}`);
      if (el && scrollRef.current) {
        const elOffset = el.offsetTop;
        scrollRef.current.scrollTo({
          top: Math.max(0, elOffset - 20),
          behavior,
        });
      }
    }, 100);
  };

  const generateTurn = async (userAction: string | null) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsGeneratingStream(true);
    setRightOpen(true); // Tự động mở khung stream

    const isFirstTurn = userAction === null;
    const aiMsgId = Date.now().toString();

    // Reset stream
    updateStreamData(() =>
      isFirstTurn
        ? ">>> KHỞI TẠO MA TRẬN LUÂN HỒI BẮT ĐẦU...\n"
        : ">>> ĐANG XỬ LÝ HÀNH ĐỘNG CỦA NGƯỜI CHƠI...\n",
    );

    const mcLocationStr = turns.length > 0 ? (turns[turns.length - 1].aiMsg?.mcLocation || "") : "";
    const actionStr = userAction || gameData.startingContext || "";

    const excludedKeys = ["worldState"];
    let contextStr = "";
    if (isFirstTurn) {
      contextStr = `===[ HƯỚNG DẪN QUAN TRỌNG VỀ NGÔI KỂ & VĂN PHONG ]===
- Ngôi kể (Narrative Perspective): ${gameData.worldData?.narrativePerspective || "Không có"}
- Văn phong (Writing Style): ${gameData.worldData?.writingStyle || "Không có"}
===[ YÊU CẦU: ÁP DỤNG NGHIÊM NGẶT NGÔI KỂ VÀ VĂN PHONG NÀY CHO TOÀN BỘ CÂU CHUYỆN ]===

Ý TƯỞNG SƠ KHAI:
${gameData.initialIdea || "Không có"}

Ý TƯỞNG ĐÃ PHÁT TRIỂN:
${gameData.developedIdea || "Không có"}

THÔNG TIN THẾ GIỚI (Lấy từ bảng Tạo Mới Thế Giới):
${formatCodexData(gameData.worldData, excludedKeys)}

QUY TẮC & SÁNG TẠO DO NGƯỜI CHƠI BỔ SUNG:
${gameData.creativeRules || "Không có"}

THÔNG TIN ĐỊA DANH & VẬT PHẨM (Lấy từ bảng Tạo Mới Địa Danh/Vật Phẩm):
${formatCodexData(gameData.worldDetails)}

THÔNG TIN NHÂN VẬT CHÍNH - MC (BẢN HIỆN HÀNH / SỐ 2 - ĐƯỢC PHÉP CẬP NHẬT & DÙNG LÀM CHUẨN: BẠN CẦN LƯU VÀ CẬP NHẬT MỌI SỰ THAY ĐỔI VÀO ĐÂY):
${formatCodexData(gameData.mcData)}

THÔNG TIN NHÂN VẬT CHÍNH - MC (BẢN GỐC / SỐ 1 - CHỈ ĐỌC. TUYỆT ĐỐI NGHIÊM CẤM VIỆC CẬP NHẬT/THAY ĐỔI DỮ LIỆU NÀY DƯỚI MỌI HÌNH THỨC):
${formatCodexData(gameData.originalMcData || gameData.mcData)}

DANH SÁCH NPCs (BẢN HIỆN HÀNH / SỐ 2 - ĐƯỢC PHÉP CẬP NHẬT):
${formatNPCsCodex(gameData.npcs, mcLocationStr, actionStr)}

DANH SÁCH NPCs (BẢN GỐC / SỐ 1 - CHỈ ĐỌC. TUYỆT ĐỐI NGHIÊM CẤM SỬA ĐỔI):
${formatNPCsCodex(gameData.originalNpcs || gameData.npcs, mcLocationStr, actionStr)}

NHIỆM VỤ CỦA BẠN: HÃY TẠO RA LƯỢT CHƠI ĐẦU TIÊN (MỞ MÀN) - LƯỢT 0000. 
ĐẶC BIỆT QUAN TRỌNG VỀ "KỊCH BẢN MỞ ĐẦU" (starterScenario): Bạn BẮT BUỘC phải mang trọn vẹn toàn bộ nội dung của mục "KỊCH BẢN MỞ ĐẦU" (nếu có trong Thông tin thế giới) vào chính văn Lượt 0000. Bạn phải diễn giải, phân chia và triển khai nội dung đó sao cho hợp lý, sinh động, logic và đạt đủ số chữ (Target Word Count) được yêu cầu. NGHIÊM CẤM TUYỆT ĐỐI việc cắt xén, làm mất, tóm tắt sơ sài hay rút gọn nội dung mà người chơi đã duyệt trong mục KỊCH BẢN MỞ ĐẦU.
Cực kỳ quan trọng: Bắt buộc xác lập và tạo lập chuẩn xác, hợp logic các trường báo cáo về VỊ TRÍ CỦA MC, VỊ TRÍ CỦA NPC để thiết lập mốc sinh tồn vững chắc cho cốt truyện. ĐỐI VỚI "THỜI GIAN THẾ GIỚI" (worldTime): BẮT BUỘC PHẢI lấy nguyên văn nội dung từ "MỐC THỜI GIAN MỞ ĐẦU" (starterTimeline: ${gameData.worldData?.starterTimeline || "Không có"}) (Bao gồm đầy đủ giờ, phút, ngày, tháng, năm) để điền vào trường worldTime trong JSON, có thể thêm diễn tiến chi tiết nếu cần.
Suy luận sâu (Deep Reasoning) về yếu tố Thời Gian và Vị Trí Không Gian để kịch bản khởi đầu thật lôi cuốn, logic với bối cảnh, và phản ánh đúng TÍNH CÁCH cốt lõi của MC. Đưa MC vào một tình huống cụ thể ngay lúc này.
LƯU Ý NGHIÊM KHẮC CHO LƯỢT 0000: Có thể do khởi đầu có quá nhiều Data JSON nên AI thường có xu hướng bỏ qua hoặc viết rất ngắn phần THINKING_PROCESS, AI cũng hay bỏ quên việc khai báo THỜI GIAN VÀ VỊ TRÍ. BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC MẮC SAI LẦM NÀY NỮA! BẮT BUỘC PHẢI KHAI TRIỂN CHUỖI SUY NGHĨ (THINKING_PROCESS) VÔ CÙNG CHI TIẾT VÀ TÍNH TOÁN KỸ VỀ THỜI GIAN VÀ KHÔNG GIAN TƯƠNG TỰ NHƯ CÁC LƯỢT SAU!`;
    } else {
      const recentTurns = turns.slice(-memoryFullTurnsCount);
      const historyText = recentTurns
        .map(
          (t: any) => `[LƯỢT ${t.index}]
THỜI GIAN THẾ GIỚI MỚI NHẤT MÀ HỆ THỐNG GHI NHẬN ĐƯỢC: ${t.aiMsg?.worldTime || "Vô định"}
THỜI TIẾT GHI NHẬN ĐƯỢC: ${t.aiMsg?.weather || "Vô định"}
VỊ TRÍ CỦA MC MÀ HỆ THỐNG GHI NHẬN ĐƯỢC: ${t.aiMsg?.mcLocation || "Vô định"}
VỊ TRÍ CỦA NPC MÀ HỆ THỐNG GHI NHẬN ĐƯỢC: ${JSON.stringify(t.aiMsg?.npcLocations || [])}

DÀN Ý / TÓM TẮT:
${t.aiMsg?.outline || ""}

DIỄN BIẾN CHÍNH VĂN (FULL TEXT):
${t.aiMsg?.mainText || t.aiMsg?.content || ""}

HÀNH ĐỘNG CỦA MC (NGƯỜI CHƠI) XUẤT PHÁT TỪ NHỮNG DỮ LIỆU ĐÓ:
${t.userMsg?.content || ""}

---KẾT THÚC LƯỢT ${t.index}---
`,
        )
        .join("\n\n");

      const memTurnsLength = turns.length - memoryFullTurnsCount;
      const memStartIndex = Math.max(0, memTurnsLength - memoryLogsCount);
      const memoryTurns =
        memTurnsLength > 0 ? turns.slice(memStartIndex, memTurnsLength) : [];

      let memoryText = "";
      if (turns.length >= 10) {
        try {
          const q = userAction ? String(userAction) : "khởi đầu";
          console.log("Tìm kiếm ký ức RAG với:", q);
          // Lấy số lượng kết quả liên quan từ RAG theo tỉ lệ của memoryLogsCount (khoảng 10%) để tránh tràn token nhưng vẫn tối ưu, tối thiểu 2 và tối đa 10
          const searchLimit = Math.max(
            2,
            Math.min(10, Math.round(memoryLogsCount / 10)),
          );
          const searchRes = await ragService.searchMemory(
            gameData.id,
            q,
            searchLimit,
            0.1,
          );
  
          let memorySections = [];
          if (searchRes.core && searchRes.core.length > 0) {
            memorySections.push(
              "[CORE MEMORY - KÝ ỨC CỐT LÕI (BẮT BUỘC NHỚ)]\n" +
                searchRes.core
                  .map((m: any, idx: number) => `* ${m.text}`)
                  .join("\n"),
            );
          }
          if (searchRes.standard && searchRes.standard.length > 0) {
            memorySections.push(
              "[RECENT MEMORY - KÝ ỨC NGẮN HẠN LIÊN QUAN]\n" +
                searchRes.standard
                  .map((m: any, idx: number) => `(${idx + 1}): ${m.text}`)
                  .join("\n\n"),
            );
          }
  
          if (memorySections.length > 0) {
            memoryText = memorySections.join("\n\n") + "\n\n";
          }
        } catch (err) {
          console.error("Lỗi khi lấy ký ức từ RAG:", err);
        }
      }

      // Dự phòng nếu RAG chưa lấy được hoặc lỗi, có thể dùng kiểu cũ
      if (!memoryText && memoryTurns.length > 0) {
        // memoryText = "[MEMORY - KÝ ỨC CỦA TỐI ĐA 200 LƯỢT CHƠI TRƯỚC ĐÓ DẠNG TÓM TẮT]\n" +
        //  memoryTurns.map((t: any) => `Lượt ${t.index}: ${t.aiMsg?.outline || 'Không có tóm tắt. Hành động của MC: ' + (t.userMsg?.content || 'Chưa rõ')}`).join("\n") + "\n\n";
      }

      contextStr = `===[ HƯỚNG DẪN QUAN TRỌNG VỀ NGÔI KỂ & VĂN PHONG ]===
- Ngôi kể: ${gameData.worldData?.narrativePerspective || "Không có"}
- Văn phong: ${gameData.worldData?.writingStyle || "Không có"}

===[ ĐỊNH HƯỚNG THỂ LOẠI & NHỊP ĐỘ (PHẢI TUÂN THỦ TỪNG LƯỢT) ]===
- Thể loại (Genre): ${gameData.worldData?.genre || "Không có"}
- Âm hưởng chủ đạo (Main Mood): ${gameData.worldData?.mainMood || "Không có"}
- Nhịp độ (Pacing): ${gameData.worldData?.pacing || "Không có"}

===[ QUY TẮC THẾ GIỚI & LOGIC BAN ĐẦU ]===
- Hệ thống sức mạnh/phân bậc: ${gameData.worldData?.powerSystem || "Không có"}
- Kiểm soát logic & Loại trừ: ${gameData.worldData?.logicControl || "Không có"}

[THÔNG TIN TỪ CODEX - CẬP NHẬT GẦN NHẤT]
CỐT TRUYỆN CHÍNH: ${gameData.developedIdea || gameData.initialIdea || ""}

[THÔNG TIN THẾ GIỚI (TỪ CODEX)]
TRẠNG THÁI CUỐN CHIẾU HIỆN TẠI (WORLD STATE): ${gameData.worldData?.worldState || "Chưa có cập nhật trạng thái cuốn chiếu nào."}
${formatCodexData(gameData.worldData, excludedKeys)}

[QUY TẮC & SÁNG TẠO DO NGƯỜI CHƠI BỔ SUNG]
${gameData.creativeRules || "Không có"}

[ĐỊA DANH & VẬT PHẨM (TỪ CODEX)]
${formatCodexData(gameData.worldDetails)}

[THÔNG TIN NHÂN VẬT CHÍNH - MC (BẢN HIỆN HÀNH / SỐ 2 - ĐƯỢC PHÉP CẬP NHẬT & DÙNG LÀM CHUẨN: BẠN CẦN LƯU VÀ CẬP NHẬT MỌI SỰ THAY ĐỔI VÀO ĐÂY)]
${formatCodexData(gameData.mcData)}

[THÔNG TIN NHÂN VẬT CHÍNH - MC (BẢN GỐC / SỐ 1 - CHỈ ĐỌC. TUYỆT ĐỐI NGHIÊM CẤM VIỆC CẬP NHẬT/THAY ĐỔI DỮ LIỆU NÀY DƯỚI MỌI HÌNH THỨC)]
${formatCodexData(gameData.originalMcData || gameData.mcData)}

[DANH SÁCH NPCs VÀ BẢNG THÔNG TIN RIÊNG CHI TIẾT (BẢN HIỆN HÀNH / SỐ 2 - ĐƯỢC PHÉP CẬP NHẬT)]
${formatNPCsCodex(gameData.npcs, mcLocationStr, actionStr)}

[DANH SÁCH NPCs (BẢN GỐC / SỐ 1 - CHỈ ĐỌC. TUYỆT ĐỐI NGHIÊM CẤM SỬA ĐỔI)]
${formatNPCsCodex(gameData.originalNpcs || gameData.npcs, mcLocationStr, actionStr)}

${memoryText}[QUAN TRỌNG] TOÀN BỘ DIỄN BIẾN CHI TIẾT CỦA ${memoryFullTurnsCount} LƯỢT CHƠI GẦN ĐÂY NHẤT ĐỂ AI LIÊN KẾT LIỀN MẠCH KHÔNG GIAN/THỜI GIAN:
${historyText}

BẠN ĐANG XỬ LÝ LƯỢT CHƠI THỨ: ${turns.length}

Hành động tiếp theo của người chơi: ${userAction}`;
    }

    const systemInstruction = getGameplaySystemInstruction(
      isFirstTurn,
      targetWordCount,
      temperature,
      playerRules,
      useColorEnabled,
      theme.group,
      isDramatic
    );

    const prompt = `Đây là dữ liệu của lượt chơi này:\n\n${contextStr}\n\nHãy tiến hành BƯỚC 1 (THINKING_PROCESS) sau đó kết xuất BƯỚC 2 (JSON Đầu ra) nhé.`;

    // Thêm tin nhắn tạm thời của AI
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        sender: "ai",
        content: "",
        isStreaming: true,
      },
    ]);

    scrollToTurn(aiMsgId, "instant");

    try {
      let fullText = "";
      let fullThought = "";
      let lastUsage: any = null;
      const startTime = performance.now();
      const stream = aiService.generateStreamingContent(
        prompt,
        undefined,
        systemInstruction,
      );

      for await (const chunk of stream) {
        if (chunk.thought) {
          fullThought += chunk.thought;
          updateStreamData((prev) => prev + chunk.thought);
        }
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData((prev) => prev + chunk.text);
        }
        if (chunk.usage) {
          lastUsage = chunk.usage;
        }
      }

      const pTime = performance.now() - startTime;

      // Xử lý bù đắp thought nếu SDK không tách nó ra (AI ném thẻ THINKING_PROCESS thẳng vào chunk.text)
      if (!fullThought && fullText) {
        const tStartMatch = fullText.match(/<thinking_process>/i);
        if (tStartMatch && tStartMatch.index !== undefined) {
          const tStart = tStartMatch.index + tStartMatch[0].length;
          const tEnd = fullText.toLowerCase().indexOf('</thinking_process>');
          if (tEnd !== -1 && tEnd > tStart) {
            fullThought = fullText.substring(tStart, tEnd).trim();
          } else {
             // Chỉ lấy tạm một phần hiển thị cho đến JSON block
             const jStartMatch = fullText.match(/(<json_output>|```json|{)/i);
             if (jStartMatch && jStartMatch.index !== undefined && jStartMatch.index > tStart) {
                fullThought = fullText.substring(tStart, jStartMatch.index).trim();
             } else {
                fullThought = fullText.substring(tStart).trim();
             }
          }
        }
      }

      // Xử lý JSON bằng Parser kiên cường của Matrix Lite
      const { parsedData } = robustParseGameplayJSON(fullText);

      let statsObj: any = null;
      if (parsedData) {
        // Hàm làm sạch statusData chống lại mảng rỗng hoặc chèn {} vô nghĩa
        const sanitizeStatusData = (statusObj: any) => {
          if (!statusObj) return undefined;
          const cleanObj: any = {};
          ['mood', 'psychological', 'physiological', 'health', 'condition'].forEach((key: string) => {
            if (Array.isArray(statusObj[key])) {
              cleanObj[key] = statusObj[key].filter((item: any) => item && typeof item === 'object' && item.name && item.name.trim().length > 0);
            }
          });
          return cleanObj;
        };

        // Handle MC & NPC Updates
        let currentState = useStore.getState();
        if (currentState.gameData) {
          let newData = JSON.parse(JSON.stringify(currentState.gameData)); // deep clone
          let hasUpdate = false;

          // Cleaning up existing empty items in DB to fix legacy bugs
          if (newData.mcData.statusData) {
             newData.mcData.statusData = sanitizeStatusData(newData.mcData.statusData);
          }
          if (Array.isArray(newData.npcs)) {
             newData.npcs.forEach((npc: any) => {
                if (npc.statusData) {
                   npc.statusData = sanitizeStatusData(npc.statusData);
                }
             });
          }

          // MC Updates
          if (
            parsedData.mcUpdates &&
            typeof parsedData.mcUpdates === "object"
          ) {
            const cMc = { ...parsedData.mcUpdates };
            delete cMc.ghi_chu;
            delete cMc["VÍ DỤ TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP"];
            delete cMc["TÊN_CÁC_TRƯỜNG (KEYS) ĐƯỢC PHÉP UPDATE"];
            delete cMc.IN_THIS_JSON_OUTPUT;

            // Normalize inventory aliases
            const inventoryAliases = ['Túi', 'túi', 'Túi đồ', 'Túi Đồ', 'tui_do', 'túi đồ', 'items', 'Inventory', 'tuis', 'Tài sản', 'tài sản'];
            for (const alias of inventoryAliases) {
              if (cMc[alias] !== undefined) {
                if (!cMc.inventory) {
                  cMc.inventory = cMc[alias];
                } else if (typeof cMc.inventory === 'string' && typeof cMc[alias] === 'string') {
                  cMc.inventory += '\n' + cMc[alias];
                }
                delete cMc[alias];
              }
            }

            // Normalize other common aliases
            const goalAliases = ['Mục tiêu', 'mục tiêu', 'nhiệm vụ', 'Nhiệm vụ', 'Quest', 'quest', 'quests', 'Quests'];
            for (const alias of goalAliases) {
              if (cMc[alias] !== undefined) {
                if (!cMc.goal) {
                  cMc.goal = cMc[alias];
                } else if (typeof cMc.goal === 'string' && typeof cMc[alias] === 'string') {
                  cMc.goal += '\n' + cMc[alias];
                }
                delete cMc[alias];
              }
            }

            if (cMc.inventoryChanges) {
              const changes = cMc.inventoryChanges;
              let currentInventory = Array.isArray(newData.mcData.inventory) 
                ? [...newData.mcData.inventory] 
                : (typeof newData.mcData.inventory === 'string' && newData.mcData.inventory.trim().length > 0 ? [{ id: 'item_1', name: "Đồ vật lúc đầu", quantity: 1, description: newData.mcData.inventory }] : []);

              if (Array.isArray(changes)) {
                // AI xuất nhầm inventoryChanges thành một mảng các item thì ta coi như mảng 'add'
                changes.forEach((item: any) => {
                  if (item.name) {
                    const idx = currentInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
                    if (idx >= 0) {
                      currentInventory[idx].quantity += (item.quantity || 1);
                      if (item.description) currentInventory[idx].description = item.description;
                    } else {
                      currentInventory.push({
                        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                        name: item.name,
                        quantity: item.quantity || 1,
                        description: item.description || ''
                      });
                    }
                  }
                });
              } else {
                if (changes.add && Array.isArray(changes.add)) {
                  changes.add.forEach((item: any) => {
                    if (item.name) {
                      const idx = currentInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
                      if (idx >= 0) {
                        currentInventory[idx].quantity += (item.quantity || 1);
                        if (item.description) currentInventory[idx].description = item.description;
                      } else {
                        currentInventory.push({
                          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                          name: item.name,
                          quantity: item.quantity || 1,
                          description: item.description || ''
                        });
                      }
                    }
                  });
                }

                if (changes.update && Array.isArray(changes.update)) {
                  changes.update.forEach((item: any) => {
                    if (item.name) {
                      const idx = currentInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
                      if (idx >= 0) {
                        if (item.quantity !== undefined) currentInventory[idx].quantity = item.quantity;
                        if (item.description) currentInventory[idx].description = item.description;
                      }
                    }
                  });
                }

                if (changes.remove && Array.isArray(changes.remove)) {
                  changes.remove.forEach((nameToRemove: any) => {
                    if (typeof nameToRemove === 'string') {
                      currentInventory = currentInventory.filter(i => i.name.toLowerCase() !== nameToRemove.toLowerCase());
                    } else if (typeof nameToRemove === 'object' && nameToRemove.name) {
                      currentInventory = currentInventory.filter(i => i.name.toLowerCase() !== nameToRemove.name.toLowerCase());
                    }
                  });
                }
              }

              cMc.inventory = currentInventory;
              delete cMc.inventoryChanges;
            }

            const smartMergeArray = (oldArr: any[], newArr: any[]) => {
              if (!Array.isArray(oldArr)) oldArr = [];
              if (!Array.isArray(newArr)) return oldArr;
              
              let merged = [...oldArr];
              newArr.forEach(newItem => {
                if (!newItem.name) return;
                const idx = merged.findIndex(i => i.name === newItem.name);
                if (idx !== -1) {
                  merged[idx] = { ...merged[idx], ...newItem }; // Cập nhật
                } else {
                  merged.push(newItem); // Thêm mới
                }
              });
              return merged;
            };

            const arrayKeys = ['powers', 'skills', 'relationships'];
            arrayKeys.forEach(key => {
              if (cMc[key] && Array.isArray(cMc[key])) {
                cMc[key] = smartMergeArray(newData.mcData[key] || [], cMc[key]);
              }
            });
            
            if (cMc.statusData) {
              cMc.statusData = sanitizeStatusData(cMc.statusData);
            }

            if (Object.keys(cMc).length > 0) {
              newData.mcData = { ...newData.mcData, ...cMc };
              hasUpdate = true;
            }
          }

          // NPC Updates
          if (parsedData.npcUpdates && Array.isArray(parsedData.npcUpdates)) {
            parsedData.npcUpdates.forEach((upd: any) => {
              if (upd.id && upd.updates && typeof upd.updates === "object") {
                const cNpc = { ...upd.updates };
                delete cNpc.ghi_chu_quan_trong;
                delete cNpc.LƯU_Ý_KHI_XUẤT_JSON;
                delete cNpc["TÊN_TRƯỜNG_ĐÃ_TỒN_TẠI"];

                const idx = (newData.npcs || []).findIndex(
                  (n: any) =>
                    n.name === upd.id ||
                    n.fullName === upd.id ||
                    (n.name && upd.id.includes(n.name)) ||
                    (n.fullName && upd.id.includes(n.fullName)),
                );
                if (idx !== -1) {
                  const smartMergeArray = (oldArr: any[], newArr: any[]) => {
                    if (!Array.isArray(oldArr)) return newArr ? JSON.parse(JSON.stringify(newArr)) : [];
                    if (!Array.isArray(newArr)) return JSON.parse(JSON.stringify(oldArr));
                    
                    let merged = JSON.parse(JSON.stringify(oldArr));
                    newArr.forEach(newItem => {
                      if (!newItem.name) return;
                      const idx = merged.findIndex((i: any) => i.name === newItem.name);
                      if (idx !== -1) {
                        merged[idx] = { ...merged[idx], ...newItem }; // Cập nhật
                      } else {
                        merged.push(JSON.parse(JSON.stringify(newItem))); // Thêm mới
                      }
                    });
                    return merged;
                  };

                  const arrayKeys = ['powers', 'skills', 'relationships'];
                  arrayKeys.forEach(key => {
                    if (cNpc[key] && Array.isArray(cNpc[key])) {
                      cNpc[key] = smartMergeArray(newData.npcs[idx][key] || [], cNpc[key]);
                    }
                  });

                  // Cũng cần làm sạch statusData
                  if (cNpc.statusData) {
                    // statusData do AI quản lý nên cập nhật thẳng vào NPC, KHÔNG cần đưa vào pendingUpdates
                    newData.npcs[idx].statusData = sanitizeStatusData(cNpc.statusData);
                    delete cNpc.statusData; // Xóa khỏi cNpc để không vào pendingUpdates
                    hasUpdate = true;
                  }

                  if (Object.keys(cNpc).length > 0) {
                    if (!newData.npcs[idx].pendingUpdates) {
                      newData.npcs[idx].pendingUpdates = {};
                    }
                    newData.npcs[idx].pendingUpdates = {
                      ...newData.npcs[idx].pendingUpdates,
                      ...cNpc
                    };
                    hasUpdate = true;
                  }
                }
              }
            });
          }

          // New NPCs Registration
          if (parsedData.newNPCs && Array.isArray(parsedData.newNPCs)) {
            if (!newData.npcs) newData.npcs = [];
            parsedData.newNPCs.forEach((npc: any) => {
              if (npc.name || npc.fullName) {
                const targetName = npc.name || npc.fullName;
                const targetFullName = npc.fullName || npc.name;
                const exist = newData.npcs.some(
                  (n: any) =>
                    n.name === targetName || n.fullName === targetFullName,
                );
                if (!exist) {
                  const defaultNpc = {
                    name: "",
                    fullName: "",
                    titles: "",
                    occupation: "",
                    gender: "",
                    age: "",
                    dob: "",
                    height: "",
                    weight: "",
                    measurements: "",
                    appearance: "",
                    appearanceLite: "",
                    background: "",
                    rank: "",
                    powers: [],
                    skills: [],
                    role: "",
                    relation: "",
                    personality: "",
                    personalityCore: "",
                    philosophy: "",
                    distinguishingFeatures: "",
                    innerSecret: "",
                    relationships: [],
                    loveViews: "",
                    experience: "",
                    nsfwPersonality: "",
                    nsfwReactions: "",
                    literaryDescription: "",
                    goal: "",
                  };
                  const finalNpc = { ...defaultNpc, ...npc };
                  if (finalNpc.statusData) {
                    finalNpc.statusData = sanitizeStatusData(finalNpc.statusData);
                  }
                  newData.npcs.push(finalNpc);
                  hasUpdate = true;
                  toast.success(`Nhân vật mới xuất hiện:\n${targetName}`);
                }
              }
            });
          }

          // World State Updates
          if (
            parsedData.worldStateUpdate &&
            typeof parsedData.worldStateUpdate === "string"
          ) {
            if (!newData.worldData) newData.worldData = {};
            newData.worldData.worldState = parsedData.worldStateUpdate;
            hasUpdate = true;
          }

          if (hasUpdate) {
            useStore.getState().setGameData(newData);
          }
        }

        // Fallback for older saves or if the model ignored the split request
        let assembledText = parsedData.mainText || "";
        if (!assembledText) {
          const parts = Object.keys(parsedData)
            .filter((k) => /^part\d+/i.test(k) && !k.toLowerCase().includes("audit"))
            .sort((a, b) => {
              const numA = parseInt(a.replace(/\D/g, "")) || 0;
              const numB = parseInt(b.replace(/\D/g, "")) || 0;
              return numA - numB;
            })
            .map((k) => (parsedData as any)[k]);

          if (parts.length > 0) {
            assembledText = parts
              .filter(Boolean)
              .map((t: any) =>
                typeof t === "string" ? t.replace(/\\n/g, "\n") : t,
              )
              .join("\n\n");
          }
        }

        // Dọn dẹp các điểm neo cũ trong văn bản nếu có, không hiển thị lên UI game
        assembledText = assembledText.replace(
          /<div(?:[^>]*?)>[\s\S]*?\[ĐIỂM NEO K[I|Ì]ỂM TOÁN LƯỢNG TỪ\][\s\S]*?<\/div>/gi,
          "",
        );
        // Or strip any div with display: none just in case
        assembledText = assembledText.replace(
          /<div[^>]*style=["']display:\s*none;?["'][^>]*>[\s\S]*?<\/div>/gi,
          "",
        );
        // And strip markdown anchors not wrapped in div just in case
        assembledText = assembledText.replace(
          /\*\*\s*\[ĐIỂM NEO KIỂM TOÁN LƯỢNG TỪ\][\s\S]*?\*\*/gi,
          "",
        );

        const wordCount = assembledText
          ? (assembledText.match(/[\p{L}\p{N}_]+/gu) || []).length
          : 0;
        const norm = normalizeUsage(lastUsage);
        statsObj = {
          processingTime: pTime,
          wordCount: wordCount,
          tokensIn: norm.promptTokenCount,
          tokensOut: norm.candidatesTokenCount,
          tokensTotal: norm.totalTokenCount,
        };
        setCurrentStats(statsObj);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  isStreaming: false,
                  thought: fullThought,
                  fullStreamLog: useStore.getState().fullScreenStreamData,
                  outline: parsedData.outline,
                  mainText: assembledText,
                  suggestedActions: (Array.isArray(parsedData.suggestedActions) ? parsedData.suggestedActions : 
                                    (Array.isArray(parsedData.options) ? parsedData.options : 
                                    (Array.isArray(parsedData.choices) ? parsedData.choices : 
                                    (typeof parsedData.suggestedActions === 'object' && parsedData.suggestedActions !== null ? Object.values(parsedData.suggestedActions) : [])))) as any[],
                  worldTime: parsedData.worldTime,
                  weather: parsedData.weather,
                  mcLocation: parsedData.mcLocation,
                  npcLocations: parsedData.npcLocations,
                  stats: statsObj,
                }
              : msg,
          ),
        );

        // Thêm vào RAG DB (Ghi nhớ vector)
        try {
          const weatherStr = parsedData.weather ? ` (${parsedData.weather})` : "";
          const logMsg = `Lượt ${turns.length}:\nBối cảnh: ${parsedData.mcLocation || "Không xác định"} lúc ${parsedData.worldTime || ""}${weatherStr}\nHành động MC: ${userAction || "Bắt đầu"}\nKhái quát: ${parsedData.outline || ""}\nChi tiết: ${assembledText.substring(0, 1000)}`;
          await ragService.addMemory(gameData.id, logMsg, false);
        } catch (e) {
          console.error("Lỗi khi thêm bộ nhớ RAG:", e);
        }

        // Tự động lưu game
        try {
          autoSaveCurrentGame();
        } catch (e) {
          console.error("Lỗi tự động lưu game (Chế độ Parse):", e);
        }
      } else {
        const cleanText = cleanRawOutputText(fullText);
        const wordCount = (cleanText.match(/[\p{L}\p{N}_]+/gu) || []).length;
        const norm = normalizeUsage(lastUsage);
        statsObj = {
          processingTime: pTime,
          wordCount: wordCount,
          tokensIn: norm.promptTokenCount,
          tokensOut: norm.candidatesTokenCount,
          tokensTotal: norm.totalTokenCount,
        };
        setCurrentStats(statsObj);

        // Fallback
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  isStreaming: false,
                  thought: fullThought,
                  fullStreamLog: useStore.getState().fullScreenStreamData,
                  content:
                    cleanText ||
                    "Có lỗi xảy ra khi tạo luồng, không thu được kịch bản hoàn chỉnh.",
                  stats: statsObj,
                }
              : msg,
          ),
        );

        // Thêm vào RAG DB (Ghi nhớ vector)
        try {
          const logMsg = `Lượt ${turns.length}:\nHành động MC: ${userAction || "Bắt đầu"}\nChi tiết: ${cleanText.substring(0, 1500)}`;
          await ragService.addMemory(gameData.id, logMsg, false);
        } catch (e) {
          console.error("Lỗi khi thêm bộ nhớ RAG:", e);
        }

        // Tự động lưu game
        try {
          autoSaveCurrentGame();
        } catch (e) {
          console.error("Lỗi tự động lưu game (Chế độ Fallback):", e);
        }
      }
    } catch (error: any) {
      const errorMsg = cleanErrorMessage(error?.message || String(error));
      const newSysLog = generateSysLog(error);
      setSystemLogs(newSysLog);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                isStreaming: false,
                content:
                  "Matrix Lite v4 bị nhiễu loạn băng thông, quá trình tính toán bị ngắt quãng. Vui lòng thử lại.\nLỗi hệ thống: " +
                  errorMsg,
              }
            : msg,
        ),
      );
    } finally {
      setIsGenerating(false);
      setIsGeneratingStream(false);
      scrollToTurn(aiMsgId, "instant");
    }
  };

  const handleSend = (actionText: string) => {
    if (isGenerating) return;

    // Thêm User message
    const userMsgId = Date.now().toString() + "_u";
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", content: actionText },
    ]);

    generateTurn(actionText);
  };

  const handleSendSummarize = async () => {
    if (isGenerating || isSummarizing) return;
    setIsGenerating(true);
    setIsSummarizing(true);

    try {
      const outlineMessages = messages.filter((m) => m.outline);
      const lastSummarizedTurnIndex =
        gameData.worldData?.lastSummarizedTurnIndex || 0;

      const newMessages = outlineMessages.slice(lastSummarizedTurnIndex);
      if (newMessages.length === 0) {
        toast.info("Chưa có lượt chơi mới nào để tóm tắt.");
        setIsGenerating(false);
        setIsSummarizing(false);
        return;
      }

      const newLogsStr = newMessages
        .map(
          (m, idx) =>
            `[LƯỢT ${lastSummarizedTurnIndex + idx + 1}]\n- Tóm tắt: ${m.outline}\n- Diễn biến chi tiết: ${m.mainText}`,
        )
        .join("\n\n");

      const oldWorldState =
        gameData.worldData?.worldState || "Chưa có trạng thái thế giới cũ.";

      const promptText = `TRẠNG THÁI THẾ GIỚI CŨ LƯU TRONG NÃO BỘ AI:\n"""\n${oldWorldState}\n"""\n\nDIỄN BIẾN MỚI CẦN CẬP NHẬT (TỪ LƯỢT ${lastSummarizedTurnIndex + 1} ĐẾN CHUỖI TƯƠNG TÁC HIỆN TẠI):\n"""\n${newLogsStr}\n"""\n\nYÊU CẦU: Hãy đọc kỹ Trạng thái thế giới cũ và kết hợp với các Diễn biến mới để ĐÚC KẾT & CẬP NHẬT lại một TRẠNG THÁI THẾ GIỚI MỚI NHẤT. Hãy cập nhật lại tình trạng chung của cảnh vật, trạng thái sinh lý/tâm lý, đồ đạc của Nhân Vật Chính và các NPC đang tương tác, những thay đổi quan trọng nếu có. Bỏ bớt các nội dung đã cũ không còn phù hợp. Chỉ trả lời MỘT bảng tóm tắt súc tích, hoàn chỉnh và cô đọng. Định dạng JSON output với key là "worldState".`;

      const stream = aiService.summarizeWorldStateStream(promptText);
      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }

      let finalWorldState = "";
      let cleanOutput = fullText.trim();

      // Attempt 1: Raw JSON extraction
      try {
        const startIdx = cleanOutput.indexOf("{");
        const endIdx = cleanOutput.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const jsonStr = cleanOutput.substring(startIdx, endIdx + 1);
          const parsed = safeParseJSON(jsonStr);
          if (parsed.worldState) {
            finalWorldState = parsed.worldState;
          }
        }
      } catch (e) {}

      // Attempt 2: Fallback to robust parser
      if (!finalWorldState) {
        const { parsedData } = robustParseGameplayJSON(fullText);
        if (parsedData && parsedData.worldState) {
          finalWorldState = parsedData.worldState;
        }
      }

      // Attempt 3: If AI just printed markdown or string
      if (!finalWorldState && fullText.length > 10) {
        finalWorldState = fullText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        // If it still looks like an object, try removing opening brackets
        if (finalWorldState.startsWith("{") && finalWorldState.endsWith("}")) {
          finalWorldState = finalWorldState.slice(1, -1).trim();
        }
      }

      if (finalWorldState) {
        let currentState = useStore.getState();
        if (currentState.gameData && currentState.gameData.worldData) {
          let newData = JSON.parse(JSON.stringify(currentState.gameData));
          newData.worldData.worldState = finalWorldState;
          newData.worldData.lastSummarizedTurnIndex = outlineMessages.length; // Update the index
          currentState.setGameData(newData);
          toast.success(
            `Trí nhớ AI (World State) đã cập nhật ${newMessages.length} lượt thành công!`,
          );

          // Thêm worldState vào RAG để AI tương lai có thể recall được
          await ragService.addMemory(
            newData.id,
            "[CẬP NHẬT TRẠNG THÁI CUỐN CHIẾU]: " + finalWorldState,
            true,
          );
        }
      } else {
        toast.error(
          "Không tìm thấy thông tin worldState trong nội dung trả về.",
        );
      }
    } catch (e: any) {
      toast.error(
        "Quá trình tạo tóm tắt gặp lỗi: " +
          cleanErrorMessage(e?.message || String(e)),
      );
    } finally {
      setIsGenerating(false);
      setIsSummarizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy hành động!");
  };

  const handleDownloadSave = async () => {
    const state = useStore.getState();
    if (!state.gameData) return;

    const gameName = "Matrix Lite v4";
    const worldName = state.gameData.worldData?.name || "Untitled World";
    const mcName = state.gameData.mcData?.name || "MC";
    const aiMsgsCount = state.messages.filter(
      (m) => m.sender === "ai" || m.sender === "system",
    ).length;
    const turnCount = Math.max(0, aiMsgsCount - 1);

    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
    const saveName = `${gameName} - ${worldName} - Lượt ${turnCount} - ${mcName} - ${dateStr}`;

    const currentId = state.gameData.id || Date.now().toString();
    const ragMemories = await ragService.getMemories(currentId);

    const saveObj = {
      id: currentId,
      name: saveName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: state.messages,
      gameData: state.gameData,
      ragMemories: ragMemories,
    };

    const blob = new Blob([JSON.stringify(saveObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = saveName + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã tải tệp tiến trình về máy!");
  };

  if (!gameData) return null;

  const currentTurnsArr = getPageTurns(currentPage);

  const latestAiMsg = messages
    .slice()
    .reverse()
    .find((m) => m.sender === "ai" && !m.isStreaming);
  const currentWorldTime = latestAiMsg?.worldTime || "N/A";
  const currentWeather = latestAiMsg?.weather || "";
  const currentLoc = (latestAiMsg?.mcLocation || "N/A").replace(/<[^>]+>/g, "").replace(/[*_~`]/g, "");

  return (
    <div className="w-full h-full flex flex-col bg-transparent relative overflow-hidden">
      {/* Header */}
      <header className="min-h-[64px] py-2 relative shrink-0 border-b border-white/10 flex items-center justify-between px-4 z-40 backdrop-blur-md theme-panel shadow-none border-transparent overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="p-2 rounded-xl theme-panel-hover transition-colors theme-text-base cursor-pointer"
            title="Đóng/Mở danh sách NPCs"
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl theme-panel-hover transition-colors theme-text-base cursor-pointer"
            title="Trang Chủ"
          >
            <Home size={18} />
          </button>

          <div
            className={`hidden md:flex items-center gap-1.5 md:gap-2 px-2 ml-2 border-l ${theme.group === "Dark" ? "border-white/10" : "border-slate-300"}`}
          >
            <button
              onClick={async () => {
                await saveCurrentGame();
                toast.success("Đã lưu tiến trình!");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("green")}`}
            >
              <Save size={14} /> <span>LƯU</span>
            </button>
            <button
              onClick={async () => {
                const success = await resumeLatestGame();
                if (success) {
                  toast.success("Đã tải nhanh tệp lưu mới nhất!");
                } else {
                  toast.error("Không tìm thấy tệp lưu nào để tải!");
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("orange")}`}
              title="Tải tiến trình mới nhất"
            >
              <RotateCcw size={14} /> <span>LOAD</span>
            </button>
            <button
              onClick={handleDownloadSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("blue")}`}
            >
              <Download size={14} /> <span>SAVE</span>
            </button>
            <button
              onClick={() => setShowMC(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("emerald")}`}
            >
              <User size={14} /> <span>MC</span>
            </button>
            <button
              onClick={() => setShowRules(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("indigo")}`}
            >
              <ListTodo size={14} /> <span>RULES</span>
            </button>
            <button
              onClick={() => setShowStatus(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("teal")}`}
            >
              <Activity size={14} /> <span>STATUS</span>
            </button>
            <button
              onClick={() => setShowGallery(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("pink")}`}
            >
              <ImageIcon size={14} /> <span>ẢNH</span>
            </button>
            <button
              onClick={() => setShowCodex(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("cyan")}`}
            >
              <Book size={14} /> <span>CODEX</span>
            </button>
            <button
              onClick={() => setShowMemory(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("purple")}`}
            >
              <BrainCircuit size={14} /> <span>MEMORY</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider ${getHeaderBtnClass("gray")}`}
            >
              <SettingsIcon size={14} /> <span>CẤU HÌNH</span>
            </button>
            <button
              onClick={() => setUseColorEnabled(!useColorEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider border text-white ${useColorEnabled ? 'bg-green-600 border-white hover:bg-green-500' : 'bg-black border-white hover:bg-zinc-900'}`}
              title={useColorEnabled ? "Luật Tô Màu: Bật" : "Luật Tô Màu: Tắt"}
            >
              <Palette size={14} /> <span>{useColorEnabled ? "MÀU: BẬT" : "MÀU: TẮT"}</span>
            </button>
            <button
              onClick={() => setIsDramatic(!isDramatic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold tracking-wider border text-white ${isDramatic ? 'bg-red-600 border-white hover:bg-red-500' : 'bg-black border-white hover:bg-zinc-900'}`}
              title="Kích hoạt tình huống kịch tính, bất ngờ"
            >
              <Flame size={14} className={isDramatic ? "animate-pulse" : ""} /> <span>KỊCH TÍNH: {isDramatic ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto py-1">
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="p-2 rounded-xl theme-panel-hover transition-colors theme-text-base cursor-pointer relative"
            title="Đóng/Mở Streaming"
          >
            <PanelRight
              size={18}
              className={isGenerating ? "text-purple-400" : ""}
            />
            {isGenerating && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay for Sidebars */}
        <AnimatePresence>
          {(leftOpen || rightOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setLeftOpen(false);
                setRightOpen(false);
              }}
              className="md:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-20"
            />
          )}
        </AnimatePresence>

        {/* Left Sidebar - NPCs */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute md:relative left-0 top-0 bottom-0 w-72 md:w-80 border-r z-30 flex flex-col ${theme.group === "Dark" ? "theme-panel !border-y-0 !border-l-0 text-white backdrop-blur-2xl" : "border-black/10 bg-[#F4EFE6]/95 backdrop-blur-md shadow-lg text-[#0f172a]"}`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between shrink-0 ${theme.group === "Dark" ? "border-white/10" : "border-black/10"}`}
              >
                <h3
                  className={
                    "text-sm font-bold uppercase tracking-widest opacity-50 " +
                    theme.textPrimary
                  }
                >
                  NPCs ({gameData.npcs?.length || 0})
                </h3>
                <button
                  onClick={() => setShowNPCBuilder(true)}
                  className="px-2 py-1 flex items-center gap-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                >
                  <User size={12} /> Tạo NPC Mới
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {[
                  ...(gameData.npcs || []).map((npc: any, index: number) => ({ npc, index, isLite: false }))
                ]
                  .map(({ npc, index, isLite }) => {
                    const currentNpcLoc = latestAiMsg?.npcLocations?.find(
                      (loc: any) =>
                        loc.id === npc.name || loc.id === npc.fullName,
                    )?.location;
                    const locStr = currentNpcLoc || npc.location || "";
                    const cleanLocStr = locStr.replace(/<[^>]+>/g, "").replace(/[*_~`]/g, "");
                    const isUnknownLoc =
                      !cleanLocStr ||
                      cleanLocStr.toLowerCase().includes("chưa rõ") ||
                      cleanLocStr.toLowerCase().includes("không rõ") ||
                      cleanLocStr.toLowerCase() === "n/a" ||
                      cleanLocStr.toLowerCase().includes("unknown");
                    const isMale =
                      npc.gender?.toLowerCase() === "nam" ||
                      npc.gender?.toLowerCase() === "male" ||
                      npc.gender?.toLowerCase().includes("nam giới");
                    return {
                      npc,
                      index,
                      isLite,
                      locStr: cleanLocStr || "Vị trí chưa rõ",
                      isUnknownLoc,
                      isMale,
                    };
                  })
                  .sort((a, b) => {
                    if (a.isUnknownLoc === b.isUnknownLoc) {
                      if (a.isLite === b.isLite) return 0;
                      return a.isLite ? 1 : -1;
                    }
                    return a.isUnknownLoc ? 1 : -1;
                  })
                  .map(({ npc, index, isLite, locStr, isUnknownLoc, isMale }, renderIndex) => {
                    const bgClass = isMale
                      ? theme.group === "Dark"
                        ? "bg-blue-500/5 hover:bg-blue-500/10"
                        : "bg-sky-50/70 hover:bg-sky-100/70 text-[#0f172a]"
                      : theme.group === "Dark"
                        ? "bg-pink-500/5 hover:bg-pink-500/10"
                        : "bg-pink-50/70 hover:bg-pink-100/70 text-[#0f172a]";
                    const borderClass = isMale
                      ? theme.group === "Dark"
                        ? "border-blue-500/20 hover:border-blue-500/30"
                        : "border-black/10 hover:border-sky-300/80"
                      : theme.group === "Dark"
                        ? "border-pink-500/20 hover:border-pink-500/30"
                        : "border-black/10 hover:border-pink-300/80";
                    const iconBgClass = isMale
                      ? theme.group === "Dark"
                        ? "bg-blue-500/10"
                        : "bg-sky-100"
                      : theme.group === "Dark"
                        ? "bg-pink-500/10"
                        : "bg-pink-100";
                    const iconBorderClass = isMale
                      ? theme.group === "Dark"
                        ? "border-blue-500/20"
                        : "border-sky-200"
                      : theme.group === "Dark"
                        ? "border-pink-500/20"
                        : "border-pink-200";
                    const textClass = isMale
                      ? "text-sky-600 font-bold"
                      : "text-pink-600 font-bold";
                    const opacityClass = isUnknownLoc
                      ? "opacity-60 hover:opacity-100"
                      : "opacity-100";

                    return (
                      <div
                        key={`npc-${index}`}
                        onClick={() => {
                          setSelectedNPCIndex(index);
                          if (isMobile) setLeftOpen(false);
                        }}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${bgClass} ${borderClass} ${opacityClass}`}
                      >
                        {npc.pendingUpdates && Object.keys(npc.pendingUpdates).length > 0 && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 z-10" title="Có cập nhật NPC cần xác nhận">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-900"></span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          {npc.avatar ? (
                            <div
                              className={`w-16 shrink-0 overflow-hidden rounded-md border aspect-[2/3] ${iconBorderClass}`}
                            >
                               <LazyImage
                                 src={npc.avatar}
                                 alt="Avatar"
                                 className="w-full h-full"
                               />
                             </div>
                           ) : (
                             <div
                               className={`w-16 shrink-0 flex items-center justify-center rounded-md border aspect-[2/3] relative overflow-hidden ${iconBgClass} ${iconBorderClass}`}
                             >
                               <User size={32} className={textClass} />
                             </div>
                           )}
                           <div className="flex flex-col gap-1 items-start flex-1 min-w-0">
                             <h4
                               className={
                                 "font-bold leading-tight break-words whitespace-pre-wrap flex items-center gap-1.5 " +
                                 theme.textPrimary
                               }
                             >
                               <span>{npc.fullName || npc.name || "Chưa đặt tên"}</span>
                             </h4>
                            <div
                              className={`flex items-start gap-1 text-[10px] border px-2 py-1.5 rounded-md w-full mt-0.5 ${theme.group === "Dark" ? "text-white/70 bg-white/5 border-transparent" : "text-[#334155] bg-white/80 border-black/10"}`}
                              title="Vị trí & Hoạt động"
                            >
                              <MapPin
                                size={12}
                                className="text-green-500 shrink-0 mt-0.5"
                              />
                              <span className="whitespace-pre-wrap break-words leading-tight">
                                {locStr}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {(!gameData.npcs || gameData.npcs.length === 0) && (
                  <div className="text-center p-8 opacity-50 text-sm">
                    Chưa có NPC nào
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Gameplay Content */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${theme.group === "Dark" ? "bg-transparent" : "bg-[#FAF6F0]"}`}
        >
          <div
            className="flex-1 overflow-y-auto py-4 md:py-8 px-4 md:px-0 space-y-8 custom-scrollbar"
            ref={scrollRef}
          >
            {currentTurnsArr.map((turn: any) => (
              <div
                key={turn.id}
                id={`turn-${turn.id}`}
                className="w-full relative mb-12 flex flex-col gap-6"
              >
                {turn.userMsg && (
                  // USER MESSAGE (Full width)
                  <div
                    className={`w-full rounded-2xl border p-5 md:p-6 shadow-md backdrop-blur-md relative overflow-hidden ${theme.group === "Dark" ? "bg-blue-900/10 border-blue-500/20 text-blue-50" : "bg-black/5 border-black/10 text-[#0f172a]"}`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${theme.group === "Dark" ? "bg-blue-500/50" : "bg-slate-800/60"}`}
                    />
                    <div className="flex items-center gap-2 mb-3">
                      <User
                        size={16}
                        className={
                          theme.group === "Dark"
                            ? "text-blue-400"
                            : "text-slate-700"
                        }
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${theme.group === "Dark" ? "text-blue-400/80" : "text-slate-700/80"}`}
                      >
                        Người chơi hành động:
                      </span>
                    </div>
                    <div
                      className={`whitespace-pre-wrap leading-relaxed text-base md:text-lg font-medium opacity-95 ${theme.group === "Dark" ? "text-blue-5" : "text-[#0f172a]"}`}
                    >
                      {turn.userMsg.content}
                    </div>
                  </div>
                )}

                {turn.aiMsg && (
                  // AI/SYSTEM MESSAGE (Full width)
                  <div
                    className={`w-full rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden flex flex-col ${theme.group === "Dark" ? "bg-black/60 border-transparent text-white/90" : "bg-white/60 border-black/10 text-[#0f172a]"}`}
                  >
                    {/* Header AI Message */}
                    <div className="flex items-center gap-2 p-3 theme-panel shadow-none border-b border-transparent">
                      <Sparkles
                        size={16}
                        className={
                          turn.aiMsg.isStreaming
                            ? "text-purple-400 animate-pulse"
                            : "text-purple-500"
                        }
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${theme.group === "Dark" ? "text-purple-400/80" : "text-[#334155]/80"}`}
                      >
                        {turn.aiMsg.isStreaming
                          ? "Matrix Lite v4 đang kiến tạo..."
                          : "Lượt " + String(turn.index).padStart(4, "0")}
                      </span>
                      <div className="flex-1" />
                      {!turn.aiMsg.isStreaming && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (editingTurnId === turn.aiMsg.id) {
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === turn.aiMsg.id
                                      ? {
                                          ...m,
                                          mainText: editingContent,
                                          content: editingContent,
                                        }
                                      : m,
                                  ),
                                );
                                setEditingTurnId(null);
                              } else {
                                setEditingTurnId(turn.aiMsg.id);
                                setEditingContent(
                                  turn.aiMsg.mainText ||
                                    turn.aiMsg.content ||
                                    "",
                                );
                              }
                            }}
                            className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg theme-panel shadow-none border-transparent theme-panel-hover text-slate-500 dark-theme:text-white/60 hover:theme-text-base transition-all text-[10px] font-bold tracking-wider"
                            title={
                              editingTurnId === turn.aiMsg.id
                                ? "Lưu"
                                : "Chỉnh sửa lượt (Edit Draw)"
                            }
                          >
                            {editingTurnId === turn.aiMsg.id ? (
                              <>
                                <Save size={12} /> LƯU DIỄN BIẾN
                              </>
                            ) : (
                              <>
                                <Edit3 size={12} /> EDIT DRAW
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              // Xóa ngay lập tức không cần xác nhận rườm rà nhưng có thông báo ngắn gọn.
                              // Nếu turn có userMsg tương ứng (hành động trước đó), ta xóa cả userMsg và aiMsg
                              // để tránh rỗng dở dang gây kẹt trò chơi. Nếu không có userMsg (lượt 0000), ta chỉ xóa aiMsg.
                              const idsToDelete = [turn.aiMsg.id];
                              if (turn.userMsg?.id) {
                                idsToDelete.push(turn.userMsg.id);
                              }
                              setMessages((prev) =>
                                prev.filter((m) => !idsToDelete.includes(m.id)),
                              );
                              toast.success(
                                "Đã xóa phản hồi và quay lại lượt trước thành công!",
                              );
                            }}
                            className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-[10px] font-bold tracking-wider border border-red-500/10 hover:border-red-500/20 cursor-pointer"
                            title="Xóa phản hồi này ngay lập tức"
                          >
                            <Trash2 size={12} /> XÓA
                          </button>
                        </div>
                      )}
                      {turn.aiMsg.isStreaming && (
                        <Loader2
                          size={12}
                          className="ml-auto flex animate-spin text-purple-400"
                        />
                      )}
                    </div>

                    <div className="p-5 md:p-6 space-y-6">
                      {turn.aiMsg.isStreaming ? (
                        <div className="text-sm text-white/50 italic animate-pulse">
                          Đang thu thập dữ liệu luân hồi... (Xem chi tiết ở cột
                          bên phải)
                        </div>
                      ) : (
                        <>
                          {/* Outline */}
                          {turn.aiMsg.outline && (
                            <div className="hidden">
                              <span className="absolute -top-2.5 left-4 px-2 bg-black uppercase tracking-widest text-[10px] font-black text-emerald-400">
                                Dàn ý & Tóm tắt
                              </span>
                              {turn.aiMsg.outline}
                            </div>
                          )}

                          {/* Main Text */}
                          {editingTurnId === turn.aiMsg.id ? (
                            <textarea
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              className={`w-full h-80 rounded-xl border p-4 text-base md:text-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 resize-y custom-scrollbar leading-loose transition-colors ${theme.group === "Dark" ? "bg-black/40 border-white/10 text-white/90" : "bg-[#FDFBF7] border-black/10 text-[#2C1D11]"}`}
                            />
                          ) : (
                            (turn.aiMsg.mainText || turn.aiMsg.content) && (
                              <div
                                className={`markdown-body whitespace-pre-wrap leading-loose text-base md:text-lg opacity-95 font-medium ${theme.group === "Dark" ? "" : "text-[#2C1D11]"}`}
                              >
                                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                  {autoColorizeQuotes((turn.aiMsg.mainText || turn.aiMsg.content || '').replace(/<br\s*\/?>/gi, '\n').replace(/\\"/g, '"'), useColorEnabled)}
                                </Markdown>
                              </div>
                            )
                          )}

                          {/* Suggested Actions */}
                          {turn.aiMsg.suggestedActions &&
                            turn.aiMsg.suggestedActions.length > 0 && (
                              <div
                                className={`pt-4 mt-6 border-t ${theme.group === "Dark" ? "border-white/10" : "border-black/10"}`}
                              >
                                {(() => {
                                  const msgId = turn.aiMsg.id;
                                  const isLatestTurn = turn.index === turns.length - 1;
                                  const isCollapsed = collapsedSuggestions[msgId] !== undefined ? collapsedSuggestions[msgId] : !isLatestTurn;
                                  
                                  return (
                                    <>
                                      <div className="flex items-center justify-between mb-4">
                                        <h4
                                          className={`text-sm font-bold uppercase tracking-widest opacity-80 ${theme.group === "Dark" ? "text-blue-400" : "text-slate-700"}`}
                                        >
                                          Gợi ý nhánh dàn ý tiếp theo:
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => setIsSuggestionsLocked(!isSuggestionsLocked)}
                                            className={`p-1.5 rounded-lg border transition-colors ${
                                              isSuggestionsLocked 
                                                ? (theme.group === 'Dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-600 border-red-200')
                                                : (theme.group === 'Dark' ? 'bg-white/5 text-white/50 border-white/10 hover:text-white' : 'bg-black/5 text-black/50 border-black/10 hover:text-black')
                                            }`}
                                            title={isSuggestionsLocked ? "Đã khóa (Chỉ copy vào khung nhập)" : "Chưa khóa (Nhấn là thực hiện ngay)"}
                                          >
                                            {isSuggestionsLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                          </button>
                                          <button
                                            onClick={() => setCollapsedSuggestions(prev => ({ ...prev, [msgId]: !isCollapsed }))}
                                            className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 rounded-lg border transition-colors ${theme.group === 'Dark' ? 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white' : 'border-black/10 text-black/50 hover:bg-black/5 hover:text-black'}`}
                                          >
                                            {isCollapsed ? (
                                              <><ChevronDown size={14} /> Mở rộng</>
                                            ) : (
                                              <><ChevronUp size={14} /> Thu gọn</>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {!isCollapsed && (
                                        <div className="grid grid-cols-1 gap-0 -mx-5 md:-mx-6 border-t border-transparent">
                                          {turn.aiMsg.suggestedActions.map(
                                            (actionItem: any, idx: number) => {
                                              if (!actionItem) return null;
                                              let actionTitle =
                                                typeof actionItem === "string"
                                                  ? actionItem
                                                  : actionItem.action || actionItem.text || actionItem.title || actionItem.name || actionItem.option;
                                              
                                              if (typeof actionTitle === "string") {
                                                actionTitle = actionTitle.replace(/^Dàn ý nhánh \d+:\s*(?:\[)?/, '').replace(/(?:\])?$/, '');
                                              }
                                              
                                              const details =
                                                typeof actionItem === "object"
                                                  ? actionItem.details || actionItem.description
                                                  : null;
                                              const timeCost =
                                                typeof actionItem === "object"
                                                  ? actionItem.timeCost
                                                  : null;

                                              let actionText = actionTitle || "Gợi ý hành động (Trống)";
                                              
                                              // Object fallback if actionTitle was not resolved properly but there is an object
                                              if (actionText === "Gợi ý hành động (Trống)" && typeof actionItem === "object") {
                                                const values = Object.values(actionItem).filter(v => typeof v === 'string' && v.length > 0);
                                                if (values.length > 0) {
                                                   actionText = values[0] as string;
                                                }
                                              }
                                              if (details && timeCost) {
                                                actionText += `\n${details}\n[Thời gian dự kiến: ${timeCost}]`;
                                              } else if (details) {
                                                actionText += `\n${details}`;
                                              } else if (timeCost) {
                                                actionText += `\n[Thời gian dự kiến: ${timeCost}]`;
                                              }

                                              return (
                                                <div
                                                  key={idx}
                                                  className="relative group flex items-start"
                                                >
                                                  <button
                                                    onClick={() => {
                                                      if (!isGenerating) {
                                                        const userMsgId =
                                                          Date.now().toString() + "_u";
                                                        if (isSuggestionsLocked) {
                                                          actionInputRef.current?.setText(actionText);
                                                        } else {
                                                          actionInputRef.current?.clear();
                                                          setMessages((prev) => [
                                                            ...prev,
                                                            {
                                                              id: userMsgId,
                                                              sender: "user",
                                                              content: actionText,
                                                            },
                                                          ]);
                                                          generateTurn(actionText);
                                                        }
                                                      }
                                                    }}
                                                    disabled={isGenerating}
                                                    className={`w-full text-left px-5 md:px-6 py-4 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex flex-col relative overflow-hidden bg-transparent border-b ${
                                                      theme.group === "Dark"
                                                        ? "border-white/5 hover:bg-black/20"
                                                        : "border-black/10 hover:bg-white/500/5"
                                                    }`}
                                                  >
                                                    <div className="flex flex-col items-start w-full md:pr-10">
                                                      <div className="flex items-start">
                                                        <span
                                                          className={`font-bold leading-tight text-base ${theme.group === "Dark" ? "text-white/95" : "text-[#0f172a]"}`}
                                                        >
                                                          {actionTitle}
                                                        </span>
                                                      </div>
                                                      {details && (
                                                        <div
                                                          className={`text-sm mt-1.5 leading-relaxed ${theme.group === "Dark" ? "text-slate-500 dark-theme:text-white/60" : "text-[#334155]/85"}`}
                                                        >
                                                          {details}
                                                        </div>
                                                      )}
                                                      {timeCost && (
                                                        <div className="mt-2 text-left">
                                                          <span
                                                            className={`text-[11px] font-mono border px-2 py-1 rounded inline-flex items-center gap-1.5 ${
                                                              theme.group === "Dark"
                                                                ? "text-white/40 border-transparent bg-black/20"
                                                                : "text-[#334155] border-black/10 bg-black/5"
                                                            }`}
                                                          >
                                                            <Clock className="w-3 h-3 opacity-70" />
                                                            Tiêu tốn {timeCost}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      copyToClipboard(actionText);
                                                    }}
                                                    className={`absolute top-4 right-5 md:right-6 p-2 rounded-lg transition-all border ${
                                                      theme.group === "Dark"
                                                        ? "bg-white/10 border-transparent hover:bg-white/20 text-white/70"
                                                        : "bg-black/5 border-black/10 hover:bg-black/5 text-[#334155]"
                                                    }`}
                                                    title="Copy hành động"
                                                  >
                                                    <Copy size={14} />
                                                  </button>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {currentTurnsArr.length === 0 && (
              <div className="flex items-center justify-center h-full opacity-50">
                <p>Đang chờ luồng luân hồi...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer
            className={`shrink-0 border-t z-20 flex flex-col gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg ${
              theme.group === "Dark"
                ? "theme-panel !border-none backdrop-blur-2xl"
                : "border-black/10 bg-[#EFE9DD]/90 backdrop-blur-xl"
            }`}
          >
            <ActionInput ref={actionInputRef} isGenerating={isGenerating} theme={theme} onSend={handleSend} />
            <div className="w-full max-w-5xl mx-auto flex items-center justify-between mt-3">
              {/* Pagination */}
              <div
                className={`flex items-center gap-1.5 md:gap-3 theme-panel shadow-none rounded-lg p-1 border ${theme.group === "Dark" ? "border-white/5" : "border-black/10 bg-[#FAF6F0]"}`}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 md:p-2 rounded transition-all disabled:opacity-30 cursor-pointer ${theme.group === "Dark" ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm"}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <div
                  className={`text-xs md:text-sm font-black w-12 text-center ${theme.group === "Dark" ? "text-blue-400" : "text-blue-600"}`}
                >
                  {currentPage}{" "}
                  <span
                    className={`${theme.group === "Dark" ? "text-white/30" : "text-[#334155]/60"} font-normal`}
                  >
                    / {totalPages}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-1.5 md:p-2 rounded transition-all disabled:opacity-30 cursor-pointer ${theme.group === "Dark" ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm"}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Scroll Controls & Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollToTop("auto")}
                  className={`p-2 md:p-2.5 rounded-lg transition-colors cursor-pointer border ${theme.group === "Dark" ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20 shadow-none" : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm"}`}
                  title="Lên đầu"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => scrollToBottom("auto")}
                  className={`p-2 md:p-2.5 rounded-lg transition-colors cursor-pointer border ${theme.group === "Dark" ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20 shadow-none" : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm"}`}
                  title="Xuống cuối"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          </footer>
        </div>

        {/* Right Sidebar - Streaming & Stats */}
        <AnimatePresence>
          {rightOpen && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute md:relative right-0 top-0 bottom-0 w-72 md:w-96 border-l z-30 flex flex-col shadow-2xl overflow-y-auto custom-scrollbar ${theme.group === "Dark" ? "theme-panel !border-y-0 !border-r-0 backdrop-blur-2xl text-white" : "border-black/10 bg-[#F4EFE6]/95 backdrop-blur-md shadow-xl text-[#0f172a]"}`}
            >
              {/* Phần 1: Các nút thao tác trên mobile */}
              <div
                className={`md:hidden p-4 border-b shrink-0 ${theme.group === "Dark" ? "theme-panel !border-l-0 !border-r-0 !border-t-0 shadow-none" : "border-black/10 bg-[#EFE9DD]/90 backdrop-blur-xl"}`}
              >
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={async () => {
                      await saveCurrentGame();
                      toast.success("Đã lưu tiến trình!");
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("green")}`}
                  >
                    <Save size={16} /> <span>LƯU</span>
                  </button>
                  <button
                    onClick={async () => {
                      const success = await resumeLatestGame();
                      if (success) {
                        toast.success("Đã tải nhanh tệp lưu mới nhất!");
                      } else {
                        toast.error("Không tìm thấy tệp lưu nào để tải!");
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("orange")}`}
                    title="Tải tiến trình mới nhất"
                  >
                    <RotateCcw size={16} /> <span>LOAD</span>
                  </button>
                  <button
                    onClick={handleDownloadSave}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("blue")}`}
                  >
                    <Download size={16} /> <span>SAVE</span>
                  </button>
                  <button
                    onClick={() => setShowMC(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("emerald")}`}
                  >
                    <User size={16} /> <span>MC</span>
                  </button>
                  <button
                    onClick={() => setShowRules(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("indigo")}`}
                  >
                    <ListTodo size={16} /> <span>RULES</span>
                  </button>
                  <button
                    onClick={() => setShowStatus(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("teal")}`}
                  >
                    <Activity size={16} /> <span>STATUS</span>
                  </button>
                  <button
                    onClick={() => setShowGallery(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("pink")}`}
                  >
                    <ImageIcon size={16} /> <span>ẢNH</span>
                  </button>
                  <button
                    onClick={() => setShowCodex(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("cyan")}`}
                  >
                    <Book size={16} /> <span>CODEX</span>
                  </button>
                  <button
                    onClick={() => setShowMemory(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("purple")}`}
                  >
                    <BrainCircuit size={16} /> <span>MEMORY</span>
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider ${getHeaderBtnClass("gray")}`}
                  >
                    <SettingsIcon size={16} /> <span>CẤU HÌNH</span>
                  </button>
                  <button
                    onClick={() => setUseColorEnabled(!useColorEnabled)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider border text-white ${useColorEnabled ? 'bg-green-600 border-white hover:bg-green-500' : 'bg-black border-white hover:bg-zinc-900'}`}
                  >
                    <Palette size={16} /> <span>{useColorEnabled ? "MÀU: BẬT" : "MÀU: TẮT"}</span>
                  </button>
                  <button
                    onClick={() => setIsDramatic(!isDramatic)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer text-[10px] font-bold tracking-wider border text-white ${isDramatic ? 'bg-red-600 border-white hover:bg-red-500' : 'bg-black border-white hover:bg-zinc-900'}`}
                  >
                    <Flame size={16} className={isDramatic ? "animate-pulse" : ""} /> <span>KỊCH TÍNH: {isDramatic ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>

              {/* Tên Thế Giới */}
              <div
                className={`p-4 border-b shrink-0 flex flex-col gap-3 ${theme.group === "Dark" ? "theme-panel !border-l-0 !border-r-0 !border-t-0" : "border-black/10 bg-white/60"}`}
              >
                <div>
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.group === "Dark" ? "text-white/50" : "text-[#334155]/80"}`}
                  >
                    THẾ GIỚI HIỆN TẠI
                  </div>
                  <div className="text-sm font-bold theme-text-base drop-shadow-sm">
                    {gameData.worldData?.name || "Thế giới vô danh"}
                  </div>
                </div>
                <div
                  className={`flex flex-col gap-2 pt-3 border-t ${theme.group === "Dark" ? "border-white/10" : "border-black/10"}`}
                >
                  <div className="flex gap-2">
                    <Clock
                      size={14}
                      className={
                        theme.group === "Dark"
                          ? "text-blue-500 shrink-0 mt-0.5"
                          : "text-slate-700 shrink-0 mt-0.5"
                      }
                    />
                    <span
                      className={`text-[11px] font-mono whitespace-pre-wrap break-words leading-tight ${theme.group === "Dark" ? "text-white/70" : "text-[#0f172a]"}`}
                    >
                      {currentWorldTime}
                    </span>
                  </div>
                  {currentWeather && (
                    <div className="flex gap-2">
                      <CloudSun
                        size={14}
                        className={
                          theme.group === "Dark"
                            ? "text-amber-500 shrink-0 mt-0.5"
                            : "text-orange-600 shrink-0 mt-0.5"
                        }
                      />
                      <span
                        className={`text-[11px] font-mono whitespace-pre-wrap break-words leading-tight ${theme.group === "Dark" ? "text-white/70" : "text-[#0f172a]"}`}
                      >
                        {currentWeather}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <MapPin
                      size={14}
                      className={
                        theme.group === "Dark"
                          ? "text-green-500 shrink-0 mt-0.5"
                          : "text-emerald-700 shrink-0 mt-0.5"
                      }
                    />
                    <span
                      className={`text-[11px] font-mono whitespace-pre-wrap break-words leading-tight ${theme.group === "Dark" ? "text-white/70" : "text-[#0f172a]"}`}
                    >
                      {currentLoc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phần 2: Màn Hình Stats */}
              <div
                className={`p-4 border-b shrink-0 relative ${theme.group === "Dark" ? "theme-panel !border-l-0 !border-r-0 !border-t-0" : "border-black/10 bg-[#F4EFE6]/50"}`}
              >
                {isGenerating && (
                  <Loader2
                    size={16}
                    className="absolute top-4 right-4 animate-spin text-purple-400"
                  />
                )}
                <h4
                  className={`text-[10px] font-black uppercase mb-3 tracking-widest ${theme.group === "Dark" ? "text-blue-500" : "text-sky-700"}`}
                >
                  Màn Hình Stats
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="theme-panel shadow-none border-transparent p-2 rounded-lg">
                    <div
                      className={`text-[10px] mb-1 ${theme.group === "Dark" ? "text-white/50" : "text-[#334155]/80 font-bold"}`}
                    >
                      THỜI GIAN NGAY LÚC NÀY
                    </div>
                    <div className="text-sm font-mono theme-text-base">
                      <LocalTimer isGenerating={isGenerating} processingTime={currentStats.processingTime} />
                    </div>
                  </div>
                  <div className="theme-panel shadow-none border-transparent p-2 rounded-lg">
                    <div
                      className={`text-[10px] mb-1 ${theme.group === "Dark" ? "text-white/50" : "text-[#334155]/80 font-bold"}`}
                    >
                      SỐ CHỮ (VĂN BẢN)
                    </div>
                    <div className="text-sm font-mono theme-text-base">
                      {currentStats.wordCount} chữ
                    </div>
                  </div>
                  <div className="theme-panel shadow-none border-transparent p-2 rounded-lg col-span-2">
                    <div
                      className={`text-[10px] mb-1 ${theme.group === "Dark" ? "text-white/50" : "text-[#334155]/80 font-bold"}`}
                    >
                      TOKENS (IN / OUT / TỔNG)
                    </div>
                    <div className="text-sm font-mono theme-text-base flex gap-1">
                      <span>{currentStats.tokensIn}</span> /{" "}
                      <span>{currentStats.tokensOut}</span> /{" "}
                      <span
                        className={
                          theme.group === "Dark"
                            ? "text-purple-400 font-bold"
                            : "text-purple-700 font-extrabold"
                        }
                      >
                        {currentStats.tokensTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phần 3: Deep Reasoning */}
              <div
                className={`p-3 border-b flex justify-between items-center shrink-0 ${theme.group === "Dark" ? "theme-panel !border-l-0 !border-r-0 !border-t-0" : "border-black/10 bg-white/60"}`}
              >
                <h4
                  className={`text-[10px] font-black uppercase tracking-widest ${theme.group === "Dark" ? "text-purple-400" : "text-purple-700"}`}
                >
                  Hội Đồng AI Suy Luận
                </h4>
                <button
                  onClick={() => setExpandedLog("reasoning")}
                  className={`p-1 rounded transition-colors ${theme.group === "Dark" ? "text-white/50 hover:text-white hover:bg-white/10" : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"}`}
                >
                  <Maximize2 size={12} />
                </button>
              </div>
              <StreamLogViewer theme={theme} isExpanded={false} />

              {/* Phần 4: Error & Diagnostic */}
              <div
                className={`p-3 border-y flex justify-between items-center shrink-0 ${theme.group === "Dark" ? "border-white/10" : "border-black/10 bg-white/60"}`}
              >
                <h4
                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${theme.group === "Dark" ? "text-red-400" : "text-red-700"}`}
                >
                  Error & Diagnostics Log {systemLogs && systemLogs.length > 0 ? `(${systemLogs.length})` : ''}
                  {systemLogs && systemLogs.length > 0 && (
                    <button
                      onClick={() => setSystemLogs("")}
                      className="p-[2px] ml-1 bg-red-500/20 text-red-650 hover:bg-red-500/40 rounded transition-colors"
                      title="Xóa logs"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </h4>
                <button
                  onClick={() => setExpandedLog("error")}
                  className={`p-1 rounded transition-colors ${theme.group === "Dark" ? "text-white/50 hover:text-white hover:bg-white/10" : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"}`}
                >
                  <Maximize2 size={12} />
                </button>
              </div>
              <div
                className={`h-48 shrink-0 p-4 overflow-y-auto custom-scrollbar scroll-smooth flex flex-col gap-2 ${theme.group === "Dark" ? "bg-red-950/20" : "bg-red-50/40 border border-red-100 rounded-xl m-2 shadow-inner"}`}
              >
                {systemLogs && systemLogs.length > 0 ? (
                  systemLogs.map((log) => (
                    <div key={log.id} className={`font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap border rounded p-2 ${theme.group === "Dark" ? "text-red-400/80 border-red-900/30 bg-red-900/10" : "text-red-800 font-medium border-red-200 bg-red-50"}`}>
                      <div className="flex justify-between items-center mb-1 border-b pb-1 opacity-70">
                        <span className="font-bold">Error Info</span>
                        <span className="text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {log.message}
                    </div>
                  ))
                ) : (
                  <div className={`font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap ${theme.group === "Dark" ? "text-red-400/80" : "text-red-800 font-medium"}`}>
                    {"> Hệ thống trạng thái bình thường...\n> Không có lỗi phát sinh."}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals placeholders */}
      <AnimatePresence>
        {showMC && (
          <CharacterModal type="mc" onClose={() => setShowMC(false)} />
        )}

        {selectedNPCIndex !== null && (
          <CharacterModal
            type="npc"
            npcIndex={selectedNPCIndex}
            onClose={() => setSelectedNPCIndex(null)}
          />
        )}

        {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
        
        {showNPCBuilder && (
          <NPCBuilderModal onClose={() => setShowNPCBuilder(false)} />
        )}

        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col w-[100dvw] h-[100dvh] p-0 m-0 overflow-hidden"
            onClick={() => setShowRules(false)}
          >
            <div
              className={`w-full h-full flex flex-col rounded-none border-0 shadow-none overflow-hidden ${theme.group === "Dark" ? "theme-panel !border-none text-white" : theme.bgClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`p-4 border-b flex items-center justify-between shrink-0 ${theme.group === "Dark" ? "border-white/10 bg-black/10" : "border-slate-300"}`}
              >
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                  <ListTodo size={20} /> PLAYER RULES
                </h2>
                <button
                  onClick={() => setShowRules(false)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${theme.group === "Dark" ? "text-white/50 hover:text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-slate-700 dark-theme:text-white/80 flex flex-col">
                <p
                  className={`text-sm ${theme.group === "Dark" ? "text-white/50" : "text-slate-600 font-medium"}`}
                >
                  Thêm các quy tắc bối cảnh, hành vi hoặc phong cách kể chuyện
                  mà AI phải tuân thủ trong suốt quá trình chơi.
                </p>
                <textarea
                  className="w-full flex-1 min-h-[300px] theme-input border rounded-xl p-4 focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-sm leading-relaxed"
                  placeholder={`Mô tả các quy tắc theo dạng gạch đầu dòng:\n- Không được sử dụng phép thuật trong 5 lượt tới.\n- AI phải viết dài hơn bình thường.\n- ...`}
                  value={playerRules}
                  onChange={(e) => setPlayerRules(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {showCodex && <CodexModal onClose={() => setShowCodex(false)} />}

        {showMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col w-[100dvw] h-[100dvh] p-0 m-0 overflow-hidden"
            onClick={() => setShowMemory(false)}
          >
            <div
              className={`w-full h-full flex flex-col rounded-none border-0 overflow-hidden shadow-none ${theme.group === "Dark" ? "theme-panel !border-none text-white" : "bg-slate-50"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`p-4 md:p-6 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 px-6 md:px-8 ${theme.group === "Dark" ? "border-white/10 text-white bg-black/20" : "border-slate-300 bg-white shadow-sm text-slate-800"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-500">
                    <BrainCircuit size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest theme-text-base leading-none">
                      TRÍ NHỚ AI
                    </h2>
                    <span
                      className={`text-[10px] tracking-wider uppercase font-mono mt-1 block ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
                    >
                      AI Memory Matrix & Context Config
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div
                  className={`flex gap-1.5 p-1 rounded-xl border uppercase font-bold text-xs ${theme.group === "Dark" ? "theme-panel shadow-none border-transparent bg-white/5" : "bg-slate-100 border-slate-300 shadow-inner"}`}
                >
                  <button
                    onClick={() => setMemoryActiveTab("settings")}
                    className={`px-4 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${
                      memoryActiveTab === "settings"
                        ? theme.group === "Dark"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                          : "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/10"
                        : theme.group === "Dark"
                          ? "text-white/60 hover:text-white"
                          : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Thiết Lập
                  </button>
                  <button
                    onClick={() => setMemoryActiveTab("state")}
                    className={`px-4 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${
                      memoryActiveTab === "state"
                        ? theme.group === "Dark"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                          : "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/10"
                        : theme.group === "Dark"
                          ? "text-white/60 hover:text-white"
                          : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Trí nhớ Cuốn chiếu
                  </button>
                  <button
                    onClick={() => setMemoryActiveTab("logs")}
                    className={`px-4 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${
                      memoryActiveTab === "logs"
                        ? theme.group === "Dark"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                          : "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/10"
                        : theme.group === "Dark"
                          ? "text-white/60 hover:text-white"
                          : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Log Ký Ức ({messages.filter((m) => m.outline).length})
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMemoryFullTurnsCount(10);
                      setMemoryLogsCount(50);
                      toast.success("Đã khôi phục cài đặt gốc bộ nhớ");
                    }}
                    className="px-3.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition-colors cursor-pointer tracking-wider uppercase"
                  >
                    Mặc Định
                  </button>
                  <button
                    onClick={() => setShowMemory(false)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer tracking-wider uppercase ${theme.group === "Dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-800"}`}
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {/* Main space */}
              <div
                className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar ${theme.group === "Dark" ? "theme-panel !border-none" : theme.bgClass}`}
              >
                {memoryActiveTab === "settings" && (
                  <div className="w-full space-y-8 py-4 px-4 md:px-8">
                    {/* Intro card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                      <p className="text-slate-700 dark-theme:text-white/80 text-sm leading-relaxed">
                        Chào mừng bạn đến với{" "}
                        <strong className="text-purple-400 font-bold">
                          Ma Trận Trí Nhớ AI
                        </strong>
                        . Game Matrix Lite v4 sử dụng hệ thống RAG
                        (Retrieval-Augmented Generation) kết hợp với cửa sổ lịch
                        sử trích xuất động để gửi dữ liệu tối ưu nhất cho mô
                        hình{" "}
                        <strong className="text-purple-400 font-bold">
                          Gemini 3.1 Pro
                        </strong>
                        . Tại đây, bạn hoàn toàn có thể tinh chỉnh cách AI lưu
                        giữ ký ức hoàn toàn miễn phí mà không lo tốn kém tài
                        nguyên.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Config 1 */}
                      <div className="p-6 theme-panel shadow-none border-transparent rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold theme-text-base flex items-center gap-2">
                                Số lượng lượt chơi đầy đủ gửi cho AI
                              </h3>
                              <p className="text-xs text-white/50">
                                (Full Turns Context Size)
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-lg font-black font-mono">
                              {memoryFullTurnsCount}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark-theme:text-white/70 leading-relaxed">
                            Số lượt trò chơi mới nhất được gửi{" "}
                            <strong>toàn văn (full text)</strong> bao gồm cả dàn
                            ý, bối cảnh diễn biến và hành động người chơi. Giúp
                            AI hiểu rõ nét nhất văn phong, diễn biến cực kỳ mượt
                            mà và trực tiếp tại khung bối cảnh hiện tại.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                          <input
                            type="range"
                            min="2"
                            max="30"
                            step="1"
                            value={memoryFullTurnsCount}
                            onChange={(e) =>
                              setMemoryFullTurnsCount(Number(e.target.value))
                            }
                            className="flex-1 accent-purple-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setMemoryFullTurnsCount(
                                  Math.max(2, memoryFullTurnsCount - 1),
                                )
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg theme-panel shadow-none border-transparent theme-panel-hover theme-text-base border border-transparent cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              onClick={() =>
                                setMemoryFullTurnsCount(
                                  Math.min(30, memoryFullTurnsCount + 1),
                                )
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg theme-panel shadow-none border-transparent theme-panel-hover theme-text-base border border-transparent cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Config 2 */}
                      <div className="p-6 theme-panel shadow-none border-transparent rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold theme-text-base flex items-center gap-2">
                                Số lượng Log ký ức gửi cho AI
                              </h3>
                              <p className="text-xs text-white/50">
                                (Memory Summary Retrieval Limit)
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-lg font-black font-mono">
                              {memoryLogsCount}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark-theme:text-white/70 leading-relaxed">
                            Số lượng log tóm tắt tối đa trong quá khứ được RAG
                            tìm kiếm thông minh từ cơ sở dữ liệu ký ức dựa trên
                            ngữ cảnh phát ngôn hiện tại, hoặc truyền nén lịch sử
                            để AI nhớ lại các hành trình sâu trong ký ức. Tối ưu
                            trí nhớ vĩnh viễn không giới hạn.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                          <input
                            type="range"
                            min="5"
                            max="300"
                            step="5"
                            value={memoryLogsCount}
                            onChange={(e) =>
                              setMemoryLogsCount(Number(e.target.value))
                            }
                            className="flex-1 accent-purple-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setMemoryLogsCount(
                                  Math.max(5, memoryLogsCount - 5),
                                )
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg theme-panel shadow-none border-transparent theme-panel-hover theme-text-base border border-transparent cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              onClick={() =>
                                setMemoryLogsCount(
                                  Math.min(300, memoryLogsCount + 5),
                                )
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg theme-panel shadow-none border-transparent theme-panel-hover theme-text-base border border-transparent cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pro Tip logic */}
                    <div className="p-4 bg-white/500/5 border border-amber-500/20 text-slate-700 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed theme-panel shadow-none border-transparent">
                      <span className="font-bold text-base shrink-0 mt-[-3px]">
                        💡
                      </span>
                      <p>
                        <strong>Gợi ý cài đặt hoàn hảo:</strong> Đặt số lượng
                        lượt chơi full từ <strong>8 - 15 lượt</strong> giúp AI
                        giữ được bối cảnh mượt mà có liên kết chặt chẽ nhất. Đặt
                        số log ký ức từ <strong>30 - 80 tóm tắt</strong> giúp AI
                        tìm kiếm hoặc lội dòng lịch sử một cách thông minh,
                        không lo tràn token mà vẫn đảm bảo ký ức dài hạn tuyệt
                        đối bền vững!
                      </p>
                    </div>
                  </div>
                )}

                {memoryActiveTab === "state" && (
                  <div className="w-full space-y-6 px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase text-purple-400 tracking-wider">
                        Trí nhớ Cuốn chiếu (World State)
                      </h3>
                    </div>
                    <div className="p-6 theme-panel shadow-none border-transparent rounded-2xl flex flex-col space-y-4 text-slate-700 dark-theme:text-white/80 leading-relaxed text-sm">
                      <p>
                        <strong>Tóm tắt cuốn chiếu là gì?</strong> Ký ức AI sẽ
                        dần bị phai nhạt và dẫn tới nhầm lẫn chi tiết theo thời
                        gian (VD: Quên MC đã cởi áo, quên mất NPC đã bị
                        thương...). Việc tóm tắt Cuốn Chiếu sẽ yêu cầu AI tự đọc
                        lại các lượt chơi kết hợp với Trạng thái cũ để cập nhật
                        một bộ não mới.
                      </p>
                      <p>
                        <strong>Khi nào nên bấm?</strong> Kể từ{" "}
                        <strong>lượt thứ 10</strong> trở đi, hoặc sau bất cứ sự
                        kiện lớn nào (đổi map, chuyển cảnh, kết thúc một trận
                        chiến/vấn đề), bạn nên bấm để cập nhật trí nhớ cho hệ
                        thống.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={async () => {
                            if (isGenerating) return;
                            toast.info(
                              "Yêu cầu AI phân tích và tóm tắt cuốn chiếu... đang xử lý!",
                            );
                            handleSendSummarize();
                          }}
                          disabled={
                            isGenerating ||
                            isSummarizing ||
                            messages.filter((m) => m.outline).length ===
                              (gameData.worldData?.lastSummarizedTurnIndex || 0)
                          }
                          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 theme-text-base font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 w-full disabled:opacity-50"
                        >
                          {isSummarizing ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-slate-700"
                            />
                          ) : (
                            <Sparkles size={18} className="animate-pulse" />
                          )}
                          {isSummarizing
                            ? " ĐANG TỐM TẮT CUỐN CHIẾU... (" +
                              formatDuration(summarizeDuration) +
                              ")"
                            : " THỰC HIỆN TÓM TẮT CUỐN CHIẾU LỊCH SỬ THẾ GIỚI"}
                        </button>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                        <div className="flex gap-4">
                          <div className="flex-1 theme-panel shadow-none border-transparent p-3 rounded-lg text-center">
                            <p className="text-xs text-white/50 mb-1 tracking-wider uppercase">
                              ĐÃ LƯU KÝ ỨC
                            </p>
                            <p className="text-xl font-bold theme-text-base">
                              {gameData.worldData?.lastSummarizedTurnIndex || 0}
                            </p>
                          </div>
                          <div className="flex-1 bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-center">
                            <p className="text-xs text-purple-400 mb-1 tracking-wider uppercase">
                              LƯỢT CHỜ TÓM TẮT
                            </p>
                            <p className="text-xl font-bold text-purple-300">
                              {messages.filter((m) => m.outline).length -
                                (gameData.worldData?.lastSummarizedTurnIndex ||
                                  0)}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-purple-300 mt-4">
                          Dữ liệu World State mới nhất đang lưu trong não bộ AI:
                        </p>
                        <div className="p-4 theme-panel shadow-none border-transparent rounded-xl font-mono text-xs text-purple-300 whitespace-pre-wrap border border-purple-500/10 min-h-24">
                          {(gameData.worldData?.worldState || '').replace(/<br\s*\/?>/gi, '\n') ||
                            "Chưa có dữ liệu thống kê cuốn chiếu nào. Hãy tạo những lượt chơi đầu tiên và nhấn nút phía trên để bắt đầu!"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {memoryActiveTab === "logs" && (
                  <div className="w-full space-y-6 px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase text-purple-400 tracking-wider">
                        Danh sách các đoạn tóm tắt dòng chảy thời gian
                      </h3>
                      <div className="flex gap-2">
                        {messages.filter((m) => m.outline).length > 0 && (
                          <button
                            onClick={() => {
                              const textToExport = messages
                                .filter((m) => m.outline)
                                .map(
                                  (m, idx) => `Lượt ${idx + 1}: ${m.outline}`,
                                )
                                .join("\n\n");
                              const blob = new Blob([textToExport], {
                                type: "text/plain;charset=utf-8",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `AI_Memory_Logs_${gameData.mcData?.name || "MC"}.txt`;
                              a.click();
                              toast.success("Đã tải về tệp ký ức!");
                            }}
                            className="px-3 py-1.5 rounded-lg theme-panel shadow-none border-transparent theme-panel-hover theme-text-base text-xs font-bold border border-transparent transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            TẢI LOG (.TXT)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {messages
                        .filter((m) => m.outline)
                        .map((m, idx) => (
                          <div
                            key={idx}
                            className="p-4 theme-panel shadow-none border-transparent rounded-2xl hover:border-purple-500/30 transition-all flex flex-col gap-2 relative group overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                            <div className="flex items-center justify-between shrink-0">
                              <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-purple-500/10">
                                Lượt {idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await ragService.addMemory(
                                      gameData.id,
                                      `[CORE MEMORY - Người dùng GHIM]\nLượt ${idx + 1}:\n${m.outline}`,
                                      true,
                                    );
                                    toast.success(
                                      `Đã GHIM Lượt ${idx + 1} thành KÝ ỨC CỐT LÕI (Core Memory)!`,
                                    );
                                  }}
                                  className="px-2 py-0.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                  title="Đánh dấu Ký ức này là Sổ Tay Ghim để AI không bao giờ quên"
                                >
                                  GHIM CORE
                                </button>
                                {m.worldTime && (
                                  <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                                    <Clock size={10} />
                                    {m.worldTime}
                                  </span>
                                )}
                                {m.weather && (
                                  <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                                    <CloudSun size={10} />
                                    {m.weather}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-700 dark-theme:text-white/80 text-xs md:text-sm leading-relaxed whitespace-pre-line bg-transparent">
                              {m.outline}
                            </p>
                          </div>
                        ))}
                    </div>

                    {messages.filter((m) => m.outline).length === 0 && (
                      <div className="text-center opacity-40 py-20 border border-dashed border-white/10 rounded-2xl theme-panel shadow-none border-transparent flex flex-col items-center justify-center gap-3">
                        <BrainCircuit
                          size={48}
                          className="text-purple-400 stroke-[1.5] opacity-50"
                        />
                        <div>
                          <p className="font-bold text-sm theme-text-base">
                            Chưa ghi nhận ký ức hệ thống
                          </p>
                          <p className="text-xs text-white/50 mt-1 max-w-sm">
                            Khi bạn tiến hành chơi lượt tiếp theo, trí tuệ nhân
                            tạo sẽ tự động phân tích và ghi nhận dàn ý tóm tắt
                            câu chuyện vào đây!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showGallery && <GalleryModal onClose={() => setShowGallery(false)} />}

        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 backdrop-blur-xl flex flex-col w-[100dvw] h-[100dvh] p-0 m-0 overflow-hidden ${theme.group === "Dark" ? "bg-black/80" : "bg-amber-900/15"}`}
            onClick={() => setShowSettings(false)}
          >
            <div
              className={`w-full h-full flex flex-col border-0 rounded-none overflow-hidden shadow-none ${theme.group === "Dark" ? "theme-panel !border-none text-white" : "bg-[#FAF7F0]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`p-4 md:p-6 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 theme-panel shadow-none border-transparent ${theme.group === "Dark" ? "border-white/10" : "border-black/10 bg-white/60"}`}
              >
                <h2 className="text-xl font-black uppercase tracking-widest theme-text-base flex items-center gap-2">
                  <SettingsIcon size={20} /> CẤU HÌNH IN-GAME
                </h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      toast.success("Đã lưu cấu hình hiện tại");
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors cursor-pointer tracking-wider shadow-lg shadow-blue-500/20"
                  >
                    LƯU CẤU HÌNH
                  </button>
                </div>
              </div>
              <div
                className={`flex-1 overflow-y-auto relative ${theme.group === "Dark" ? "theme-panel !border-none" : theme.bgClass}`}
              >
                <Settings />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => setExpandedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full h-full flex flex-col overflow-hidden shadow-2xl ${theme.group === "Dark" ? "bg-slate-900/95" : "bg-white/95"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <h4
                    className={`text-sm font-black uppercase tracking-widest ${expandedLog === "error" ? "text-red-400" : "text-purple-400"}`}
                  >
                    {expandedLog === "reasoning"
                      ? "Hội Đồng AI Suy Luận (Deep Reasoning)"
                      : "Error & Diagnostics Log"}
                  </h4>
                  {expandedLog === "error" && systemLogs && (
                    <button
                      onClick={() => setSystemLogs("")}
                      className="p-1 px-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded transition-colors text-xs font-bold"
                      title="Xóa logs"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={scrollExpandedLogToTop}
                    className="p-2 theme-panel-hover rounded-lg transition-colors text-slate-600 dark-theme:text-white/70 hover:theme-text-base"
                    title="Lên đầu trang"
                  >
                    <ArrowUpToLine size={20} />
                  </button>
                  <button
                    onClick={scrollExpandedLogToBottom}
                    className="p-2 theme-panel-hover rounded-lg transition-colors text-slate-600 dark-theme:text-white/70 hover:theme-text-base"
                    title="Xuống cuối trang"
                  >
                    <ArrowDownToLine size={20} />
                  </button>
                  <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                  <button
                    onClick={() => setExpandedLog(null)}
                    className="p-2 theme-panel-hover rounded-lg transition-colors text-slate-600 dark-theme:text-white/70 hover:theme-text-base"
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div
                ref={expandedLogScrollRef}
                className={`flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar ${expandedLog === "error" ? "bg-red-950/20" : ""} ${theme.group === "Dark" ? "theme-panel !border-none" : theme.bgClass}`}
              >
                {expandedLog === "reasoning" ? (
                  <StreamLogViewer theme={theme} isExpanded={true} expandedLog={expandedLog} />
                ) : (
                  <div className="flex flex-col gap-3 max-w-5xl mx-auto">
                    {systemLogs && systemLogs.length > 0 ? (
                      systemLogs.map((log) => (
                        <div key={log.id} className={`font-mono text-sm leading-relaxed break-words whitespace-pre-wrap border rounded p-4 ${expandedLog === "error" ? (theme.group === "Dark" ? "text-red-400 border-red-900/30 bg-red-900/10" : "text-red-800 border-red-200 bg-red-50") : (theme.group === "Dark" ? "text-green-400 border-green-900/30 bg-green-900/10" : "text-green-800 border-green-200 bg-green-50")}`}>
                          <div className="flex justify-between items-center mb-2 border-b border-current/20 pb-2 opacity-80">
                            <span className="font-bold">Error Info</span>
                            <span className="text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          {log.message}
                        </div>
                      ))
                    ) : (
                      <div className={`font-mono text-sm leading-relaxed break-words whitespace-pre-wrap ${expandedLog === "error" ? "text-red-400/80" : "text-green-400/80"}`}>
                        {"> Hệ thống trạng thái bình thường...\n> Không có lỗi phát sinh."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
