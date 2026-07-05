import type { Metadata } from 'next';
import { Roboto, Noto_Sans_KR } from 'next/font/google';
import Link from 'next/link';
import { Header } from '../components/Header';
import './globals.css';

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' });
const noto = Noto_Sans_KR({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://cho-ai.com'),
  title: { default: '조현정의AI실험실 — 구글시트 자동화 템플릿', template: '%s · 조현정의AI실험실' },
  description: '구글시트·앱스스크립트로 반복 작업을 자동화하는 무료 템플릿 스토어. 유튜브 영상 속 자료를 사본 만들기로 바로 받아가세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${roboto.className} ${noto.className}`}>
      <body>
        <Header />
        <main className="container">{children}</main>
        <footer className="pagefoot container">
          <div className="foot-links">
            <Link href="/about">소개</Link>
            <a href="https://www.youtube.com/channel/UCiBi0s6g_Uk3k8yhCmkH5xw" target="_blank" rel="noopener">유튜브 채널 ↗</a>
            <a href="https://github.com/chohyunjungai/cho-ai-templates" target="_blank" rel="noopener">GitHub ↗</a>
            <a href="mailto:creator@cho-ai.com">creator@cho-ai.com</a>
          </div>
          <div className="foot-legal">© 2026 조현정의AI실험실 · 코드 MIT · 콘텐츠 CC BY 4.0 (출처 표기 후 자유 이용)</div>
        </footer>
      </body>
    </html>
  );
}
