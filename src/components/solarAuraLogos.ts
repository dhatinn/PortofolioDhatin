export interface LogoData {
  id: string;
  name: string;
  targetX: number;
  targetY: number;
  sizePercent: number;
  blurPx: number;
  finalZ: number;
  crossToFront: boolean;
  delayMs: number;
  durationMs: number;
  baseRotate: number;
  floatAmpY: number;
  floatSpeed: number;
  phaseOffset: number;
  parallaxFactor: number;
  type: 'tile' | 'freeform';
  tileStyle?: string;
  svg: string;
}

export const LOGOS_DATA: LogoData[] = [
      {
        id: 'react-top-left',
        name: 'React 3D',
        targetX: 14.5,
        targetY: 23.0,
        sizePercent: 11.8,
        blurPx: 0.5,
        finalZ: 24,
        crossToFront: false,
        delayMs: 0,
        durationMs: 1350,
        baseRotate: -14,
        floatAmpY: 9,
        floatSpeed: 1.15,
        phaseOffset: 0.2,
        parallaxFactor: 0.45,
        type: 'freeform',
        svg: `
          <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.75)]">
            <defs>
              <linearGradient id="reactFront" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#9beeff"/>
                <stop offset="45%" stop-color="#53c8f8"/>
                <stop offset="100%" stop-color="#1ca2dc"/>
              </linearGradient>
              <linearGradient id="reactSide" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1a7ba8"/>
                <stop offset="100%" stop-color="#0b4666"/>
              </linearGradient>
            </defs>
            <g transform="translate(4, 5)" stroke="url(#reactSide)" stroke-width="7.5" fill="none">
              <ellipse cx="60" cy="60" rx="48" ry="18" />
              <ellipse cx="60" cy="60" rx="48" ry="18" transform="rotate(60 60 60)" />
              <ellipse cx="60" cy="60" rx="48" ry="18" transform="rotate(120 60 60)" />
              <circle cx="60" cy="60" r="10.5" fill="#0b4666" stroke="none" />
            </g>
            <g stroke="url(#reactFront)" stroke-width="7" fill="none">
              <ellipse cx="60" cy="60" rx="48" ry="18" />
              <ellipse cx="60" cy="60" rx="48" ry="18" transform="rotate(60 60 60)" />
              <ellipse cx="60" cy="60" rx="48" ry="18" transform="rotate(120 60 60)" />
              <circle cx="60" cy="60" r="10.5" fill="url(#reactFront)" stroke="none" />
            </g>
          </svg>
        `
      },
      {
        id: 'ts-top-left',
        name: 'TypeScript 3D',
        targetX: 29.0,
        targetY: 14.5,
        sizePercent: 8.8,
        blurPx: 0.4,
        finalZ: 22,
        crossToFront: false,
        delayMs: 90,
        durationMs: 1300,
        baseRotate: -19,
        floatAmpY: 8,
        floatSpeed: 1.0,
        phaseOffset: 1.4,
        parallaxFactor: 0.35,
        type: 'tile',
        tileStyle: 'background: linear-gradient(145deg, #448ee4 0%, #2b6cb8 65%, #1c4c88 100%); box-shadow: 5px 7px 0 #13355f, 0 16px 28px rgba(0,0,0,0.7), 0 0 22px rgba(255,150,40,0.38);',
        svg: `
          <div class="w-full h-full flex items-end justify-end p-[12%] select-none">
            <span class="font-black text-white leading-none tracking-tighter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" style="font-size: 2.35vw;">TS</span>
          </div>
        `
      },
      {
        id: 'html-top-right',
        name: 'HTML5 3D',
        targetX: 63.0,
        targetY: 18.0,
        sizePercent: 9.4,
        blurPx: 0.5,
        finalZ: 23,
        crossToFront: false,
        delayMs: 150,
        durationMs: 1350,
        baseRotate: 14,
        floatAmpY: 10,
        floatSpeed: 0.95,
        phaseOffset: 2.3,
        parallaxFactor: 0.42,
        type: 'freeform',
        svg: `
          <svg viewBox="0 0 120 145" class="w-full h-full drop-shadow-[0_14px_20px_rgba(0,0,0,0.75)]">
            <text x="60" y="23" text-anchor="middle" fill="#17120e" stroke="#ffcf8b" stroke-width="0.8" font-family="Inter, sans-serif" font-weight="900" font-size="23" letter-spacing="1.5">HTML</text>
            <polygon points="20,34 104,34 96,120 62,135 28,120" fill="#8b2509" />
            <polygon points="16,30 100,30 92,116 58,131 24,116" fill="#e44d26" />
            <polygon points="58,37 92,37 85,110 58,122" fill="#f16529" />
            <polygon points="34,52 84,52 82,66 49,66 50,80 81,80 77,112 58,118 39,112 37,94 51,94 52,103 58,105 64,103 66,92 36,92" fill="#ffffff" />
          </svg>
        `
      },
      {
        id: 'python-top-right',
        name: 'Python 3D',
        targetX: 86.0,
        targetY: 20.0,
        sizePercent: 13.0,
        blurPx: 0.6,
        finalZ: 25,
        crossToFront: false,
        delayMs: 70,
        durationMs: 1450,
        baseRotate: -12,
        floatAmpY: 11,
        floatSpeed: 1.08,
        phaseOffset: 3.1,
        parallaxFactor: 0.55,
        type: 'freeform',
        svg: `
          <svg viewBox="0 0 130 130" class="w-full h-full drop-shadow-[0_16px_24px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="pyBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5ca4da"/>
                <stop offset="100%" stop-color="#2b6391"/>
              </linearGradient>
              <linearGradient id="pyYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffe56d"/>
                <stop offset="100%" stop-color="#f2b824"/>
              </linearGradient>
            </defs>
            <g transform="translate(5, 6)">
              <path d="M63,14 C38,14 40,25 40,25 L40,37 L64,37 L64,41 L30,41 C30,41 14,39 14,64 C14,89 28,88 28,88 L36,88 L36,76 C36,76 35,62 50,62 L74,62 C74,62 87,62 87,49 L87,27 C87,27 89,14 63,14 Z" fill="#173a56"/>
              <path d="M67,116 C92,116 90,105 90,105 L90,93 L66,93 L66,89 L100,89 C100,89 116,91 116,66 C116,41 102,42 102,42 L94,42 L94,54 C94,54 95,68 80,68 L56,68 C56,68 43,68 43,81 L43,103 C43,103 41,116 67,116 Z" fill="#9c7009"/>
            </g>
            <path d="M63,14 C38,14 40,25 40,25 L40,37 L64,37 L64,41 L30,41 C30,41 14,39 14,64 C14,89 28,88 28,88 L36,88 L36,76 C36,76 35,62 50,62 L74,62 C74,62 87,62 87,49 L87,27 C87,27 89,14 63,14 Z" fill="url(#pyBlue)"/>
            <circle cx="48" cy="26" r="4.2" fill="#e6f4ff"/>
            <path d="M67,116 C92,116 90,105 90,105 L90,93 L66,93 L66,89 L100,89 C100,89 116,91 116,66 C116,41 102,42 102,42 L94,42 L94,54 C94,54 95,68 80,68 L56,68 C56,68 43,68 43,81 L43,103 C43,103 41,116 67,116 Z" fill="url(#pyYellow)"/>
            <circle cx="82" cy="104" r="4.2" fill="#9c7009"/>
          </svg>
        `
      },
      {
        id: 'ps-mid-right',
        name: 'Photoshop 3D',
        targetX: 76.2,
        targetY: 50.0,
        sizePercent: 9.8,
        blurPx: 1.1,
        finalZ: 26,
        crossToFront: false,
        delayMs: 210,
        durationMs: 1380,
        baseRotate: 12,
        floatAmpY: 8.5,
        floatSpeed: 1.05,
        phaseOffset: 2.0,
        parallaxFactor: 0.52,
        type: 'tile',
        tileStyle: 'background: radial-gradient(circle at 80% 10%, #5e533e 0%, #051e34 38%, #021120 100%); box-shadow: 6px 7px 0 #07192b, 0 18px 32px rgba(0,0,0,0.82), 0 0 24px rgba(255,160,55,0.42);',
        svg: `
          <div class="w-full h-full flex items-center justify-center select-none">
            <span class="font-extrabold tracking-tight" style="color: #31a8ff; font-size: 2.75vw; text-shadow: 0 2px 8px rgba(49,168,255,0.35);">Ps</span>
          </div>
        `
      },
      {
        id: 'github-fg-left',
        name: 'GitHub Bokeh 3D',
        targetX: 16.5,
        targetY: 74.0,
        sizePercent: 18.2,
        blurPx: 5.5,
        finalZ: 46,
        crossToFront: true,
        delayMs: 250,
        durationMs: 1520,
        baseRotate: -15,
        floatAmpY: 12,
        floatSpeed: 0.88,
        phaseOffset: 4.1,
        parallaxFactor: 1.05,
        type: 'tile',
        tileStyle: 'background: radial-gradient(circle at 75% 12%, #c57b30 0%, #1c1613 32%, #090807 90%); box-shadow: -8px 10px 0 #1f1916, 0 26px 45px rgba(0,0,0,0.9), 0 -6px 32px rgba(255,155,40,0.62);',
        svg: `
          <svg viewBox="0 0 100 100" class="w-[78%] h-[78%]">
            <path fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd" d="M50 12C29 12 12 29 12 50c0 16.8 10.9 31 26 36 1.9.3 2.6-.8 2.6-1.8v-6.4c-10.6 2.3-12.8-5.1-12.8-5.1-1.7-4.4-4.2-5.6-4.2-5.6-3.5-2.4.3-2.3.3-2.3 3.8.3 5.8 3.9 5.8 3.9 3.4 5.8 8.9 4.1 11.1 3.1.3-2.5 1.3-4.1 2.4-5.1-8.4-1-17.3-4.2-17.3-18.8 0-4.2 1.5-7.6 3.9-10.2-.4-1-1.7-4.9.4-10.1 0 0 3.2-1 10.5 3.9 3-.8 6.3-1.3 9.5-1.3 3.2 0 6.5.4 9.5 1.3 7.3-4.9 10.5-3.9 10.5-3.9 2.1 5.2.8 9.1.4 10.1 2.4 2.7 3.9 6.1 3.9 10.2 0 14.6-8.9 17.8-17.3 18.8 1.4 1.2 2.6 3.5 2.6 7v10.4c0 1 .7 2.2 2.6 1.8 15.1-5 26-19.2 26-36C88 29 71 12 50 12z"/>
          </svg>
        `
      },
      {
        id: 'pr-fg-right',
        name: 'Premiere Pro 3D',
        targetX: 66.8,
        targetY: 83.5,
        sizePercent: 10.2,
        blurPx: 1.6,
        finalZ: 42,
        crossToFront: true,
        delayMs: 290,
        durationMs: 1450,
        baseRotate: -7,
        floatAmpY: 9,
        floatSpeed: 1.12,
        phaseOffset: 3.7,
        parallaxFactor: 0.72,
        type: 'tile',
        tileStyle: 'background: linear-gradient(145deg, #1b0a5e 0%, #0d0338 70%, #070120 100%); box-shadow: 5px 6px 0 #1e1252, 0 20px 34px rgba(0,0,0,0.85), 0 0 26px rgba(255,135,30,0.45);',
        svg: `
          <div class="w-full h-full flex items-center justify-center select-none">
            <span class="font-extrabold tracking-tight" style="color: #9999ff; font-size: 2.85vw; text-shadow: 0 2px 10px rgba(153,153,255,0.45);">Pr</span>
          </div>
        `
      },
      {
        id: 'capcut-fg-right',
        name: 'CapCut Bokeh 3D',
        targetX: 87.8,
        targetY: 83.5,
        sizePercent: 16.5,
        blurPx: 5.0,
        finalZ: 47,
        crossToFront: true,
        delayMs: 340,
        durationMs: 1550,
        baseRotate: 15,
        floatAmpY: 11.5,
        floatSpeed: 0.88,
        phaseOffset: 1.8,
        parallaxFactor: 1.05,
        type: 'tile',
        tileStyle: 'background: radial-gradient(circle at 22% 14%, #5e4831 0%, #171717 42%, #080808 95%); box-shadow: 8px 8px 0 #262626, 0 26px 46px rgba(0,0,0,0.9), 0 0 30px rgba(255,145,35,0.48);',
        svg: `
          <svg viewBox="0 0 100 100" class="w-[68%] h-[68%]">
            <g fill="none" stroke="#ffffff" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20,30 L80,70" />
              <path d="M80,30 L20,70" />
              <path d="M20,30 L58,30 L58,41" />
              <path d="M20,70 L58,70 L58,59" />
            </g>
          </svg>
        `
      }
    ];;
