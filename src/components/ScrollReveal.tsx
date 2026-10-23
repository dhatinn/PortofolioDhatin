import React, { Children, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const SCRUB_SPAN = 0.5;
const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const easeBack = (value: number, overshoot: number) => {
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted;
};
const glowAt = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.35 ? smooth(t / 0.35) : 1 - smooth((t - 0.35) / 0.65));

interface PieceLook {
  effect: 'fade' | 'rise' | 'flip' | 'scale';
  masked: boolean;
  baseOpacity: number;
  blur: number;
  offset: number;
  highlightColor?: string;
}

const paintPiece = (piece: HTMLElement, t: number, look: PieceLook) => {
  let reveal = t;
  let fadeIn = t;
  let motion = '';
  if (look.effect === 'rise') {
    reveal = easeOut(t);
    fadeIn = clamp01(reveal * 1.25);
    if (reveal < 1) {
      motion = look.masked
        ? `translateY(${((1 - reveal) * 100).toFixed(2)}%) translateY(${((1 - reveal) * 0.2).toFixed(3)}em)`
        : `translateY(${((1 - reveal) * 0.8).toFixed(3)}em)`;
    }
  } else if (look.effect === 'flip') {
    reveal = easeBack(t, 1.2);
    fadeIn = clamp01(t * 2);
    if (t < 1) motion = `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)`;
  } else if (look.effect === 'scale') {
    reveal = easeBack(t, 1.6);
    fadeIn = clamp01(t * 1.6);
    if (t < 1) motion = `scale(${(0.35 + 0.65 * reveal).toFixed(4)})`;
  }
  if (look.highlightColor) fadeIn = Math.max(fadeIn, clamp01(t / 0.35));
  const settle = clamp01(reveal);
  const lift = look.offset * (1 - settle);
  piece.style.opacity = t >= 1 ? '' : (look.baseOpacity + (1 - look.baseOpacity) * fadeIn).toFixed(3);
  piece.style.transform = [lift ? `translateY(${lift.toFixed(2)}px)` : '', motion].filter(Boolean).join(' ');
  piece.style.filter = look.blur && settle < 1 ? `blur(${(look.blur * (1 - settle)).toFixed(2)}px)` : '';
  if (look.highlightColor) {
    const glow = glowAt(t);
    piece.style.color =
      glow > 0.002 ? `color-mix(in srgb, ${look.highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)` : '';
  }
};

export interface ScrollRevealProps {
  children?: React.ReactNode;
  formattedText?: string;
  as?: 'p' | 'h2' | 'h3' | 'div';
  scrollContainerRef?: React.RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  baseOffset?: number;
  stagger?: number;
  smoothing?: number;
  splitBy?: 'words' | 'chars' | 'lines';
  effect?: 'fade' | 'rise' | 'flip' | 'scale';
  mode?: 'scrub' | 'enter';
  duration?: number;
  highlightColor?: string;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  enableOutAnimation?: boolean;
  inStart?: string | (() => string);
  inEnd?: string | (() => string);
  outStart?: string | (() => string);
  outEnd?: string | (() => string);
}

