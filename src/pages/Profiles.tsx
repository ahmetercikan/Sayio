import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AvatarArt } from '../components/Avatars';
import { Doodles } from '../components/Doodles';
import { sfx } from '../lib/sfx';
import { unlockAudio } from '../lib/speech';
import { useApp } from '../store/useApp';
import { bandInfo } from '../tricks/types';

export default function Profiles() {
  const nav = useNavigate();
  const profiles = useApp((s) => s.profiles);
  const setActive = useApp((s) => s.setActive);

  return (
    <div className="bg onb">
      <Doodles variant={2} />
      <div className="onb__center">
        <h1 className="title-xl rise">Kim oynayacak?</h1>
        <div className="profile-grid rise" style={{ animationDelay: '0.1s' }}>
          {profiles.map((p) => (
            <button
              key={p.id}
              className="profile-tile"
              onClick={() => {
                unlockAudio();
                sfx.pop();
                setActive(p.id);
                nav('/', { replace: true });
              }}
            >
              <AvatarArt id={p.avatar} size={132} ring />
              <b>{p.name}</b>
              <small className="profile-tile__band" style={{ background: bandInfo(p.band).soft, color: bandInfo(p.band).dark }}>{bandInfo(p.band).title}</small>
            </button>
          ))}
          <button className="profile-tile" onClick={() => nav('/hosgeldin')}>
            <span className="profile-add"><Plus size={46} /></span>
            <b>Yeni</b>
          </button>
        </div>
      </div>
    </div>
  );
}
