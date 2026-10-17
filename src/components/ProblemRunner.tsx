/**
 * Soru çözücü — iskeleli (scaffolding) öğretimin kalbi.
 *
 * - 'guided': kolay yol adım adım sorulur; her adımın cevabı bir sonrakini hazırlar.
 * - 'solo'  : yalnızca asıl soru sorulur. İsteyen "Kolay yolu göster" ile adımlara geçer.
 *
 * Yanlış cevapta asla "yanlış, doğrusu X" denmez: önce hatanın türüne göre nazik bir yönlendirme ve görsel model
 * açılır; ikinci yanlışta solo → adım adım moda geçilir, adımda ise çözüm gerekçesiyle gösterilir.
 * Sağ üstteki göz (CPA anahtarı) soyut sayıları somut modele çevirir.
 */
import { Eye, EyeOff, Lightbulb, Footprints, Volume2, ArrowRight, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeChoices, nudge, pick, PRAISE, fmt } from '../lib/util';
import { ASK_OLDER, ASK_YOUNG } from '../lib/narration';
import { sfx } from '../lib/sfx';
import { speak } from '../lib/speech';
import { useApp } from '../store/useApp';
import type { Band, Problem, Step } from '../tricks/types';
import { Visual } from '../visuals/Visual';
import { Notebook } from '../sketch/Notebook';
import { hasSketch, sketchFor } from '../sketch/recipes';
import { ChoiceBubbles, Equation, FrameInput, Numpad, type BoxState } from './Inputs';
import { Mascot, type Mood } from './Mascot';

export interface RunResult { mistakes: number; assisted: boolean }

type Feedback = { kind: 'right' | 'wrong' | 'reveal' | 'info'; text: string } | null;

const fill = (eq: string, v: number) => eq.replace('?', fmt(v));

