import { create } from "zustand";
import { persist, PersistStorage, StorageValue } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  ThemeType,
  ViewType,
  THEMES,
  ThemeConfig,
  ProxyConfig,
  GameMessage,
  SaveFile,
  StatusData,
  SystemLogItem,
} from "../types";
import { storageService } from "../services/storageService";
import { ragService } from "../services/ragService";

export interface StreamStats {
  usedApiKey: boolean;
  activeApiKey?: string | null;
  usedProxy: string | null;
  model: string;
  firstResponseTimeMs: number | null;
  totalTimeMs: number | null;
  vietnameseWordCount: number;
  inputTokens: number;
  outputTokens: number;
  timestamp: number | null;
}

interface GameState {
  currentThemeId: ThemeType;
  currentView: ViewType;
  theme: ThemeConfig;
  proxies: ProxyConfig[];
  activeProxyId: string | null;
  personalApiKeys: string[];
  isFullScreenStream: boolean;
  isGeneratingStream: boolean;
  streamStartTime: number | null;
  fullScreenStreamData: string;
  pendingReparseStreamData: string | null;
  setPendingReparseStreamData: (data: string | null) => void;
  systemLogs: SystemLogItem[];
  currentStreamStats: StreamStats | null;
  updateCurrentStreamStats: (
    stats: Partial<StreamStats> | ((prev: StreamStats | null) => StreamStats),
  ) => void;
  resetStreamStats: () => void;
  setSystemLogs: (log: string | SystemLogItem[] | ((prev: SystemLogItem[]) => SystemLogItem[])) => void;
  saves: SaveFile[];
  messages: GameMessage[];
  targetWordCount: number;
  temperature: number;
  fontFamily: string;
  fontSize: number;
  uiMode: "auto" | "pc" | "mobile";
  selectedAIModel: string;
  setUiMode: (mode: "auto" | "pc" | "mobile") => void;
  setSelectedAIModel: (model: string) => void;
  // World Creation State
  worldCreation: {
    initialIdea: string;
    developedIdea: string;
    worldData: {
      name: string;
      difficulty: string;
      background: string;
      starterTimeline: string;
      starterScenario: string;
      worldRules: string;
      namingConventions: string;
      genre: string;
      mainMood: string;
      pacing: string;
      geography: string;
      worldHistory: string;
      culture: string;
      economy: string;
      religion: string;
      factions: string;
      factionRelations: string;
      uniqueElements: string;
      powerSystem: string;
      logicControl: string;
      writingStyle: string;
      narrativePerspective: string;
      worldState: string;
    };
    mcsData?: Array<any>;
    selectedMcIndex?: number;
    mcData: {
      name: string;
      fullName: string;
      titles: string;
      occupation: string;
      gender: string;
      age: string;
      dob: string;
      height: string;
      weight: string;
      measurements: string;
      appearance: string;
      background: string;
      rank: string;
      powers: Array<{
        name: string;
        description: string;
        type?: string;
        level?: string;
      }>;
      skills: Array<{
        name: string;
        description: string;
        type?: string;
        level?: string;
      }>;
      personality: string;
      personalityCore: string;
      philosophy: string;
      distinguishingFeatures: string;
      innerSecret: string;
      relationships: Array<{
        name: string;
        relation: string;
        status?: string;
        impression?: string;
        termsOfAddress?: string[];
        selfAppellation?: string[];
        description: string;
      }>;
      loveViews: string;
      experience: string;
      nsfwPersonality: string;
      nsfwReactions: string;
      literaryDescription: string;
      goal: string;
      inventory: Array<{ name: string; description: string; quantity: number }>;
      statusData?: StatusData;
    };
    npcs: Array<{
      name: string;
      fullName: string;
      titles: string;
      occupation: string;
      gender: string;
      age: string;
      dob: string;
      height: string;
      weight: string;
      measurements: string;
      appearance: string;
      appearanceLite: string;
      background: string;
      rank: string;
      powers: Array<{
        name: string;
        description: string;
        type?: string;
        level?: string;
      }>;
      skills: Array<{
        name: string;
        description: string;
        type?: string;
        level?: string;
      }>;
      role: string;
      personality: string;
      personalityCore: string;
      philosophy: string;
      distinguishingFeatures: string;
      innerSecret: string;
      relationships: Array<{
        name: string;
        relation: string;
        status?: string;
        impression?: string;
        termsOfAddress?: string[];
        selfAppellation?: string[];
        description: string;
      }>;
      loveViews: string;
      experience: string;
      nsfwPersonality: string;
      nsfwReactions: string;
      literaryDescription: string;
      goal: string;
      needs?: string;
      preferences?: {
        sfw: string;
        nsfw: string;
      };
      isPinned?: boolean;
      statusData?: StatusData;
      pendingUpdates?: any;
    }>;
    worldDetails: {
      places: string;
      locations: Array<{ name: string; description: string }>;
    };
  };
  playerRules: string;
  setPlayerRules: (rules: string) => void;
  setTargetWordCount: (count: number) => void;
  setTemperature: (temp: number) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (themeId: ThemeType) => void;
  setView: (view: ViewType) => void;
  addProxy: (proxy: ProxyConfig) => void;
  updateProxy: (id: string, proxy: Partial<ProxyConfig>) => void;
  removeProxy: (id: string) => void;
  setActiveProxy: (id: string | null) => void;
  globalProxyEnabled: boolean;
  setGlobalProxyEnabled: (enabled: boolean) => void;
  addPersonalApiKey: (key: string) => void;
  removePersonalApiKey: (key: string) => void;
  setFullScreenStream: (active: boolean) => void;
  setIsGeneratingStream: (active: boolean) => void;
  updateStreamData: (data: string | ((prev: string) => string)) => void;
  updateWorldCreation: (
    data:
      | Partial<GameState["worldCreation"]>
      | ((state: GameState["worldCreation"]) => void),
  ) => void;
  resetWorldCreation: () => void;
  gameData: any;
  setGameData: (data: any) => void;
  setMessages: (
    messages: GameMessage[] | ((prev: GameMessage[]) => GameMessage[]),
  ) => void;
  saveCurrentGame: () => Promise<void>;
  autoSaveCurrentGame: () => Promise<void>;
  loadSave: (id: string) => Promise<boolean>;
  deleteSave: (id: string) => void;
  clearSaves: () => void;
  importSaves: (saves: SaveFile[]) => void;
  resumeLatestGame: () => Promise<boolean>;
  clearApiConfig: () => void;
  resetSettings: () => void;
  memoryFullTurnsCount: number;
  memoryLogsCount: number;
  setMemoryFullTurnsCount: (count: number) => void;
  setMemoryLogsCount: (count: number) => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  useColorEnabled: boolean;
  setUseColorEnabled: (enabled: boolean) => void;
  npcBuilder: {
    prompt: string;
    images: string[];
    generatedNPCs: any[];
    streamedText: string;
    streamedThought: string;
    isInputOpen: boolean;
    expandedNpcIndexes: number[];
  };
  setNpcBuilder: (data: Partial<GameState["npcBuilder"]>) => void;
}

