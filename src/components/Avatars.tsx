/** Avatarlar: renkli daire üzerinde sevimli hayvanlar (Çizio'daki gibi halkalı). */
export interface AvatarDef { id: string; emoji: string; bg: string; label: string }

export const AVATARS: AvatarDef[] = [
  { id: 'kedi', emoji: '🐱', bg: '#ff5a7a', label: 'Kedi' },
  { id: 'tavsan', emoji: '🐰', bg: '#2ecf8a', label: 'Tavşan' },
  { id: 'panda', emoji: '🐼', bg: '#3ec6f0', label: 'Panda' },
  { id: 'baykus', emoji: '🦉', bg: '#ffd43b', label: 'Baykuş' },
  { id: 'tilki', emoji: '🦊', bg: '#7c3cff', label: 'Tilki' },
  { id: 'kaplumbaga', emoji: '🐢', bg: '#ff8a3d', label: 'Kaplumbağa' },
  { id: 'aslan', emoji: '🦁', bg: '#ff4dc4', label: 'Aslan' },
  { id: 'robot', emoji: '🤖', bg: '#ffb13b', label: 'Robot' },
  { id: 'uzayli', emoji: '👽', bg: '#22b5a0', label: 'Uzaylı' },
  { id: 'unicorn', emoji: '🦄', bg: '#b58bff', label: 'Tek boynuzlu at' },
  { id: 'kurbaga', emoji: '🐸', bg: '#5ad1ff', label: 'Kurbağa' },
  { id: 'ahtapot', emoji: '🐙', bg: '#9be15d', label: 'Ahtapot' },
];

export function AvatarArt({ id, size = 96, ring = false }: { id: string; size?: number; ring?: boolean }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  return (
    <span
      className={`avatar-art avatar-face ${ring ? 'avatar-face--ring' : ''}`}
      role="img"
      aria-label={a.label}
      style={{ width: size, height: size, background: a.bg, fontSize: size * 0.56 }}
    >
      {a.emoji}
    </span>
  );
}