export function ProblemRunner({ problem, band, mode, onDone, autoSpeak }: {
  problem: Problem; band: Band; mode: 'guided' | 'solo'; onDone: (r: RunResult) => void; autoSpeak?: boolean;
}) {
  const settings = useApp((s) => s.settings);
  const logSolve = useApp((s) => s.logSolve);
  const young = band === 'minik' || band === 'kesif';
  const [guided, setGuided] = useState(mode === 'guided');
  const [stepIdx, setStepIdx] = useState(0);
  const [value, setValue] = useState('');
  const [wrongHere, setWrongHere] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [eye, setEye] = useState(!!problem.visualAlways || young);
  const [hint, setHint] = useState(false);
  const [fb, setFb] = useState<Feedback>(null);
  const [box, setBox] = useState<BoxState>('idle');
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<Mood>('happy');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Adım adım modda kolay yol, deftere kalemle çizilir (her doğru adımda bir parça daha).
  const sketch = useMemo(() => (guided && hasSketch(problem.trickId, true) ? sketchFor(problem) : null), [guided, problem]);
  useEffect(() => {
    if (sketch) setEye(false);
  }, [sketch]);

  const target: Step = guided
    ? problem.steps[stepIdx]
    : { say: problem.ask ?? (young ? ASK_YOUNG : ASK_OLDER), eq: problem.expr, answer: problem.answer, choices: problem.choices };

  const choices = useMemo(
    () => target.choices ?? (young ? makeChoices(target.answer, band === 'minik' ? 3 : 4, !!problem.negative) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guided, stepIdx, problem],
  );

  const frameMode = problem.input === 'frame' && problem.visual?.type === 'tenframe' && target.eq.includes('?');

  const read = () => speak(`${target.say} ${target.eq === '?' ? '' : target.eq}`, { rate: settings.rate });
  useEffect(() => {
    if ((autoSpeak ?? young) && settings.narration) read();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided, stepIdx, problem]);

  const resetForNext = () => {
    setValue('');
    setWrongHere(0);
    setWrongPicks([]);
    setBox('idle');
    setFb(null);
    setHint(false);
    setMood('happy');
    setBusy(false);
  };

  const advance = (extraMistakes = 0) => {
    const last = !guided || stepIdx >= problem.steps.length - 1;
    if (last) {
      logSolve(mistakes + extraMistakes === 0);
      onDone({ mistakes: mistakes + extraMistakes, assisted: guided && mode === 'solo' });
      return;
    }
    setStepIdx((i) => i + 1);
    resetForNext();
  };

  const submit = (raw: number) => {
    if (busy) return;
    if (raw === target.answer) {
      sfx.right();
      setBox('right');
      setMood('cheer');
      setValue(fmt(raw));
      const lastStep = !guided || stepIdx >= problem.steps.length - 1;
      setFb({ kind: 'right', text: lastStep ? pick(PRAISE) : pick(['Evet!', 'Doğru!', 'Harika!', 'Süper!']) });
      setBusy(true);
      timer.current = window.setTimeout(() => advance(), lastStep ? 1100 : 750);
      return;
    }
    sfx.soft();
    setMood('think');
    setBox('wrong');
    setMistakes((m) => m + 1);
    const n = wrongHere + 1;
    setWrongHere(n);
    setWrongPicks((w) => [...w, raw]);
    if (!guided) {
      if (n === 1) {
        setEye(true);
        setHint(true);
        setFb({ kind: 'wrong', text: nudge(raw, target.answer) });
      } else {
        // İkinci yanlış: kolay yolu birlikte, adım adım yürüyelim.
        setFb({ kind: 'info', text: 'Gel, kolay yoldan adım adım yapalım!' });
        setBusy(true);
        timer.current = window.setTimeout(() => {
          setGuided(true);
          setStepIdx(0);
          setEye(true);
          setValue('');
          setWrongHere(0);
          setWrongPicks([]);
          setBox('idle');
          setBusy(false);
        }, 1200);
      }
    } else if (n === 1) {
      setEye(true);
      setFb({ kind: 'wrong', text: target.hint ?? nudge(raw, target.answer) });
    } else {
      // Adımda ikinci yanlış: çözümü gerekçesiyle göster, çocuk "Anladım" deyince devam.
      setBox('show');
      setValue(fmt(target.answer));
      setBusy(true);
      setFb({ kind: 'reveal', text: `Bak: ${fill(target.eq, target.answer)}` });
    }
    timer.current = window.setTimeout(() => {
      setBox((b) => (b === 'wrong' ? 'idle' : b));
      setValue((v) => (n >= 2 && guided ? v : ''));
    }, 650);
  };

  const showSteps = () => {
    sfx.pop();
    setGuided(true);
    setStepIdx(0);
    setEye(true);
    resetForNext();
  };

  const tf = problem.visual?.type === 'tenframe' ? problem.visual : undefined;

  return (
    <div className="runner">
      <div className="runner__head">
        {guided ? (
          <div className="runner__q">
            <span className="runner__q-label">Soru</span>
            <Equation eq={problem.expr} size="sm" />
          </div>
        ) : (
          <span />
        )}
        {problem.visual && (!problem.visualAlways || sketch) && (
          <button className={`round-btn eye-btn ${eye ? 'round-btn--on' : ''}`} aria-pressed={eye} aria-label={eye ? 'Modeli gizle' : 'Modeli göster'} title="Somut model (göz)"
            onClick={() => { sfx.tap(); setEye(!eye); }}>
            {eye ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
        )}
      </div>

      {problem.visual && (eye || (problem.visualAlways && !sketch)) && !frameMode && (
        <div className="runner__visual paper-card pop-in" key={`${problem.expr}-${guided}`}>
          <Visual spec={problem.visual} />
        </div>
      )}

      {sketch && (
        <div className="runner__notebook">
          <Notebook sketch={sketch} upto={stepIdx + (box === 'right' || box === 'show' ? 1 : 0)} />
        </div>
      )}

      {guided && !sketch && stepIdx > 0 && (
        <ol className="trail">
          {problem.steps.slice(0, stepIdx).map((s, i) => (
            <li key={i} className="trail__item pop-in">
              <span className="trail__check"><Check size={16} strokeWidth={3.5} /></span>
              <Equation eq={fill(s.eq, s.answer)} size="sm" />
            </li>
          ))}
        </ol>
      )}

      <div className="runner__ask">
        <Mascot size={56} mood={mood} className="runner__mascot" />
        <div className="bubble bubble--ask">
          {guided && problem.steps.length > 1 && <span className="runner__stepno">{stepIdx + 1}. adım</span>}
          <span>{target.say}</span>
          <button className="speak-btn" onClick={read} aria-label="Sesli oku"><Volume2 size={18} /></button>
        </div>
      </div>

      {(guided || target.eq !== '?') && <Equation eq={target.eq} value={value} state={box} size={guided ? 'lg' : 'xl'} />}

      {fb && (
        <div className={`feedback feedback--${fb.kind} pop-in`} role="status">
          <span>{fb.text}</span>
          {fb.kind === 'reveal' && (
            <button className="pill pill--sm pill--yellow" onClick={() => { sfx.tap(); advance(); }}>
              Anladım <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
      {hint && !guided && fb?.kind !== 'info' && (
        <div className="hint-card pop-in"><Lightbulb size={20} /> {problem.hint}</div>
      )}

      <div className="runner__input">
        {frameMode && tf ? (
          <FrameInput a={tf.a} onSubmit={submit} disabled={busy} />
        ) : choices ? (
          <ChoiceBubbles key={`${guided}-${stepIdx}`} choices={choices} onPick={submit} disabled={busy} wrong={wrongPicks} />
        ) : (
          <Numpad value={value} onChange={setValue} negative={problem.negative} disabled={busy}
            onSubmit={() => submit(Number(value.replace('−', '-')))} />
        )}
      </div>

      {!guided && problem.steps.length > 1 && (
        <div className="runner__help">
          {!hint && (
            <button className="help-btn" onClick={() => { sfx.tap(); setHint(true); setEye(true); }}>
              <Lightbulb size={18} /> İpucu
            </button>
          )}
          <button className="help-btn" onClick={showSteps}>
            <Footprints size={18} /> Kolay yolu göster
          </button>
        </div>
      )}
    </div>
  );
}
