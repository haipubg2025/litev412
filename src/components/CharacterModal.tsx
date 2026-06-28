import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  User,
  X,
  Shield,
  Activity,
  Fingerprint,
  BookOpen,
  Star,
  Info,
  Crown,
  Key,
  Edit3,
  Save,
  Flame,
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowDownToLine,
  ArrowUpToLine,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { DEV_IMAGES } from "../constants/devImages";
import LazyImage from "./LazyImage";
import { toast } from "sonner";
import GalleryModal from "./GalleryModal";
import { compressImage } from "../utils/imageCompression";
import { storageService } from "../services/storageService";
import NpcUpdateModal from "./NpcUpdateModal";

interface CharacterModalProps {
  type: "mc" | "npc";
  npcIndex?: number;
  onClose: () => void;
}

interface EditableFieldProps {
  label: string;
  field: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
}

function EditableField({
  label,
  field,
  value,
  isEditing,
  onChange,
  multiline = false,
  className = "",
}: EditableFieldProps) {
  const theme = useStore((state) => state.theme);
  const isDark = theme.group === "Dark";
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span
          className={`text-[10px] uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-500 font-bold"}`}
        >
          {label}
        </span>
      )}
      {isEditing ? (
        multiline ? (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              if (localValue !== value) onChange(localValue);
            }}
            className={`w-full border rounded-lg p-2 text-sm outline-none resize-y min-h-[80px] ${
              isDark
                ? "bg-black/40 border-white/20 text-white/90 focus:border-blue-500/50"
                : "bg-white border-slate-300 text-slate-900 focus:border-blue-600"
            }`}
          />
        ) : (
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              if (localValue !== value) onChange(localValue);
            }}
            className={`w-full border rounded-lg p-2 text-sm outline-none ${
              isDark
                ? "bg-black/40 border-white/20 text-white/90 focus:border-blue-500/50"
                : "bg-white border-slate-300 text-slate-900 focus:border-blue-600"
            }`}
          />
        )
      ) : (
        <span
          className={`text-sm ${multiline ? "leading-relaxed whitespace-pre-wrap" : "font-medium"} ${
            isDark
              ? multiline
                ? "text-white/80"
                : "text-white/90"
              : multiline
                ? "text-slate-700"
                : "text-slate-900"
          } ${!value && "italic opacity-30"}`}
        >
          {value
            ? multiline && typeof value === "string"
              ? value.replace(/<br\s*\/?>/gi, "\n")
              : value
            : "Không có dữ liệu."}
        </span>
      )}
    </div>
  );
}

