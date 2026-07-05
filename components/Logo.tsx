// 로고 아이콘은 테마 불변 — 몸통 그린 #2BA05F + 흰 셀 + 잉크 눈 (DESIGN §2-4)
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <rect x="3" y="1.5" width="16" height="19" rx="2.5" fill="#2BA05F" />
      <rect x="6.5" y="10" width="4" height="3" rx=".8" fill="#fff" />
      <rect x="11.8" y="10" width="4" height="3" rx=".8" fill="#fff" />
      <rect x="6.5" y="14" width="4" height="3" rx=".8" fill="#fff" />
      <rect x="11.8" y="14" width="4" height="3" rx=".8" fill="#fff" />
      <circle cx="8.4" cy="6" r="1.1" fill="#0F1F14" />
      <circle cx="13.6" cy="6" r="1.1" fill="#0F1F14" />
    </svg>
  );
}
