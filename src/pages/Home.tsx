/**
 * "Bugün": selam, seri ve seviye; günün antrenmanı; sıradaki püf noktası; işlem kartları;
 * problem çözme, şimşek tur ve rozetlere kısayollar. Çizio'nun "Bugün" ekranıyla aynı düzen.
 */
import { Check, ChevronRight, Flame, Grid3x3, Lightbulb, Play, Puzzle, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell, LevelBadge } from '../components/AppShell';
import { Mascot } from '../components/Mascot';
import { Stars } from '../components/ui';
import { sfx } from '../lib/sfx';
import { dayKey, streakOf } from '../lib/util';
import { useFacts, useProfile, useProfileData, type ProfileData } from '../store/useApp';
import { FACTS as ALL_FACTS, HARD_FACTS } from '../times/facts';
import { progressOf } from '../times/mastery';
import { tricks, tricksByBand } from '../tricks';
import { BANDS, OPS, bandIndex, type Band, type Op, type Trick } from '../tricks/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Günaydın';
  if (h < 18) return 'Merhaba';
  return 'İyi akşamlar';
}

const FACTS = [
  'Toplamada sıra önemli değil: 2 + 9 ile 9 + 2 aynı! Büyükten başlamak daha kolay.',
  '10\'un arkadaşlarını bilen, 20\'ye kadar her toplamayı zihinden yapabilir.',
  '9\'un katlarında rakamların toplamı hep 9 eder: 9 × 6 = 54 → 5 + 4 = 9!',
  'Bir sayıyı 5 ile çarpmak, 10 ile çarpıp yarısını almakla aynıdır.',
  'Çıkarma aslında "aradaki fark ne?" sorusudur. Küçükten büyüğe zıplayabilirsin!',
  '11 × 11 = 121, 111 × 111 = 12321. Sayıların da güzel örüntüleri var!',
  'Hata yapmak beyni büyütür! Her yanlış, beyninde yeni bir bağlantı demek.',
  '%10 bulmak için sondaki sıfırı silmen yeter: 250\'nin %10\'u 25.',
  'Çarpma tablosunu ezberlemek yerine parçala: 7 × 8 = 7 × 5 + 7 × 3.',
  'Matematikçiler de tahmin eder! Önce tahmin et, sonra hesapla, sonra karşılaştır.',
];

/** Önerilen püf: kendi grubunda henüz 3 yıldız alınmamış ilk püf; hepsi bittiyse bir üst grup. */
export function recommend(band: Band, data: ProfileData): Trick {
  for (let i = bandIndex(band); i < BANDS.length; i++) {
    const t = tricksByBand(BANDS[i].id).find((x) => (data.tricks[x.id]?.best ?? 0) < 3);
    if (t) return t;
  }
  const own = tricksByBand(band);
  return own[new Date().getDate() % own.length];
}