function parseFormattedToWords(rawText: string) {
  const parts = rawText.split(/(\*\*.*?\*\*)/g);
  const wordsWithFormat: Array<{ word: string; isBold: boolean }> = [];

  parts.forEach((part) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      const words = inner.split(/(\s+)/);
      words.forEach((w) => {
        if (w) wordsWithFormat.push({ word: w, isBold: true });
      });
    } else {
      const words = part.split(/(\s+)/);
      words.forEach((w) => {
        if (w) wordsWithFormat.push({ word: w, isBold: false });
      });
    }
  });

  return wordsWithFormat;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  formattedText,
  as: Component = 'p',
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.15,
  baseRotation = 0,
  blurStrength = 5,
  baseOffset = 0,
  stagger = 0.04,
  smoothing = 0,
  splitBy = 'words',
  effect = 'fade',
  mode = 'scrub',
  duration = 0.8,
  highlightColor = '',
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  enableOutAnimation = true,
  inStart,
  inEnd,
  outStart,
  outEnd
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const plainText = useMemo(() => {
    if (formattedText) return null;
    const parts = Children.toArray(children);
    return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
  }, [children, formattedText]);

  const splitContent = useMemo(() => {
    if (formattedText) {
      const tokens = parseFormattedToWords(formattedText);
      return tokens.map((token, index) => {
        if (token.word.trim() === '') {
          return token.word;
        }
        if (token.isBold) {
          return (
            <span className="scroll-reveal-word" key={index}>
              <strong className="about-bold">
                <span className="scroll-reveal-piece">{token.word}</span>
              </strong>
            </span>
          );
        }
        return (
          <span className="scroll-reveal-word" key={index}>
            <span className="scroll-reveal-piece">{token.word}</span>
          </span>
        );
      });
    }

    if (plainText === null) return null;
    return plainText.split(/(\s+)/).map((word, index) =>
      word.trim() === '' ? (
        word
      ) : (
        <span className="scroll-reveal-word" key={index}>
          {splitBy === 'chars' ? (
            Array.from(word).map((char, charIndex) => (
              <span className="scroll-reveal-piece" key={charIndex}>
                {char}
              </span>
            ))
          ) : (
            <span className="scroll-reveal-piece">{word}</span>
          )}
        </span>
      )
    );
  }, [formattedText, plainText, splitBy]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    const textEl = textRef.current;
    if (!el || !textEl) return;
    if (scrollContainerRef && !scrollContainerRef.current) return;

    const scroller = scrollContainerRef?.current || window;
    const wrappers = Array.from(el.querySelectorAll('.scroll-reveal-word')) as HTMLElement[];
    const pieces = (wrappers.length ? Array.from(el.querySelectorAll('.scroll-reveal-piece')) : [textEl]) as HTMLElement[];
    const viewportHeight = () => (scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight);
    const scrub = smoothing > 0 ? smoothing : true;
    const span = mode === 'enter' ? Math.max(0.05, duration) : SCRUB_SPAN;
    const gap = Math.max(0, stagger);
    const look: PieceLook = {
      effect,
      masked: effect === 'rise' && wrappers.length > 0,
      baseOpacity,
      blur: enableBlur ? blurStrength : 0,
      offset: baseOffset,
      highlightColor
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const order = pieces.map((_, index) => index);
      const last = pieces.map(() => -1);
      const state = { pIn: 0, pOut: 0 };
      let count = pieces.length;

      const measure = () => {
        if (splitBy !== 'lines' || !wrappers.length) return;
        let line = -1;
        let top = -Infinity;
        wrappers.forEach((wrapper, index) => {
          const next = wrapper.offsetTop;
          if (Math.abs(next - top) > 2) {
            line += 1;
            top = next;
          }
          order[index] = line;
        });
        count = line + 1;
      };

      const total = () => span + Math.max(0, count - 1) * gap;

      const render = () => {
        const atIn = state.pIn * total();
        const atOut = state.pOut * total();
        pieces.forEach((piece, index) => {
          const tIn = clamp01((atIn - order[index] * gap) / span);
          // Out animation: blur comes following from bottom words up
          const revOrder = count - 1 - order[index];
          const tOut = enableOutAnimation ? clamp01((atOut - revOrder * gap) / span) : 0;
          const effectiveT = clamp01(tIn * (1 - tOut));
          if (effectiveT === last[index]) return;
          last[index] = effectiveT;
          paintPiece(piece, effectiveT, look);
        });
      };

      measure();
      pieces.forEach(piece => {
        piece.style.willChange =
          pieces.length > 80 ? '' : effect === 'fade' && !baseOffset ? 'opacity, filter' : 'opacity, transform, filter';
        piece.style.transformOrigin = effect === 'flip' ? '50% 100%' : '';
      });
      if (look.masked) {
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = RISE_MASK;
        });
      }
      render();

      if (mode === 'enter') {
        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          gsap.to(state, { pIn: 1, duration: total(), ease: 'none', onUpdate: render });
          if (baseRotation) gsap.to(el, { rotate: 0, duration: Math.min(total(), 1.4), ease: 'power3.out' });
        };
        const startAt = () => {
          const view = viewportHeight();
          const top =
            el.getBoundingClientRect().top -
            (scroller instanceof HTMLElement
              ? scroller.getBoundingClientRect().top + scroller.clientTop - scroller.scrollTop
              : -window.scrollY);
          const raw = top - view + 0.2 * Math.min(el.offsetHeight, view);
          return Math.min(raw, ScrollTrigger.maxScroll(scroller) - 1);
        };
        if (baseRotation) gsap.set(el, { transformOrigin: '0% 50%', rotate: baseRotation });
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: startAt,
          onEnter: play,
          onLeave: play,
          onRefresh: self => {
            if (self.progress > 0) play();
          }
        });
      } else {
        if (baseRotation) {
          gsap.fromTo(
            el,
            { transformOrigin: '0% 50%', rotate: baseRotation },
            {
              ease: 'none',
              rotate: 0,
              scrollTrigger: {
                trigger: el,
                scroller,
                start: 'top bottom',
                end: clampToScroll(rotationEnd),
                scrub
              }
            }
          );
        }

        // In-animation ScrollTrigger: words unblur and reveal from top to bottom
        gsap.to(state, {
          pIn: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: inStart || (() => `top bottom-=${0.2 * Math.min(el.offsetHeight, viewportHeight())}`),
            end: inEnd || clampToScroll(wordAnimationEnd),
            scrub
          }
        });

        // Out-animation ScrollTrigger: blur comes following from the bottom words up!
        if (enableOutAnimation) {
          gsap.to(state, {
            pOut: 1,
            ease: 'none',
            onUpdate: render,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: outStart || "center 45%",
              end: outEnd || "bottom 15%",
              scrub
            }
          });
        }
      }

      const resizeObserver =
        splitBy === 'lines' && typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => {
              measure();
              last.fill(-1);
              render();
            })
          : null;
      resizeObserver?.observe(textEl);

      return () => {
        resizeObserver?.disconnect();
        pieces.forEach(piece => {
          piece.style.opacity = '';
          piece.style.transform = '';
          piece.style.transformOrigin = '';
          piece.style.filter = '';
          piece.style.color = '';
          piece.style.willChange = '';
        });
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = '';
        });
      };
    });

    return () => mm.revert();
  }, [
    mounted,
    scrollContainerRef,
    plainText,
    formattedText,
    splitBy,
    effect,
    mode,
    duration,
    highlightColor,
    enableBlur,
    baseOpacity,
    baseRotation,
    blurStrength,
    baseOffset,
    stagger,
    smoothing,
    rotationEnd,
    wordAnimationEnd,
    enableOutAnimation,
    inStart,
    inEnd,
    outStart,
    outEnd
  ]);

  return (
    <Component
      ref={containerRef as any}
      className={`scroll-reveal ${containerClassName}`.trim()}
      aria-label={formattedText ?? plainText ?? undefined}
    >
      <span
        ref={textRef}
        className={`scroll-reveal-text ${textClassName}`.trim()}
        aria-hidden={splitContent === null ? undefined : true}
      >
        {splitContent ?? children}
      </span>
    </Component>
  );
};

export default ScrollReveal;
