import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { setSfxEnabled } from './lib/sfx';
import { unlockAudio } from './lib/speech';
import Badges from './pages/Badges';
import Games from './pages/Games';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Onboarding from './pages/Onboarding';
import Parent from './pages/Parent';
import Practice from './pages/Practice';
import Problems from './pages/Problems';
import Profiles from './pages/Profiles';
import Times from './pages/Times';
import TimesRound from './pages/TimesRound';
import Tricks from './pages/Tricks';
import { BondsGame, EstimateGame, SprintGame } from './games/Games';
import { useApp } from './store/useApp';

/** Profil yoksa karşılama akışına yönlendirir. */
function NeedsProfile({ children }: { children: ReactNode }) {
  const has = useApp((s) => !!s.activeId && s.profiles.some((p) => p.id === s.activeId));
  const any = useApp((s) => s.profiles.length > 0);
  if (!has) return <Navigate to={any ? '/profiller' : '/hosgeldin'} replace />;
  return <>{children}</>;
}

const P = (el: ReactNode) => <NeedsProfile>{el}</NeedsProfile>;

export default function App() {
  const sfxOn = useApp((s) => s.settings.sfx);
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  // iOS: ses ancak bir dokunuştan sonra çalabilir.
  useEffect(() => {
    const once = () => unlockAudio();
    window.addEventListener('pointerdown', once, { once: true });
    return () => window.removeEventListener('pointerdown', once);
  }, []);
  return (
    <HashRouter>
      <Routes>
        <Route path="/hosgeldin" element={<Onboarding />} />
        <Route path="/profiller" element={<Profiles />} />
        <Route path="/" element={P(<Home />)} />
        <Route path="/carpim" element={P(<Times />)} />
        <Route path="/carpim/tur" element={P(<TimesRound />)} />
        <Route path="/puflar" element={P(<Tricks />)} />
        <Route path="/ders/:id" element={P(<Lesson />)} />
        <Route path="/antrenman" element={P(<Practice />)} />
        <Route path="/problemler" element={P(<Problems />)} />
        <Route path="/oyunlar" element={P(<Games />)} />
        <Route path="/oyun/simsek" element={P(<SprintGame />)} />
        <Route path="/oyun/arkadas" element={P(<BondsGame />)} />
        <Route path="/oyun/tahmin" element={P(<EstimateGame />)} />
        <Route path="/rozetler" element={P(<Badges />)} />
        <Route path="/ebeveyn" element={<Parent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
