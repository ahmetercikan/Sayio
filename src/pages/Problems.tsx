/**
 * Problem Çözme Atölyesi — Polya'nın 4 aşaması, Singapur çubuk modeliyle:
 * 🔍 Anla (ne soruluyor?) → 🗺️ Planla (hangi çubuk modeli?) → ✏️ Uygula (iskeleli adımlar) → ✅ Kontrol (ters işlem).
 * Miniklerde planlama ve kontrol atlanır; problem resimlerle anlatılır.
 */
import confetti from 'canvas-confetti';
import { ArrowRight, Check, Home as HomeIcon, RotateCcw, Search, Map, Pencil, CircleCheck, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Mascot, MascotSays } from '../components/Mascot';
import { ProblemRunner } from '../components/ProblemRunner';
import { StepDots } from '../components/ui';
import { sfx } from '../lib/sfx';
import { speak } from '../lib/speech';
import { makeWordProblem, type WordProblem } from '../problems/word';
import { useApp, useProfile } from '../store/useApp';
import type { Problem } from '../tricks/types';
import { Visual } from '../visuals/Visual';

type Stage = 'anla' | 'planla' | 'uygula' | 'kontrol' | 'tamam';
const COUNT = 3;

const STAGES: { id: Stage; title: string; Icon: typeof Search }[] = [
  { id: 'anla', title: 'Anla', Icon: Search },
  { id: 'planla', title: 'Planla', Icon: Map },
  { id: 'uygula', title: 'Uygula', Icon: Pencil },
  { id: 'kontrol', title: 'Kontrol', Icon: CircleCheck },
];

export default function Problems() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <AppShell flow={3}>
      {!started ? (
        <ProblemsIntro onStart={() => { sfx.pop(); setStarted(true); }} />
      ) : (
        <Session key={round} onAgain={() => setRound((r) => r + 1)} />
      )}
    </AppShell>
  );
}

function ProblemsIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="pintro">
      <header className="page-head rise">
        <div>
          <p className="sub">Metni matematiğe çevirmeyi öğren</p>
          <h1 className="title-xl">Problem Çözme</h1>
        </div>
      </header>
      <MascotSays mood="think">
        Problemlerde en zor kısım hesap değil, <b>ne sorulduğunu anlamaktır</b>. Dedektif gibi 4 adımda çözeceğiz!
      </MascotSays>
      <div className="polya-grid rise">
        {[
          ['🔍', 'Anla', 'Ne verilmiş, ne soruluyor?'],
          ['🗺️', 'Planla', 'Problemi bir çubuk modeliyle çiz.'],
          ['✏️', 'Uygula', 'Kolay yoldan hesapla.'],
          ['✅', 'Kontrol', 'Ters işlemle sağlamasını yap.'],
        ].map(([e, t, d], i) => (
          <div key={t} className="polya-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="polya-card__n">{i + 1}</span>
            <span className="polya-card__e">{e}</span>
            <b>{t}</b>
            <small>{d}</small>
          </div>
        ))}
      </div>
      <div className="center-row">
        <button className="pill pill--big pulse" onClick={onStart}>Problemlere başla <ArrowRight size={24} /></button>
      </div>
    </div>
  );
}

