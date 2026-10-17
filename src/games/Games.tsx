/**
 * Mini oyunlar — akıcılık ve kestirim:
 * - Şimşek Tur: 60 saniye, yaşa uygun hızlı sorular. Yanlışta ceza yok: kolay yol ipucu görünür, sonraki soruya geçilir.
 * - Sayı Arkadaşları: toplamı (Dahilerde çarpımı) hedefi veren baloncuk çiftlerini bul.
 * - Tahmin Ustası: hesaplamadan önce tahmin et (Polya'nın "geriye bakış" becerisi).
 */
import confetti from 'canvas-confetti';
import { Flame, Home as HomeIcon, RotateCcw, Timer, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeHost } from '../components/AppShell';
import { Doodles } from '../components/Doodles';
import { ChoiceBubbles, Equation, Numpad, type BoxState } from '../components/Inputs';
import { Mascot } from '../components/Mascot';
import { BackButton } from '../components/ui';
import { fmt, makeChoices } from '../lib/util';
import { sfx } from '../lib/sfx';
import { useApp, useProfile } from '../store/useApp';
import { bondBoard, estimateRound, quickFact } from '../tricks';
import type { Problem } from '../tricks/types';
import { Visual } from '../visuals/Visual';

function GameFrame({ title, emoji, right, children }: { title: string; emoji: string; right?: React.ReactNode; children: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="bg lesson game">
      <Doodles variant={1} />
      <header className="lesson__top">
        <BackButton onBack={() => nav('/oyunlar')} />
        <div className="lesson__title">
          <small>{emoji} Oyun</small>
          <b>{title}</b>
        </div>
        {right ?? <span />}
      </header>
      <main className="lesson__main">{children}</main>
      <BadgeHost />
    </div>
  );
}