const INITIAL_WORLD_CREATION = {
  initialIdea: "",
  developedIdea: "",
  worldData: {
    name: "",
    difficulty: "",
    background: "",
    starterTimeline: "",
    starterScenario: "",
    worldRules: "",
    namingConventions: "",
    genre: "",
    mainMood: "",
    pacing: "",
    geography: "",
    worldHistory: "",
    culture: "",
    economy: "",
    religion: "",
    factions: "",
    factionRelations: "",
    uniqueElements: "",
    powerSystem: "",
    logicControl: "",
    writingStyle: "",
    narrativePerspective: "",
    worldState: "",
  },
  mcsData: [],
  selectedMcIndex: 0,
  mcData: {
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
    background: "",
    rank: "",
    powers: [],
    skills: [],
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
    inventory: [],
    statusData: {
      mood: [],
      psychological: [],
      physiological: [],
      health: [],
      condition: [],
    },
  },
  npcs: [
    {
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
      needs: "",
      preferences: {
        sfw: "",
        nsfw: "",
      },
      isPinned: false,
      statusData: {
        mood: [],
        psychological: [],
        physiological: [],
        health: [],
        condition: [],
      },
    },
  ],
  worldDetails: {
    places: "",
    locations: [],
  },
};

const customIdbStorage: PersistStorage<GameState> = {
  getItem: async (name: string): Promise<StorageValue<GameState> | null> => {
    return (
      (await storageService.loadItem<StorageValue<GameState>>(name)) || null
    );
  },
  setItem: async (
    name: string,
    value: StorageValue<GameState>,
  ): Promise<void> => {
    await storageService.saveItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await storageService.removeItem(name);
  },
};

