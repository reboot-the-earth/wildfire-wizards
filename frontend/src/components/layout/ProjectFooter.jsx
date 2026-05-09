/**
 * ProjectFooter — surfaces the Reboot the Earth 2026 judging criteria that
 * are otherwise invisible in the main UI:
 *   - Open Source / Open Data attribution (criterion 3 in the RBE brief)
 *   - Scalability beyond San Diego (criterion 4)
 *   - Submission link to Unite Ideas (the official RBE submission platform)
 *
 * Floats in the bottom-right corner of the map. Compact, glass, dismissible.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DATA_SOURCES = [
  { id: 'firms',   label: 'NASA FIRMS',  href: 'https://firms.modaps.eosdis.nasa.gov/' },
  { id: 'noaa',    label: 'NOAA Weather', href: 'https://www.weather.gov/documentation/services-web-api' },
  { id: 'osm',     label: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
  { id: 'landfire', label: 'LANDFIRE',   href: 'https://landfire.gov/' },
];

const SUBMIT_URL = 'https://idea.unite.un.org';
const REPO_URL = 'https://github.com/reboot-the-earth/wildfire-wizards';

export default function ProjectFooter() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="
              glass-coal-strong rounded-xl shadow-coal-lift
              w-[280px] sm:w-[300px] overflow-hidden
              relative
            "
          >
            {/* Top scanline */}
            <div className="absolute inset-x-0 top-0 h-px scanline opacity-70" />

            <div className="px-3.5 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                    Open Source · Open Data
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-0.5 text-coal-400 hover:text-white transition-colors"
                  aria-label="Hide project info"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Data sources */}
              <div className="flex flex-wrap gap-1 mb-2.5">
                {DATA_SOURCES.map((s) => (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      text-[10px] font-mono font-semibold
                      text-coal-200 hover:text-white
                      bg-white/5 hover:bg-white/10
                      border border-white/10 hover:border-white/20
                      rounded px-1.5 py-0.5
                      transition-colors
                    "
                  >
                    {s.label}
                  </a>
                ))}
              </div>

              {/* Scalability + license row */}
              <div className="flex items-center gap-2 text-[10px] text-coal-300 mb-2.5">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-coal-200">Replicable to any county</span>
                </span>
                <span className="text-coal-500">·</span>
                <span className="font-mono font-semibold text-coal-200">MIT</span>
              </div>

              {/* Action row: repo + submit */}
              <div className="flex items-center gap-1.5">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex-1 inline-flex items-center justify-center gap-1
                    text-[10px] font-bold uppercase tracking-widest
                    text-coal-200 hover:text-white
                    bg-white/5 hover:bg-white/10
                    border border-white/10 hover:border-white/20
                    rounded-md py-1.5
                    transition-colors
                  "
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  Source
                </a>
                <a
                  href={SUBMIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex-[1.4] inline-flex items-center justify-center gap-1
                    text-[10px] font-black uppercase tracking-widest
                    text-white
                    bg-gradient-to-br from-ember-500 to-red-600
                    rounded-md py-1.5
                    shadow-ember-glow
                    transition-all hover:shadow-[0_0_0_1px_rgba(249,115,22,0.45),0_10px_28px_-6px_rgba(249,115,22,0.6)]
                    group
                  "
                >
                  Submit on Unite Ideas
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <div className="text-[9px] text-coal-400 mt-2 text-center">
                Reboot the Earth 2026 · Challenge 1 · San Diego
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed pill */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setOpen(true)}
          className="
            glass-coal rounded-full px-3 py-1.5
            text-[10px] font-bold uppercase tracking-widest
            text-coal-200 hover:text-white
            shadow-coal-lift
            flex items-center gap-1.5
            transition-colors
          "
          aria-label="Show project info"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          About · Submit
        </motion.button>
      )}
    </div>
  );
}
