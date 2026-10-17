/**
 * Ebeveyn bölümü: basit bir işlem sorusuyla korunur (çocuklar kazara girmesin).
 * Ayarlar, profil (yaş → içerik grubu), ilerleme raporu ve uygulamanın pedagojik yaklaşımı.
 */
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarArt } from '../components/Avatars';
import { Doodles } from '../components/Doodles';
import { Numpad } from '../components/Inputs';
import { Confirm, Stars, TopBar } from '../components/ui';
import { rnd } from '../lib/util';
import { useApp, useProfile, useProfileData } from '../store/useApp';
import { tricksByBand } from '../tricks';
import { BANDS, OPS, bandInfo, bandOfAge } from '../tricks/types';

export default function Parent() {
  const [ok, setOk] = useState(false);
  return (
    <div className="bg settings-page">
      <Doodles variant={2} />
      <div className="settings-page__inner">
        <TopBar title="Ebeveyn bölümü" />
        {ok ? <ParentBody /> : <Gate onPass={() => setOk(true)} />}
      </div>
    </div>
  );
}

function Gate({ onPass }: { onPass: () => void }) {
  const q = useMemo(() => ({ a: rnd(12, 19), b: rnd(3, 9) }), []);
  const [v, setV] = useState('');
  const [err, setErr] = useState(false);
  return (
    <div className="paper-card settings-card gate">
      <h2 className="card-title">Bir büyüğün yardımı gerekiyor</h2>
      <p className="muted">Devam etmek için işlemi çözün:</p>
      <p className="gate__q">{q.a} × {q.b} = <span className={`eq__box ${err ? 'eq__box--wrong' : ''}`}>{v || '?'}</span></p>
      <Numpad value={v} onChange={(x) => { setErr(false); setV(x); }} onSubmit={() => (Number(v) === q.a * q.b ? onPass() : (setErr(true), setV('')))} />
    </div>
  );
}

