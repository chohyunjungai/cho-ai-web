# 보안 감사 심화 보고서 — cho-ai.com

**대상**: `chohyunjungai/cho-ai-web` (Next.js 16 + Neon Postgres + Drizzle)
**일자**: 2026-07-06 · **범위**: 소스코드, 리다이렉트/클릭 로직, DB 계층, GitHub 저장소, 의존성
**총평**: 직접적인 코드 인젝션(SQL/XSS) 취약점은 **없음**. 위험은 의존성·운영·방어심층(defense-in-depth) 영역에 집중.

> 조치 현황은 각 항목의 **[상태]** 표기 참조. 최초 감사 후 H-1·M-1·M-3·L-2·L-3 패치 적용됨.

## 잘 되어 있는 것 (근거 있는 안심)
- **시크릿 관리 청결**: `.env.local` 미추적, 전체 git 히스토리·추적 파일에 DB URL/API 키/토큰 노출 0건. `.gitignore`가 `.env*`·`data/`·`.next/` 차단.
- **SQL 인젝션 없음**: 모든 쿼리가 Drizzle 파라미터 바인딩 또는 `sql` 태그(값 바인딩). 문자열 concat·`sql.raw` 0건.
- **XSS 없음**: `dangerouslySetInnerHTML`·`eval`·`innerHTML` 0건. `body_md`는 React가 텍스트로 이스케이프.
- **리다이렉트 슬러그 검증**: `^\d+[a-z]?$`로 반사(`?via=`) 값 안전.
- **fail-open 설계 일관**: 클릭 기록 실패가 리다이렉트를 막지 않음 (CLAUDE.md 규칙 9).

---

## 🔴 High

### H-1. Drizzle ORM SQL 인젝션 취약점 (의존성) — [상태: 패치됨]
- **위치**: `package.json` — `drizzle-orm@0.44.7` → `^0.45.2`
- **내용**: [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9) — SQL 식별자 이스케이프 미흡. 현재 코드는 사용자 입력을 식별자로 쓰지 않아 실 익스플로잇 가능성은 낮으나, 고위험 라이브러리를 프로덕션에 두는 리스크 자체를 제거.
- **조치**: `drizzle-orm@^0.45.2` 업그레이드 + 회귀 확인.

## 🟠 Medium

### M-1. 보안 응답 헤더 전무 — [상태: 패치됨]
- **위치**: `next.config.ts` — `headers()` 부재
- **내용**: CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy 부재 → 클릭재킹, MIME 스니핑, HTTPS 다운그레이드, 리퍼러 유출.
- **조치**: `next.config.ts`에 전역 보안 헤더 추가.

### M-2. 클릭 기록 무제한 쓰기 = 비용/오염 증폭 — [상태: 인프라 필요, 미적용]
- **위치**: `app/[code]/route.ts`, `app/out/[store]/[isbn]/route.ts`
- **내용**: 매 히트마다 무조건 `clicks` INSERT, 레이트리밋 없음. `/1`,`/2`… 스팸 시 Neon(사용량 과금)에 무한 행 → 비용·분석 오염. `clicks_human`은 읽기 시점 필터라 원본은 쌓임.
- **조치(권장)**: 엣지 레이트리밋(Vercel/Upstash KV 등 외부 상태 필요) 또는 삽입 전 UA 봇 조기 차단. 서버리스 특성상 인프라 결정이 선행되어야 하므로 코드만으로는 미적용. 완화책으로 봇 UA 조기 스킵을 삽입 경로에 추가 검토.

### M-3. 오픈 리다이렉트 방어심층 부재 — [상태: 패치됨(`[code]`), 확인(`/out`)]
- **위치**: `app/[code]/route.ts` — `new URL(targetPath+?via, origin)`
- **내용**: `short_links.targetPath`가 절대 URL이면 외부로 리다이렉트 가능(관리자 데이터라 직접 벡터 아님, DB 오염 대비 안전장치 부재).
- **조치**: `targetPath`가 `/`로 시작하는 같은 오리진 경로만 허용하도록 가드. `/out`은 의도된 외부 서점 링크(설계상 정상).

## 🟡 Low / 정보

### L-1. postcss 취약점 (Next 번들) — [상태: 모니터링]
- `postcss < 8.5.10` (Next 의존) [GHSA-qx2v-qp2m-jg93] 중간 XSS. **`npm audit fix --force` 금지**(Next을 9.x로 다운그레이드). Next 패치 릴리스로만 해소.

### L-2. `outbound_clicks.video_id` 미검증 쿼리파라미터 — [상태: 패치됨]
- `?v=` 값을 그대로 INSERT. `videos.id` FK로 위조 값은 유실되나 정상 클릭도 손실 가능. 삽입 전 형식 검증 추가.

### L-3. LIKE 와일드카드 미이스케이프 — [상태: 패치됨]
- `src/db/queries.ts` `search()` — 사용자의 `%`·`_`가 와일드카드로 해석(검색 품질). 이스케이프 처리.

### L-4. 공개 저장소 — [상태: 확인, 정상]
- 저장소 PUBLIC. MIT 코드 공개는 정책상 정상, 시크릿·클릭데이터 유출 없음. 스키마 공개되므로 M-1/M-2 방어 중요.

---

## 우선순위 처리 순서
1. H-1 `drizzle-orm@^0.45.2` — 완료
2. M-1 보안 헤더 — 완료
3. M-2 레이트리밋 — 인프라 결정 필요(보류)
4. M-3 `targetPath` 오리진 강제 — 완료
5. L-1 Next 패치로 postcss 해소 — 모니터링
