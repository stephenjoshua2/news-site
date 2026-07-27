"use client";

import { useEffect, useState } from "react";
import type { StoryMedia } from "@/lib/types";

type SlideItem = {
  id: string;
  url: string;
  caption?: string | null;
  altText?: string | null;
};

type ArticlePhotoSliderProps = {
  featuredImageUrl?: string | null;
  featuredAlt?: string;
  gallery?: StoryMedia[];
  videoUrl?: string | null;
  videoCaption?: string | null;
};

export function ArticlePhotoSlider({
  featuredImageUrl,
  featuredAlt = "Story image",
  gallery = [],
  videoUrl,
  videoCaption,
}: ArticlePhotoSliderProps) {
  const slides: SlideItem[] = [];

  if (featuredImageUrl) {
    slides.push({
      id: "featured",
      url: featuredImageUrl,
      caption: null,
      altText: featuredAlt,
    });
  }

  gallery.forEach((item) => {
    if (item.url && item.url !== featuredImageUrl) {
      slides.push({
        id: item.id,
        url: item.url,
        caption: item.caption,
        altText: item.alt_text || item.caption || featuredAlt,
      });
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, currentIndex, slides.length]);

  if (slides.length === 0 && !videoUrl) {
    return null;
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section className="article-photo-slider-wrapper mb-10">
      {/* Main Video (if provided) */}
      {videoUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-black rounded-sm mb-6 shadow-md">
          <video controls src={videoUrl} className="w-full h-full object-contain" />
          {videoCaption && (
            <p className="text-xs text-on-surface-variant italic mt-2 px-1">{videoCaption}</p>
          )}
        </div>
      )}

      {/* Main Photo Slider */}
      {slides.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[16/9] sm:aspect-[16/9] w-full overflow-hidden bg-surface-container-highest rounded-md shadow-lg group">
            <img
              src={activeSlide.url}
              alt={activeSlide.altText || featuredAlt}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Top Right Counter Badge */}
            {slides.length > 1 && (
              <div className="absolute top-4 right-4 z-20 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 shadow-lg pointer-events-none">
                {currentIndex + 1} / {slides.length} Photos
              </div>
            )}

            {/* Click to expand hint */}
            <div
              className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/20 cursor-pointer hover:bg-black/80 transition-colors flex items-center gap-1.5"
              onClick={() => setIsLightboxOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Tap to Expand
            </div>

            {/* Prev / Next Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 group-hover:opacity-100 hover:scale-110 border border-white/20"
                  aria-label="Previous photo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 group-hover:opacity-100 hover:scale-110 border border-white/20"
                  aria-label="Next photo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Active Caption */}
          {activeSlide.caption && (
            <p className="text-sm text-on-surface-variant font-body leading-relaxed italic border-l-2 border-primary pl-4 py-0.5">
              {activeSlide.caption}
            </p>
          )}

          {/* Thumbnail Bar for multi-photo stories */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide pt-1">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-20 h-14 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? "border-primary scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={slide.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && activeSlide && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center text-white z-10">
            <span className="text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              {currentIndex + 1} of {slides.length} Photos
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20"
              aria-label="Close Lightbox"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Center Image */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={activeSlide.url}
              alt={activeSlide.altText || featuredAlt}
              className="max-h-[82vh] max-w-full object-contain shadow-2xl rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                  aria-label="Previous"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                  aria-label="Next"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Bottom Caption Bar */}
          {activeSlide.caption && (
            <div className="max-w-2xl mx-auto w-full text-center text-white/90 text-sm font-body leading-relaxed bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10 z-10">
              {activeSlide.caption}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
