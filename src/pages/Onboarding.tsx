/**
 * Karşılama akışı (Çizio ile aynı ritim):
 * açılış (Sayio tanışır) → avatar → isim → yaş → ebeveyn onayı → "Hadi başlayalım".
 * Yaş, içeriğin hangi gruptan başlayacağını belirler (4-5 Minik, 6-7 Kaşif, 8-10 Usta, 11-14 Dahi).
 * Zaten bir profil varsa (kardeş ekleme) ebeveyn onayı atlanır.
 */
import { ArrowRight, Check, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarArt, AVATARS } from '../components/Avatars';
import { Doodles } from '../components/Doodles';
import { Mascot } from '../components/Mascot';
import { sfx } from '../lib/sfx';
import { speak, unlockAudio } from '../lib/speech';
import { useApp } from '../store/useApp';
import { bandInfo, bandOfAge } from '../tricks/types';

type Step = 'splash' | 'avatar' | 'name' | 'age' | 'parent' | 'start';

const LINES: Partial<Record<Step, string>> = {
  splash: 'Merhaba! Ben Sayio. Matematiğin kolay yollarını birlikte keşfedeceğiz!',
  avatar: 'Avatarını seç!',
  name: 'Adın ne?',
  age: 'Kaç yaşındasın?',
  parent: 'Hadi bir büyüğünü çağır! Sayio\'yu birlikte kuralım.',
  start: 'Hadi başlayalım!',
};

const FLOAT = ['+', '−', '×', '÷', '=', '7', '3', '10'];

