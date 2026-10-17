/**
 * Çarpım Tablosu bölümü.
 *
 * Üç parça: (1) **harita** — 100 kutuluk tablo, bildiklerin renklenir; (2) **günün turu** —
 * aralıklı tekrarla seçilmiş çarpımlar; (3) **kolay yollar** — 10 aile dersi.
 *
 * Buradaki asıl fikir psikolojik: 100 kutuluk tablo çocuğa dağ gibi görünür. Oysa 3 × 7 ile 7 × 3
 * aynı şeydir (55 çarpım), kolay aileler çıkınca **gerçekten zor olan 21 tane** kalır. Harita bunu
 * gözle görünür kılar; çocuk her derste dağın küçüldüğünü görür.
 */
import { ArrowRight, Check, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { sfx } from '../lib/sfx';
import { FACTS, FAMILIES, FAMILY_ORDER, HARD_FACTS, factKey, familyOf, type Family } from '../times/facts';
import { MASTERED_BOX, isLearning, isMastered, progressOf, type FactMap } from '../times/mastery';
import { useFacts, useProfileData } from '../store/useApp';

/** Haritadaki bir kutunun durumu. */
function cellClass(map: FactMap, a: number, b: number) {
  const s = map[factKey(a, b)];
  if (isMastered(s)) return 'ct-cell ct-cell--known';
  if (isLearning(s)) return 'ct-cell ct-cell--learning';
  if (s) return 'ct-cell ct-cell--seen';
  return 'ct-cell';
}

/** 10 × 10 çarpım haritası. Köşegen (kareler) ve bildiklerin belli olur. */
function Map10({ map }: { map: FactMap }) {
  const nums = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="ct-map" role="table" aria-label="Çarpım haritası">
      <div className="ct-row ct-row--head">
        <span className="ct-corner">×</span>
        {nums.map((n) => (
          <span key={n} className="ct-head" style={{ color: FAMILIES[String(n) as Family].dark }}>{n}</span>
        ))}
      </div>
      {nums.map((a) => (
        <div key={a} className="ct-row" role="row">
          <span className="ct-head">{a}</span>
          {nums.map((b) => (
            <span key={b} className={`${cellClass(map, a, b)}${a === b ? ' ct-cell--square' : ''}`} role="cell"
              aria-label={`${a} çarpı ${b} eşittir ${a * b}`}>
              {a * b}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Times() {
  const map = useFacts();
  const data = useProfileData();
  const p = useMemo(() => progressOf(map), [map]);
  const hardLeft = HARD_FACTS.length - p.hardKnown;

  return (
    <AppShell flow={3}>
      <div className="page-head">
        <div>
          <h1 className="title-xl">Çarpım Tablosu</h1>
          <p className="sub">Ezber değil, kolay yollar.</p>
        </div>
      </div>

      {/* İlerleme: "dağ küçülüyor" hikâyesi */}
      <div className="paper-card ct-progress">
        <div className="ct-progress__big">
          <b>{p.known}</b>
          <span>/ {FACTS.length} çarpım</span>
        </div>
        <div className="ct-bar"><i style={{ width: `${(p.known / FACTS.length) * 100}%` }} /></div>
        <p className="ct-progress__note">
          {p.known === 0
            ? '3 × 7 ile 7 × 3 aynı şey! O yüzden 100 kutu aslında 55 çarpım. Hadi başlayalım.'
            : hardLeft > 0
              ? <>Zor olanlardan geriye <b>{hardLeft} tane</b> kaldı. 💪</>
              : 'Zor çarpımların hepsini bitirdin! Artık tablo senin. 🏆'}
        </p>
      </div>

      <Link to="/carpim/tur" className="ct-cta" onClick={() => sfx.pop()}>
        <span className="ct-cta__icon"><Play size={28} fill="#fff" /></span>
        <span className="ct-cta__text">
          <b>Günün turu</b>
          <small>{p.due > 0 ? `${p.due} çarpımın tekrar zamanı geldi` : 'Yeni çarpımlarla tanış'}</small>
        </span>
        <ArrowRight size={24} />
      </Link>

      <h2 className="row-section__title ct-section">🗺️ Haritan</h2>
      <div className="paper-card ct-map-card">
        <Map10 map={map} />
        <div className="ct-legend">
          <span><i className="ct-dot ct-dot--known" /> ezberledin</span>
          <span><i className="ct-dot ct-dot--learning" /> öğreniyorsun</span>
          <span><i className="ct-dot" /> daha tanışmadın</span>
        </div>
      </div>

      <h2 className="row-section__title ct-section">💡 Kolay yollar</h2>
      <div className="ct-families">
        {FAMILY_ORDER.map((f) => {
          const info = FAMILIES[f];
          const facts = FACTS.filter((x) => x.family === f);
          const known = facts.filter((x) => isMastered(map[x.key])).length;
          const learned = !!data.tricks[info.trickId];
          return (
            <Link key={f} to={`/ders/${info.trickId}`} className="ct-family rise" onClick={() => sfx.pop()}
              style={{ ['--world' as string]: info.color, ['--world-dark' as string]: info.dark, ['--world-soft' as string]: info.soft }}>
              <span className="ct-family__emoji">{info.emoji}</span>
              <span className="ct-family__text">
                <b>{info.title}</b>
                <small>{info.short}</small>
              </span>
              <span className="ct-family__count">
                {known === facts.length ? <Check size={22} strokeWidth={3} /> : `${known}/${facts.length}`}
              </span>
              {!learned && <span className="badge-new">yeni</span>}
            </Link>
          );
        })}
      </div>
      <p className="muted center-text ct-foot">
        Her ailede öğrenilecek yeni çarpım bir azalır: 1'lerde 10 tane, 7'lerde sadece 1 tane kalır.
      </p>
    </AppShell>
  );
}

/** Ebeveyn raporu ve ana sayfa için küçük özet. */
export function timesSummary(map: FactMap) {
  const p = progressOf(map);
  return { ...p, total: FACTS.length, hardTotal: HARD_FACTS.length };
}

export { familyOf, MASTERED_BOX };
