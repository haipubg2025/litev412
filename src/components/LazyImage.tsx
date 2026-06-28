import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Loader2, ImageIcon } from 'lucide-react';
import { storageService } from '../services/storageService';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  id?: string;
}

export default function LazyImage({ src, alt, className = '', id }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [actualSrc, setActualSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
    setIsInView(false);
    setActualSrc(null);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load ahead by 200px for best performance & smoother transition
      }
    );

    const element = imageRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  useEffect(() => {
    if (isInView && src) {
      if (src.startsWith('local-img-')) {
        storageService.loadImage(src)
          .then(dataUrl => {
            if (dataUrl) {
              setActualSrc(dataUrl);
            } else {
              setHasError(true);
            }
          })
          .catch(() => setHasError(true));
      } else {
        setActualSrc(src);
      }
    }
  }, [isInView, src]);

  return (
    <div 
      ref={imageRef} 
      id={id}
      className={`relative overflow-hidden bg-black/20 ${className}`}
    >
      {/* Background placeholder while loading or error */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          {!hasError ? (
            <Loader2 size={16} className="text-white/20 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/20 select-none">
              <ImageIcon size={18} />
              <span className="text-[9px]">Lỗi tải</span>
            </div>
          )}
        </div>
      )}

      {actualSrc && (
        <motion.img
          src={actualSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
