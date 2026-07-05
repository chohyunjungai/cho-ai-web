// 소개 — 문안 원본은 docs/about-draft.md, 수정 시 여기에 반영
import type { Metadata } from 'next';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDefaultBook } from '@/db/queries';
import { BookPromo } from '../../components/BookPromo';

export const metadata: Metadata = { title: '소개' };
export const revalidate = 3600;

const YT = 'https://www.youtube.com/channel/UCiBi0s6g_Uk3k8yhCmkH5xw';
const GH = 'https://github.com/chohyunjungai/cho-ai-templates';

export default async function AboutPage() {
  const book = await getDefaultBook();
  const photo = ['profile.jpg', 'profile.png', 'profile.webp']
    .find((f) => existsSync(join(process.cwd(), 'public', f)));
  return (
    <article className="about">
      <header className="about-hd">
        {photo && <img className="about-photo" src={`/${photo}`} alt="조현정 프로필 사진" />}
        <div>
          <h1>조현정의AI실험실</h1>
          <p className="lead">구글시트 자동화 템플릿을 만들어 무료로 나눕니다.</p>
        </div>
      </header>

      <section className="about-body">
        <p>
          이곳은 유튜브 채널 <a href={YT} target="_blank" rel="noopener">조현정의AI실험실</a>에서
          소개한 템플릿들을 쉽게 사용하실 수 있도록 마련한 공간입니다. 마음에 드는 템플릿을
          선택해 <b>사본 만들기</b>를 누르시면, 여러분의 구글 드라이브에 복사되어 온전히
          여러분의 것이 됩니다. 템플릿을 사용하시다 보면 어느새 구글 시트의 매력에 푹
          빠져드실 겁니다. &lsquo;이런 엄청난 기능이 전부 무료라니!&rsquo; 하시면서요.
        </p>
      </section>

      <h2>LICENSE</h2>
      <section className="about-body">
        <p>
          대부분의 템플릿은 무료로 제공하고 있습니다. 짧게는 며칠에서 길게는 몇 달에 걸쳐
          수정을 거듭하며 만든, 아주 아끼는 템플릿들입니다. 마음껏 사용하고, 수정하고,
          나누시되 출처(조현정의AI실험실, cho-ai.com)만 꼭 표시해 주세요.
        </p>
        <p>
          코드는 MIT 라이선스, 템플릿 구조·문서·글은 CC BY 4.0 라이선스를 따릅니다. 두
          라이선스 모두 사용을 폭넓게 허용하는 대신, <b>원저작자 표시</b>를 필수 조건으로
          합니다. 템플릿을 수정해서 배포하시더라도 원본의 실질적인 부분이 남아있는 한 저작권
          고지와 라이선스 문구를 그대로 남겨야 하며, 출처 없이 재배포하는 것은 라이선스
          위반에 해당합니다.
        </p>
        <p>
          모든 템플릿은 유튜브 영상과 함께 공개됩니다. 각 영상의 업로드 날짜가 최초 공개
          시점을 증명하는 기록이며, 코드 원본은{' '}
          <a href={GH} target="_blank" rel="noopener">GitHub</a>에서 누구나 투명하게 확인할 수
          있습니다.
        </p>
      </section>

      <h2>FAQ</h2>
      <section className="about-body">
        <p>
          <b>사본 만들기가 뭔가요?</b> — 템플릿이 내 구글 드라이브로 복사되는 기능입니다.
          원본 파일은 그대로 유지되고, 복사된 파일은 온전히 내 것이 되어 자유롭게 수정할 수
          있습니다.
        </p>
        <p>
          <b>&ldquo;확인되지 않은 앱&rdquo; 경고가 떠요.</b> — 자동화 스크립트가 포함된 시트를
          처음 실행할 때 구글이 띄우는 표준 안내입니다. 개인이 제작한 스크립트를 실행할 때
          나타나는 정상적인 화면이며, [고급] → [안전하지 않음으로 이동]을 누르시면 정상적으로
          사용할 수 있습니다. 모든 코드는 GitHub에서 직접 확인하실 수 있습니다.
        </p>
        <p>
          <b>왜 이렇게 계속 무료로 공개하나요? 아깝지 않나요?</b> — 한동안은 카피당하는 것이
          싫어서 아이디어를 움켜쥐고만 지냈습니다. 하지만 이제는 과거의 결과물을 지키는 데
          에너지를 소모하기보다, 세상에 아낌없이 나누고 끊임없이 새로운 영감을 던지는
          &lsquo;독창적인 크리에이터&rsquo;로 나아가기로 마음먹었습니다.
        </p>
        <p>
          <b>유료 템플릿도 있나요?</b> — 현재는 모두 무료로 제공하고 있으나, 추후 일부
          템플릿은 유료로 제공될 수 있습니다.
        </p>
      </section>

      <hr />
      <h2>PROFILE</h2>
      <ul className="bio">
        <li>성균관대학교 교육학·경제학 전공</li>
        <li>하나고등학교 사회 교사</li>
        <li>서울특별시교육청 AI·에듀테크 선도교사</li>
        <li>『유튜브 AI 비서 고용하기』 저자(골든래빗)</li>
        <li>구글과 함께하는 미니글로벌포럼 강사</li>
      </ul>
      {book && <BookPromo book={book} />}

      <h2>CONTACT</h2>
      <ul className="links">
        <li><b>유튜브</b> <a href={YT} target="_blank" rel="noopener">조현정의AI실험실</a></li>
        <li><b>스레드</b> <a href="https://www.threads.com/@cho_ai_lab" target="_blank" rel="noopener">@cho_ai_lab</a></li>
        <li><b>GitHub</b> <a href={GH} target="_blank" rel="noopener">chohyunjungai/cho-ai-templates</a></li>
        <li><b>이메일</b> <a href="mailto:creator@cho-ai.com">creator@cho-ai.com</a></li>
      </ul>
    </article>
  );
}
