import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#6f0000",
        "secondary-fixed-dim": "#ffb4ab",
        "surface-bright": "#fcf8f8",
        "on-primary-fixed-variant": "#930000",
        "on-tertiary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed": "#410000",
        "surface-container-low": "#f6f3f2",
        "error": "#ba1a1a",
        "surface-container-highest": "#e5e2e1",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "on-tertiary-fixed": "#1b1c1c",
        "on-tertiary-fixed-variant": "#474746",
        "tertiary-fixed": "#e5e2e1",
        "primary-fixed-dim": "#ffb4a8",
        "outline": "#8f706b",
        "surface-dim": "#dcd9d9",
        "outline-variant": "#e4beb8",
        "tertiary-fixed-dim": "#c8c6c5",
        "on-primary-container": "#ffa293",
        "inverse-primary": "#ffb4a8",
        "surface": "#fcf8f8",
        "on-background": "#1c1b1b",
        "surface-container": "#f0edec",
        "secondary": "#a43b33",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#ffdad6",
        "tertiary": "#343434",
        "on-tertiary-container": "#bcbab9",
        "on-surface-variant": "#5b403c",
        "surface-variant": "#e5e2e1",
        "on-error": "#ffffff",
        "inverse-surface": "#313030",
        "surface-container-high": "#ebe7e7",
        "tertiary-container": "#4b4a4a",
        "primary-container": "#9a0000",
        "on-secondary-fixed-variant": "#84231f",
        "on-secondary-fixed": "#410002",
        "on-primary": "#ffffff",
        "primary-fixed": "#ffdad4",
        "surface-tint": "#b81f13",
        "secondary-container": "#fd7d71",
        "inverse-on-surface": "#f3f0ef",
        "on-secondary-container": "#711513",
        "background": "#fcf8f8",
        "on-surface": "#1c1b1b"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["var(--font-headline)"],
        "body": ["var(--font-body)"],
        "label": ["var(--font-body)"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
};
export default config;
