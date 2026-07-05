'use client';
// 유입 경로별 문구 분기 — 짧은 링크 302가 붙이는 ?via 쿼리로 판별 (SPEC §3-8, DESIGN §3-2c).
// 페이지는 동일한 정적 HTML — 문구만 클라이언트에서 바뀐다.
import { useEffect, useState } from 'react';

export function ContextLabel() {
  const [fromYoutube, setFromYoutube] = useState(false);
  useEffect(() => {
    setFromYoutube(new URLSearchParams(window.location.search).has('via'));
  }, []);
  return <p className="lab">{fromYoutube ? '지금 보신 영상의 자료예요' : '이 영상에서 소개한 자료예요'}</p>;
}
