export type ThemeType = 
  | 'cyberpunk' | 'luxury' | 'deepsea' | 'volcano' | 'midnight' 
  | 'forest_night' | 'space' | 'dracula' | 'nordic_dark' | 'matrix'
  | 'minimal' | 'nature' | 'sakura' | 'ocean' | 'desert' 
  | 'lavender' | 'mint' | 'sunset' | 'coffee' | 'cloud'
  | 'glass_dark' | 'glass_light' | 'brutal_dark' | 'brutal_light' 
  | 'neumorphic_dark' | 'neumorphic_light' | 'aurora_dark' | 'aurora_light' 
  | 'mesh_dark' | 'mesh_light';

export type ViewType = 'main' | 'characters' | 'settings' | 'history' | 'shop';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  group: 'Dark' | 'Light';
  bgClass: string;
  sidebarClass: string;
  accentClass: string;
  bgAccentClass: string;
  accentHex: string;
  textPrimary: string;
  textSecondary: string;
}

export const THEMES: ThemeConfig[] = [
  // --- DARK GROUP (10) ---
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    group: 'Dark',
    bgClass: 'bg-[#050505]',
    sidebarClass: 'bg-black/80 backdrop-blur-xl border-r border-[#00FF00]/20',
    accentClass: 'text-[#00FF00] border-[#00FF00]',
    bgAccentClass: 'bg-[#00FF00]/15',
    accentHex: '#00FF00',
    textPrimary: 'text-white',
    textSecondary: 'text-green-500/70',
  },
  {
    id: 'luxury',
    name: 'Luxury Gold',
    group: 'Dark',
    bgClass: 'bg-[#0a0a0a]',
    sidebarClass: 'bg-[#1a1a1a]/90 backdrop-blur-md border-r border-yellow-600/30',
    accentClass: 'text-yellow-500 border-yellow-500',
    bgAccentClass: 'bg-yellow-500/15',
    accentHex: '#eab308',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-400',
  },
  {
    id: 'deepsea',
    name: 'Deep Sea Blue',
    group: 'Dark',
    bgClass: 'bg-[#000814]',
    sidebarClass: 'bg-[#001d3d]/80 backdrop-blur-xl border-r border-blue-500/20',
    accentClass: 'text-blue-400 border-blue-400',
    bgAccentClass: 'bg-blue-400/15',
    accentHex: '#60a5fa',
    textPrimary: 'text-white',
    textSecondary: 'text-blue-200/60',
  },
  {
    id: 'volcano',
    name: 'Volcanic Ash',
    group: 'Dark',
    bgClass: 'bg-[#120000]',
    sidebarClass: 'bg-[#2a0000]/80 backdrop-blur-xl border-r border-red-500/20',
    accentClass: 'text-red-500 border-red-500',
    bgAccentClass: 'bg-red-500/15',
    accentHex: '#ef4444',
    textPrimary: 'text-white',
    textSecondary: 'text-red-300/60',
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    group: 'Dark',
    bgClass: 'bg-[#0a001a]',
    sidebarClass: 'bg-[#1a0033]/80 backdrop-blur-xl border-r border-purple-500/20',
    accentClass: 'text-purple-400 border-purple-400',
    bgAccentClass: 'bg-purple-400/15',
    accentHex: '#c084fc',
    textPrimary: 'text-white',
    textSecondary: 'text-purple-200/60',
  },
  {
    id: 'forest_night',
    name: 'Emerald Night',
    group: 'Dark',
    bgClass: 'bg-[#03120e]',
    sidebarClass: 'bg-[#062c21]/80 backdrop-blur-xl border-r border-emerald-500/20',
    accentClass: 'text-emerald-400 border-emerald-400',
    bgAccentClass: 'bg-emerald-400/15',
    accentHex: '#34d399',
    textPrimary: 'text-white',
    textSecondary: 'text-emerald-200/60',
  },
  {
    id: 'space',
    name: 'Space Silver',
    group: 'Dark',
    bgClass: 'bg-[#0f172a]',
    sidebarClass: 'bg-[#1e293b]/80 backdrop-blur-xl border-r border-slate-400/20',
    accentClass: 'text-slate-200 border-slate-200',
    bgAccentClass: 'bg-slate-200/15',
    accentHex: '#e2e8f0',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
  },
  {
    id: 'dracula',
    name: 'Dracula Pink',
    group: 'Dark',
    bgClass: 'bg-[#282a36]',
    sidebarClass: 'bg-[#44475a]/80 backdrop-blur-xl border-r border-[#ff79c6]/20',
    accentClass: 'text-[#ff79c6] border-[#ff79c6]',
    bgAccentClass: 'bg-[#ff79c6]/15',
    accentHex: '#ff79c6',
    textPrimary: 'text-[#f8f8f2]',
    textSecondary: 'text-[#6272a4]',
  },
  {
    id: 'nordic_dark',
    name: 'Nordic Storm',
    group: 'Dark',
    bgClass: 'bg-[#181a1b]',
    sidebarClass: 'bg-[#222426]/80 backdrop-blur-xl border-r border-cyan-500/20',
    accentClass: 'text-cyan-400 border-cyan-400',
    bgAccentClass: 'bg-cyan-400/15',
    accentHex: '#22d3ee',
    textPrimary: 'text-gray-200',
    textSecondary: 'text-gray-500',
  },
  {
    id: 'matrix',
    name: 'Digital Oasis',
    group: 'Dark',
    bgClass: 'bg-[#000a00]',
    sidebarClass: 'bg-black/90 backdrop-blur-xl border-r border-green-600/40',
    accentClass: 'text-[#00FF41] border-[#00FF41]',
    bgAccentClass: 'bg-[#00FF41]/15',
    accentHex: '#00FF41',
    textPrimary: 'text-white',
    textSecondary: 'text-green-900',
  },

  // --- LIGHT GROUP (10) ---
  {
    id: 'minimal',
    name: 'Minimal Clean',
    group: 'Light',
    bgClass: 'bg-[#FAF9F6]', // Trắng ngọc ấm nhẹ, không xám
    sidebarClass: 'bg-[#FFFDF9]/95 backdrop-blur-md border-r border-amber-100/60',
    accentClass: 'text-blue-700 border-blue-600',
    bgAccentClass: 'bg-blue-700/15',
    accentHex: '#1d4ed8',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
  },
  {
    id: 'nature',
    name: 'Nature Earth',
    group: 'Light',
    bgClass: 'bg-[#FAF8F0]', // Kem đất nhạt ấm áp, không xám hay sẫm
    sidebarClass: 'bg-[#F3EFE6]/95 backdrop-blur-lg border-r border-[#5A5A40]/15',
    accentClass: 'text-[#4a4a30] border-[#4a4a30]',
    bgAccentClass: 'bg-[#4a4a30]/15',
    accentHex: '#4a4a30',
    textPrimary: 'text-[#2C2C1E]',
    textSecondary: 'text-[#4a4a30]',
  },
  {
    id: 'sakura',
    name: 'Sakura Petal',
    group: 'Light',
    bgClass: 'bg-[#FFF6F7]', // Màu phấn hồng cực nhạt dịu ấm
    sidebarClass: 'bg-[#FFECEF]/95 backdrop-blur-md border-r border-pink-200',
    accentClass: 'text-pink-600 border-pink-500',
    bgAccentClass: 'bg-pink-600/15',
    accentHex: '#db2777',
    textPrimary: 'text-pink-950',
    textSecondary: 'text-pink-800',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    group: 'Light',
    bgClass: 'bg-[#F2F7FF]', // Màu biển pastel cực loãng, thư thả
    sidebarClass: 'bg-[#E5F0FF]/95 backdrop-blur-md border-r border-sky-200',
    accentClass: 'text-sky-700 border-sky-600',
    bgAccentClass: 'bg-sky-700/15',
    accentHex: '#0369a1',
    textPrimary: 'text-sky-950',
    textSecondary: 'text-sky-800',
  },
  {
    id: 'desert',
    name: 'Desert Sand',
    group: 'Light',
    bgClass: 'bg-[#FFFBEB]', // Sữa vàng mật ong siêu loãng
    sidebarClass: 'bg-[#FEF5D1]/95 backdrop-blur-md border-r border-amber-200',
    accentClass: 'text-amber-800 border-amber-700',
    bgAccentClass: 'bg-amber-800/15',
    accentHex: '#b45309',
    textPrimary: 'text-amber-950',
    textSecondary: 'text-amber-855',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    group: 'Light',
    bgClass: 'bg-[#FAF8FF]', // Tím oải hương nhạt như mộng
    sidebarClass: 'bg-[#F1EBFF]/95 backdrop-blur-md border-r border-violet-200',
    accentClass: 'text-violet-700 border-violet-600',
    bgAccentClass: 'bg-violet-700/15',
    accentHex: '#6d28d9',
    textPrimary: 'text-violet-950',
    textSecondary: 'text-violet-800',
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    group: 'Light',
    bgClass: 'bg-[#F0FDF4]', // Bạc hà nhạt thanh lịch mát mẻ
    sidebarClass: 'bg-[#DFFCE9]/95 backdrop-blur-md border-r border-emerald-200',
    accentClass: 'text-emerald-700 border-emerald-600',
    bgAccentClass: 'bg-emerald-700/15',
    accentHex: '#047857',
    textPrimary: 'text-emerald-950',
    textSecondary: 'text-emerald-800',
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    group: 'Light',
    bgClass: 'bg-[#FFFAF4]', // Cam tía hoàng hôn nhẵn
    sidebarClass: 'bg-[#FFEFE0]/95 backdrop-blur-md border-r border-orange-200',
    accentClass: 'text-orange-600 border-orange-500',
    bgAccentClass: 'bg-orange-600/15',
    accentHex: '#ea580c',
    textPrimary: 'text-orange-950',
    textSecondary: 'text-orange-800',
  },
  {
    id: 'coffee',
    name: 'Coffee Cream',
    group: 'Light',
    bgClass: 'bg-[#FAF6F0]', // Kem sữa cà phê ấm, không xám bẩn
    sidebarClass: 'bg-[#EFE7DC]/95 backdrop-blur-md border-r border-amber-200/40',
    accentClass: 'text-[#5C4033] border-[#5C4033]',
    bgAccentClass: 'bg-[#5C4033]/15',
    accentHex: '#5C4033',
    textPrimary: 'text-[#3E2723]',
    textSecondary: 'text-[#5C4033]/90',
  },
  {
    id: 'cloud',
    name: 'Soft Cloud',
    group: 'Light',
    bgClass: 'bg-[#F7F7FA]', // Trắng tuyết loãng thiên thanh cực dịu
    sidebarClass: 'bg-[#ECECF3]/95 backdrop-blur-md border-r border-indigo-100',
    accentClass: 'text-indigo-700 border-indigo-600',
    bgAccentClass: 'bg-indigo-700/15',
    accentHex: '#4f46e5',
    textPrimary: 'text-indigo-950',
    textSecondary: 'text-indigo-800',
  },

  // --- SPECIAL THEMES: GLASSMORPHISM ---
  {
    id: 'glass_dark',
    name: 'Dark Glass',
    group: 'Dark',
    bgClass: 'bg-[#0f1016]',
    sidebarClass: 'bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]',
    accentClass: 'text-indigo-400 border-indigo-400',
    bgAccentClass: 'bg-indigo-400/20',
    accentHex: '#818cf8',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
  },
  {
    id: 'glass_light',
    name: 'Light Glass',
    group: 'Light',
    bgClass: 'bg-[#f0f2f5]',
    sidebarClass: 'bg-white/40 backdrop-blur-xl border-r border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]',
    accentClass: 'text-indigo-600 border-indigo-600',
    bgAccentClass: 'bg-indigo-600/15',
    accentHex: '#4f46e5',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
  },

  // --- SPECIAL THEMES: NEO-BRUTALISM ---
  {
    id: 'brutal_dark',
    name: 'Brutal Dark',
    group: 'Dark',
    bgClass: 'bg-[#1a1b1e]',
    sidebarClass: 'bg-[#1a1b1e] border-r-[4px] border-white',
    accentClass: 'text-[#ffdb58] border-[#ffdb58]',
    bgAccentClass: 'bg-[#ffdb58]/20',
    accentHex: '#ffdb58',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-200',
  },
  {
    id: 'brutal_light',
    name: 'Brutal Light',
    group: 'Light',
    bgClass: 'bg-[#ffde59]',
    sidebarClass: 'bg-white border-r-[4px] border-black',
    accentClass: 'text-black border-black',
    bgAccentClass: 'bg-black/10',
    accentHex: '#000000',
    textPrimary: 'text-black',
    textSecondary: 'text-gray-900',
  },

  // --- SPECIAL THEMES: NEUMORPHISM ---
  {
    id: 'neumorphic_dark',
    name: 'Neu Dark',
    group: 'Dark',
    bgClass: 'bg-[#292b2d]',
    sidebarClass: 'bg-[#292b2d] border-r border-white/5',
    accentClass: 'text-cyan-400 border-cyan-400',
    bgAccentClass: 'bg-cyan-400/20',
    accentHex: '#22d3ee',
    textPrimary: 'text-gray-200',
    textSecondary: 'text-gray-400',
  },
  {
    id: 'neumorphic_light',
    name: 'Neu Light',
    group: 'Light',
    bgClass: 'bg-[#e0e5ec]',
    sidebarClass: 'bg-[#e0e5ec] border-r border-black/5',
    accentClass: 'text-blue-500 border-blue-500',
    bgAccentClass: 'bg-blue-500/15',
    accentHex: '#3b82f6',
    textPrimary: 'text-slate-700',
    textSecondary: 'text-slate-500',
  },

  // --- SPECIAL THEMES: AURORA BACKGROUND ---
  {
    id: 'aurora_dark',
    name: 'Aurora Dark',
    group: 'Dark',
    bgClass: 'bg-slate-950', 
    sidebarClass: 'bg-black/20 backdrop-blur-3xl border-r border-white/10',
    accentClass: 'text-fuchsia-400 border-fuchsia-400',
    bgAccentClass: 'bg-fuchsia-400/20',
    accentHex: '#e879f9',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-200',
  },
  {
    id: 'aurora_light',
    name: 'Aurora Light',
    group: 'Light',
    bgClass: 'bg-white', 
    sidebarClass: 'bg-white/40 backdrop-blur-2xl border-r border-black/5',
    accentClass: 'text-teal-600 border-teal-600',
    bgAccentClass: 'bg-teal-600/15',
    accentHex: '#0d9488',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
  },

  // --- SPECIAL THEMES: MESH GRADIENT ---
  {
    id: 'mesh_dark',
    name: 'Mesh Dark',
    group: 'Dark',
    bgClass: 'bg-[#0f172a]', 
    sidebarClass: 'bg-black/20 backdrop-blur-2xl border-r border-white/10',
    accentClass: 'text-amber-400 border-amber-400',
    bgAccentClass: 'bg-amber-400/20',
    accentHex: '#fbbf24',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-200',
  },
  {
    id: 'mesh_light',
    name: 'Mesh Light',
    group: 'Light',
    bgClass: 'bg-[#f8fafc]',
    sidebarClass: 'bg-white/30 backdrop-blur-2xl border-r border-black/5',
    accentClass: 'text-rose-500 border-rose-500',
    bgAccentClass: 'bg-rose-500/15',
    accentHex: '#f43f5e',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
  }
];