function Ready({ emoji, title, text, onGo }: { emoji: string; title: string; text: string; onGo: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      onGo();
      return;
    }
    sfx.key();
    const t = setTimeout(() => setCount(count - 1), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  return (
    <div className="result rise">
      <span className="ready__emoji">{emoji}</span>
      <h1 className="title-xl">{title}</h1>
      <p className="sub">{text}</p>
      {count === null ? (
        <button className="pill pill--big pulse" onClick={() => { sfx.pop(); setCount(3); }}>Hazırım!</button>
      ) : (
        <span key={count} className="countdown pop-in">{count}</span>
      )}
    </div>
  );
}

function End({ title, lines, earned, onAgain, mood = 'wow' }: { title: string; lines: string[]; earned: number; onAgain: () => void; mood?: 'wow' | 'cheer' }) {
  return (
    <div className="result rise">
      <Mascot size={120} mood={mood} className="float" />
      <h1 className="title-xl">{title}</h1>
      {lines.map((l) => <p key={l} className="sub">{l}</p>)}
      {earned > 0 && <div className="wallet-gain">+{earned} yıldız kazandın</div>}
      <div className="result__actions">
        <button className="pill" onClick={onAgain}><RotateCcw size={20} /> Tekrar oyna</button>
        <Link to="/oyunlar" className="btn-outline"><HomeIcon size={20} /> Oyunlar</Link>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Şimşek Tur
// ------------------------------------------------------------------------------------------------
const SPRINT = 60;

export function SprintGame() {
  const profile = useProfile()!;
  const band = profile.band;
  const young = band === 'minik' || band === 'kesif';
  const setRecord = useApp((s) => s.setRecord);
  const addStars = useApp((s) => s.addStars);
  const logSolve = useApp((s) => s.logSolve);
  const [phase, setPhase] = useState<'ready' | 'play' | 'end'>('ready');
  const [left, setLeft] = useState(SPRINT);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [q, setQ] = useState<Problem>(() => quickFact(band));
  const [value, setValue] = useState('');
  const [box, setBox] = useState<BoxState>('idle');
  const [tip, setTip] = useState<string | null>(null);
  const [lock, setLock] = useState(false);
  const [newRec, setNewRec] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (phase !== 'play') return;
    if (left <= 0) {
      const s = scoreRef.current;
      setNewRec(setRecord('simsek', s));
      addStars(Math.floor(s / 3));
      setPhase('end');
      sfx.fanfare();
      if (s >= 8) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      return;
    }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  const choices = useMemo(() => (young ? makeChoices(q.answer, 3) : undefined), [q, young]);

  const nextQ = () => {
    setQ(quickFact(band));
    setValue('');
    setBox('idle');
    setTip(null);
    setLock(false);
  };

  const submit = (v: number) => {
    if (lock || phase !== 'play') return;
    setLock(true);
    if (v === q.answer) {
      sfx.right();
      setBox('right');
      setValue(fmt(v));
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setCombo((c) => c + 1);
      logSolve(true);
      setTimeout(nextQ, 350);
    } else {
      sfx.soft();
      setBox('show');
      setValue(fmt(q.answer));
      setCombo(0);
      setTip(`Kolay yol: ${q.hint}`);
      setTimeout(nextQ, 1500);
    }
  };

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setLeft(SPRINT);
    nextQ();
    setPhase('play');
  };

  return (
    <GameFrame title="Şimşek Tur" emoji="⚡" right={phase === 'play' ? <span className="chip"><Zap size={18} color="#e8a200" fill="#ffc83d" /> {score}</span> : undefined}>
      {phase === 'ready' && <Ready emoji="⚡" title="Şimşek Tur" text="60 saniyen var. Kolay yolları kullan, hızlı ol! Yanlış yaparsan dert etme, ipucunu görüp devam et." onGo={start} />}
      {phase === 'play' && (
        <div className="sprint">
          <div className="timebar-lite"><i style={{ width: `${(left / SPRINT) * 100}%` }} className={left <= 10 ? 'low' : ''} /></div>
          <div className="sprint__meta">
            <span className="chip"><Timer size={18} /> {left} sn</span>
            {combo >= 3 && <span className="chip chip--combo pop-in" key={combo}><Flame size={18} color="#ff8a3d" fill="#ffb13b" /> {combo} seri!</span>}
          </div>
          {q.visual && band === 'minik' && <div className="runner__visual paper-card"><Visual spec={q.visual} /></div>}
          <Equation eq={q.expr} value={value} state={box} size="xl" />
          {tip && <div className="hint-card pop-in">{tip}</div>}
          <div className="runner__input">
            {choices ? (
              <ChoiceBubbles key={q.expr} choices={choices} onPick={submit} disabled={lock} />
            ) : (
              <Numpad value={box === 'idle' ? value : ''} onChange={setValue} negative={q.negative} disabled={lock} onSubmit={() => submit(Number(value.replace('−', '-')))} />
            )}
          </div>
        </div>
      )}
      {phase === 'end' && (
        <End title={newRec ? 'Yeni rekor!' : 'Süre doldu!'} lines={[`${score} soruyu doğru çözdün.`, score >= 10 ? 'Şimşek gibisin! ⚡' : 'Her turda daha da hızlanacaksın!']} earned={Math.floor(score / 3)} onAgain={() => setPhase('ready')} />
      )}
    </GameFrame>
  );
}

// ------------------------------------------------------------------------------------------------
// Sayı Arkadaşları
// ------------------------------------------------------------------------------------------------
export function BondsGame() {
  const profile = useProfile()!;
  const setRecord = useApp((s) => s.setRecord);
  const addStars = useApp((s) => s.addStars);
  const [round, setRound] = useState(0);
  const board = useMemo(() => bondBoard(profile.band), [profile.band, round]);
  const [gone, setGone] = useState<Set<number>>(new Set());
  const [sel, setSel] = useState<number | null>(null);
  const [shake, setShake] = useState<number[]>([]);
  const [start, setStart] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState<{ secs: number; rec: boolean } | null>(null);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [done]);

  const tap = (i: number) => {
    if (gone.has(i) || done) return;
    if (sel === null) {
      sfx.tap();
      setSel(i);
      return;
    }
    if (sel === i) return setSel(null);
    const a = board.nums[sel], b = board.nums[i];
    const ok = board.sign === '+' ? a + b === board.target : a * b === board.target;
    if (ok) {
      sfx.right();
      const g = new Set(gone);
      g.add(sel);
      g.add(i);
      setGone(g);
      setSel(null);
      if (g.size === board.nums.length) {
        const secs = Math.round((Date.now() - start) / 1000);
        setDone({ secs, rec: setRecord('arkadas', secs, true) });
        addStars(3);
        sfx.fanfare();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      sfx.soft();
      setShake([sel, i]);
      setSel(null);
      setTimeout(() => setShake([]), 500);
    }
  };

  const again = () => {
    setRound((r) => r + 1);
    setGone(new Set());
    setSel(null);
    setStart(Date.now());
    setDone(null);
  };

  const left = board.nums.length - gone.size;
  return (
    <GameFrame title="Sayı Arkadaşları" emoji="🫧" right={<span className="chip"><Timer size={18} /> {Math.round(((done ? start + done.secs * 1000 : now) - start) / 1000)} sn</span>}>
      {!done ? (
        <div className="bonds">
          <div className="bonds__target">
            <span>{board.sign === '+' ? 'Toplamı' : 'Çarpımı'}</span>
            <b>{board.target}</b>
            <span>olan çiftleri patlat!</span>
          </div>
          {sel !== null && (
            <p className="bonds__hint pop-in">
              {board.nums[sel]} {board.sign} <b>?</b> = {board.target}
            </p>
          )}
          <div className="bonds__grid">
            {board.nums.map((n, i) => (
              <button key={`${round}-${i}`} className={`bubble-btn ${gone.has(i) ? 'popped' : ''} ${sel === i ? 'sel' : ''} ${shake.includes(i) ? 'shake' : ''}`}
                style={{ ['--h' as string]: `${(i * 47) % 360}`, animationDelay: `${i * 0.04}s` }} onClick={() => tap(i)} disabled={gone.has(i)}>
                {n}
              </button>
            ))}
          </div>
          <p className="muted bonds__left">{left / 2} çift kaldı</p>
        </div>
      ) : (
        <End title={done.rec ? 'Yeni rekor!' : 'Hepsini buldun!'} lines={[`${done.secs} saniyede tüm arkadaşları buluşturdun.`, 'Sayı çiftlerini bilmek her hesabı kolaylaştırır!']} earned={3} onAgain={again} />
      )}
    </GameFrame>
  );
}

// ------------------------------------------------------------------------------------------------
// Tahmin Ustası
// ------------------------------------------------------------------------------------------------
const ROUNDS = 10;
const ROUND_SECS = 7;

export function EstimateGame() {
  const profile = useProfile()!;
  const setRecord = useApp((s) => s.setRecord);
  const addStars = useApp((s) => s.addStars);
  const [phase, setPhase] = useState<'ready' | 'play' | 'end'>('ready');
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [r, setR] = useState(() => estimateRound(profile.band));
  const [left, setLeft] = useState(ROUND_SECS);
  const [picked, setPicked] = useState<number | null>(null);
  const [rec, setRec] = useState(false);

  useEffect(() => {
    if (phase !== 'play' || picked !== null) return;
    if (left <= 0) return choose(NaN);
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left, picked]);

  const choose = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    const ok = v === r.answer;
    if (ok) {
      sfx.right();
      setScore((s) => s + 1);
    } else sfx.soft();
    setTimeout(() => {
      if (n + 1 >= ROUNDS) {
        const final = score + (ok ? 1 : 0);
        setRec(setRecord('tahmin', final));
        addStars(Math.floor(final / 3));
        setPhase('end');
        sfx.fanfare();
        return;
      }
      setN(n + 1);
      setR(estimateRound(profile.band));
      setPicked(null);
      setLeft(ROUND_SECS);
    }, 1100);
  };

  const young = profile.band === 'minik' || profile.band === 'kesif';
  return (
    <GameFrame title="Tahmin Ustası" emoji="🎯" right={phase === 'play' ? <span className="chip">{n + 1} / {ROUNDS}</span> : undefined}>
      {phase === 'ready' && (
        <Ready emoji="🎯" title="Tahmin Ustası" text={young ? 'İki toplamdan hangisi daha büyük? Saymadan, hızlıca karar ver!' : 'Hesaplama! Sayıları yuvarla ve sonuca en yakın olanı seç. Her soruya 7 saniye.'}
          onGo={() => { setN(0); setScore(0); setR(estimateRound(profile.band)); setPicked(null); setLeft(ROUND_SECS); setPhase('play'); }} />
      )}
      {phase === 'play' && (
        <div className="sprint">
          <div className="timebar-lite"><i style={{ width: `${(left / ROUND_SECS) * 100}%` }} className={left <= 2 ? 'low' : ''} /></div>
          <h2 className="estimate__q">{r.q}</h2>
          {!young && <p className="muted">Sonuca en yakın hangisi?</p>}
          <div className={`choices choices--${r.options.length}`}>
            {r.options.map((o) => (
              <button key={o.label} className={`choice choice--wide ${picked !== null && o.value === r.answer ? 'choice--ok' : ''} ${picked === o.value && o.value !== r.answer ? 'choice--off' : ''}`}
                disabled={picked !== null} onClick={() => { sfx.tap(); choose(o.value); }}>
                {o.label}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className={`feedback ${picked === r.answer ? 'feedback--right' : 'feedback--wrong'} pop-in`}>
              {picked === r.answer ? 'Süper tahmin!' : young ? `Bak: ${r.options.find((o) => o.value === r.answer)?.label} daha büyük!` : `En yakını: ${r.answer}. Sayıları en yakın onluğa/yüzlüğe yuvarla!`}
            </div>
          )}
        </div>
      )}
      {phase === 'end' && (
        <End title={rec ? 'Yeni rekor!' : 'Tahminler bitti!'} lines={[`${ROUNDS} tahminden ${score} tanesi tam isabet!`, 'İyi tahmin eden, hatasını da hemen fark eder.']} earned={Math.floor(score / 3)} onAgain={() => setPhase('ready')} mood="cheer" />
      )}
    </GameFrame>
  );
}
