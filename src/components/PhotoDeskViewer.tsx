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
  const items = story.photo_desk_items || [];
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
  }, []);

  if (sortedItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-on-surface-variant text-lg">No photos available.</p>
      </div>
    );
  }

  return (
    <div className="photo-desk-viewer-container bg-black min-h-screen">
      <div className="photo-desk-counter">
        {activeIndex + 1} / {sortedItems.length}
      </div>

      <div className="photo-desk-scroll-area mx-auto max-w-[680px] bg-[#111] shadow-2xl relative">
        <ViewTracker storyId={story.id} />
        
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
                        Tap to read more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <section className="photo-desk-footer bg-[#111] text-white/90 p-8 min-h-[50vh] flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-primary font-label text-[10px] font-bold uppercase tracking-widest block mb-2">
              {story.category}
            </span>
            <h1 className="font-headline text-3xl font-bold mb-4">{story.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-widest font-bold">
              {story.location && <span>{story.location} &bull; </span>}
              <span>{dateFormatter.format(new Date(story.published_at || story.created_at))}</span>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 mb-12">
            <ShareStoryButton title={story.title} text={sortedItems[0]?.caption || ""} />
          </div>

          <div className="photo-desk-comments bg-surface rounded-lg text-on-surface p-6">
            <CommentSection storyId={story.id} initialComments={comments} isAdmin={isAdmin} />
          </div>
        </section>
      </div>
    </div>
  );
}