function Session({ onAgain }: { onAgain: () => void }) {
  const profile = useProfile()!;
  const markWord = useApp((s) => s.markWord);
  const addStars = useApp((s) => s.addStars);
  const problems = useMemo(() => Array.from({ length: COUNT }, () => makeWordProblem(profile.band)), [profile.band]);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  const next = () => {
    markWord();
    addStars(2);
    if (i + 1 < COUNT) setI(i + 1);
    else {
      setFinished(true);
      sfx.fanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ff6b4a', '#14a89a', '#ffc83d'] });
    }
  };

  if (finished) {
    return (
      <div className="result rise">
        <Mascot size={130} mood="wow" className="float" />
        <h1 className="title-xl">Problem dedektifi!</h1>
        <p className="sub">{COUNT} problemi 4 adımda çözdün. Anlamak, planlamak, uygulamak, kontrol etmek: işte gerçek matematikçi!</p>
        <div className="wallet-gain">+{COUNT * 2} yıldız kazandın</div>
        <div className="result__actions">
          <button className="pill" onClick={onAgain}><RotateCcw size={20} /> Yeni problemler</button>
          <Link to="/" className="btn-outline"><HomeIcon size={20} /> Ana sayfa</Link>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="session-top">
        <b>Problem {i + 1} / {COUNT}</b>
        <StepDots total={COUNT} now={i} />
      </div>
      <PolyaFlow key={i} wp={problems[i]} onDone={next} />
    </>
  );
}

function PolyaFlow({ wp, onDone }: { wp: WordProblem; onDone: () => void }) {
  const profile = useProfile()!;
  const settings = useApp((s) => s.settings);
  const mini = wp.band === 'minik';
  const [stage, setStage] = useState<Stage>('anla');
  const [wrong, setWrong] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [okPick, setOkPick] = useState<number | null>(null);

  const stages = STAGES.filter((s) => !mini || (s.id !== 'planla' && s.id !== 'kontrol') || (s.id === 'kontrol' && wp.check));
  const read = () => speak(wp.text, { rate: settings.rate });

  useEffect(() => {
    if (settings.narration && (wp.band === 'minik' || wp.band === 'kesif')) read();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goto = (s: Stage) => {
    setStage(s);
    setWrong([]);
    setMsg(null);
    setOkPick(null);
  };
  const after = (s: Stage): Stage => {
    const order = stages.map((x) => x.id);
    const k = order.indexOf(s);
    return k + 1 < order.length ? order[k + 1] : 'tamam';
  };

  const pickAsk = (k: number) => {
    if (okPick !== null) return;
    if (k === wp.askIndex) {
      sfx.right();
      setOkPick(k);
      setMsg('Evet! Ne sorulduğunu buldun.');
      setTimeout(() => goto(after('anla')), 900);
    } else {
      sfx.soft();
      setWrong((w) => [...w, k]);
      setMsg('Soruyu bir daha oku: en sondaki cümle neyi soruyor?');
    }
  };

  const pickModel = (k: number) => {
    if (okPick !== null) return;
    if (k === wp.modelIndex) {
      sfx.right();
      setOkPick(k);
      setMsg('Harika plan! Bu çubuk modeli problemi tam anlatıyor.');
      setTimeout(() => goto('uygula'), 1000);
    } else {
      sfx.soft();
      setWrong((w) => [...w, k]);
      setMsg(
        wp.kind === 'compare' ? 'İpucu: iki şeyi karşılaştırıyorsak iki ayrı çubuk alt alta durur.'
          : wp.kind === 'multi' ? 'İpucu: "kat" varsa eşit kutular kullanırız.'
          : wp.kind === 'groups' ? 'İpucu: eşit gruplar varsa çubuk eşit parçalara bölünür.'
          : 'İpucu: parçalar yan yana durur, bütün altta parantezle gösterilir.',
      );
    }
  };

  const solveProblem: Problem = {
    trickId: 'word',
    expr: `Cevap: ? ${wp.unit}`,
    answer: wp.answer,
    steps: wp.steps,
    hint: 'Çubuk modeline bak!',
    visual: wp.models[wp.modelIndex],
    visualAlways: true,
  };
  const checkProblem: Problem | null = wp.check
    ? { trickId: 'word', expr: `Sağlama`, answer: wp.check.answer, steps: [wp.check], hint: 'Ters işlem!', visualAlways: true }
    : null;

  return (
    <div className="polya">
      <div className="polya-steps">
        {stages.map((s, k) => {
          const cur = stages.findIndex((x) => x.id === stage);
          const state = stage === 'tamam' || k < cur ? 'done' : k === cur ? 'now' : '';
          return (
            <span key={s.id} className={`polya-step ${state}`}>
              {state === 'done' ? <Check size={18} strokeWidth={3} /> : <s.Icon size={18} />} {s.title}
            </span>
          );
        })}
      </div>

      <div className="problem-card paper-card rise">
        <p className="problem-card__text">{wp.text}</p>
        <button className="speak-btn" onClick={read} aria-label="Sesli oku"><Volume2 size={18} /></button>
        {wp.picture && <Picture wp={wp} />}
        {!mini && (
          <div className="given">
            <span className="given__label">Verilenler:</span>
            {wp.given.map((g) => (
              <span key={g.label} className="given__chip">{g.label}: <b>{Number.isInteger(g.value) ? g.value : `${wp.text.match(/\d+\/\d+/)?.[0] ?? g.value}`}</b></span>
            ))}
          </div>
        )}
      </div>

      {stage === 'anla' && (
        <div className="stage rise">
          <h2 className="stage__title">🔍 Ne soruluyor?</h2>
          <div className="option-list">
            {wp.askOptions.map((o, k) => (
              <button key={k} className={`option ${wrong.includes(k) ? 'option--off' : ''} ${okPick === k ? 'option--ok' : ''}`} disabled={wrong.includes(k)} onClick={() => pickAsk(k)}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {stage === 'planla' && (
        <div className="stage rise">
          <h2 className="stage__title">🗺️ Hangi çubuk modeli bu problemi anlatıyor?</h2>
          <div className="model-list">
            {wp.models.map((m, k) => (
              <button key={k} className={`model-opt paper-card ${wrong.includes(k) ? 'option--off' : ''} ${okPick === k ? 'option--ok' : ''}`} disabled={wrong.includes(k)} onClick={() => pickModel(k)}>
                <Visual spec={m} />
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'uygula' && (
        <div className="stage rise">
          <h2 className="stage__title">✏️ Kolay yoldan hesapla</h2>
          <ProblemRunner problem={solveProblem} band={profile.band} mode="guided" onDone={() => { goto(after('uygula')); }} />
        </div>
      )}

      {stage === 'kontrol' && checkProblem && (
        <div className="stage rise">
          <h2 className="stage__title">✅ Sonuç mantıklı mı? Sağlamasını yap</h2>
          <ProblemRunner problem={checkProblem} band={profile.band} mode="guided" onDone={() => goto('tamam')} />
        </div>
      )}

      {stage === 'tamam' && (
        <div className="stage stage--done pop-in">
          <MascotSays mood="cheer">
            <b>Cevap: {wp.answer} {wp.unit}.</b> {wp.check ? 'Sağlaması da tuttu, cevabından emin olabilirsin!' : 'Harika iş çıkardın!'}
          </MascotSays>
          <button className="pill pill--big" onClick={() => { sfx.pop(); onDone(); }}>Devam <ArrowRight size={24} /></button>
        </div>
      )}

      {msg && stage !== 'uygula' && stage !== 'kontrol' && stage !== 'tamam' && (
        <div className={`feedback ${okPick !== null ? 'feedback--right' : 'feedback--wrong'} pop-in`}>{msg}</div>
      )}
    </div>
  );
}

/** Miniklerin problemi: nesneler resimli; çıkarmada verilenler soluk ve çarpılı. */
function Picture({ wp }: { wp: WordProblem }) {
  const p = wp.picture!;
  const items = p.op === '+' ? p.a + p.b : p.a;
  return (
    <div className="picture">
      {Array.from({ length: items }, (_, i) => {
        const gone = p.op === '−' && i >= p.a - p.b;
        const second = p.op === '+' && i >= p.a;
        return (
          <span key={i} className={`picture__item v-pop ${gone ? 'picture__item--gone' : ''} ${second ? 'picture__item--b' : ''}`} style={{ animationDelay: `${i * 0.07}s` }}>
            {wp.emoji}
          </span>
        );
      })}
    </div>
  );
}