export default function Onboarding() {
  const nav = useNavigate();
  const addProfile = useApp((s) => s.addProfile);
  const hasProfiles = useApp((s) => s.profiles.length > 0);
  const settings = useApp((s) => s.settings);
  const [step, setStep] = useState<Step>('splash');
  const [consent, setConsent] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [jump, setJump] = useState(false);

  const say = (t?: string) => t && settings.narration && speak(t, { rate: settings.rate });

  useEffect(() => {
    if (step !== 'splash') say(LINES[step]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const go = (s: Step) => {
    sfx.pop();
    setStep(s);
  };

  const finish = () => {
    sfx.success();
    addProfile({ name: name.trim(), avatar: avatar ?? 'kedi', age: age ?? 7 });
    nav('/', { replace: true });
  };

  const variant = { splash: 0, avatar: 1, name: 1, age: 2, parent: 1, start: 0 }[step];
  const progress = ['avatar', 'name', 'age', 'parent'].indexOf(step);
  const total = hasProfiles ? 3 : 4;

  return (
    <div className="bg onb">
      <Doodles variant={variant} />

      {progress >= 0 && (
        <div className="onb__steps" aria-label={`Adım ${progress + 1} / ${total}`}>
          {Array.from({ length: total }, (_, k) => (
            <span key={k} className={k < progress ? 'done' : k === progress ? 'now' : ''} />
          ))}
        </div>
      )}

      {step === 'splash' && (
        <div className="onb__center splash rise">
          <button
            type="button"
            className={`splash__mascot ${jump ? 'jump' : ''}`}
            aria-label="Sayio"
            onClick={() => {
              sfx.pop();
              setJump(true);
              window.setTimeout(() => setJump(false), 700);
            }}
          >
            <span className="splash__glow" />
            {FLOAT.map((ch, i) => (
              <span key={i} className="splash__sym" style={{ ['--a' as string]: `${(i / FLOAT.length) * 360}deg`, animationDelay: `${i * 0.12}s` }}>{ch}</span>
            ))}
            <Mascot size={130} mood="cheer" className="float mascot--wave splash__pal" />
            <span className="splash__spark" style={{ left: '6%', top: '14%' }} />
            <span className="splash__spark" style={{ right: '4%', top: '26%', animationDelay: '0.7s' }} />
            <span className="splash__spark" style={{ left: '14%', bottom: '8%', animationDelay: '1.3s' }} />
          </button>
          <h1 className="brand-title splash__title" aria-label="Sayio">
            {'Sayio'.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.2 + i * 0.09}s` }}>{ch}</span>
            ))}
          </h1>
          <p className="sub onb__lead">Matematiğin kolay yollarını keşfet. Zor görünen her işlemin bir püf noktası var!</p>
          <button
            className="pill pill--big pulse splash__start"
            onClick={() => {
              unlockAudio();
              say(LINES.splash);
              go('avatar');
            }}
          >
            Başla <ArrowRight size={24} />
          </button>
        </div>
      )}

      {step === 'avatar' && (
        <Screen title="Avatarını seç" action={<button className="pill" disabled={!avatar} onClick={() => go('name')}>Devam</button>}>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button key={a.id} className={`avatar-pick ${avatar === a.id ? 'on' : ''}`} aria-label={a.label} onClick={() => { sfx.tap(); setAvatar(a.id); }}>
                <AvatarArt id={a.id} size={110} />
              </button>
            ))}
          </div>
        </Screen>
      )}

      {step === 'name' && (
        <Screen title="Adın ne?" action={<button className="pill" disabled={!name.trim()} onClick={() => go('age')}>Devam</button>}>
          <div className="name-step">
            {avatar && <AvatarArt id={avatar} size={140} ring />}
            <input
              className="name-input"
              value={name}
              maxLength={20}
              placeholder="Adını yaz"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && go('age')}
            />
          </div>
        </Screen>
      )}

      {step === 'age' && (
        <Screen
          title="Kaç yaşındasın?"
          sub={age ? `${bandInfo(bandOfAge(age)).title} grubundan başlayacağız` : 'Sana uygun yerden başlayalım'}
          action={<button className="pill" disabled={!age} onClick={() => go(hasProfiles ? 'start' : 'parent')}>Devam</button>}
        >
          <div className="age-grid">
            {Array.from({ length: 11 }, (_, i) => i + 4).map((n) => {
              const b = bandInfo(bandOfAge(n));
              return (
                <button key={n} className={`age-pick ${age === n ? 'on' : ''}`} style={{ ['--c' as string]: b.color, ['--cd' as string]: b.dark, ['--cs' as string]: b.soft }}
                  onClick={() => { sfx.tap(); setAge(n); }}>
                  {n}
                </button>
              );
            })}
          </div>
        </Screen>
      )}

      {step === 'parent' && (
        <div className="onb__center">
          <div className="parent-card rise">
            <Mascot size={90} mood="happy" />
            <h2 className="title-lg">Bir büyüğünü çağır!</h2>
            <p className="parent-card__text">
              Sayio 4-14 yaş çocuklar için. Dört işlemin kolay yollarını, bilimsel öğretim ilkeleriyle (somuttan soyuta, çubuk modeli) öğretir.
            </p>
            <ul className="parent-card__facts">
              <li><ShieldCheck size={22} /> Reklam ve satın alma yok</li>
              <li><Smartphone size={22} /> İlerleme yalnızca bu cihazda kalır</li>
              <li><Sparkles size={22} /> Ayarlar ebeveyn bölümünde, korumalı</li>
            </ul>
            <label className="parent-card__consent">
              <input type="checkbox" className="switch" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Ben bir ebeveynim ve onaylıyorum
            </label>
            <button className="pill" disabled={!consent} onClick={() => go('start')}>
              <Check size={22} /> Onayla
            </button>
          </div>
        </div>
      )}

      {step === 'start' && (
        <div className="onb__center start rise">
          <div className="start__stage">
            {avatar && <AvatarArt id={avatar} size={120} ring />}
            <Mascot size={150} mood="wow" className="float" />
          </div>
          <h1 className="title-xl">Hazırsın, {name.trim()}!</h1>
          <p className="sub onb__lead">Her gün biraz oyna, beynin kas gibi güçlensin. Kolay yolları öğrendikçe yıldız ve rozet kazanacaksın!</p>
          <button className="pill pill--big" onClick={finish} aria-label="Hadi başlayalım">
            Hadi başlayalım! <ArrowRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function Screen({ title, sub, children, action }: { title: ReactNode; sub?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="onb__screen">
      <div className="onb__head rise">
        <h1 className="title-lg">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      <div className="onb__body">{children}</div>
      {action && <div className="onb__action rise">{action}</div>}
    </div>
  );
}
