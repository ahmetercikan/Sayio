/**
 * Cevap girişleri:
 * - Seçenek baloncukları (4-7 yaş: klavyeden kaçınma),
 * - Dokunmalı 10'luk çerçeve (boş gözlere sayaç koyarak cevap),
 * - Ekran numpad'i (8+ yaş; fiziksel klavye de çalışır).
 */
import { Delete, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Choice } from '../tricks/types';
import { sfx } from '../lib/sfx';
import { CELL, Counter, FrameGrid, frameCell } from '../visuals/Visual';

export type BoxState = 'idle' | 'right' | 'wrong' | 'show';

/** Denklem: "?" yerine cevap kutusu. */
export function Equation({ eq, value, state = 'idle', size = 'lg' }: { eq: string; value?: string; state?: BoxState; size?: 'xl' | 'lg' | 'md' | 'sm' }) {
  const i = eq.indexOf('?');
  if (i < 0) return <div className={`eq eq--${size}`}>{eq}</div>;
  const before = eq.slice(0, i), after = eq.slice(i + 1);
  return (
    <div className={`eq eq--${size}`} aria-live="polite">
      {before && <span>{before}</span>}
      <span className={`eq__box eq__box--${state} ${value ? 'has' : ''}`}>{value || '?'}</span>
      {after && <span>{after}</span>}
    </div>
  );
}

export function ChoiceBubbles({ choices, onPick, disabled, wrong }: { choices: Choice[]; onPick: (v: number) => void; disabled?: boolean; wrong?: number[] }) {
  return (
    <div className={`choices choices--${choices.length}`}>
      {choices.map((c, i) => {
        const off = wrong?.includes(c.value);
        return (
          <button
            key={`${c.label}-${i}`}
            className={`choice rise ${off ? 'choice--off' : ''}`}
            style={{ animationDelay: `${i * 0.06}s` }}
            disabled={disabled || off}
            onClick={() => {
              sfx.tap();
              onPick(c.value);
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

export function Numpad({ value, onChange, onSubmit, negative, disabled }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; negative?: boolean; disabled?: boolean;
}) {
  const press = (k: string) => {
    if (disabled) return;
    sfx.key();
    if (k === 'del') onChange(value.slice(0, -1));
    else if (k === '±') onChange(value.startsWith('−') ? value.slice(1) : `−${value}`);
    else if (value.replace('−', '').length < 6) onChange(value === '0' ? k : value + k);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if ((e.key === '-' || e.key === '−') && negative) press('±');
      else if (e.key === 'Enter' && value) onSubmit();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', negative ? '±' : '', '0', 'del'];
  return (
    <div className="numpad">
      <div className="numpad__keys">
        {keys.map((k, i) =>
          k ? (
            <button key={i} className={`numpad__key ${k === 'del' ? 'numpad__key--del' : ''} ${k === '±' ? 'numpad__key--sign' : ''}`} onClick={() => press(k)} disabled={disabled} aria-label={k === 'del' ? 'Sil' : k}>
              {k === 'del' ? <Delete size={26} /> : k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <button className="pill pill--teal numpad__ok" disabled={disabled || !value || value === '−'} onClick={onSubmit}>
        <Check size={24} strokeWidth={3} /> Tamam
      </button>
    </div>
  );
}

/** Boş gözlere dokunarak çerçeveyi doldur; eklenen sayaç sayısı cevaptır. */
export function FrameInput({ a, onSubmit, disabled }: { a: number; onSubmit: (v: number) => void; disabled?: boolean }) {
  const [added, setAdded] = useState(0);
  useEffect(() => setAdded(0), [a]);
  const toggle = (i: number) => {
    if (disabled) return;
    sfx.tap();
    // Sırayla dolar: dokunulan göz son doluysa geri al, değilse bir sonrakini doldur.
    if (i === a + added - 1 && added > 0) setAdded(added - 1);
    else if (i >= a + added && a + added < 10) setAdded(added + 1);
  };
  return (
    <div className="frame-input">
      <svg className="visual__svg frame-input__svg" viewBox={`0 0 ${24 + CELL * 5} ${CELL * 2 + 24}`}>
        <FrameGrid frames={1} />
        {Array.from({ length: 10 }, (_, i) => {
          const { x, y } = frameCell(i);
          return <rect key={`hit${i}`} x={x + 2} y={y + 2} width={CELL - 4} height={CELL - 4} fill="transparent" className={i >= a ? 'frame-input__cell' : ''} onClick={() => toggle(i)} />;
        })}
        {Array.from({ length: a }, (_, i) => <Counter key={i} i={i} color="#ff6b4a" />)}
        {Array.from({ length: added }, (_, i) => (
          <g key={`n${i}`} onClick={() => toggle(a + i)} style={{ cursor: 'pointer' }}><Counter i={a + i} color="#14a89a" /></g>
        ))}
      </svg>
      <div className="frame-input__bar">
        <span className="frame-input__count">{added}</span>
        <button className="pill pill--teal" disabled={disabled || added === 0} onClick={() => onSubmit(added)}>
          <Check size={24} strokeWidth={3} /> Tamam
        </button>
      </div>
    </div>
  );
}
