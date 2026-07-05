import type { Metadata } from 'next';

export const metadata: Metadata = { title: '소개' };
export const revalidate = false;

export default function AboutPage() {
  return (
    <article className="prose">
      <h1>조현정의AI실험실</h1>
      <p>
        구글시트와 앱스스크립트로 반복 작업을 자동화하는 방법을 나누는 곳입니다.
        유튜브 영상에서 소개한 템플릿을 여기서 <b>사본 만들기</b>로 바로 받아가실 수 있어요 — 전부 무료입니다.
      </p>
      <h2>이 사이트는</h2>
      <p>
        유튜브 채널 <a href="https://www.youtube.com/channel/UCiBi0s6g_Uk3k8yhCmkH5xw" target="_blank" rel="noopener" style={{ color: 'var(--link)' }}>조현정의AI실험실</a>을
        운영하는 개인 크리에이터가 만들고 운영합니다. <b>Google과 무관한 개인 사이트</b>이며, 구글시트·구글문서는 Google LLC의 서비스입니다.
      </p>
      <h2>저작권과 사용 조건</h2>
      <p>
        템플릿과 코드는 무료로 쓰고, 고치고, 나눠도 됩니다. 코드는 MIT 라이선스,
        템플릿 구조·문서·글은 CC BY 4.0을 따릅니다 — 재배포하실 때 출처 <b>cho-ai.com</b>을 남겨주세요.
        모든 코드 원본은 <a href="https://github.com/chohyunjungai/cho-ai-templates" target="_blank" rel="noopener" style={{ color: 'var(--link)' }}>GitHub</a>에 공개돼 있고,
        커밋 이력이 창작 시점의 증거입니다.
      </p>
      <h2>자주 묻는 것</h2>
      <p>
        <b>사본 만들기가 뭔가요?</b> — 템플릿이 내 구글 드라이브로 복사되는 것입니다. 원본은 그대로 있고, 복사본은 온전히 내 것이 됩니다.
      </p>
      <p>
        <b>&ldquo;확인되지 않은 앱&rdquo; 경고가 떠요.</b> — 자동화 스크립트가 포함된 시트를 처음 실행하면 구글이 보여주는 표준 안내입니다.
        개인 제작 스크립트라 뜨는 정상 화면이며, [고급] → [이동]을 누르면 사용할 수 있습니다. 모든 코드는 GitHub에서 직접 확인할 수 있어요.
      </p>
    </article>
  );
}
