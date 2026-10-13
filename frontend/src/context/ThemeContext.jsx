import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

/* ─── All light-mode CSS overrides ─────────────────────────────────
   Injected as a <style> tag so JS handles the escaping correctly.
   Each \\ in a JS string becomes \ in the actual CSS text.
   ──────────────────────────────────────────────────────────────── */
const LIGHT_CSS = `
  /* ── Page / body ── */
  body { background-color: #F4F5F7 !important; color: #111218 !important; }
  .bg-\\[\\#0A0B0D\\] { background-color: #F4F5F7 !important; }
  .bg-\\[\\#0A0B0E\\] { background-color: #F4F5F7 !important; }

  /* ── Primary card surfaces ── */
  .bg-\\[\\#16161A\\] { background-color: #FFFFFF !important; }
  .bg-\\[\\#1C1C22\\] { background-color: #FAFAFA !important; }

  /* ── Navbar base (non-opacity version) ── */
  .bg-\\[\\#0D0E11\\] { background-color: #FFFFFF !important; }

  /* ── Dropdown / notification panels ── */
  .bg-\\[\\#141418\\] { background-color: #FFFFFF !important; }
  .bg-\\[\\#1A1A20\\] { background-color: #F0F1F4 !important; }

  /* ── Secondary surfaces ── */
  .bg-\\[\\#141419\\] { background-color: #F7F8FA !important; }
  .bg-\\[\\#141518\\] { background-color: #F7F8FA !important; }
  .bg-\\[\\#141519\\] { background-color: #F7F8FA !important; }
  .bg-\\[\\#14151A\\] { background-color: #F7F8FA !important; }
  .bg-\\[\\#141417\\] { background-color: #F7F8FA !important; }

  /* ── Input / inner card backgrounds ── */
  .bg-\\[\\#0E0F12\\] { background-color: #EDEEF2 !important; }
  .bg-\\[\\#0E0F12\\]\\/60 { background-color: rgba(237,238,242,0.6) !important; }

  /* ── Button / pill / icon backgrounds ── */
  .bg-\\[\\#18181C\\] { background-color: #E4E5EA !important; }
  .bg-\\[\\#1C1C24\\] { background-color: #E4E5EA !important; }
  .bg-\\[\\#1D1E24\\] { background-color: #E4E5EA !important; }
  .bg-\\[\\#222228\\] { background-color: #D8D9DF !important; }
  .bg-\\[\\#202026\\] { background-color: #D8D9DF !important; }

  /* ── Deepest card darks ── */
  .bg-\\[\\#111216\\] { background-color: #F0F1F4 !important; }
  .bg-\\[\\#111317\\] { background-color: #F0F1F4 !important; }
  .bg-\\[\\#111113\\] { background-color: #EDEEF2 !important; }
  .bg-\\[\\#1A1A1A\\] { background-color: #F0F1F4 !important; }

  /* ── Zinc system backgrounds ── */
  .bg-zinc-900 { background-color: #E8E9ED !important; }
  .bg-zinc-800 { background-color: #DDDEE3 !important; }

  /* ── Text: turn white/light → dark ── */
  .text-white  { color: #111218 !important; }
  .text-slate-100 { color: #111218 !important; }
  .text-zinc-100  { color: #1A1C28 !important; }
  .text-zinc-200  { color: #2A2C38 !important; }
  .text-zinc-300  { color: #4A4C58 !important; }
  .text-zinc-400  { color: #5C5E6C !important; }
  .text-zinc-500  { color: #72747E !important; }
  .text-zinc-700  { color: #888A94 !important; }

  /* ── Borders ── */
  .border-zinc-800 { border-color: #D4D5DA !important; }
  .border-zinc-700 { border-color: #C4C5CA !important; }
  [class*="border-zinc-800"] { border-color: #D4D5DA !important; }
  [class*="border-zinc-700"] { border-color: #C4C5CA !important; }

  /* ── Form controls ── */
  input, textarea, select { color: #111218 !important; }
  input::placeholder, textarea::placeholder { color: #858792 !important; opacity: 1 !important; }

  /* ── Colored hero keeps its intentional high-contrast type ── */
  .light-theme-hero .text-white { color: #FFFFFF !important; }
  .light-theme-hero .text-white\\/90 { color: rgba(255,255,255,0.92) !important; }

  /* ── Hover states ── */
  .hover\\:bg-\\[\\#1C1C22\\]:hover { background-color: #EAEBED !important; }
  .hover\\:bg-\\[\\#202026\\]:hover { background-color: #D8D9DF !important; }
  .hover\\:bg-\\[\\#222228\\]:hover { background-color: #D8D9DF !important; }
  .hover\\:bg-zinc-800:hover       { background-color: #D8D9DF !important; }
  [class*="hover:bg-zinc-800"]:hover { background-color: #D8D9DF !important; }

  /* ── Shadows: softer on white ── */
  .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.10) !important; }
  .shadow-xl  { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08) !important; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar-track { background: #F4F5F7; }
  ::-webkit-scrollbar-thumb { background: #C4C5CA; }
  ::-webkit-scrollbar-thumb:hover { background: #A4A5AA; }

  /* ── Active dark bg classes used in ItemDetails confirm modal ── */
  .bg-\\[\\#0E0F12\\]\\/60 { background-color: rgba(237,238,242,0.6) !important; }
`;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tnish_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('tnish_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const STYLE_ID = 'tnish-light-overrides';
    let styleEl = document.getElementById(STYLE_ID);

    if (theme === 'light') {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = LIGHT_CSS;
    } else {
      if (styleEl) styleEl.remove();
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