export default function Home() {
  const profile = useProfile()!;
  const data = useProfileData();
  const today = dayKey();
  const quest = !!data.days[today]?.quest;
  const factMap = useFacts();
  const times = useMemo(() => {
    const p = progressOf(factMap);
    return { ...p, total: ALL_FACTS.length, hardTotal: HARD_FACTS.length };
  }, [factMap]);
  const next = useMemo(() => recommend(profile.band, data), [profile.band, data]);
  const fact = FACTS[(new Date().getDate() + new Date().getMonth()) % FACTS.length];
  const nextProg = data.tricks[next.id];
  const ops = (Object.keys(OPS) as Op[]).filter((op) => tricksByBand(profile.band).some((t) => t.op === op));
  const learned = Object.keys(data.tricks).length;

  return (
    <AppShell flow={1}>
      <header className="page-head rise">
        <div>
          <p className="sub">Bugün ne keşfedelim?</p>
          <h1 className="title-xl">{greeting()}, {profile.name}!</h1>
        </div>
        <div className="chips">
          <span className="chip" title="Üst üste çalıştığın gün"><Flame size={20} color="#ffb13b" fill="#ff8a3d" /> {streakOf(data.days)}</span>
          <LevelBadge />
        </div>
      </header>

      <div className="daily-row rise">
        <Link to="/antrenman" className={`quest-card ${quest ? 'done' : ''}`} onClick={() => sfx.pop()}>
          <span className="quest-card__icon">{quest ? <Check size={26} strokeWidth={3} /> : <Target size={26} />}</span>
          <div className="quest-card__text">
            <span className="quest-card__label">Günün antrenmanı</span>
            <b>{quest ? 'Bugünkü antrenman tamam!' : '8 soruluk zihin antrenmanı'}</b>
            <span className="quest-card__state">{quest ? 'İstersen bir tur daha at!' : 'Tamamlayınca seri devam eder'}</span>
          </div>
          <span className="quest-card__img quest-card__img--math">🧠</span>
          {!quest && <span className="quest-card__go"><Play size={20} fill="currentColor" /></span>}
        </Link>
        <div className="special-card fact-card">
          <span className="special-card__emoji">💡</span>
          <div className="special-card__text">
            <b>Biliyor muydun?</b>
            <span>{fact}</span>
          </div>
        </div>
      </div>

      <section className="row-section" style={{ marginTop: 6 }}>
        <h2 className="row-section__title"><Grid3x3 size={20} /> Çarpım tablosu</h2>
        <Link to="/carpim" className="ct-home rise" onClick={() => sfx.pop()}>
          <span className="ct-home__big"><b>{times.known}</b><small>/ {times.total}</small></span>
          <span className="ct-home__text">
            <b>{times.known === 0 ? 'Kolay yoldan başla' : times.due > 0 ? `${times.due} çarpımın tekrar zamanı` : 'Haritanı büyüt'}</b>
            <small>{times.known === times.total ? 'Tablonun tamamı senin! 👑' : `Gerçekten zor olanlardan ${times.hardTotal - times.hardKnown} tane kaldı`}</small>
          </span>
          <span className="ct-home__bar"><i style={{ width: `${(times.known / times.total) * 100}%` }} /></span>
        </Link>
      </section>

      <section className="row-section">
        <h2 className="row-section__title"><Sparkles size={20} /> Sıradaki püf noktası</h2>
        <Link to={`/ders/${next.id}`} className="world-card next-card rise" style={opVars(next.op)} onClick={() => sfx.pop()}>
          <div className="world-art next-card__art">
            <span className="next-card__emoji">{next.emoji}</span>
            <span className="next-card__short">{next.short}</span>
            <Mascot size={70} mood="cheer" className="next-card__mascot" />
          </div>
          <span className="world-card__text">
            <small className="next-card__op">{OPS[next.op].title} · {BANDS.find((b) => b.id === next.band)!.title}</small>
            <b>{next.title}</b>
            <small>{next.idea.split(/[.!:]/)[0]}.</small>
            <span className="world-card__status">
              {nextProg ? <><Stars value={nextProg.best} size={16} /> {nextProg.level}. seviye</> : 'Yeni püf noktası'}
            </span>
          </span>
          <span className="world-card__go" aria-hidden="true"><ChevronRight size={28} strokeWidth={3} /></span>
        </Link>
      </section>

      <section className="row-section">
        <h2 className="row-section__title"><Lightbulb size={20} /> İşlemler</h2>
        <div className="op-grid">
          {ops.map((op, i) => {
            const list = tricksByBand(profile.band).filter((t) => t.op === op);
            const done = list.filter((t) => (data.tricks[t.id]?.best ?? 0) >= 1).length;
            return (
              <Link key={op} to={`/puflar?op=${op}`} className="op-card rise" style={{ ...opVars(op), animationDelay: `${i * 0.05}s` }} onClick={() => sfx.tap()}>
                <span className="op-card__sign">{OPS[op].sign}</span>
                <b>{OPS[op].title}</b>
                <span className="op-card__bar"><i style={{ width: `${(done / list.length) * 100}%` }} /></span>
                <small>{done} / {list.length} püf</small>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="feature-row rise">
        <Link to="/problemler" className="feature-card">
          <span className="feature-card__art feature-card__art--teal"><Puzzle size={40} color="#0d8074" /></span>
          <span className="feature-card__text">
            <span className="feature-card__label"><Puzzle size={15} /> Problem çözme</span>
            <b>Çubuk modeliyle çöz</b>
            <small>{data.words} problem çözdün · Anla, planla, uygula, kontrol et</small>
          </span>
        </Link>
        <Link to="/oyun/simsek" className="feature-card">
          <span className="feature-card__art"><Zap size={40} color="#e8a200" fill="#ffc83d" /></span>
          <span className="feature-card__text">
            <span className="feature-card__label"><Zap size={15} /> Şimşek Tur</span>
            <b>60 saniyede kaç soru?</b>
            <small>{data.records.simsek !== undefined ? `Rekorun: ${data.records.simsek} doğru` : 'İlk rekorunu kır!'}</small>
          </span>
        </Link>
        <Link to="/rozetler" className="feature-card">
          <span className="feature-card__rank"><Trophy size={30} /></span>
          <span className="feature-card__text">
            <span className="feature-card__label"><Trophy size={15} /> Rozetlerim</span>
            <b>{data.badges.length} rozet</b>
            <small>{learned} / {tricks.length} püf noktası öğrendin</small>
          </span>
        </Link>
      </div>
    </AppShell>
  );
}

export const opVars = (op: Op) =>
  ({ ['--world' as string]: OPS[op].color, ['--world-dark' as string]: OPS[op].dark, ['--world-soft' as string]: OPS[op].soft }) as React.CSSProperties;
