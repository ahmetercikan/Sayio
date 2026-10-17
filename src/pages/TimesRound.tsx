/**
 * Çarpım tablosu — günün turu.
 *
 * Sorular aralıklı tekrar motoruyla seçilir (src/times/mastery.ts): zamanı gelmiş tekrarlar önce,
 * sonra henüz tanışılmamış çarpımlar; aynı aile arka arkaya gelmez (harmanlama).
 * Zaman tutulmaz, yanlış cevap cezalandırılmaz — takılınca kolay yol adım adım açılır.
 */
import confetti from 'canvas-confetti';
import { Grid3x3, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeHost } from '../components/AppShell';
import { Doodles } from '../components/Doodles';
import { Mascot } from '../components/Mascot';
import { ProblemRunner, type RunResult } from '../components/ProblemRunner';
import { BackButton, StepDots } from '../components/ui';
import { sfx } from '../lib/sfx';
import { useApp, useFacts, useProfile } from '../store/useApp';
import { FAMILIES } from '../times/facts';
import { pickRound } from '../times/mastery';
import { problemFor } from '../times/table';

const N = 10;

export default function TimesRound() {
  const nav = useNavigate();
  const profile = useProfile()!;
  const map = useFacts();
  const data = useApp((s) => (s.activeId ? s.data[s.activeId] : undefined));
  const answerFact = useApp((s) => s.answerFact);
  const addStars = useApp((s) => s.addStars);
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [clean, setClean] = useState(0);
  const [done, setDone] = useState(false);

  // Kolay yolu öğrenilmiş aileler: yeni çarpımlar önce buralardan gelir.
  const facts = useMemo(() => {
    const learned = new Set(
      Object.entries(FAMILIES)
        .filter(([, info]) => data?.tricks[info.trickId])
        .map(([f]) => f),
    );
    return pickRound(map, N, learned);
    // Tur başlarken bir kez seçilir; cevaplar listeyi değiştirmesin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const total = facts.length;
  const fact = facts[idx];
  const problem = useMemo(() => (fact ? problemFor(fact.a, fact.b) : null), [fact]);

  const onDone = (r: RunResult) => {
    const perfect = r.mistakes === 0 && !r.assisted;
    answerFact(fact.a, fact.b, perfect);
    const c = clean + (perfect ? 1 : 0);
    setClean(c);
    if (idx + 1 < total) return setIdx(idx + 1);
    addStars(Math.max(1, Math.ceil(c / 2)));
    setDone(true);
    sfx.fanfare();
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 }, colors: ['#3f7fe0', '#14a89a', '#ffc83d'] });
  };

  if (!total)
    return (
      <div className="bg lesson">
        <Doodles variant={3} />
        <header className="lesson__top">
          <BackButton onBack={() => nav(-1)} />
          <div className="lesson__title"><b>Günün turu</b></div>
        </header>
        <main className="lesson__main">
          <div className="result rise">
            <Mascot size={130} mood="happy" className="float" />
            <h1 className="title-xl">Bugünlük bu kadar!</h1>
            <p className="sub">Tekrar zamanı gelen çarpım kalmadı. Yarın yine buradayız — beyin, araları açılan tekrarlarla daha iyi hatırlıyor.</p>
            <Link to="/carpim" className="pill"><Grid3x3 size={20} /> Haritaya dön</Link>
          </div>
        </main>
      </div>
    );

  return (
    <div className="bg lesson">
      <Doodles variant={3} />
      <header className="lesson__top">
        <BackButton onBack={() => nav(-1)} />
        <div className="lesson__title">
          <small>✖️ Çarpım tablosu</small>
          <b>Günün Turu</b>
        </div>
        <StepDots total={total} now={done ? total : idx} />
      </header>
      <main className="lesson__main">
        {!done && problem ? (
          <ProblemRunner key={`${round}-${idx}`} problem={problem} band={profile.band} mode="solo" onDone={onDone} autoSpeak />
        ) : (
          <div className="result rise">
            <Mascot size={130} mood="wow" className="float" />
            <h1 className="title-xl">Tur tamam!</h1>
            <p className="sub">{total} çarpımdan {clean} tanesini kolay yoldan, tek seferde buldun.</p>
            <div className="wallet-gain">+{Math.max(1, Math.ceil(clean / 2))} yıldız kazandın</div>
            <div className="result__actions">
              <button className="btn-outline" onClick={() => { setRound((r) => r + 1); setIdx(0); setClean(0); setDone(false); }}>
                <RotateCcw size={20} /> Bir tur daha
              </button>
              <Link to="/carpim" className="pill"><Grid3x3 size={20} /> Haritam</Link>
            </div>
          </div>
        )}
      </main>
      <BadgeHost />
    </div>
  );
}
