import { Flame, Lightbulb, Puzzle, Star, Target } from 'lucide-react';
import { AppShell, LevelBadge } from '../components/AppShell';
import { streakOf } from '../lib/util';
import { BADGES, useProfileData } from '../store/useApp';
import { tricks } from '../tricks';
import { BANDS, OPS, type Op } from '../tricks/types';

export default function Badges() {
  const data = useProfileData();
  const learned = Object.keys(data.tricks).length;
  const stats = [
    { Icon: Star, v: data.stars, t: 'yıldız', c: '#e8a200' },
    { Icon: Lightbulb, v: `${learned}/${tricks.length}`, t: 'püf noktası', c: '#ff6b4a' },
    { Icon: Target, v: data.solved, t: 'soru çözdün', c: '#14a89a' },
    { Icon: Puzzle, v: data.words, t: 'problem', c: '#3f7fe0' },
    { Icon: Flame, v: streakOf(data.days), t: 'gün seri', c: '#ff8a3d' },
  ];
  return (
    <AppShell flow={3}>
      <header className="page-head rise">
        <div>
          <p className="sub">Emeğinin karşılığı burada</p>
          <h1 className="title-xl">Rozetlerim</h1>
        </div>
        <LevelBadge />
      </header>

      <div className="stats rise">
        {stats.map(({ Icon, v, t, c }) => (
          <div key={t} className="stat">
            <Icon size={26} color={c} />
            <b>{v}</b>
            <small>{t}</small>
          </div>
        ))}
      </div>

      <section className="row-section">
        <h2 className="row-section__title">Rozetler ({data.badges.length}/{BADGES.length})</h2>
        <div className="badge-grid">
          {BADGES.map((b, i) => {
            const on = data.badges.includes(b.id);
            return (
              <div key={b.id} className={`badge-card rise ${on ? 'on' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
                <span className="sticker">{on ? b.emoji : '🔒'}</span>
                <b>{b.title}</b>
                <small>{b.desc}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="row-section">
        <h2 className="row-section__title">İşlem ustalığı</h2>
        <div className="mastery paper-card">
          {(Object.keys(OPS) as Op[]).map((op) => {
            const list = tricks.filter((t) => t.op === op);
            const stars = list.reduce((s, t) => s + (data.tricks[t.id]?.best ?? 0), 0);
            return (
              <div key={op} className="mastery__row">
                <span className="op-dot" style={{ background: OPS[op].color }}>{OPS[op].sign}</span>
                <b>{OPS[op].title}</b>
                <span className="mastery__bar"><i style={{ width: `${(stars / (list.length * 3)) * 100}%`, background: OPS[op].color }} /></span>
                <small>{stars}/{list.length * 3} ★</small>
              </div>
            );
          })}
          <div className="mastery__bands">
            {BANDS.map((b) => {
              const list = tricks.filter((t) => t.band === b.id);
              const done = list.filter((t) => (data.tricks[t.id]?.best ?? 0) >= 1).length;
              return (
                <span key={b.id} className="mastery__band" style={{ background: b.soft, color: b.dark }}>
                  {b.title}: {done}/{list.length}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
