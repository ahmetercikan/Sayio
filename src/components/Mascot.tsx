/** Sayio — uygulamanın maskotu: başında artı filizi olan sevimli bir sayı küpü (Çizio'nun kardeşi). */
export type Mood = 'happy' | 'cheer' | 'think' | 'wow';

const INK = '#2b2250';

export function Mascot({ size = 120, mood = 'happy', className }: { size?: number; mood?: Mood; className?: string }) {
  const armsUp = mood === 'cheer' || mood === 'wow';
  return (
    <svg className={className} width={size} height={(size * 170) / 140} viewBox="0 0 140 170" role="img" aria-label="Sayio" overflow="visible">
      <ellipse cx="70" cy="164" rx="36" ry="5" fill={INK} opacity="0.08" />
      {/* kollar */}
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
        {armsUp ? (
          <>
            <path className="mascot__arm mascot__arm--l" d="M30,96 Q16,82 12,62" />
            <path className="mascot__arm mascot__arm--r" d="M110,96 Q124,82 128,62" />
          </>
        ) : mood === 'think' ? (
          <>
            <path d="M30,104 Q16,114 18,128" />
            <path d="M110,104 Q124,96 112,84" />
          </>
        ) : (
          <>
            <path d="M30,104 Q14,112 12,126" />
            <path className="mascot__arm mascot__arm--r" d="M110,100 Q128,92 132,74" />
          </>
        )}
      </g>
      {/* bacaklar */}
      <path d="M54,146 V158 M86,146 V158" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="50" cy="159" rx="9" ry="5" fill="#ff6b4a" stroke={INK} strokeWidth="3.5" />
      <ellipse cx="90" cy="159" rx="9" ry="5" fill="#ff6b4a" stroke={INK} strokeWidth="3.5" />
      {/* artı filizi */}
      <path d="M70,36 V22" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(70 14)">
        <rect x="-15" y="-5.5" width="30" height="11" rx="5.5" fill="#ff6b4a" stroke={INK} strokeWidth="3.5" />
        <rect x="-5.5" y="-15" width="11" height="30" rx="5.5" fill="#ff6b4a" stroke={INK} strokeWidth="3.5" />
        <rect x="-4" y="-4" width="8" height="8" fill="#ff6b4a" />
      </g>
      {/* gövde: küp */}
      <rect x="28" y="36" width="84" height="112" rx="26" fill="#ffc531" stroke={INK} strokeWidth="4.5" />
      <path d="M36,58 Q36,44 50,44 H64" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M40,138 H100" stroke="#f5a623" strokeWidth="4" strokeLinecap="round" />
      {/* yüz */}
      <rect x="40" y="62" width="60" height="54" rx="22" fill="#ffd866" />
      {mood === 'wow' ? (
        <>
          <circle cx="56" cy="82" r="6.5" fill={INK} />
          <circle cx="84" cy="82" r="6.5" fill={INK} />
          <ellipse cx="70" cy="101" rx="6" ry="7" fill={INK} />
        </>
      ) : mood === 'cheer' ? (
        <>
          <g className="mascot__eyes">
            <path d="M49,84 Q56,75 63,84" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M77,84 Q84,75 91,84" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </g>
          <path d="M58,95 Q70,110 82,95 Z" fill={INK} />
          <path d="M64,100 Q70,104 76,100" stroke="#ff8fb1" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <g className="mascot__eyes">
            <circle cx="56" cy="82" r="6" fill={INK} />
            <circle cx="84" cy="82" r="6" fill={INK} />
            <circle cx="58" cy="80" r="2.2" fill="#fff" />
            <circle cx="86" cy="80" r="2.2" fill="#fff" />
          </g>
          {mood === 'think' ? (
            <path d="M62,100 Q70,100 78,96" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M60,96 Q70,106 80,96" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          )}
        </>
      )}
      <ellipse cx="48" cy="97" rx="5.5" ry="3.8" fill="#ff8fb1" opacity="0.85" />
      <ellipse cx="92" cy="97" rx="5.5" ry="3.8" fill="#ff8fb1" opacity="0.85" />
      {mood === 'think' && (
        <g fill="#fff" stroke={INK} strokeWidth="3">
          <circle cx="122" cy="40" r="5" />
          <circle cx="132" cy="24" r="8" />
        </g>
      )}
    </svg>
  );
}

/** Maskot + konuşma balonu. */
export function MascotSays({ children, mood, size = 84, className = '' }: { children: React.ReactNode; mood?: Mood; size?: number; className?: string }) {
  return (
    <div className={`says ${className}`}>
      <Mascot size={size} mood={mood} className="float says__mascot" />
      <div className="bubble">{children}</div>
    </div>
  );
}
