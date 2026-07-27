"use client";

import { useEffect, useRef, useState } from "react";
import { CommentSection } from "@/components/CommentSection";
import { ShareStoryButton } from "@/components/ShareStoryButton";
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
      { threshold: 0.6 }
    );
    
    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, [sortedItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, sortedItems.length]);

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < sortedItems.length) {
      slideRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
    } else if (index === sortedItems.length) {
      slideRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
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
    <div className="photo-desk-viewer-container bg-black text-white relative">
      <ViewTracker storyId={story.id} />

      {/* Top Segmented Story Progress Bar (Instagram / BBC Style) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
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
      <div className="fixed top-6 right-4 sm:right-8 z-50 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/20 shadow-xl pointer-events-none">
        {activeIndex < sortedItems.length ? `${activeIndex + 1} / ${sortedItems.length}` : "Story End"}
      </div>

      {/* Floating Prev / Next Desktop Arrow Controls */}
      {sortedItems.length > 1 && (
        <div className="fixed inset-y-0 left-0 right-0 pointer-events-none z-40 hidden md:flex items-center justify-between px-6 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 shadow-2xl"
            aria-label="Previous photo slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === sortedItems.length}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 shadow-2xl"
            aria-label="Next photo slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Single Scroll Container with Mandatory Snap */}
      <div className="photo-desk-scroll-area mx-auto max-w-[720px] relative">
        {sortedItems.map((item, index) => {
          const isExpanded = expandedIndex === index;
          
          return (
            <section
              key={index}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              className="photo-desk-slide"
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
                  className="photo-desk-caption cursor-pointer"
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

        {/* Footer Section - End of Story */}
        <section
          ref={(el) => {
            slideRefs.current[sortedItems.length] = el;
          }}
          className="photo-desk-footer bg-[#0d0d0d] text-white/90 p-8 sm:p-12 min-h-[80vh] flex flex-col justify-center border-t border-white/10"
        >
          <div className="mb-8">
            <span className="text-primary font-label text-[10px] font-bold uppercase tracking-widest block mb-2">
              {story.category}
            </span>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold mb-4 leading-tight">{story.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-widest font-bold">
              {story.location && <span>{story.location} &bull; </span>}
              <span>{dateFormatter.format(new Date(story.published_at || story.created_at))}</span>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 mb-10">
            <ShareStoryButton title={story.title} text={sortedItems[0]?.caption || ""} />
          </div>

          <div className="photo-desk-comments bg-surface rounded-lg text-on-surface p-6 sm:p-8 shadow-2xl">
            <CommentSection storyId={story.id} initialComments={comments} isAdmin={isAdmin} />
          </div>
        </section>
      </div>
    </div>
  );
}
