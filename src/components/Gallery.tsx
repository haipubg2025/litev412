import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DEV_IMAGES } from "../constants/devImages";
import { ThemeConfig } from "../types";
import { Upload, X, ChevronLeft, ChevronRight, Maximize2, Eye, EyeOff } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import { useDropzone } from "react-dropzone";
import { useStore } from "../store/useStore";
import { useDeviceMode } from "../hooks/useDeviceMode";

interface GalleryProps {
  theme: ThemeConfig;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Gallery({ theme }: GalleryProps) {
  const gameData = useStore(state => state.gameData);
  const devGalleryImages = (gameData?.gallery?.devImages || DEV_IMAGES)
    .filter((img: any) => !img.groupId || img.groupId === "gallery")
    .map((img: any) => img.url);

  const [images, setImages] = useState<string[]>(() =>
    shuffleArray(devGalleryImages),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animType, setAnimType] = useState(0);
  const [isBlurred, setIsBlurred] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("gallery_blur");
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("gallery_blur", JSON.stringify(isBlurred));
    } catch (e) {
      console.error(e);
    }
  }, [isBlurred]);

  const isMobile = useDeviceMode();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset về đầu nếu chuyển đổi giữa di động và desktop để tránh lỗi index
  useEffect(() => {
    setCurrentIndex(0);
  }, [isMobile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...newUrls, ...prev]);
      setCurrentIndex(0);
      setAnimType(Math.floor(Math.random() * variants.length));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    noClick: true,
    noKeyboard: true,
  });

  // Danh sách các hiệu ứng chuyển động đa dạng
  const variants = [
    {
      initial: { opacity: 0, x: 100, filter: "blur(10px)" },
      animate: { opacity: 1, x: 0, filter: "blur(0px)" },
      exit: { opacity: 0, x: -100, filter: "blur(10px)" },
    },
    {
      initial: { opacity: 0, scale: 1.2, filter: "brightness(0.5)" },
      animate: { opacity: 1, scale: 1, filter: "brightness(1)" },
      exit: { opacity: 0, scale: 0.8, filter: "brightness(1.5)" },
    },
    {
      initial: { opacity: 0, y: 100 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    {
      initial: { opacity: 0, rotate: 5, scale: 1.1 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: -5, scale: 0.9 },
    },
    {
      initial: { opacity: 0, filter: "blur(20px) saturate(0)" },
      animate: { opacity: 1, filter: "blur(0px) saturate(1)" },
      exit: { opacity: 0, filter: "blur(20px) saturate(2)" },
    },
  ];

  const perPage = isMobile ? 1 : 2;

  // Tự động chuyển ảnh sau 6 giây
  useEffect(() => {
    if (images.length <= perPage) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev + perPage >= images.length ? 0 : prev + perPage,
      );
      setAnimType(Math.floor(Math.random() * variants.length));
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length, perPage, variants.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newUrls = Array.from(files).map((file) =>
        URL.createObjectURL(file),
      );
      setImages((prev) => [...newUrls, ...prev]);
      setCurrentIndex(0);
      setAnimType(Math.floor(Math.random() * variants.length));
    }
  };

  const currentPair = images.slice(currentIndex, currentIndex + perPage);
  const currentVariant = variants[animType];
  const isDark = theme.group === "Dark";

  return (
    <div
      {...getRootProps()}
      className={`h-full w-full flex flex-col relative overflow-hidden outline-none ${
        isDark ? "bg-transparent" : "bg-[#FAF7F0]"
      }`}
    >
      {/* Nút Upload */}
      <div className="absolute top-6 left-6 z-30 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-3 rounded-full backdrop-blur-md border transition-all cursor-pointer group ${
            isDark 
              ? "bg-white/5 hover:bg-white/20 border-white/5 text-white" 
              : "bg-white/60 hover:bg-white/500/15 border-black/10 text-slate-800 shadow-sm"
          }`}
          title="Tải Ảnh Lên"
        >
          <Upload className="w-5 h-5 opacity-40 group-hover:opacity-100" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => setIsBlurred(prev => !prev)}
          className={`p-3 rounded-full backdrop-blur-md border transition-all cursor-pointer group flex items-center justify-center ${
            isBlurred
              ? "bg-white/500/20 border-amber-500/30 text-slate-700 font-bold"
              : (isDark 
                  ? "bg-white/5 hover:bg-white/20 border-white/5 text-white/50 hover:text-white" 
                  : "bg-white/60 hover:bg-white/500/15 border-black/10 text-slate-800 hover:text-slate-950 shadow-sm")
          }`}
          title={isBlurred ? "Bật Hiển Thị Rõ" : "Làm Mờ Ảnh (Blur)"}
        >
          {isBlurred ? (
            <Eye className="w-5 h-5 opacity-90" />
          ) : (
            <EyeOff className="w-5 h-5 opacity-40 group-hover:opacity-100" />
          )}
        </button>
        {images.length > devGalleryImages.length && (
          <button
            onClick={() => {
              setImages(shuffleArray(devGalleryImages));
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-full backdrop-blur-md border transition-all cursor-pointer group ${
              isDark 
                ? "bg-red-500/5 hover:bg-red-500/20 border-red-500/10 text-red-500" 
                : "bg-red-50 hover:bg-red-100 border-red-250 text-red-650 shadow-sm"
            }`}
            title="Xóa ảnh đã tải"
          >
            <X className="w-5 h-5 opacity-45 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {isDragActive && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm border-4 border-dashed m-8 rounded-3xl ${
          isDark ? "bg-black/60 border-white/50 text-white" : "bg-white/500/10 border-amber-500/40 text-[#4E3629]"
        }`}>
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 opacity-80 animate-bounce" />
            <h3 className="text-2xl font-black tracking-tight">
              Kéo thả ảnh vào đây, hoặc click để chọn
            </h3>
          </div>
        </div>
      )}

      {/* Hiển thị ảnh */}
      <div className="flex-1 min-h-0 min-w-0 flex gap-2 p-4 pb-28 md:pb-20 pt-20 items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <div
            className="flex w-full h-full min-h-0 min-w-0 gap-4 max-w-[1920px] mx-auto"
            key={currentIndex}
          >
            {currentPair.map((url, idx) => (
              <motion.div
                key={`${url}-${idx}`}
                initial={currentVariant.initial}
                animate={currentVariant.animate}
                exit={currentVariant.exit}
                transition={{
                  duration: 0.85,
                  ease: [0.25, 1, 0.5, 1],
                  opacity: { duration: 0.6 },
                }}
                className={`flex-1 h-full min-h-0 min-w-0 relative overflow-hidden shadow-2xl rounded-2xl ${
                  isDark ? "bg-black" : "bg-white/60 border border-black/10"
                }`}
              >
                {/* Background Blur Effect */}
                <img
                  src={url}
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-25"
                  alt="bg blur"
                  referrerPolicy="no-referrer"
                />

                {/* Main Content Image */}
                <div
                  className="w-full h-full relative cursor-zoom-in group/img flex items-center justify-center"
                  onClick={() => {
                    setLightboxIndex(currentIndex + idx);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={url}
                    className={`w-full h-full max-h-full max-w-full object-contain relative z-10 transition-all duration-700 group-hover/img:scale-104 ${
                      isBlurred ? "blur-[6px] saturate-[0.4] opacity-55 scale-[0.93]" : ""
                    }`}
                    alt="Gallery content"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity ${
                    isDark ? "bg-black/20" : "bg-amber-650/5"
                  }`}>
                    <Maximize2 className={`w-12 h-12 drop-shadow-xl ${isDark ? 'text-white' : 'text-amber-850'}`} />
                  </div>
                </div>
                <div className={`absolute inset-0 pointer-events-none z-20 rounded-2xl ${
                  isDark ? 'bg-linear-to-t from-black/40 via-transparent to-black/20' : 'bg-linear-to-t from-amber-900/10 via-transparent to-amber-900/5'
                }`} />
              </motion.div>
            ))}

            {currentPair.length < perPage && images.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex-1 h-full relative rounded-3xl overflow-hidden border ${
                  isDark ? 'border-white/5 bg-white/2' : 'border-black/10 bg-white/60'
                }`}
              />
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Thanh tiến trình */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 transition-all duration-100 ease-linear z-40 ${
          isDark ? 'bg-white/20' : 'bg-slate-800/30'
        }`}
        style={{
          width: "100%",
          transformOrigin: "left",
          animation:
            images.length > perPage
              ? "progress-bar 6s linear infinite"
              : "none",
        }}
      />

      {/* Điều hướng thủ công */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6 opacity-0 hover:opacity-100 transition-opacity duration-1000">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - perPage))}
          className={`p-2 transition-all hover:scale-125 ${
            isDark ? 'text-white/30 hover:text-white' : 'text-slate-700/30 hover:text-slate-700'
          }`}
        >
          <ChevronLeft className="w-8 h-8 cursor-pointer" />
        </button>

        <div className="flex gap-2">
          {Array.from({ length: Math.ceil(images.length / perPage) }).map(
            (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                  Math.floor(currentIndex / perPage) === i 
                    ? (isDark ? "bg-white w-6" : "bg-slate-800 w-6") 
                    : (isDark ? "bg-white/10" : "bg-amber-900/15")
                }`}
              />
            ),
          )}
        </div>

        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              prev + perPage >= images.length ? 0 : prev + perPage,
            )
          }
          className={`p-2 transition-all hover:scale-125 ${
            isDark ? 'text-white/30 hover:text-white' : 'text-slate-700/30 hover:text-slate-700'
          }`}
        >
          <ChevronRight className="w-8 h-8 cursor-pointer" />
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes progress-bar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `,
        }}
      />

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images.map((src) => ({ src }))}
        plugins={[Zoom, Fullscreen]}
        carousel={{ finite: images.length <= perPage }}
        render={{
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}
