import { Award, Gamepad2, Lightbulb, Puzzle, Settings, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { sfx } from '../lib/sfx';
import { BADGES, levelOf, useApp, useProfile, useProfileData } from '../store/useApp';
import { AvatarArt } from './Avatars';
import { Doodles } from './Doodles';
import { Mascot } from './Mascot';
import { Modal } from './ui';

const TABS = [
  { to: '/', label: 'Bugün', Icon: Sun },
  { to: '/puflar', label: 'Püfler', Icon: Lightbulb },
  { to: '/problemler', label: 'Problemler', Icon: Puzzle },
  { to: '/oyunlar', label: 'Oyunlar', Icon: Gamepad2 },
  { to: '/rozetler', label: 'Rozetler', Icon: Award },
];

const INK = '#3a2b27';

export function StarIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12,2 l3,6.3 l6.9,0.8 l-5.1,4.7 l1.4,6.8 l-6.2,-3.5 l-6.2,3.5 l1.4,-6.8 l-5.1,-4.7 l6.9,-0.8 Z" fill="#ffc83d" stroke="#e8a200" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Üst çubuktaki yıldız sayacı; yıldız artınca zıplar. */
export function StarCounter() {
  const stars = useProfileData().stars;
  const prev = useRef(stars);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (stars > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 700);
      prev.current = stars;
      return () => clearTimeout(t);
    }
    prev.current = stars;
  }, [stars]);
  return (
    <Link to="/rozetler" className="star-counter" aria-label={`${stars} yıldız`}>
      <span className={`star-counter__icon ${bump ? 'bump' : ''}`}><StarIcon size={26} /></span>
      <b>{stars}</b>
    </Link>
  );
}

export function LevelBadge() {
  const lv = levelOf(useProfileData().stars);
  const pct = Math.round(((lv.xp - lv.from) / Math.max(1, lv.to - lv.from)) * 100);
  return (
    <div className="level" title={`${lv.to - lv.xp} yıldız sonra ${lv.n + 1}. seviye`}>
      <svg viewBox="0 0 60 60" className="level__star" aria-hidden="true">
        <path d="M30,4 l7.5,16 l17.5,2 l-13,12 l3.5,17 l-15.5,-8.5 l-15.5,8.5 l3.5,-17 l-13,-12 l17.5,-2 Z" fill="#ffc83d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <text x="30" y="38" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="17" fill={INK}>{lv.n}</text>
      </svg>
      <div className="level__text">
        <b>{lv.name}</b>
        <span className="level__bar"><i style={{ width: `${pct}%` }} /></span>
        <small>{lv.xp} / {lv.to} yıldız</small>
      </div>
    </div>
  );
}

/** Yeni rozet kazanılınca kutlama penceresi (her ekranda). */
export function BadgeHost() {
  const ids = useProfileData().newBadges;
  const consume = useApp((s) => s.consumeBadges);
  useEffect(() => {
    if (ids.length) sfx.fanfare();
  }, [ids.length]);
  if (!ids.length) return null;
  return (
    <Modal onClose={consume}>
      <div className="center-col">
        <Mascot size={90} mood="wow" />
        <h2 className="title-lg">{ids.length > 1 ? 'Yeni rozetler!' : 'Yeni rozet!'}</h2>
        <div className="sticker-row">
          {ids.map((id) => {
            const b = BADGES.find((x) => x.id === id);
            return b ? (
              <div key={id} className="sticker-win">
                <span className="sticker sticker--new">{b.emoji}</span>
                <b>{b.title}</b>
                <small className="muted">{b.desc}</small>
              </div>
            ) : null;
          })}
        </div>
        <button className="btn-dark" onClick={consume}>Süper!</button>
      </div>
    </Modal>
  );
}

/** Üst çubuk: marka, yıldızlar, ebeveyn, profil. */
export function AppBar() {
  const profile = useProfile();
  return (
    <header className="appbar">
      <Link to="/" className="appbar__brand">
        <Mascot size={30} />
        <span>Sayio</span>
      </Link>
      <span className="appbar__spacer" />
      <StarCounter />
      <Link to="/ebeveyn" className="round-btn round-btn--soft" aria-label="Ebeveyn bölümü" title="Ebeveyn bölümü">
        <Settings size={22} />
      </Link>
      <Link to="/profiller" className="appbar__avatar" aria-label="Profil değiştir">
        {profile && <AvatarArt id={profile.avatar} size={46} />}
      </Link>
    </header>
  );
}

/** Uygulama kabuğu: üstte marka çubuğu, altta yüzen sekmeler, zeminde boya lekeleri. */
export function AppShell({ children, flow = 0 }: { children: ReactNode; flow?: number }) {
  return (
    <div className="bg app">
      <Doodles variant={flow} />
      <AppBar />
      <main className="app__main">{children}</main>
      <BadgeHost />
      <nav className={`tabbar tabbar--${TABS.length}`} aria-label="Ana menü">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="tabbar__item" onClick={() => sfx.tap()}>
            <Icon size={24} strokeWidth={2.3} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
