import { ArrowRight, Timer, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { sfx } from '../lib/sfx';
import { useProfile, useProfileData } from '../store/useApp';

export default function Games() {
  const data = useProfileData();
  const profile = useProfile()!;
  const target = profile.band === 'minik' ? 5 : profile.band === 'kesif' ? 10 : profile.band === 'usta' ? 100 : 'çarpım';
  const games = [
    { to: '/oyun/simsek', emoji: '⚡', title: 'Şimşek Tur', desc: '60 saniyede kolay yollarla kaç soru çözebilirsin?', rec: data.records.simsek !== undefined ? `Rekor: ${data.records.simsek} doğru` : null, cls: 'sun' },
    { to: '/oyun/arkadas', emoji: '🫧', title: 'Sayı Arkadaşları', desc: typeof target === 'number' ? `Toplamı ${target} eden baloncuk çiftlerini patlat!` : 'Çarpımı hedef sayıyı veren çiftleri bul!', rec: data.records.arkadas !== undefined ? `En hızlı: ${data.records.arkadas} sn` : null, cls: 'teal' },
    { to: '/oyun/tahmin', emoji: '🎯', title: 'Tahmin Ustası', desc: profile.band === 'minik' || profile.band === 'kesif' ? 'Hangisi daha büyük? Saymadan, hızlıca tahmin et!' : 'Hesaplamadan önce tahmin et: sonuca en yakın hangisi?', rec: data.records.tahmin !== undefined ? `Rekor: ${data.records.tahmin} / 10` : null, cls: 'coral' },
  ];
  return (
    <AppShell flow={0}>
      <header className="page-head rise">
        <div>
          <p className="sub">Oynarken hızlan, tahmin etmeyi öğren</p>
          <h1 className="title-xl">Oyunlar</h1>
        </div>
      </header>
      <div className="game-grid">
        {games.map((g, i) => (
          <Link key={g.to} to={g.to} className={`game-card game-card--${g.cls} rise`} style={{ animationDelay: `${i * 0.06}s` }} onClick={() => sfx.pop()}>
            <span className="game-card__emoji">{g.emoji}</span>
            <b>{g.title}</b>
            <span className="game-card__desc">{g.desc}</span>
            <span className="game-card__foot">
              {g.rec ? <span className="game-card__rec"><Trophy size={15} /> {g.rec}</span> : <span className="game-card__rec"><Timer size={15} /> Henüz oynamadın</span>}
              <span className="game-card__go">Oyna <ArrowRight size={16} /></span>
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