export interface ActionSuggestion {
  action: string;
  details?: string;
  timeCost?: string;
}

export interface SystemLogItem {
  id: string;
  timestamp: number;
  message: string;
}

export interface GameMessage {
  id: string;
  sender: 'system' | 'user' | 'ai';
  content: string;
  outline?: string;
  thought?: string;
  mainText?: string;
  suggestedActions?: ActionSuggestion[] | string[];
  worldTime?: string;
  weather?: string;
  mcLocation?: string;
  npcLocations?: { id: string; location: string }[];
  isStreaming?: boolean;
  fullStreamLog?: string;
  stats?: {
    processingTime: number; // ms
    wordCount: number;
    tokensIn: number;
    tokensOut: number;
    tokensTotal: number;
  };
}

export interface SaveFile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  gameData: any;
  messages: GameMessage[];
  ragMemories?: any[];
  playerRules?: string;
}

export interface StatusItem {
  name: string;
  description: string;
  type: 'permanent' | 'temporary';
  solvable: 'solvable' | 'unsolvable';
  duration?: string;
}

export interface StatusData {
  mood?: StatusItem[];
  psychological: StatusItem[];
  physiological: StatusItem[];
  health: StatusItem[];
  condition: StatusItem[];
}

export interface ProxyConfig {
  id: string;
  name: string;
  url: string;
  key: string;
  createdAt: number;
  models?: string[];
  selectedModel?: string;
  enabled?: boolean;
  format?: 'auto' | 'gemini' | 'openai';
}

