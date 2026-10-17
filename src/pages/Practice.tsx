/**
 * Günün antrenmanı: öğrenilen püflerden (yoksa grubun ilk püflerinden) karışık 8 soru — aralıklı tekrar.
 * Solo modda; takılınca kolay yol adım adım açılır.
 */
import confetti from 'canvas-confetti';
import { Home as HomeIcon, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeHost } from '../components/AppShell';
import { Doodles } from '../components/Doodles';
import { Mascot } from '../components/Mascot';
import { ProblemRunner, type RunResult } from '../components/ProblemRunner';
import { BackButton, StepDots } from '../components/ui';
import { shuffle } from '../lib/util';
import { sfx } from '../lib/sfx';
import { useApp, useProfile, useProfileData } from '../store/useApp';
import { reviewPool, tricksByBand } from '../tricks';
import type { Problem } from '../tricks/types';

const N = 8;

export default function Practice() {
  const nav = useNavigate();
  const profile = useProfile()!;
  const data = useProfileData();
  const markQuest = useApp((s) => s.markQuest);
  const addStars = useApp((s) => s.addStars);
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [clean, setClean] = useState(0);
  const [done, setDone] = useState(false);

  const qs: Problem[] = useMemo(() => {
    const played = reviewPool(profile.band).filter((t) => data.tricks[t.id]);
    const pool = played.length >= 2 ? played : tricksByBand(profile.band).slice(0, 3);
    const list = shuffle(Array.from({ length: N }, (_, i) => pool[i % pool.length]));
    return list.map((t) => t.make(data.tricks[t.id]?.level ?? 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.band, round]);

  const onDone = (r: RunResult) => {
    const c = clean + (r.mistakes === 0 && !r.assisted ? 1 : 0);
    setClean(c);
    if (idx + 1 < N) return setIdx(idx + 1);
    const earned = Math.max(1, Math.ceil(c / 2));
    markQuest();
    addStars(earned);
    setDone(true);
    sfx.fanfare();
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 }, colors: ['#ff6b4a', '#14a89a', '#ffc83d'] });
  };

  return (
    <div className="bg lesson">
      <Doodles variant={2} />
      <header className="lesson__top">
        <BackButton onBack={() => nav(-1)} />
        <div className="lesson__title">
          <small>🧠 Karışık sorular</small>
          <b>Günün Antrenmanı</b>
        </div>
        <StepDots total={N} now={done ? N : idx} />
      </header>
      <main className="lesson__main">
        {!done ? (
          <ProblemRunner key={`${round}-${idx}`} problem={qs[idx]} band={profile.band} mode="solo" onDone={onDone} />
        ) : (
          <div className="result rise">
            <Mascot size={130} mood="wow" className="float" />
            <h1 className="title-xl">Antrenman tamam!</h1>
            <p className="sub">{N} sorudan {clean} tanesini ilk denemede çözdün. Serin devam ediyor! 🔥</p>
            <div className="wallet-gain">+{Math.max(1, Math.ceil(clean / 2))} yıldız kazandın</div>
            <div className="result__actions">
              <button className="btn-outline" onClick={() => { setRound((r) => r + 1); setIdx(0); setClean(0); setDone(false); }}><RotateCcw size={20} /> Bir tur daha</button>
              <Link to="/" className="pill"><HomeIcon size={20} /> Ana sayfa</Link>
            </div>
          </div>
        )}
      </main>
      <BadgeHost />
    </div>
  );
}
