import Link from 'next/link';
import { LogoMark } from './Logo';

export function Header() {
  return (
    <header className="hdr">
      <Link href="/" className="logo" aria-label="조현정의AI실험실 홈">
        <LogoMark />
        조현정의AI실험실
      </Link>
      <nav className="nav-links" aria-label="주 메뉴">
        <Link href="/">홈</Link>
        <Link href="/templates">템플릿</Link>
        <Link href="/videos">영상</Link>
        <Link href="/about">소개</Link>
      </nav>
      <div className="hdr-grow" />
      <Link href="/search" className="iconbtn" aria-label="검색">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </Link>
    </header>
  );
}