function ParentBody() {
  const nav = useNavigate();
  const profile = useProfile();
  const data = useProfileData();
  const settings = useApp((s) => s.settings);
  const setSettings = useApp((s) => s.setSettings);
  const update = useApp((s) => s.updateProfile);
  const remove = useApp((s) => s.removeProfile);
  const [ask, setAsk] = useState(false);

  const week = useMemo(() => {
    const out: { d: string; solved: number }[] = [];
    const t = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(t);
      d.setDate(t.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ d: d.toLocaleDateString('tr-TR', { weekday: 'short' }), solved: data.days[k]?.solved ?? 0 });
    }
    return out;
  }, [data.days]);
  const maxDay = Math.max(1, ...week.map((w) => w.solved));
  const totalCorrect = Object.values(data.days).reduce((s, d) => s + d.correct, 0);
  const totalSolved = Object.values(data.days).reduce((s, d) => s + d.solved, 0);

  return (
    <>
      {profile && (
        <div className="paper-card settings-card">
          <div className="parent-profile">
            <AvatarArt id={profile.avatar} size={64} ring />
            <div>
              <h2 className="card-title">{profile.name}</h2>
              <p className="muted">{bandInfo(profile.band).title} grubu · {bandInfo(profile.band).ages}</p>
            </div>
          </div>
          <div className="toggle-row">
            <span>Yaş</span>
            <select className="select" value={profile.age} onChange={(e) => update(profile.id, { age: Number(e.target.value) })}>
              {Array.from({ length: 11 }, (_, i) => i + 4).map((n) => (
                <option key={n} value={n}>{n} yaş · {bandInfo(bandOfAge(n)).title}</option>
              ))}
            </select>
          </div>
          <div className="toggle-row">
            <span>İsim</span>
            <input className="select" value={profile.name} maxLength={20} onChange={(e) => update(profile.id, { name: e.target.value })} />
          </div>
        </div>
      )}

      <div className="paper-card settings-card">
        <h2 className="card-title">Bu hafta</h2>
        <div className="week">
          {week.map((w, i) => (
            <div key={i} className="week__day">
              <span className="week__bar"><i style={{ height: `${(w.solved / maxDay) * 100}%` }} /></span>
              <b>{w.solved}</b>
              <small>{w.d}</small>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Toplam {totalSolved} soru · ilk denemede doğru oranı %{totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0} · {data.words} sözel problem
        </p>
      </div>

      <div className="paper-card settings-card">
        <h2 className="card-title">Püf noktaları ilerlemesi</h2>
        {BANDS.map((b) => (
          <div key={b.id} className="report-band">
            <h3 style={{ color: b.dark }}>{b.title} <small className="muted">{b.ages}</small></h3>
            <ul className="report-list">
              {tricksByBand(b.id).map((t) => {
                const p = data.tricks[t.id];
                return (
                  <li key={t.id}>
                    <span className="op-dot op-dot--sm" style={{ background: OPS[t.op].color }}>{OPS[t.op].sign}</span>
                    <span className="report-list__title">{t.title}</span>
                    {p ? <><Stars value={p.best} size={15} /> <small className="muted">{p.plays}× · sv {p.level}</small></> : <small className="muted">henüz yok</small>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="paper-card settings-card">
        <h2 className="card-title">Ayarlar</h2>
        <label className="toggle-row">
          <span>Sesli anlatım<br /><small>Yönergeler ve sorular sesli okunur (okuma bilmeyenler için)</small></span>
          <input type="checkbox" className="switch" checked={settings.narration} onChange={(e) => setSettings({ narration: e.target.checked })} />
        </label>
        <label className="toggle-row">
          <span>Ses efektleri</span>
          <input type="checkbox" className="switch" checked={settings.sfx} onChange={(e) => setSettings({ sfx: e.target.checked })} />
        </label>
        <label className="toggle-row">
          <span>Konuşma hızı</span>
          <input type="range" min={0.7} max={1.3} step={0.1} value={settings.rate} onChange={(e) => setSettings({ rate: Number(e.target.value) })} />
        </label>
      </div>

      <div className="paper-card settings-card pedagogy">
        <h2 className="card-title">Sayio nasıl öğretir?</h2>
        <ul>
          <li><b>Somuttan soyuta (CPA, Bruner):</b> her soruda sağ üstteki göz, sayıları bloklara, 10'luk çerçeveye ya da çubuklara çevirir.</li>
          <li><b>İskeleleme:</b> çocuk doğrudan cevaba zorlanmaz; kolay yol adım adım sorulur, takılınca adımlar açılır.</li>
          <li><b>Hataya nazik geri bildirim:</b> "yanlış, doğrusu X" yerine hatanın türüne göre yönlendirme yapılır.</li>
          <li><b>Pratik stratejiler:</b> 10'a tamamlama, ikizler, sabit fark, parçala-çarp, 9'un sihri, çapraz çarpım, yüzde kısayolları…</li>
          <li><b>Problem çözme (Polya + Singapur çubuk modeli):</b> Anla → Planla → Uygula → Kontrol.</li>
          <li><b>Klavyesiz küçükler:</b> 4-7 yaşta cevaplar baloncuklarla ya da çerçeveye dokunarak verilir.</li>
          <li><b>Gelişim zihniyeti:</b> yetenek değil çaba ve strateji övülür; 3 yıldızla sorular kademeli zorlaşır.</li>
        </ul>
      </div>

      {profile && (
        <button className="btn-dark btn-dark--danger" onClick={() => setAsk(true)}><Trash2 size={20} /> Bu profili sil</button>
      )}
      <p className="muted center-text">Sayio {__APP_VERSION__} · Tüm veriler yalnızca bu cihazda saklanır.</p>
      {ask && profile && (
        <Confirm title={`${profile.name} silinsin mi?`} text="Tüm yıldızlar ve ilerleme silinir. Bu geri alınamaz." yes="Sil" danger
          onNo={() => setAsk(false)} onYes={() => { remove(profile.id); setAsk(false); nav('/profiller'); }} />
      )}
    </>
  );
}
