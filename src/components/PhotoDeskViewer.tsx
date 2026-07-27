"use client";

import { useEffect, useRef, useState } from "react";
import { CommentSection } from "@/components/CommentSection";
import { ViewTracker } from "@/components/ViewTracker";
import type { Comment, PhotoDeskItem, Story } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

type PhotoDeskViewerProps = {
  story: Story;
  comments: Comment[];
  isAdmin: boolean;
};

export function PhotoDeskViewer({ story, comments, isAdmin }: PhotoDeskViewerProps) {
  let items: PhotoDeskItem[] = [];
  if (Array.isArray(story.photo_desk_items)) {
    items = story.photo_desk_items;
  } else if (typeof story.photo_desk_items === "string") {
    try {
      items = JSON.parse(story.photo_desk_items);
    } catch {
      items = [];
    }
  }
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sortedItems.length]);

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < sortedItems.length) {
      slideRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: story.title,
      text: sortedItems[0]?.caption || story.title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {
        // Fallback
      }
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-on-surface-variant text-lg">No photos available.</p>
      </div>
    );
  }

  return (
    <div className="photo-desk-viewer-container bg-black text-white relative min-h-screen">
      <ViewTracker storyId={story.id} />

      {/* Top Segmented Story Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="max-w-xl mx-auto flex items-center gap-1.5 pointer-events-auto">
          {sortedItems.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className="h-1 flex-1 rounded-full overflow-hidden bg-white/20 transition-all cursor-pointer hover:bg-white/40"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx <= activeIndex ? "w-full" : "w-0"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Top Right Counter Badge */}
      <div className="fixed top-6 right-4 sm:right-8 z-40 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/20 shadow-xl pointer-events-none opacity-80">
        {activeIndex + 1} / {sortedItems.length}
      </div>

      {/* Floating Prev / Next Desktop Arrow Controls */}
      {sortedItems.length > 1 && (
        <div className="fixed inset-y-0 left-0 right-0 pointer-events-none z-40 hidden md:flex items-center justify-between px-6 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 shadow-2xl opacity-75 hover:opacity-100"
            aria-label="Previous photo slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === sortedItems.length - 1}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 shadow-2xl opacity-75 hover:opacity-100"
            aria-label="Next photo slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Side Translucent Floating Action Column (Right Side - Unblocks Captions) */}
      <div className="fixed right-4 sm:right-8 bottom-24 z-40 flex flex-col gap-4 items-center pointer-events-none">
        {/* Comments Button */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsCommentDrawerOpen(true)}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/90 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-xl border border-white/25 shadow-2xl transition-all duration-200 opacity-75 hover:opacity-100 hover:scale-110 active:scale-95 group"
            aria-label="Open discussion comments"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow uppercase tracking-wider">
            {comments.length}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/90 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-xl border border-white/25 shadow-2xl transition-all duration-200 opacity-75 hover:opacity-100 hover:scale-110 active:scale-95 group relative"
            aria-label="Share story"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {copiedLink && (
              <span className="absolute -left-24 bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-white/20 whitespace-nowrap animate-fadeIn">
                Copied!
              </span>
            )}
          </button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow uppercase tracking-wider">
            Share
          </span>
        </div>
      </div>

      {/* Main Continuous Fluid Scroll Container */}
      <div className="photo-desk-scroll-area mx-auto max-w-[720px] relative">
        {sortedItems.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <section
              key={index}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              className="photo-desk-slide relative"
              onClick={() => setExpandedIndex(null)}
            >
              <img
                src={item.image_url}
                alt={item.caption || "Photo"}
                className="photo-desk-image"
                loading={index < 2 ? "eager" : "lazy"}
              />

              {item.caption && (
                <div
                  className="photo-desk-caption cursor-pointer pr-20"
                  data-expanded={isExpanded}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedIndex(isExpanded ? null : index);
                  }}
                >
                  <div className="photo-desk-caption-gradient" />
                  <div className="photo-desk-caption-content">
                    <p className={`photo-desk-caption-text ${!isExpanded ? "line-clamp-3" : ""}`}>
                      {item.caption}
                    </p>
                    {item.caption.length > 120 && !isExpanded && (
                      <span className="photo-desk-caption-more text-[11px] uppercase tracking-wider font-bold mt-2 block text-white/70">
                        Tap to read full caption
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Glassmorphic Sliding Comment Overlay Drawer */}
      {isCommentDrawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsCommentDrawerOpen(false)}
        >
          <div
            className="w-full max-w-xl mx-auto bg-[#121212]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 p-6 sm:p-8 max-h-[82vh] overflow-y-auto shadow-2xl relative text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle & Close */}
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-white/30 rounded-full" />
                <h3 className="font-headline text-xl font-bold">Discussion</h3>
                <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-white/70">
                  {comments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCommentDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Embedded Dark Theme Comment Section */}
            <div className="photo-desk-comments text-on-surface">
              <CommentSection storyId={story.id} initialComments={comments} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