function EditableArrayField({
  label,
  items,
  isEditing,
  onChange,
  itemLabel = "Item",
}: {
  label: string;
  items: Array<any>;
  isEditing: boolean;
  onChange: (val: Array<any>) => void;
  itemLabel?: string;
}) {
  const theme = useStore((state) => state.theme);
  const isDark = theme.group === "Dark";
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span
          className={`text-[10px] uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-500 font-bold"}`}
        >
          {label}
        </span>
      )}
      {isEditing ? (
        <div className="space-y-3">
          {arr.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-black/40 border-white/20" : "bg-white border-slate-300"}`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Tên ${itemLabel}`}
                  value={item.name || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], name: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-1 border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Loại"
                  value={item.type || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], type: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-1 border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Cấp độ"
                  value={item.level || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], level: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-[0.8] border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
              <textarea
                placeholder="Mô tả chi tiết"
                value={item.description || ""}
                onChange={(e) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], description: e.target.value };
                  onChange(newArr);
                }}
                className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none resize-y min-h-[50px] ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
              />
              <button
                onClick={() => {
                  const newArr = arr.filter((_, idx) => idx !== i);
                  onChange(newArr);
                }}
                className="self-end px-2 py-1 text-[10px] uppercase font-bold rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newArr = [
                ...arr,
                { name: "", description: "", type: "", level: "" },
              ];
              onChange(newArr);
            }}
            className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-colors ${isDark ? "border-white/20 hover:bg-white/10 text-white/80" : "border-slate-300 hover:bg-slate-100 text-slate-600"} cursor-pointer`}
          >
            + Thêm {itemLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {arr.length === 0 && (
            <span
              className={`text-sm italic opacity-50 ${isDark ? "text-white" : "text-slate-600"}`}
            >
              Chưa có thông tin.
            </span>
          )}
          {arr.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex flex-wrap gap-2 items-center mb-1">
                <h4
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {item.name || "Không tên"}
                </h4>
                {item.type && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${isDark ? "bg-white/10 text-teal-300" : "bg-teal-100 text-teal-800 font-bold"}`}
                  >
                    {item.type}
                  </span>
                )}
                {item.level && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-800 font-bold"}`}
                  >
                    {item.level}
                  </span>
                )}
              </div>
              {item.description && (
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap opacity-80 ${isDark ? "text-white" : "text-slate-700"}`}
                >
                  {typeof item.description === "string"
                    ? item.description.replace(/<br\s*\/?>/gi, "\n")
                    : item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableRelationshipArrayField({
  label,
  items,
  isEditing,
  onChange,
}: {
  label: string;
  items: Array<any>;
  isEditing: boolean;
  onChange: (val: Array<any>) => void;
}) {
  const theme = useStore((state) => state.theme);
  const isDark = theme.group === "Dark";
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span
          className={`text-[10px] uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-500 font-bold"}`}
        >
          {label}
        </span>
      )}
      {isEditing ? (
        <div className="space-y-3">
          {arr.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-black/40 border-white/20" : "bg-white border-slate-300"}`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Họ và tên nhân vật"
                  value={item.name || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], name: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-[1.5] border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Quan hệ"
                  value={item.relation || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], relation: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-1 border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Tình trạng"
                  value={item.status || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], status: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-[0.8] border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ấn tượng và suy nghĩ"
                  value={item.impression || ""}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], impression: e.target.value };
                    onChange(newArr);
                  }}
                  className={`w-full flex-[1.5] border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Cách xưng hô với họ (cách nhau bởi phẩy)"
                  value={
                    Array.isArray(item.termsOfAddress)
                      ? item.termsOfAddress.join(", ")
                      : item.termsOfAddress || ""
                  }
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = {
                      ...newArr[i],
                      termsOfAddress: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    };
                    onChange(newArr);
                  }}
                  className={`w-full flex-1 border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <input
                  type="text"
                  placeholder="Cách tự xưng bản thân (cách nhau bởi phẩy)"
                  value={
                    Array.isArray(item.selfAppellation)
                      ? item.selfAppellation.join(", ")
                      : item.selfAppellation || ""
                  }
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = {
                      ...newArr[i],
                      selfAppellation: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    };
                    onChange(newArr);
                  }}
                  className={`w-full flex-1 border rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
              <textarea
                placeholder="Mô tả chi tiết"
                value={item.description || ""}
                onChange={(e) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], description: e.target.value };
                  onChange(newArr);
                }}
                className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none resize-y min-h-[50px] ${isDark ? "bg-black/60 border-white/20 text-white/90 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800"}`}
              />
              <button
                onClick={() => {
                  const newArr = arr.filter((_, idx) => idx !== i);
                  onChange(newArr);
                }}
                className="self-end px-2 py-1 text-[10px] uppercase font-bold rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newArr = [
                ...arr,
                { name: "", description: "", relation: "", status: "" },
              ];
              onChange(newArr);
            }}
            className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-colors ${isDark ? "border-white/20 hover:bg-white/10 text-white/80" : "border-slate-300 hover:bg-slate-100 text-slate-600"} cursor-pointer`}
          >
            + Thêm Quan Hệ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {arr.length === 0 && (
            <span
              className={`text-sm italic opacity-50 ${isDark ? "text-white" : "text-slate-600"}`}
            >
              Chưa có thông tin.
            </span>
          )}
          {arr.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex flex-wrap gap-2 items-center mb-1">
                <h4
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {item.name || "Không tên"}
                </h4>
                {item.relation && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${isDark ? "bg-white/10 text-teal-300" : "bg-teal-100 text-teal-800 font-bold"}`}
                  >
                    {item.relation}
                  </span>
                )}
                {item.status && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${isDark ? "bg-pink-500/20 text-pink-300" : "bg-pink-100 text-pink-800 font-bold"}`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
              {item.impression && (
                <div className="mb-1 text-xs">
                  <span
                    className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Ấn tượng:{" "}
                  </span>
                  <span
                    className={`${isDark ? "text-white/80" : "text-slate-700"}`}
                  >
                    {item.impression}
                  </span>
                </div>
              )}
              {((item.termsOfAddress && item.termsOfAddress.length > 0) ||
                (item.selfAppellation && item.selfAppellation.length > 0)) && (
                <div className="mb-2 flex flex-col gap-1">
                  {item.termsOfAddress && item.termsOfAddress.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span
                        className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Gọi họ là:
                      </span>
                      {item.termsOfAddress.map((term: string, idx: number) => (
                        <span
                          key={idx}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isDark ? "border-white/20 text-white/60 bg-white/5" : "border-slate-200 text-slate-600 bg-slate-100"}`}
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.selfAppellation && item.selfAppellation.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span
                        className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Tự xưng là:
                      </span>
                      {item.selfAppellation.map((term: string, idx: number) => (
                        <span
                          key={idx}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isDark ? "border-white/20 text-white/60 bg-white/5" : "border-slate-200 text-slate-600 bg-slate-100"}`}
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {item.description && (
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap opacity-80 mt-1 ${isDark ? "text-white" : "text-slate-700"}`}
                >
                  {typeof item.description === "string"
                    ? item.description.replace(/<br\s*\/?>/gi, "\n")
                    : item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CharacterModal({
  type,
  npcIndex,
  onClose,
}: CharacterModalProps) {
  const gameData = useStore((state) => state.gameData);
  const setGameData = useStore((state) => state.setGameData);
  const theme = useStore((state) => state.theme);
  const isDark = theme.group === "Dark";
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chung" | "tui">("chung");
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [activeVersion, setActiveVersion] = useState<"1" | "2">("2");
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  const [isAppearanceCollapsed, setIsAppearanceCollapsed] = useState(() => {
    return localStorage.getItem("hideNpcAppearance") === "true";
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const toggleAppearanceCollapse = () => {
    const newState = !isAppearanceCollapsed;
    setIsAppearanceCollapsed(newState);
    localStorage.setItem("hideNpcAppearance", String(newState));
  };

  const handleDeleteNPC = () => {
    if (!gameData || type !== "npc" || npcIndex === undefined) return;
    const origNpcs = gameData.originalNpcs
      ? gameData.originalNpcs.filter((_: any, idx: number) => idx !== npcIndex)
      : gameData.npcs.filter((_: any, idx: number) => idx !== npcIndex);
    const newNpcs = gameData.npcs.filter(
      (_: any, idx: number) => idx !== npcIndex,
    );
    setGameData({ ...gameData, originalNpcs: origNpcs, npcs: newNpcs });
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setActiveTab("chung");
  }, [type, npcIndex]);

  useEffect(() => {
    if (!gameData) return;

    setEditedData((prev: any) => {
      // Step 1: Resolve the new current source data
      let sourceData: any;
      if (type === "mc") {
        sourceData =
          activeVersion === "1"
            ? gameData.originalMcData || gameData.mcData
            : gameData.mcData;
      } else {
        sourceData =
          activeVersion === "1"
            ? gameData.originalNpcs?.[npcIndex as number] ||
              gameData.npcs[npcIndex as number]
            : gameData.npcs[npcIndex as number];
      }

      // Step 2: Initialize if not present or actively changing versions
      if (
        !prev ||
        prev.activeVersionResolved !== activeVersion ||
        prev.typeResolved !== type
      ) {
        return {
          ...sourceData,
          activeVersionResolved: activeVersion,
          typeResolved: type,
        };
      }

      // Step 3: If already initialized, safely sync only the pendingUpdates to prevent overwriting user input
      if (
        type === "npc" &&
        JSON.stringify(prev.pendingUpdates) !==
          JSON.stringify(sourceData?.pendingUpdates)
      ) {
        return { ...prev, pendingUpdates: sourceData?.pendingUpdates };
      }

      return prev;
    });
  }, [gameData, type, npcIndex, activeVersion]);

  if (!gameData || !editedData) return null;

  const getHeaderColorClass = (colorType: string) => {
    const isDark = theme.group === "Dark";
    switch (colorType) {
      case "blue":
        return isDark ? "text-blue-400" : "text-blue-600 font-extrabold";
      case "emerald":
        return isDark ? "text-emerald-400" : "text-emerald-600 font-extrabold";
      case "pink":
        return isDark ? "text-pink-400" : "text-pink-600 font-extrabold";
      case "red":
        return isDark ? "text-red-400" : "text-red-600 font-extrabold";
      case "amber":
        return isDark ? "text-amber-400" : "text-amber-600 font-extrabold";
      case "purple":
        return isDark ? "text-purple-400" : "text-purple-600 font-extrabold";
      case "teal":
        return isDark ? "text-teal-400" : "text-teal-600 font-extrabold";
      case "sky":
        return isDark ? "text-sky-400" : "text-sky-600 font-extrabold";
      case "rose":
        return isDark ? "text-rose-400" : "text-rose-650 font-extrabold";
      case "slate":
        return isDark ? "text-slate-400" : "text-slate-600 font-extrabold";
      case "yellow":
        return isDark ? "text-yellow-400" : "text-amber-600 font-extrabold";
      default:
        return isDark ? "text-white" : "text-slate-900 font-extrabold";
    }
  };

  const handleSave = () => {
    if (type === "mc") {
      if (activeVersion === "1") {
        setGameData({
          ...gameData,
          originalMcData: editedData,
        });
      } else {
        setGameData({
          ...gameData,
          mcData: editedData,
        });
      }
    } else if (type === "npc" && npcIndex !== undefined) {
      if (activeVersion === "1") {
        const origNpcs = gameData.originalNpcs
          ? [...gameData.originalNpcs]
          : [...gameData.npcs];
        origNpcs[npcIndex] = editedData;
        setGameData({
          ...gameData,
          originalNpcs: origNpcs,
        });
      } else {
        const newNpcs = [...gameData.npcs];
        newNpcs[npcIndex] = editedData;
        setGameData({
          ...gameData,
          npcs: newNpcs,
        });
      }
    }
    setIsEditing(false);
  };

  const handleAvatarChange = (url: string) => {
    handleChange("avatar", url);
    if (!isEditing) {
      if (type === "mc") {
        if (activeVersion === "1") {
          const newMcData = { ...editedData, avatar: url };
          setGameData({ ...gameData, originalMcData: newMcData });
        } else {
          const newMcData = { ...editedData, avatar: url };
          setGameData({ ...gameData, mcData: newMcData });
        }
      } else if (type === "npc" && npcIndex !== undefined) {
        if (activeVersion === "1") {
          const origNpcs = gameData.originalNpcs
            ? [...gameData.originalNpcs]
            : [...gameData.npcs];
          origNpcs[npcIndex] = { ...editedData, avatar: url };
          setGameData({ ...gameData, originalNpcs: origNpcs });
        } else {
          const newNpcs = [...gameData.npcs];
          newNpcs[npcIndex] = { ...editedData, avatar: url };
          setGameData({ ...gameData, npcs: newNpcs });
        }
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file) {
        try {
          // Compress keeping at least 80% quality, max width 1024px
          const base64Data = await compressImage(file, 0.8, 1024);
          const imgId = Date.now().toString();
          const localKey = await storageService.saveImage(imgId, base64Data);

          handleAvatarChange(localKey);

          // Add to gallery
          const newImg = {
            id: "img-" + imgId,
            tabId: "default-player-tab",
            url: localKey,
            name: file.name,
          };

          setGameData((prev: any) => {
            if (!prev) return prev;
            const currentGallery = prev.gallery || {};
            const gallery = {
              devImages: currentGallery.devImages || DEV_IMAGES,
              playerTabs: currentGallery.playerTabs || [
                { id: "default-player-tab", name: "Chung" },
              ],
              playerImages: currentGallery.playerImages || [],
            };
            return {
              ...prev,
              gallery: {
                ...gallery,
                playerImages: [...(gallery.playerImages || []), newImg],
              },
            };
          });
          toast.success("Thay ảnh thành công và đã lưu vào thư viện!");
        } catch (err) {
          console.error(err);
          toast.error("Lỗi khi tải hoặc nén ảnh");
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowAvatarSelect(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarSelect(true);
  };

  // Group fields logically
  const basicFields = [
    { label: "Tên đầy đủ", field: "fullName" },
    { label: "Tuổi", field: "age" },
    { label: "Giới tính", field: "gender" },
    { label: "Ngày sinh", field: "dob" },
    { label: "Chiều cao", field: "height" },
    { label: "Cân nặng", field: "weight" },
    { label: "Số đo 3 vòng", field: "measurements" },
  ];

  const identityFields = [
    { label: "Danh xưng", field: "titles" },
    { label: "Nghề nghiệp", field: "occupation" },
    { label: "Cấp bậc", field: "rank" },
    ...(type === "npc" ? [{ label: "Vai trò", field: "role" }] : []),
  ];

  const submitUrl = () => {
    if (!urlInputValue.trim()) return;
    const url = urlInputValue.trim();
    handleAvatarChange(url);

    // Add to gallery
    const newImg = {
      id: "img-" + Date.now(),
      tabId: "default-player-tab",
      url,
      name: "Ảnh từ URL",
    };
    const gallery = {
      devImages: gameData.gallery?.devImages || DEV_IMAGES,
      playerTabs: gameData.gallery?.playerTabs || [
        { id: "default-player-tab", name: "Chung" },
      ],
      playerImages: gameData.gallery?.playerImages || [],
    };
    setGameData((prev: any) => ({
      ...prev,
      gallery: {
        ...gallery,
        playerImages: [...(gallery.playerImages || []), newImg],
      },
    }));
    toast.success("Thay ảnh thành công và đã lưu vào thư viện!");

    setShowUrlInput(false);
    setShowAvatarSelect(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 z-50 backdrop-blur-md flex flex-col w-[100dvw] h-[100dvh] p-0 m-0 overflow-hidden ${isDark ? "bg-black/80" : "bg-amber-900/15"}`}
      onClick={onClose}
    >
      <div
        className={`w-full h-full flex flex-col relative rounded-none border-0 overflow-hidden ${
          isDark ? theme.bgClass : "bg-[#FAF7F0]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute top-0 left-0 w-full h-96 bg-gradient-to-b ${
            isDark ? "from-blue-900/20" : "from-blue-600/5"
          } to-transparent pointer-events-none`}
        />

        {/* Header */}
        <div
          className={`p-2 md:p-3 flex items-center justify-between shrink-0 relative z-20 border-b backdrop-blur-md ${
            isDark
              ? "border-white/5 bg-black/60"
              : "border-amber-200/60 bg-[#FFFDF9]/95 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`text-sm font-bold uppercase tracking-widest drop-shadow-sm border rounded p-1 px-2 w-full max-w-xs outline-none ${
                    isDark
                      ? "text-white bg-black/40 border-white/20 focus:border-blue-500/50"
                      : "text-[#3E2723] bg-white border-amber-250 focus:border-blue-600"
                  }`}
                  placeholder="TÊN NHÂN VẬT"
                />
              ) : (
                <h2
                  className={`text-sm font-bold uppercase tracking-wider drop-shadow-sm ${
                    isDark ? "text-white" : "text-[#3E2723] font-black"
                  }`}
                >
                  {editedData.name ||
                    (type === "mc" ? "TRUYỀN KỲ MC" : "NHÂN VẬT KHẨN CẤP")}
                </h2>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 mr-2 p-1 rounded-lg border ${
                isDark
                  ? "bg-black/50 border-white/10"
                  : "bg-amber-100/60 border-amber-250 shadow-inner"
              }`}
            >
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActiveVersion("1");
                }}
                className={`px-3 py-1.5 rounded-md font-bold text-sm transition-all ${
                  activeVersion === "1"
                    ? "bg-blue-600 text-white shadow-md"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white/80 hover:bg-white/5"
                      : "bg-transparent text-[#5C4033]/70 hover:text-[#3E2723] hover:bg-amber-500/10"
                }`}
                title="Bản gốc"
              >
                1
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActiveVersion("2");
                }}
                className={`px-3 py-1.5 rounded-md font-bold text-sm transition-all ${
                  activeVersion === "2"
                    ? "bg-blue-600 text-white shadow-md"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white/80 hover:bg-white/5"
                      : "bg-transparent text-[#5C4033]/70 hover:text-[#3E2723] hover:bg-amber-500/10"
                }`}
                title="Bản hiện tại"
              >
                2
              </button>
            </div>
            {isEditing ? (
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  theme.group === "Dark"
                    ? "bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                }`}
                title="Lưu"
              >
                <Save size={16} />
                <span className="hidden md:inline font-bold tracking-wider text-xs">
                  LƯU
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border cursor-pointer font-bold select-none ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm"
                }`}
                title="Chỉnh sửa"
              >
                <Edit3 size={16} />
                <span className="hidden md:inline font-bold tracking-wider text-xs">
                  SỬA
                </span>
              </button>
            )}
            <button
              onClick={scrollToBottom}
              className={`p-1.5 rounded-lg transition-colors border cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm"
              }`}
              title="Cuộn xuống cuối"
            >
              <ArrowDownToLine size={18} />
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-amber-100 hover:bg-amber-200 text-[#5C4033] border-amber-200 shadow-sm"
              }`}
              title="Đóng (Phím Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full flex flex-col"
        >
          <div className="flex flex-col xl:flex-row p-4 md:p-8 gap-8 w-full mx-auto flex-1">
            {/* Left Column: Avatar */}
            <div className="flex flex-col items-center xl:items-start xl:w-[420px] shrink-0">
              <div
                className="w-64 md:w-80 xl:w-full aspect-[3/4] rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shadow-2xl shadow-blue-500/10 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-blue-500/30 group relative transition-all duration-300"
                onClick={handleAvatarClick}
                title="Nhấn để đổi ảnh đại diện"
              >
                {editedData.avatar ? (
                  <LazyImage
                    src={editedData.avatar}
                    alt="Avatar"
                    className="w-full h-full"
                  />
                ) : (
                  <User size={80} className="text-blue-400/50" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                  <Edit3 size={32} className="text-white drop-shadow-md" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {type === "npc" && (
                <div className="w-full mt-4 flex justify-center xl:justify-start">
                  {activeVersion === "1" ? (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Bạn có chắc muốn đồng bộ dữ liệu từ bản Số 2 (Hiện hành) sang bản gốc Số 1 không?",
                          )
                        ) {
                          setGameData((prev: any) => {
                            const currentNpcs = prev.npcs || [];
                            const origNpcs = [
                              ...(prev.originalNpcs || currentNpcs),
                            ];
                            const syncedNpc = JSON.parse(
                              JSON.stringify(currentNpcs[npcIndex as number]),
                            );
                            origNpcs[npcIndex as number] = syncedNpc;

                            // Cập nhật ngay editedData để giao diện phản hồi lập tức
                            setEditedData({
                              ...syncedNpc,
                              activeVersionResolved: activeVersion,
                              typeResolved: type,
                            });

                            return { ...prev, originalNpcs: origNpcs };
                          });
                          toast.success(
                            "Đã đồng bộ bản gốc với bản hiện hành!",
                          );
                        }
                      }}
                      className="w-full max-w-[320px] font-bold py-3 px-4 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0"
                    >
                      <Check size={18} /> Đồng bộ từ bản số 2 (Hiện hành)
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmUpdateModal(true)}
                      className={`w-full max-w-[320px] font-bold py-3 px-4 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 ${
                        editedData?.pendingUpdates &&
                        Object.keys(editedData.pendingUpdates).length > 0
                          ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 hover:-translate-y-1 active:translate-y-0"
                          : "bg-slate-500/50 hover:bg-slate-600/50 text-white shadow-slate-500/20 hover:-translate-y-1 active:translate-y-0"
                      }`}
                    >
                      <Check size={18} />{" "}
                      {editedData?.pendingUpdates &&
                      Object.keys(editedData.pendingUpdates).length > 0
                        ? "Xác Nhận Update NPC"
                        : "Không có Update mới (Bấm để xem)"}
                      {editedData?.pendingUpdates &&
                        Object.keys(editedData.pendingUpdates).length > 0 && (
                          <span className="bg-white text-green-600 text-xs px-2 py-0.5 rounded-full">
                            {Object.keys(editedData.pendingUpdates).length}
                          </span>
                        )}
                    </button>
                  )}
                </div>
              )}

              {/* Tab Navigation (MC only) moved below avatar implicitly visually, or we can keep it on the right side */}
              {type === "mc" && (
                <div className="flex items-center justify-center xl:justify-start gap-4 mt-6 w-full relative z-10 shrink-0">
                  <button
                    onClick={() => setActiveTab("chung")}
                    className={`flex-1 py-3 font-bold tracking-wider text-sm uppercase transition-all border-2 rounded-xl ${
                      activeTab === "chung"
                        ? "text-blue-600 border-blue-500/50 bg-blue-500/10"
                        : isDark
                          ? "text-white/40 border-white/5 bg-white/5 hover:text-white/80 hover:bg-white/10"
                          : "text-[#5C4033]/70 border-amber-200/60 bg-amber-100/50 hover:text-[#3E2723] hover:bg-amber-100"
                    }`}
                  >
                    Chung
                  </button>
                  <button
                    onClick={() => setActiveTab("tui")}
                    className={`flex-1 py-3 font-bold tracking-wider text-sm uppercase transition-all border-2 rounded-xl ${
                      activeTab === "tui"
                        ? "text-blue-600 border-blue-500/50 bg-blue-500/10"
                        : isDark
                          ? "text-white/40 border-white/5 bg-white/5 hover:text-white/80 hover:bg-white/10"
                          : "text-[#5C4033]/70 border-amber-200/60 bg-amber-100/50 hover:text-[#3E2723] hover:bg-amber-100"
                    }`}
                  >
                    Túi / Tài sản
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Content Areas */}
            <div className="w-full flex-1">
              {activeTab === "chung" && (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8 w-full">
                  {/* Cột trái: Thông tin cơ bản & Đặc điểm */}
                  <div className="space-y-6 md:col-span-1">
                    {/* Identity Box */}
                    <div className="p-5 rounded-2xl theme-panel relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("blue")}`}
                      >
                        <Crown size={16} /> Danh Tính
                      </h3>
                      <div className="flex flex-col gap-3 relative z-10">
                        {identityFields.map((item, idx) => (
                          <EditableField
                            key={idx}
                            label={item.label}
                            field={item.field}
                            value={editedData[item.field] || ""}
                            isEditing={isEditing}
                            onChange={(val) => handleChange(item.field, val)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Basic Info Box */}
                    <div className="p-5 rounded-2xl theme-panel">
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("emerald")}`}
                      >
                        <Info size={16} /> Nhận Dạng Cơ Bản
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {basicFields.map((item, idx) => (
                          <EditableField
                            key={idx}
                            label={item.label}
                            field={item.field}
                            value={editedData[item.field] || ""}
                            isEditing={isEditing}
                            onChange={(val) => handleChange(item.field, val)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Appearance & Distinguishing Features */}
                    <div className="p-5 rounded-2xl theme-panel">
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("pink")}`}
                      >
                        <Fingerprint size={16} /> Ngoại Hình & Dấu Hiệu
                      </h3>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1 -mt-1">
                          <div
                            className={`flex items-center justify-between cursor-pointer py-1 transition-colors ${isDark ? "text-white/40 hover:text-white/80" : "text-slate-500 hover:text-slate-800"}`}
                            onClick={toggleAppearanceCollapse}
                          >
                            <span className="text-[10px] uppercase tracking-widest font-bold">
                              Miêu tả ngoại hình
                            </span>
                            {isAppearanceCollapsed ? (
                              <ChevronRight size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                          {!isAppearanceCollapsed && (
                            <div className="!mt-0">
                              <EditableField
                                label=""
                                field="appearance"
                                value={editedData.appearance || ""}
                                isEditing={isEditing}
                                onChange={(val) =>
                                  handleChange("appearance", val)
                                }
                                multiline
                              />
                            </div>
                          )}
                        </div>
                        <EditableField
                          label="Miêu tả Lite"
                          field="appearanceLite"
                          value={editedData.appearanceLite || ""}
                          isEditing={isEditing}
                          onChange={(val) =>
                            handleChange("appearanceLite", val)
                          }
                          multiline
                        />
                        <EditableField
                          label="Đặc điểm nhận dạng phụ"
                          field="distinguishingFeatures"
                          value={editedData.distinguishingFeatures || ""}
                          isEditing={isEditing}
                          onChange={(val) =>
                            handleChange("distinguishingFeatures", val)
                          }
                          multiline
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cột Giữa & Phải: Sức mạnh, Kỹ năng, Tính cách & Tiểu sử */}
                  <div className="space-y-6 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Powers Box */}
                      <div className="p-5 md:p-6 rounded-2xl theme-panel">
                        <h3
                          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 ${getHeaderColorClass("red")}`}
                        >
                          <Activity size={16} /> Sức Mạnh / Năng Lực
                        </h3>
                        <EditableArrayField
                          itemLabel="Năng Lực"
                          label=""
                          items={editedData.powers || []}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("powers", val)}
                        />
                      </div>

                      {/* Skills Box */}
                      <div className="p-5 md:p-6 rounded-2xl theme-panel">
                        <h3
                          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 ${getHeaderColorClass("amber")}`}
                        >
                          <Star size={16} /> Kỹ Năng Chuyên Môn
                        </h3>
                        <EditableArrayField
                          itemLabel="Kỹ Năng"
                          label=""
                          items={editedData.skills || []}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("skills", val)}
                        />
                      </div>
                    </div>

                    {/* Personal & Psychological Profile */}
                    <div className="p-5 md:p-6 rounded-2xl theme-panel">
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("purple")}`}
                      >
                        <BookOpen size={16} /> Hồ Sơ Tâm Lý
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField
                          label="Tính cách tổng quan"
                          field="personality"
                          value={editedData.personality || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("personality", val)}
                          multiline
                        />
                        <EditableField
                          label="Cốt lõi tính cách (Bản ngã)"
                          field="personalityCore"
                          value={editedData.personalityCore || ""}
                          isEditing={isEditing}
                          onChange={(val) =>
                            handleChange("personalityCore", val)
                          }
                          multiline
                        />

                        <EditableField
                          label="Kim chỉ nam / Lý tưởng"
                          field="philosophy"
                          value={editedData.philosophy || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("philosophy", val)}
                          multiline
                          className="col-span-1 md:col-span-2 pt-3 border-t border-white/5"
                        />
                        <EditableField
                          label="Mục tiêu tối thượng"
                          field="goal"
                          value={editedData.goal || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("goal", val)}
                          multiline
                          className="col-span-1 md:col-span-2 pt-3 border-t border-white/5"
                        />

                        {type !== "mc" && (
                          <EditableField
                            label="Nhu cầu (SFW & NSFW)"
                            field="needs"
                            value={editedData.needs || ""}
                            isEditing={isEditing}
                            onChange={(val) => handleChange("needs", val)}
                            multiline
                            className="col-span-1 md:col-span-2 pt-3 border-t border-white/5"
                          />
                        )}

                        {type !== "mc" && (
                          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/5">
                            <EditableField
                              label="Sở thích, Ghét, Nỗi sợ (SFW)"
                              field="preferences_sfw"
                              value={editedData.preferences?.sfw || ""}
                              isEditing={isEditing}
                              onChange={(val) =>
                                setEditedData((prev: any) => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    sfw: val,
                                  },
                                }))
                              }
                              multiline
                            />
                            <EditableField
                              label="Sở thích, Ghét, Nỗi sợ (NSFW)"
                              field="preferences_nsfw"
                              value={editedData.preferences?.nsfw || ""}
                              isEditing={isEditing}
                              onChange={(val) =>
                                setEditedData((prev: any) => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    nsfw: val,
                                  },
                                }))
                              }
                              multiline
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-2 col-span-1 md:col-span-2 pt-3 border-t border-white/5">
                          <span className="text-[10px] uppercase tracking-widest text-purple-400/80 flex items-center gap-1">
                            <Key size={12} /> Nội tâm / Suy nghĩ thầm kín
                          </span>
                          {isEditing ? (
                            <textarea
                              value={editedData.innerSecret || ""}
                              onChange={(e) =>
                                handleChange("innerSecret", e.target.value)
                              }
                              className={`w-full border rounded-lg p-2 text-sm outline-none focus:border-purple-500/50 resize-y min-h-[80px] ${
                                isDark
                                  ? "bg-black/40 border-white/20 text-purple-200/90"
                                  : "bg-white border-purple-200 text-[#3E2723] focus:ring-1 focus:ring-purple-300"
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-sm leading-relaxed whitespace-pre-wrap italic ${isDark ? "text-purple-200/70" : "text-purple-900/80 font-medium"}`}
                            >
                              {editedData.innerSecret || (
                                <span className="italic opacity-30">
                                  Không có dữ liệu.
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Background & Relationships */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-5 md:p-6 rounded-2xl theme-panel">
                        <h3
                          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 ${getHeaderColorClass("teal")}`}
                        >
                          <BookOpen size={16} /> Nguồn gốc / Xuất thân
                        </h3>
                        <EditableField
                          label=""
                          field="background"
                          value={editedData.background || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("background", val)}
                          multiline
                        />
                      </div>

                      {type === "npc" && (
                        <div className="p-5 md:p-6 rounded-2xl theme-panel">
                          <h3
                            className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 ${getHeaderColorClass("sky")}`}
                          >
                            <Users size={16} /> Tổng quan các quan hệ
                          </h3>
                          <EditableRelationshipArrayField
                            label=""
                            items={editedData.relationships || []}
                            isEditing={isEditing}
                            onChange={(val) =>
                              handleChange("relationships", val)
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* NSFW & Romance */}
                    <div className="p-5 md:p-6 rounded-2xl theme-panel">
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("rose")}`}
                      >
                        <Flame size={16} /> Lãng mạn & Tình dục (NSFW)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField
                          label="Quan niệm tình yêu & Tình dục"
                          field="loveViews"
                          value={editedData.loveViews || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("loveViews", val)}
                          multiline
                        />
                        <EditableField
                          label="Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)"
                          field="experience"
                          value={editedData.experience || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("experience", val)}
                          multiline
                        />

                        <EditableField
                          label="Tính cách khi NSFW"
                          field="nsfwPersonality"
                          value={editedData.nsfwPersonality || ""}
                          isEditing={isEditing}
                          onChange={(val) =>
                            handleChange("nsfwPersonality", val)
                          }
                          multiline
                          className="pt-3 border-t border-white/5"
                        />
                        <EditableField
                          label="Phản ứng đặc trưng (NSFW)"
                          field="nsfwReactions"
                          value={editedData.nsfwReactions || ""}
                          isEditing={isEditing}
                          onChange={(val) => handleChange("nsfwReactions", val)}
                          multiline
                          className="pt-3 border-t border-white/5"
                        />
                      </div>
                    </div>

                    {/* Literary Description */}
                    <div className="p-5 md:p-6 rounded-2xl theme-panel">
                      <h3
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 ${getHeaderColorClass("slate")}`}
                      >
                        <FileText size={16} /> Miêu tả văn học (Dành cho ngữ
                        cảnh)
                      </h3>
                      <EditableField
                        label=""
                        field="literaryDescription"
                        value={editedData.literaryDescription || ""}
                        isEditing={isEditing}
                        onChange={(val) =>
                          handleChange("literaryDescription", val)
                        }
                        multiline
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tui" && type === "mc" && (
                <div className="w-full">
                  <div className="p-5 md:p-6 rounded-2xl theme-panel mt-6">
                    <h3
                      className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${getHeaderColorClass("yellow")}`}
                    >
                      Tài sản & Vật phẩm (Túi)
                    </h3>
                    <div className="inventory-editor">
                      {isEditing ? (
                        <div className="space-y-4">
                          {(Array.isArray(editedData.inventory)
                            ? editedData.inventory
                            : []
                          ).map((item: any, idx: number) => (
                            <div
                              key={item.id || idx}
                              className={`p-4 rounded-xl flex flex-col gap-2 border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}
                            >
                              <div className="flex gap-4 items-center">
                                <input
                                  className={`flex-1 text-sm font-bold bg-transparent border-b outline-none pb-1 ${isDark ? "text-white border-white/20 focus:border-white/50" : "text-slate-900 border-slate-300 focus:border-slate-500"}`}
                                  value={item.name}
                                  onChange={(e) => {
                                    const newInv = [...editedData.inventory];
                                    newInv[idx] = {
                                      ...newInv[idx],
                                      name: e.target.value,
                                    };
                                    handleChange("inventory", newInv as any);
                                  }}
                                  placeholder="Tên vật phẩm"
                                />
                                <input
                                  type="number"
                                  className={`w-16 text-sm text-center bg-transparent border-b outline-none pb-1 ${isDark ? "text-white border-white/20 focus:border-white/50" : "text-slate-900 border-slate-300 focus:border-slate-500"}`}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newInv = [...editedData.inventory];
                                    newInv[idx] = {
                                      ...newInv[idx],
                                      quantity: Number(e.target.value),
                                    };
                                    handleChange("inventory", newInv as any);
                                  }}
                                  placeholder="SL"
                                />
                                <button
                                  onClick={() => {
                                    const newInv = [...editedData.inventory];
                                    newInv.splice(idx, 1);
                                    handleChange("inventory", newInv as any);
                                  }}
                                  className="text-red-500 hover:text-red-400 p-1 font-bold text-xs shrink-0"
                                >
                                  XÓA
                                </button>
                              </div>
                              <textarea
                                className={`w-full text-xs bg-transparent outline-none resize-none pt-1 min-h-[40px] ${isDark ? "text-white/70" : "text-slate-600"}`}
                                value={item.description || ""}
                                onChange={(e) => {
                                  const newInv = [...editedData.inventory];
                                  newInv[idx] = {
                                    ...newInv[idx],
                                    description: e.target.value,
                                  };
                                  handleChange("inventory", newInv as any);
                                }}
                                placeholder="Mô tả công dụng..."
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              let newInv = Array.isArray(editedData.inventory)
                                ? [...editedData.inventory]
                                : [];
                              if (
                                typeof editedData.inventory === "string" &&
                                editedData.inventory.trim() !== ""
                              ) {
                                newInv = [
                                  {
                                    id: "item_1",
                                    name: "Vật phẩm cũ",
                                    quantity: 1,
                                    description: editedData.inventory,
                                  },
                                ];
                              }
                              newInv.push({
                                id: `item_${Date.now()}`,
                                name: "",
                                quantity: 1,
                                description: "",
                              });
                              handleChange("inventory", newInv as any);
                            }}
                            className={`w-full p-3 rounded-xl border border-dashed text-xs uppercase tracking-widest font-bold transition-colors mt-2 ${
                              isDark
                                ? "border-white/20 text-white/50 hover:bg-white/5 hover:text-white"
                                : "border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                          >
                            + THÊM VẬT PHẨM
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {!editedData.inventory ||
                          (Array.isArray(editedData.inventory) &&
                            editedData.inventory.length === 0) ? (
                            <div
                              className={`col-span-full py-8 text-center text-sm ${isDark ? "text-white/40" : "text-slate-400"}`}
                            >
                              Túi đồ trống không.
                            </div>
                          ) : Array.isArray(editedData.inventory) ? (
                            editedData.inventory.map(
                              (item: any, idx: number) => (
                                <div
                                  key={item.id || idx}
                                  className={`p-4 rounded-xl flex items-start gap-4 transition-transform hover:-translate-y-1 ${isDark ? "bg-white/5 border border-white/5 hover:bg-white/10" : "bg-white border border-slate-200 shadow-sm hover:shadow-md"}`}
                                >
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600"}`}
                                  >
                                    <span className="font-mono font-black">
                                      {item.quantity}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4
                                      className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                                    >
                                      {item.name}
                                    </h4>
                                    {item.description && (
                                      <p
                                        className={`text-xs mt-1 leading-relaxed ${isDark ? "text-white/60" : "text-slate-500"}`}
                                      >
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ),
                            )
                          ) : (
                            <div
                              className={`col-span-full text-sm whitespace-pre-wrap ${isDark ? "text-white/70" : "text-slate-600"}`}
                            >
                              {editedData.inventory}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`w-full max-w-4xl mx-auto px-4 pb-8 z-10 relative mt-4 flex gap-4 ${type !== "npc" ? "justify-end" : ""}`}
          >
            {type === "npc" && (
              <button
                onClick={handleDeleteNPC}
                className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-colors border border-red-500 shadow-lg"
              >
                Xóa NPC
              </button>
            )}
            <button
              onClick={scrollToTop}
              className={`p-4 rounded-xl transition-colors border cursor-pointer flex items-center justify-center flex-shrink-0 ${
                isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm"
              }`}
              title="Cuộn lên đầu"
            >
              <ArrowUpToLine size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarSelect && (
        <div
          className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAvatarSelect(false)}
        >
          <div
            className={`rounded-2xl p-6 max-w-lg w-full relative shadow-2xl max-h-[80vh] flex flex-col ${
              isDark
                ? "theme-panel !border-none"
                : "bg-[#FFFDFB] border border-amber-250"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAvatarSelect(false)}
              className={`absolute top-4 right-4 z-10 transition-colors ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-amber-850 hover:text-[#3E2723]"
              }`}
            >
              <X size={20} />
            </button>
            <h3
              className={`text-lg font-bold mb-6 uppercase tracking-wider text-center shrink-0 ${
                isDark ? "text-white" : "text-[#3E2723]"
              }`}
            >
              Nguồn Ảnh Đại Diện
            </h3>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAvatarSelect(false);
                }}
                className="p-4 rounded-xl theme-button text-sm font-medium flex items-center justify-center gap-2"
              >
                Tải lên từ Máy
              </button>
              <button
                onClick={() => {
                  setShowAvatarSelect(false);
                  setShowUrlInput(true);
                }}
                className="p-4 rounded-xl theme-button text-sm font-medium flex items-center justify-center gap-2"
              >
                Nhập Link URL
              </button>
              <button
                onClick={() => {
                  setShowAvatarSelect(false);
                  setShowGalleryPicker(true);
                }}
                className={`p-4 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2 border ${
                  isDark
                    ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-300"
                    : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-bold"
                }`}
              >
                Chọn từ nút "Ảnh"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Picker (Full-Screen Expanded Overlay) */}
      {showGalleryPicker && (
        <div className="absolute inset-0 z-[70]">
          <GalleryModal
            isSelectMode={true}
            onSelect={(url) => {
              handleAvatarChange(url);
              setShowGalleryPicker(false);
            }}
            onClose={() => {
              setShowGalleryPicker(false);
              setShowAvatarSelect(true);
            }}
          />
        </div>
      )}

      {showUrlInput && (
        <div
          className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowUrlInput(false)}
        >
          <div
            className={`rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 ${
              isDark
                ? "theme-panel !border-none"
                : "bg-[#FFFDFB] border border-amber-250"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`text-lg font-bold uppercase tracking-wider ${
                isDark ? "text-white" : "text-[#3E2723]"
              }`}
            >
              Nhập Link URL Ảnh
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="https://example.com/image.jpg"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitUrl()}
                className="flex-1 theme-input border rounded-lg px-4 py-2 text-sm outline-none"
              />
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setUrlInputValue(text);
                  } catch (err) {
                    toast.error(
                      "Không thể dán tự động, vui lòng dán thủ công.",
                    );
                  }
                }}
                className="px-3 py-2 theme-button rounded-lg transition-all text-sm font-bold"
                title="Dán từ Clipboard"
              >
                Dán
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setShowUrlInput(false)}
                className={`px-4 py-2 rounded-xl transition-all text-sm font-bold ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                    : "bg-amber-100 hover:bg-amber-200 text-[#5C4033] hover:text-[#3E2723]"
                }`}
              >
                HỦY
              </button>
              <button
                onClick={submitUrl}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all text-sm font-bold"
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmUpdateModal && (
        <NpcUpdateModal
          npc={editedData}
          npcIndex={npcIndex as number}
          onClose={() => setShowConfirmUpdateModal(false)}
          onApply={(updatedData) => {
            const newNpcData = { ...editedData, ...updatedData };
            delete newNpcData.pendingUpdates;

            setEditedData(newNpcData);
            if (!isEditing && gameData) {
              const origNpcs = [...(gameData.npcs || [])];
              origNpcs[npcIndex as number] = newNpcData;
              setGameData({ ...gameData, npcs: origNpcs });
              toast.success("Đã áp dụng cập nhật NPC thành công!");
            } else if (isEditing) {
              toast.success(
                "Thay đổi đã cập nhật, vui lòng ấn Lưu để lưu lại.",
              );
            }
            setShowConfirmUpdateModal(false);
          }}
        />
      )}
    </motion.div>
  );
}
