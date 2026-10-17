/**
 * Püf noktaları: yaş grubuna göre (varsayılan çocuğun grubu), işlemlere ayrılmış kartlar.
 * Tüm gruplar açıktır: küçükler tekrar eder, meraklılar bir üst gruba göz atabilir.
 */
import { Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Stars } from '../components/ui';
import { sfx } from '../lib/sfx';
import { useProfile, useProfileData } from '../store/useApp';
import { tricksByBand } from '../tricks';
import { BANDS, OPS, type Band, type Op } from '../tricks/types';
import { opVars } from './Home';

export default function Tricks() {
  const profile = useProfile()!;
  const data = useProfileData();
  const [params] = useSearchParams();
  const focusOp = params.get('op') as Op | null;
  const [band, setBand] = useState<Band>(profile.band);
  const list = tricksByBand(band);
  const ops = (Object.keys(OPS) as Op[]).filter((op) => list.some((t) => t.op === op));

  return (
    <AppShell flow={2}>
      <header className="page-head rise">
        <div>
          <p className="sub">Her işlemin bir kolay yolu var</p>
          <h1 className="title-xl">Püf Noktaları</h1>
        </div>
      </header>

      <div className="band-tabs rise" role="tablist">
        {BANDS.map((b) => (
          <button key={b.id} role="tab" aria-selected={band === b.id} className={`band-tab ${band === b.id ? 'on' : ''}`}
            style={{ ['--c' as string]: b.color, ['--cd' as string]: b.dark }}
            onClick={() => { sfx.tap(); setBand(b.id); }}>
            <b>{b.title}</b>
            <small>{b.ages}{b.id === profile.band ? ' · sen' : ''}</small>
          </button>
        ))}
      </div>

      {ops.map((op) => (
        <section key={op} className={`row-section ${focusOp === op ? 'row-section--focus' : ''}`}>
          <h2 className="row-section__title" style={{ color: OPS[op].dark }}>
            <span className="op-dot" style={{ background: OPS[op].color }}>{OPS[op].sign}</span> {OPS[op].title}
          </h2>
          <div className="trick-grid">
            {list.filter((t) => t.op === op).map((t, i) => {
              const p = data.tricks[t.id];
              return (
                <Link key={t.id} to={`/ders/${t.id}`} className="trick-card rise" style={{ ...opVars(op), animationDelay: `${i * 0.04}s` }} onClick={() => sfx.pop()}>
                  {!p && <span className="badge-new">Yeni</span>}
                  <span className="trick-card__emoji">{t.emoji}</span>
                  <b className="trick-card__title">{t.title}</b>
                  <span className="trick-card__note">{t.short}</span>
                  <span className="trick-card__foot">
                    <Stars value={p?.best ?? 0} size={18} />
                    {p && <small>{p.level}. seviye</small>}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <p className="hint rise"><Lightbulb size={18} /> 3 yıldız aldıkça püf noktasının soruları biraz daha zorlaşır. Kolay ama zor!</p>
    </AppShell>
  );
}
