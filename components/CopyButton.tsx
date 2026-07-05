'use client';
// [사본 만들기] — requires_auth 템플릿만 이동 전 안내 바텀시트 1회 (DESIGN §5-3, 무안내 원칙의 유일한 예외)
import { useState } from 'react';

const SEEN_KEY = 'cho-ai:auth-guide-seen';

export function CopyButton({ copyUrl, requiresAuth, title }: { copyUrl: string; requiresAuth: boolean; title: string }) {
  const [sheet, setSheet] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  const go = () => window.open(copyUrl, '_blank', 'noopener');

  const onClick = () => {
    if (requiresAuth && typeof localStorage !== 'undefined' && !localStorage.getItem(SEEN_KEY)) {
      setSheet(true);
      return;
    }
    go();
  };

  const proceed = () => {
    if (dontShow) localStorage.setItem(SEEN_KEY, '1');
    setSheet(false);
    go();
  };

  return (
    <>
      <button className="btn wide" onClick={onClick} aria-label={`사본 만들기 — ${title}`}>
        📋 사본 만들기
      </button>
      {sheet && (
        <>
          <div className="sheet-dim" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="사본 만들기 안내">
            <div className="handle" />
            <h3>곧 구글 화면이 떠요</h3>
            <div className="step"><span className="n">1</span><div><b>[사본 만들기]</b> → 내 드라이브에 복사돼요</div></div>
            <div className="step"><span className="n">2</span><div>시트에서 자동화 첫 실행 시 <b>&ldquo;확인되지 않은 앱&rdquo;</b> 안내가 떠요<div className="sub">개인 제작 스크립트라 뜨는 정상 안내예요</div></div></div>
            <div className="step"><span className="n">3</span><div><b>[고급] → [이동]</b>을 누르면 끝!</div></div>
            <button className="btn wide" onClick={proceed}>사본 만들러 가기</button>
            <label className="again">
              <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
              다시 보지 않기
            </label>
          </div>
        </>
      )}
    </>
  );
}
