/**
 * Renders the pet's profile image when available (URL), otherwise the emoji fallback.
 * Use on all pages for consistent pet avatar display.
 */
export default function PetAvatar({ pet, size = 24, style = {} }) {
  const url = pet?.profile_photo_url || (typeof pet?.image === 'string' && pet.image.startsWith?.('http') ? pet.image : null);
  const s = typeof size === 'number' ? `${size}px` : size;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          width: s,
          height: s,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }
  return (
    <span style={{ fontSize: s, display: 'inline-flex', alignItems: 'center', ...style }}>
      {pet?.image || '🐾'}
    </span>
  );
}