export const useStore = create<GameState>()(
  persist(
    immer((set) => ({
      currentThemeId: "deepsea",
      currentView: "characters",
      theme: THEMES.find((t) => t.id === "deepsea") || THEMES[0],
      proxies: [],
      activeProxyId: null,
      globalProxyEnabled: true,
      personalApiKeys: [],
      isFullScreenStream: false,
      isGeneratingStream: false,
      streamStartTime: null,
      fullScreenStreamData: "",
      pendingReparseStreamData: null,
      setPendingReparseStreamData: (data) => set((state) => { state.pendingReparseStreamData = data; }),
      systemLogs: [],
      currentStreamStats: null,
      updateCurrentStreamStats: (stats) =>
        set((state) => {
          if (typeof stats === "function") {
            state.currentStreamStats = stats(state.currentStreamStats);
          } else {
            if (!state.currentStreamStats) {
              state.currentStreamStats = {
                usedApiKey: false,
                usedProxy: null,
                model: "gemini-3.5-flash",
                firstResponseTimeMs: null,
                totalTimeMs: null,
                vietnameseWordCount: 0,
                inputTokens: 0,
                outputTokens: 0,
                timestamp: Date.now(),
              };
            }
            state.currentStreamStats = {
              ...state.currentStreamStats,
              ...stats,
            };
          }
        }),
      resetStreamStats: () =>
        set((state) => {
          state.currentStreamStats = null;
        }),
      worldCreation: INITIAL_WORLD_CREATION,
      saves: [],
      messages: [],
      targetWordCount: 2000,
      temperature: 1.0,
      fontFamily: "Inter",
      fontSize: 16,
      uiMode: "auto",
      selectedAIModel: "gemini-3.5-flash",
      playerRules: "",
      setUiMode: (mode) =>
        set((state) => {
          state.uiMode = mode;
        }),
      setSelectedAIModel: (model) =>
        set((state) => {
          state.selectedAIModel = model;
        }),
      setPlayerRules: (rules) =>
        set((state) => {
          state.playerRules = rules;
        }),
      setTheme: (themeId) =>
        set((state) => {
          const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
          state.currentThemeId = themeId;
          state.theme = theme;
        }),
      setView: (view) =>
        set((state) => {
          state.currentView = view;
        }),
      addProxy: (proxy) =>
        set((state) => {
          state.proxies = [
            ...state.proxies.filter((p) => p.id !== proxy.id),
            proxy,
          ];
          if (!state.activeProxyId) state.activeProxyId = proxy.id;
        }),
      updateProxy: (id, newProxy) =>
        set((state) => {
          const index = state.proxies.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.proxies[index] = { ...state.proxies[index], ...newProxy };
          }
        }),
      removeProxy: (id) =>
        set((state) => {
          state.proxies = state.proxies.filter((p) => p.id !== id);
          if (state.activeProxyId === id) state.activeProxyId = null;
        }),
      setActiveProxy: (id) =>
        set((state) => {
          state.activeProxyId = id;
        }),
      setGlobalProxyEnabled: (enabled) =>
        set((state) => {
          state.globalProxyEnabled = enabled;
        }),
      addPersonalApiKey: (key) =>
        set((state) => {
          if (!state.personalApiKeys.includes(key)) {
            state.personalApiKeys.push(key);
          }
        }),
      removePersonalApiKey: (key) =>
        set((state) => {
          state.personalApiKeys = state.personalApiKeys.filter(
            (k) => k !== key,
          );
        }),
      setTargetWordCount: (count) =>
        set((state) => {
          state.targetWordCount = count;
        }),
      setTemperature: (temp) =>
        set((state) => {
          state.temperature = temp;
        }),
      setFontFamily: (font) =>
        set((state) => {
          state.fontFamily = font;
        }),
      setFontSize: (size) =>
        set((state) => {
          state.fontSize = size;
        }),
      memoryFullTurnsCount: 20,
      memoryLogsCount: 200,
      autoSaveEnabled: true,
      useColorEnabled: true,
      setUseColorEnabled: (enabled) =>
        set((state) => {
          state.useColorEnabled = enabled;
        }),
      setAutoSaveEnabled: (enabled) =>
        set((state) => {
          state.autoSaveEnabled = enabled;
        }),
      setMemoryFullTurnsCount: (count) =>
        set((state) => {
          state.memoryFullTurnsCount = count;
        }),
      setMemoryLogsCount: (count) =>
        set((state) => {
          state.memoryLogsCount = count;
        }),
      setFullScreenStream: (active) =>
        set((state) => {
          state.isFullScreenStream = active;
        }),
      npcBuilder: {
        prompt: "",
        images: [],
        generatedNPCs: [],
        streamedText: "",
        streamedThought: "",
        isInputOpen: true,
        expandedNpcIndexes: [],
      },
      setNpcBuilder: (data) =>
        set((state) => {
          state.npcBuilder = { ...state.npcBuilder, ...data };
        }),
      setIsGeneratingStream: (active: boolean) =>
        set((state) => {
          state.isGeneratingStream = active;
          if (active) {
            state.streamStartTime = Date.now();
          }
        }),
      updateStreamData: (data) =>
        set((state) => {
          state.fullScreenStreamData =
            typeof data === "function"
              ? data(state.fullScreenStreamData)
              : data;
        }),
      setSystemLogs: (log) =>
        set((state) => {
          if (typeof log === "function") {
            state.systemLogs = log(state.systemLogs);
          } else if (typeof log === "string") {
            if (!log) {
              state.systemLogs = [];
            } else {
              state.systemLogs = [
                {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  timestamp: Date.now(),
                  message: log,
                },
                ...state.systemLogs,
              ];
            }
          } else {
            state.systemLogs = log;
          }
        }),
      updateWorldCreation: (data) =>
        set((state) => {
          if (typeof data === "function") {
            data(state.worldCreation);
          } else {
            state.worldCreation = { ...state.worldCreation, ...data };
          }
        }),
      resetWorldCreation: () =>
        set((state) => {
          state.worldCreation = INITIAL_WORLD_CREATION;
          state.fullScreenStreamData = "";
        }),
      gameData: null,
      setGameData: (data) =>
        set((state) => {
          let updatedData =
            typeof data === "function" ? data(state.gameData) : data;
          if (updatedData && !updatedData.id) {
            updatedData.id = Date.now().toString();
          }
          state.gameData = updatedData;
        }),
      setMessages: (updater) =>
        set((state) => {
          if (typeof updater === "function") {
            state.messages = updater(state.messages);
          } else {
            state.messages = updater;
          }
        }),
      saveCurrentGame: async () => {
        const state = useStore.getState();
        if (!state.gameData) return;
        const now = Date.now();

        const gameName = "Matrix Lite v4";
        const worldName = state.gameData.worldData?.name || "Untitled World";
        const mcName = state.gameData.mcData?.name || "MC";

        // Helper tính số lượt chơi chính xác theo turn.index hiển thị trên đầu mỗi phản hồi AI
        const getExactTurnCount = (msgs: GameMessage[]) => {
          const aiMsgsCount = msgs.filter(
            (m) => m.sender === "ai" || m.sender === "system",
          ).length;
          return Math.max(0, aiMsgsCount - 1);
        };

        const turnCount = getExactTurnCount(state.messages);

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

        // Cấu trúc tên: Tên game + tên thế giới + số lượt chơi + tên MC + ngày tháng năm
        const saveName = `${gameName} - ${worldName} - Lượt ${turnCount} - ${mcName} - ${dateStr}`;

        let currentId = state.gameData.id;
        if (!currentId) {
          currentId = now.toString();
        }

        const ragMemories = await ragService.getMemories(currentId);

        set((draft) => {
          if (!draft.gameData.id) draft.gameData.id = currentId;

          const existingIdx = draft.saves.findIndex((s) => {
            const sTurnCount = getExactTurnCount(s.messages);
            return (
              s.gameData?.id === draft.gameData.id &&
              !s.id.endsWith("_auto") &&
              sTurnCount === turnCount
            );
          });

          if (existingIdx >= 0) {
            draft.saves[existingIdx].name = saveName;
            draft.saves[existingIdx].updatedAt = now;
            draft.saves[existingIdx].messages = draft.messages;
            draft.saves[existingIdx].gameData = draft.gameData;
            draft.saves[existingIdx].ragMemories = ragMemories;
            draft.saves[existingIdx].playerRules = draft.playerRules;
          } else {
            draft.saves.push({
              id: now.toString(),
              name: saveName,
              createdAt: now,
              updatedAt: now,
              messages: draft.messages,
              gameData: draft.gameData,
              ragMemories: ragMemories,
              playerRules: draft.playerRules,
            });
          }
        });
      },
      autoSaveCurrentGame: async () => {
        const state = useStore.getState();
        if (!state.autoSaveEnabled || !state.gameData) return;
        const now = Date.now();

        const gameName = "Matrix Lite v4";
        const worldName = state.gameData.worldData?.name || "Untitled World";
        const mcName = state.gameData.mcData?.name || "MC";

        const saveName = `AUTO - ${gameName} - ${worldName} - ${mcName}`;

        let currentId = state.gameData.id;
        if (!currentId) {
          currentId = now.toString();
        }

        const ragMemories = await ragService.getMemories(currentId);
        const autoSaveId = `${currentId}_auto`;

        set((draft) => {
          if (!draft.gameData.id) draft.gameData.id = currentId;

          const existingIdx = draft.saves.findIndex((s) => s.id === autoSaveId);

          if (existingIdx >= 0) {
            draft.saves[existingIdx].name = saveName;
            draft.saves[existingIdx].updatedAt = now;
            draft.saves[existingIdx].messages = draft.messages;
            draft.saves[existingIdx].gameData = draft.gameData;
            draft.saves[existingIdx].ragMemories = ragMemories;
            draft.saves[existingIdx].playerRules = draft.playerRules;
          } else {
            draft.saves.push({
              id: autoSaveId,
              name: saveName,
              createdAt: now,
              updatedAt: now,
              messages: draft.messages,
              gameData: draft.gameData,
              ragMemories: ragMemories,
              playerRules: draft.playerRules,
            });
          }
        });
      },
      loadSave: async (id) => {
        const state = useStore.getState();
        const save = state.saves.find((s) => s.id === id);
        if (!save) return false;

        if (save.ragMemories && save.gameData && save.gameData.id) {
          await ragService.setMemories(save.gameData.id, save.ragMemories);
        }

        let success = false;
        set((draft) => {
          const s = draft.saves.find((x) => x.id === id);
          if (s) {
            draft.gameData = s.gameData;
            draft.messages = s.messages;
            if (s.playerRules !== undefined) {
              draft.playerRules = s.playerRules;
            }
            const lastAiMsg = [...s.messages]
              .reverse()
              .find((m) => m.sender === "ai" || m.sender === "system");
            if (lastAiMsg && lastAiMsg.fullStreamLog) {
              draft.fullScreenStreamData = lastAiMsg.fullStreamLog;
            } else if (lastAiMsg && lastAiMsg.thought) {
              draft.fullScreenStreamData = lastAiMsg.thought;
            } else {
              draft.fullScreenStreamData = "";
            }
            success = true;
          }
        });
        return success;
      },
      deleteSave: (id) =>
        set((state) => {
          state.saves = state.saves.filter((s) => s.id !== id);
        }),
      clearSaves: () =>
        set((state) => {
          state.saves = [];
        }),
      importSaves: (newSaves) =>
        set((state) => {
          if (Array.isArray(newSaves)) {
            const validSaves = newSaves.filter(
              (s) => s.id && s.name && s.gameData,
            );
            validSaves.forEach((newSave) => {
              // Khi tải từ máy lên, nếu tên lưu y hệt thì lưu đè
              const existingIdx = state.saves.findIndex(
                (s) => s.name === newSave.name,
              );
              if (existingIdx >= 0) {
                state.saves[existingIdx] = newSave;
              } else {
                state.saves.push(newSave);
              }
            });
          }
        }),
      resumeLatestGame: async () => {
        let success = false;
        const state = useStore.getState();
        if (state.saves.length > 0) {
          const latest = [...state.saves].sort(
            (a, b) => b.updatedAt - a.updatedAt,
          )[0];
          if (latest.ragMemories && latest.gameData && latest.gameData.id) {
            await ragService.setMemories(
              latest.gameData.id,
              latest.ragMemories,
            );
          }
          set((draft) => {
            draft.gameData = latest.gameData;
            draft.messages = latest.messages;
            if (latest.playerRules !== undefined) {
              draft.playerRules = latest.playerRules;
            }
            const lastAiMsg = [...latest.messages]
              .reverse()
              .find((m) => m.sender === "ai" || m.sender === "system");
            if (lastAiMsg && lastAiMsg.fullStreamLog) {
              draft.fullScreenStreamData = lastAiMsg.fullStreamLog;
            } else if (lastAiMsg && lastAiMsg.thought) {
              draft.fullScreenStreamData = lastAiMsg.thought;
            } else {
              draft.fullScreenStreamData = "";
            }
            success = true;
          });
        }
        return success;
      },
      clearApiConfig: () =>
        set((state) => {
          state.proxies = [];
          state.activeProxyId = null;
          state.personalApiKeys = [];
        }),
      resetSettings: () =>
        set((state) => {
          state.currentThemeId = "deepsea";
          state.theme = THEMES.find((t) => t.id === "deepsea") || THEMES[0];
          state.proxies = [];
          state.activeProxyId = null;
          state.personalApiKeys = [];
          state.targetWordCount = 2000;
          state.temperature = 1.0;
          state.fontFamily = "Inter";
          state.fontSize = 16;
          state.uiMode = "auto";
          state.selectedAIModel = "gemini-3.5-flash";
          state.memoryFullTurnsCount = 20;
          state.memoryLogsCount = 200;
          state.autoSaveEnabled = true;
          state.useColorEnabled = true;
        }),
    })),
    {
      name: "game-storage",
      storage: customIdbStorage,
      partialize: (state) => ({
        currentThemeId: state.currentThemeId,
        theme: state.theme,
        proxies: state.proxies,
        activeProxyId: state.activeProxyId,
        personalApiKeys: state.personalApiKeys,
        worldCreation: state.worldCreation,
        playerRules: state.playerRules,
        saves: state.saves,
        targetWordCount: state.targetWordCount,
        temperature: state.temperature,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        uiMode: state.uiMode,
        selectedAIModel: state.selectedAIModel,
        currentStreamStats: state.currentStreamStats,
        memoryFullTurnsCount: state.memoryFullTurnsCount,
        memoryLogsCount: state.memoryLogsCount,
        autoSaveEnabled: state.autoSaveEnabled,
        useColorEnabled: state.useColorEnabled,
        fullScreenStreamData: state.fullScreenStreamData,
        npcBuilder: state.npcBuilder,
      }),
      merge: (persistedState: any, currentState: GameState) => {
        const merged = { ...currentState, ...persistedState };
        if (persistedState.theme?.id) {
          merged.theme =
            THEMES.find((t) => t.id === persistedState.theme.id) ||
            currentState.theme;
        }
        if (!merged.npcBuilder) {
          merged.npcBuilder = {
            prompt: "",
            images: [],
            generatedNPCs: [],
            streamedText: "",
            streamedThought: "",
            isInputOpen: true,
            expandedNpcIndexes: [],
          };
        }
        return merged;
      },
    },
  ),
);
