# Design System: The Editorial Authority

## 1. Overview & Creative North Star: "The Digital Curator"
The Creative North Star for this design system is **The Digital Curator**. In an era of infinite scroll and visual noise, this system honors the legacy of high-end print journalism while leveraging the fluid possibilities of the digital medium. 

We break the "template" look by rejecting rigid, boxed-in grids in favor of **intentional asymmetry** and **tonal layering**. The experience should feel like a premium physical broadsheet reimagined for a screen—dense with information but curated with breathing room. We use high-contrast typography scales and overlapping elements to create a sense of urgency and prestige. This is not a "blog"; it is a destination of record.

---

## 2. Colors & Tonal Depth
The color palette is rooted in a "Warm Neutral" foundation to avoid the sterile coldness of pure digital white. We use the deep crimson (`#9A0000`) not just as a highlight, but as a signature of authority.

### The Palette
- **Primary Authority:** `primary` (#6f0000) and `primary_container` (#9a0000). Use these for high-impact branding and urgent news markers.
- **Surface Foundation:** `surface` (#fcf8f8) provides a warm, paper-like background that reduces eye strain compared to #FFFFFF.
- **The Ink:** `on_surface` (#1c1b1b) and `tertiary` (#343434) for text, ensuring maximum legibility with a sophisticated charcoal edge.

### Implementation Rules
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be achieved through background color shifts. For example, a "Breaking News" section should sit on `surface_container_low` to distinguish itself from the main `surface` feed.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. Use `surface_container_lowest` for the most prominent foreground cards, resting upon `surface_container` sections. This creates a "nested" depth that feels organic.
*   **The "Glass & Gradient" Rule:** Use Glassmorphism for floating utility elements (like the 'Back to Top' button or sticky navigation). Apply `surface` with 80% opacity and a 12px backdrop-blur. 
*   **Signature Textures:** Main CTAs or Hero Section backgrounds should utilize a subtle linear gradient transitioning from `primary` (#6f0000) to `primary_container` (#9a0000) at a 135-degree angle to provide a "velvet" depth.

---

## 3. Typography: The Editorial Voice
We pair the intellectual rigor of a serif with the functional clarity of a modern sans-serif.

*   **The Serif (Newsreader/Adamina):** Used for `display` and `headline` scales. This is our "Editorial Voice." It conveys tradition and truth. Use `display-lg` (3.5rem) for lead investigative pieces to command attention.
*   **The Sans-Serif (Inter):** Used for `title`, `body`, and `label` scales. This is our "Utility Voice." It ensures that even in dense data blocks or long-form articles, the reading experience is effortless.
*   **Hierarchy as Brand:** Use extreme scale contrast. A `display-md` headline paired with a `label-sm` metadata tag (all-caps, tracked out +10%) creates a sophisticated, high-fashion editorial aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders are hallmarks of "standard" UI. This system uses **Tonal Layering** to define space.

*   **The Layering Principle:** Place a `surface_container_highest` card on a `surface` background to create a "lift" through color contrast alone. 
*   **Ambient Shadows:** For floating modals or "Featured Story" hovers, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(28, 27, 27, 0.06)`. The shadow color is a tint of our `on_surface` charcoal, not black.
*   **The "Ghost Border" Fallback:** If a separation is functionally required (e.g., in a dense metadata list), use the `outline_variant` token at **15% opacity**. This creates a suggestion of a boundary without closing off the layout.
*   **Glassmorphism:** Navigation bars should use a semi-transparent `surface_container_lowest` with a heavy backdrop blur (20px) to allow the "ink" of the news below to bleed through as the user scrolls.

---

## 5. Components

### Editorial Cards
*   **Style:** No borders. No shadows. Use `surface_container_low` for the card background.
*   **Typography:** Headlines use `headline-sm`. Overlap the image slightly with the text container to break the "grid box" feel.
*   **Spacing:** Use 24px internal padding (1.5rem) to maintain editorial luxury.

### Utility Top Bar & Navigation
*   **Style:** `surface_container_lowest` background. 
*   **Layout:** Category-heavy. Use `label-md` for navigation links, set in `on_surface_variant` (#5b403c). Use a `primary` (#6f0000) 2px underline for the active state.

### Newsflash Strip
*   **Style:** `primary_container` (#9a0000) background with `on_primary` (#ffffff) text.
*   **Animation:** Slow horizontal marquee. Use `title-sm` for the text to maintain a sense of serious urgency.

### Buttons
*   **Primary:** `primary` background, `on_primary` text. `0.25rem` (4px) corner radius. Use the signature gradient on hover.
*   **Secondary:** No background. `Ghost Border` (15% opacity) and `primary` text.
*   **Tertiary/Ghost:** `on_surface_variant` text with no container. Use for "Read More" or "Share" utilities.

### Metadata Blocks
*   **Style:** Use `label-sm` in all caps with 0.05em letter spacing. 
*   **Separation:** Instead of vertical bars (|), use a `primary` colored dot (•) or 16px of horizontal whitespace.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts where imagery is offset from the text column.
*   **Do** leverage "White Space" as a functional element to group related news stories.
*   **Do** use `surface_container` shifts to separate "Opinion" sections from "Breaking News."
*   **Do** ensure all imagery has a slight `surface_dim` overlay if text is placed directly on top of it.

### Don'ts
*   **Don't** use 1px solid black borders (#000000). They look unrefined and "default."
*   **Don't** use standard Material Design drop shadows. They break the editorial paper-like feel.
*   **Don't** use more than three levels of surface nesting. It creates visual clutter.
*   **Don't** use rounded corners larger than `0.5rem` (lg). This system is serious and sharp; overly rounded "pill" buttons diminish the brand authority.