/**
 * Ders akışı (bir püf noktası):
 * 1) Keşfet — maskot fikri anlatır, örnek soru kolay yoldan adım adım açılır (görsel modelle).
 * 2) Birlikte — iskeleli sorular: her adım ayrı sorulur.
 * 3) Sen yap — yalnızca asıl soru; isteyen ipucu ya da adımları açar.
 * 4) Sonuç — yıldızlar, kutlama; 3 yıldızda seviye atlanır (sorular zorlaşır).
 */
import confetti from 'canvas-confetti';
import { ArrowRight, Eye, Home as HomeIcon, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { Equation } from '../components/Inputs';
import { Mascot, MascotSays } from '../components/Mascot';
import { ProblemRunner, type RunResult } from '../components/ProblemRunner';
import { BackButton, StepDots, Stars } from '../components/ui';
import { BadgeHost } from '../components/AppShell';
import { fmt, pick } from '../lib/util';
import { sfx } from '../lib/sfx';
import { PRAISE_DONE, PRAISE_PERFECT, PRAISE_PERFECT_EXTRA } from '../lib/narration';
import { speak, stopSpeaking } from '../lib/speech';
import { useApp, useProfile, useProfileData } from '../store/useApp';
import { getTrick, nextTrick } from '../tricks';
import { OPS, type Problem, type Trick } from '../tricks/types';
import { Visual } from '../visuals/Visual';
import { Notebook } from '../sketch/Notebook';
import { sketchFor } from '../sketch/recipes';

type Phase = 'learn' | 'guided' | 'solo' | 'done';

export function starsFor(soloMistakes: number) {
  return soloMistakes <= 1 ? 3 : soloMistakes <= 3 ? 2 : 1;
}

export default function Lesson() {
  const { id } = useParams();
  const trick = getTrick(id ?? '');
  if (!trick) return <div className="bg page-wait"><Link to="/">Ana sayfa</Link></div>;
  return <LessonFlow key={trick.id} trick={trick} />;
}

function LessonFlow({ trick }: { trick: Trick }) {
  const nav = useNavigate();
  const profile = useProfile()!;
  const data = useProfileData();
  const finishTrick = useApp((s) => s.finishTrick);
  const settings = useApp((s) => s.settings);
  const level = data.tricks[trick.id]?.level ?? 1;
  const young = profile.band === 'minik' || profile.band === 'kesif';
  // Çarpım tablosu yeni bir konu: 2. sınıf çocuğu dinleyerek anlıyor, bu yüzden anlatım
  // her yaşta otomatik açılır (bölümün bütün cümlelerinin doğal ses kaydı var).
  const carpim = trick.group === 'carpim';
  const nG = 2;
  const nS = profile.band === 'minik' ? 3 : profile.band === 'kesif' ? 4 : 5;

  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('learn');
  const [idx, setIdx] = useState(0);
  const [soloMistakes, setSoloMistakes] = useState(0);
  const [result, setResult] = useState<{ stars: number; levelUp: boolean } | null>(null);

  // Her tur için yeni, parametrik sorular.
  const example = useMemo(() => trick.make(1), [trick, round]);
  const guidedQs = useMemo(() => Array.from({ length: nG }, () => trick.make(level)), [trick, level, round]);
  const soloQs = useMemo(() => Array.from({ length: nS }, () => trick.make(level)), [trick, level, nS, round]);

  useEffect(() => () => stopSpeaking(), []);

  const total = 1 + nG + nS;
  const now = phase === 'learn' ? 0 : phase === 'guided' ? 1 + idx : phase === 'solo' ? 1 + nG + idx : total;

  const onGuided = () => {
    if (idx + 1 < nG) setIdx(idx + 1);
    else {
      setPhase('solo');
      setIdx(0);
      sfx.pop();
    }
  };

  const onSolo = (r: RunResult) => {
    const m = soloMistakes + r.mistakes + (r.assisted ? 1 : 0);
    setSoloMistakes(m);
    if (idx + 1 < nS) {
      setIdx(idx + 1);
      return;
    }
    const stars = starsFor(m);
    const { levelUp } = finishTrick(trick.id, stars);
    setResult({ stars, levelUp });
    setPhase('done');
    sfx.fanfare();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ff6b4a', '#14a89a', '#ffc83d', '#3f7fe0'] });
    if (settings.narration)
      speak(stars === 3 ? `${PRAISE_PERFECT} ${pick(PRAISE_PERFECT_EXTRA)}` : PRAISE_DONE, { rate: settings.rate });
  };

  const restart = () => {
    setRound((r) => r + 1);
    setPhase('learn');
    setIdx(0);
    setSoloMistakes(0);
    setResult(null);
  };

  const nxt = nextTrick(trick.id);
  const phaseTitle = phase === 'learn' ? 'Keşfet' : phase === 'guided' ? 'Birlikte yapalım' : phase === 'solo' ? 'Sıra sende!' : 'Bitti!';

  return (
    <div className="bg lesson" style={{ ['--world' as string]: OPS[trick.op].color, ['--world-dark' as string]: OPS[trick.op].dark, ['--world-soft' as string]: OPS[trick.op].soft }}>
      <Doodles variant={3} />
      <header className="lesson__top">
        <BackButton onBack={() => nav(-1)} />
        <div className="lesson__title">
          <small>{trick.emoji} {phaseTitle}</small>
          <b>{trick.title}</b>
        </div>
        <StepDots total={total} now={now} />
      </header>

      <main className="lesson__main">
        {phase === 'learn' && (
          <Intro trick={trick} example={example} young={young} voiced={young || carpim} onStart={() => { sfx.pop(); setPhase('guided'); setIdx(0); }} />
        )}
        {phase === 'guided' && (
          <ProblemRunner key={`g${round}-${idx}`} problem={guidedQs[idx]} band={profile.band} mode="guided" onDone={onGuided} autoSpeak={young || carpim} />
        )}
        {phase === 'solo' && (
          <ProblemRunner key={`s${round}-${idx}`} problem={soloQs[idx]} band={profile.band} mode="solo" onDone={onSolo} autoSpeak={young || carpim} />
        )}
        {phase === 'done' && result && (
          <div className="result rise">
            <Mascot size={130} mood={result.stars === 3 ? 'wow' : 'cheer'} className="float" />
            <h1 className="title-xl">{result.stars === 3 ? 'Muhteşem!' : result.stars === 2 ? 'Çok iyi!' : 'Güzel çalıştın!'}</h1>
            <Stars value={result.stars} size={54} animate />
            <p className="sub">{result.stars === 3 ? `"${trick.title}" artık senin süper gücün!` : 'Her denemede beynin daha da güçleniyor. Bir tur daha atarsan 3 yıldız senin!'}</p>
            <div className="wallet-gain">+{result.stars} yıldız kazandın</div>
            {result.levelUp && (
              <div className="levelup pop-in"><Sparkles size={20} /> Seviye atladın! Sorular artık biraz daha zorlu.</div>
            )}
            <div className="result__actions">
              <button className="btn-outline" onClick={restart}><RotateCcw size={20} /> Bir daha</button>
              {nxt && <button className="pill" onClick={() => nav(`/ders/${nxt.id}`, { replace: true })}>Sıradaki püf <ArrowRight size={22} /></button>}
              <Link to="/" className="btn-outline"><HomeIcon size={20} /> Ana sayfa</Link>
            </div>
          </div>
        )}
      </main>
      <BadgeHost />
    </div>
  );
}

/** Keşfet: fikir + örneğin adım adım açılması. */
function Intro({ trick, example, young, voiced, onStart }: { trick: Trick; example: Problem; young: boolean; voiced: boolean; onStart: () => void }) {
  const settings = useApp((s) => s.settings);
  const [shown, setShown] = useState(0);
  const [model, setModel] = useState(false);
  const sketch = useMemo(() => sketchFor(example), [example]);
  const steps = example.steps;
  const all = shown >= steps.length;

  useEffect(() => {
    if (settings.narration) speak(trick.idea, { rate: settings.rate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reveal = () => {
    sfx.right();
    const s = steps[shown];
    // Adımı yalnızca kaydı olan bölümlerde kendiliğinden okuruz (küçükler + çarpım tablosu).
    // 8-14 yaşın püf sorularının doğal ses kaydı yok; otomatik okursak çocuk cihazın robot
    // sesini duyar. O yaşta çocuk ekrandan okuyor; isterse 🔊 düğmesine basar.
    if (settings.narration && voiced && s) speak(`${s.say} ${s.eq.replace('?', fmt(s.answer))}`, { rate: settings.rate });
    setShown(shown + 1);
  };

  return (
    <div className="intro">
      <MascotSays mood="happy" size={young ? 92 : 80}>
        <p className="intro__idea">{trick.idea}</p>
        <button className="speak-btn" onClick={() => speak(trick.idea, { rate: settings.rate })} aria-label="Sesli oku"><Volume2 size={18} /></button>
      </MascotSays>

      {sketch ? (
        <div className="intro__sketch rise">
          <Notebook sketch={sketch} upto={shown} />
          <div className={`notebook-caption pop-in ${shown === 0 ? 'notebook-caption--q' : ''}`} key={shown}>
            <b>{shown === 0 ? '?' : all ? '★' : shown}</b>
            <span>
              {shown === 0
                ? example.ask ?? 'Soruyu deftere yazdık. Şimdi kolay yolu adım adım çizelim!'
                : all
                  ? `İşte kolay yol! ${steps[shown - 1].say}`
                  : steps[shown - 1].say}
            </span>
          </div>
          {example.visual && (
            <button className={`intro__model-btn ${model ? 'on' : ''}`} onClick={() => { sfx.tap(); setModel(!model); }}>
              <Eye size={18} /> Somut modeli {model ? 'gizle' : 'göster'}
            </button>
          )}
          {model && example.visual && <div className="paper-card runner__visual pop-in"><Visual spec={example.visual} /></div>}
        </div>
      ) : (
      <div className="intro__card paper-card rise">
        <div className="intro__head">
          <span className="intro__label">Örnek</span>
          <Equation eq={all ? example.expr.replace('?', fmt(example.answer)) : example.expr} size="lg" state={all ? 'right' : 'idle'} />
        </div>
        {example.visual && <Visual spec={example.visual} />}
        {example.ask && <p className="intro__ask">{example.ask}</p>}
        <ol className="intro__steps">
          {steps.slice(0, shown).map((s, i) => (
            <li key={i} className="intro__step pop-in">
              <span className="intro__n">{i + 1}</span>
              <span className="intro__say">{s.say}</span>
              <Equation eq={s.eq.replace('?', fmt(s.answer))} size="sm" state="right" />
            </li>
          ))}
        </ol>
      </div>
      )}

      <div className="intro__actions">
        {!all ? (
          <button className="pill pill--big pulse" onClick={reveal}>
            {shown === 0 ? 'Kolay yolu göster' : 'Sonraki adım'} <ArrowRight size={24} />
          </button>
        ) : (
          <button className="pill pill--big pill--teal pulse" onClick={onStart}>
            Şimdi birlikte deneyelim! <ArrowRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
