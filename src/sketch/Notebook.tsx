/**
 * Kolay yol defteri: eskiz öğelerini çizgili kâğıda, kalemle çiziliyormuş gibi sırayla canlandırır.
 * Çizgiler grafit dokulu (Çizio'daki kalem filtresi), yazılar el yazısı (Caveat) ve soldan sağa "yazılır".
 * Gerçekçi sarı kalem o an çizilen öğenin üzerinde gezer; bitince kaldırılıp kenara konur.
 */
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sfx } from '../lib/sfx';
import type { Sketch, SketchItem } from './build';

const W = 640;

export function PencilSprite({ angle = 58, lifted = false, scale = 1 }: { angle?: number; lifted?: boolean; scale?: number }) {
  const sh = lifted ? { dx: 14, dy: 18, o: 0.12 } : { dx: 5, dy: 8, o: 0.22 };
  const body = 'M9,-2.4 L30,-8.5 L196,-8.5 Q200,-8.5 200,-4 L200,4 Q200,8.5 196,8.5 L30,8.5 L9,2.4 Z';
  return (
    <g transform={`scale(${scale})`} style={{ pointerEvents: 'none' }}>
      <g transform={`translate(${sh.dx} ${sh.dy}) rotate(${angle})`} opacity={sh.o} filter="url(#nb-pencil-shadow)">
        <path d={`M0,0 ${body.slice(1)}`} fill="#000" />
      </g>
      <g transform={`rotate(${angle})${lifted ? ' translate(-4 -6)' : ''}`}>
        <path d="M0,0 L9.5,-2.6 L9.5,2.6 Z" fill="#3a3a40" />
        <path d="M9,-2.4 L30,-8.5 Q27.5,-5.2 30,-2.8 Q27.5,0 30,2.8 Q27.5,5.2 30,8.5 L9,2.4 Z" fill="#efc592" />
        <path d="M29,-8.5 L162,-8.5 L162,-3 L29.5,-3 Q27.6,-5.6 29,-8.5 Z" fill="#ffc446" />
        <path d="M29.5,-3 L162,-3 L162,3 L29.5,3 Q27.8,0 29.5,-3 Z" fill="#f7a51b" />
        <path d="M29.5,3 L162,3 L162,8.5 L29,8.5 Q27.6,5.6 29.5,3 Z" fill="#dc8a0b" />
        <rect x="162" y="-8.8" width="19" height="17.6" rx="1.5" fill="#c9ccd3" />
        <path d="M166,-8.8 V8.8 M170.5,-8.8 V8.8 M175,-8.8 V8.8" stroke="#9aa0aa" strokeWidth="0.9" />
        <path d="M181,-8.6 H193 Q199,-8.6 199,-2.6 V2.6 Q199,8.6 193,8.6 H181 Z" fill="#f29aa3" />
      </g>
    </g>
  );
}

const dur = (it: SketchItem) => (it.k === 'text' ? Math.min(0.9, 0.18 + it.t.length * 0.055) : it.k === 'hatch' ? 0.4 : 0.36);

export function Notebook({ sketch, upto, animate = true, className = '', pencil = true }: {
  sketch: Sketch; upto: number; animate?: boolean; className?: string; pencil?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const H = Math.max(sketch.h, 180);
  // Bu adımda çizilecek öğeler ve zamanlamaları
  const plan = useMemo(() => {
    let t = 0.15;
    const m = new Map<number, { delay: number; d: number }>();
    sketch.items.forEach((it, i) => {
      if (it.step !== upto || !animate) return;
      const d = dur(it);
      m.set(i, { delay: t, d });
      t += d + 0.05;
    });
    return { m, total: t };
  }, [sketch, upto, animate]);

  // Eskizde kullanılan tarama renkleri (her birine bir desen tanımlanır).
  const hatchColors = useMemo(() => [...new Set(sketch.items.filter((i) => i.k === 'hatch').map((i) => i.color))], [sketch]);

  const rest: [number, number] = [W - 70, H - 30];
  const [pen, setPen] = useState<{ x: number; y: number; lifted: boolean; t: number }>({ x: rest[0], y: rest[1], lifted: true, t: 0 });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (!animate || !pencil) return;
    sketch.items.forEach((it, i) => {
      const p = plan.m.get(i);
      if (!p) return;
      timers.current.push(window.setTimeout(() => setPen({ x: it.start[0], y: it.start[1], lifted: false, t: 0.12 }), Math.max(0, p.delay * 1000 - 120)));
      timers.current.push(window.setTimeout(() => {
        setPen({ x: it.end[0], y: it.end[1], lifted: false, t: p.d });
        sfx.scribble(p.d);
      }, p.delay * 1000));
    });
    timers.current.push(window.setTimeout(() => setPen({ x: rest[0], y: rest[1], lifted: true, t: 0.5 }), plan.total * 1000 + 150));
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, animate, pencil]);

  const anim = (i: number): CSSProperties | undefined => {
    const p = plan.m.get(i);
    return p ? { animationDelay: `${p.delay}s`, animationDuration: `${p.d}s` } : undefined;
  };

  return (
    <div className={`notebook ${className}`}>
      <span className="notebook__tape" />
      <svg className="notebook__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kolay yol eskizi">
        <defs>
          <filter id={`${uid}-pen`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="wobble" />
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="9" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 2.05" result="mask" />
            <feComposite in="wobble" in2="mask" operator="in" />
          </filter>
          <filter id={`${uid}-paper`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.9  0 0 0 0 0.84  0 0 0 -0.35 0.3" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
          {/* Her tarama rengi için ayrı desen. `currentColor` desenin içinde çalışmıyor
              (tarayıcı onu <defs> içindeki kendi rengiyle çözüyor) — hepsi gri çiziliyordu. */}
          {hatchColors.map((c, i) => (
            <pattern key={c} id={`${uid}-h${i}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
              <line x1="0" y1="0" x2="0" y2="7" stroke={c} strokeWidth="2.2" />
            </pattern>
          ))}
          <filter id="nb-pencil-shadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter>
          {sketch.items.map((it, i) =>
            it.k === 'text' && it.step <= upto ? (
              <clipPath key={i} id={`${uid}-c${i}`}>
                <rect className={plan.m.has(i) ? 'nb-wipe' : undefined} style={anim(i)}
                  x={(it.anchor === 'start' ? it.x : it.anchor === 'middle' ? it.x - it.w * 0.65 : it.x - it.w * 1.3) - 14} y={it.y - it.size * 1.05} width={it.w * 1.3 + 40} height={it.size * 1.5} />
              </clipPath>
            ) : null,
          )}
        </defs>
        {/* kâğıt: krem zemin, mavi çizgiler, kırmızı kenar çizgisi */}
        <rect width={W} height={H} fill="#fffdf6" filter={`url(#${uid}-paper)`} />
        {Array.from({ length: Math.floor(H / 40) }, (_, i) => (
          <line key={i} x1="0" x2={W} y1={40 + i * 40 + 10} y2={40 + i * 40 + 10} stroke="#cfe2ef" strokeWidth="1.6" />
        ))}
        <line x1="58" x2="58" y1="0" y2={H} stroke="#f2b3ab" strokeWidth="2" />

        <g filter={`url(#${uid}-pen)`}>
          {sketch.items.map((it, i) => {
            if (it.step > upto) return null;
            const cls = plan.m.has(i) ? 'nb-anim' : undefined;
            if (it.k === 'path') {
              return (
                <path key={i} className={cls ? 'nb-draw' : undefined} style={anim(i)} d={it.d} pathLength={1}
                  fill={it.fill ? it.fill : 'none'} fillOpacity={it.fill ? 0.85 : undefined} stroke={it.color} strokeWidth={it.w} strokeLinecap="round" strokeLinejoin="round" />
              );
            }
            if (it.k === 'hatch') {
              return <rect key={i} className={cls ? 'nb-fade' : undefined} style={anim(i)} x={it.x} y={it.y} width={Math.max(0, it.wd)} height={it.h} fill={`url(#${uid}-h${hatchColors.indexOf(it.color)})`} opacity={0.7} />;
            }
            return (
              <text key={i} x={it.x} y={it.y} textAnchor={it.anchor} fontFamily="Caveat, 'Comic Sans MS', cursive" fontWeight={700} fontSize={it.size} fill={it.color} clipPath={`url(#${uid}-c${i})`}>
                {it.t}
              </text>
            );
          })}
        </g>
        {pencil && animate && (
          <g style={{ transform: `translate(${pen.x}px, ${pen.y}px)`, transition: `transform ${pen.t}s linear` }}>
            <PencilSprite lifted={pen.lifted} scale={0.42} angle={pen.lifted ? 40 : 58} />
          </g>
        )}
      </svg>
    </div>
  );
}
