# BUILD-LOG — 2026-07-05 ~ 07-06 구축 기록

> 목적: 처음부터 다시 만들더라도 이 문서만으로 오늘의 모든 결정·구현·함정 회피를 재현할 수 있게 한다.
> 원본 명세는 [SPEC.md](../SPEC.md)·[DESIGN.md](../DESIGN.md), 불변 규칙은 [CLAUDE.md](../CLAUDE.md). 이 문서는 "무엇을 어떤 순서로 왜 그렇게 했나"의 기록이다.

## 0. 최종 상태 요약 (2026-07-06 기준)

- **https://cho-ai.com 라이브** — Vercel(Hobby) + Neon(PG 18.4, ap-southeast-1) + Next.js 16 + Drizzle
- videos 84 (video_no 1~84 영구 확정, Shorts 21 포함) · templates 24 (published, 미리보기 실이미지 23) · tags 22 (task 10/tech 12 확정) · short_links 252 · video_tags 221 · books 1 + book_links 3 + video_books 8 + promos 1
- 저장소: [cho-ai-web](https://github.com/chohyunjungai/cho-ai-web)(공개·사이트+문서) · [cho-ai-templates](https://github.com/chohyunjungai/cho-ai-templates)(공개·MIT+CC BY 4.0) · [cho-ai-data](https://github.com/chohyunjungai/cho-ai-data)(**private**·야간 스냅샷)
- 크론: sync-videos(cho-ai-web Actions, KST 04:20) · snapshot(cho-ai-data Actions, KST 04:40)

## 1. 데이터 기반 (0단계) — 실행 순서와 결정

### 1-1. 스키마 (drizzle/0000~0004)

| 마이그레이션 | 내용 |
|---|---|
| 0000_init | SPEC §2 전체 — 테이블 14개, CHECK 7, 인덱스, 복합 FK(outbound_clicks→book_links) |
| 0001 | `clicks_human` 뷰 (봇 제외 집계 — user_agent 정규식 필터, 원시 데이터는 전부 보존) |
| 0002 | templates.type CHECK에 'form','file' 추가 (실데이터: 폼 1·파일 1 존재) |
| 0003 | pg_trgm 확장 + videos/templates title GIN 인덱스 (검색) |
| 0004 | books.subtitle, books.publisher (책 배너 4줄 표기용) |

핵심 원칙(재현 시 그대로): ID 불변·재사용 금지 / videos는 기계 전용 / 영상 삭제 시 행 삭제가 아니라 status 변경 / 발행된 short_links는 영원히 리다이렉트.

### 1-2. 영상 시딩과 video_no 확정 (`scripts/sync-videos.ts`)

- 채널 UCiBi0s6g_Uk3k8yhCmkH5xw 업로드 재생목록 전체 수집 → upsert (기존 행의 video_no·status 불변) → **신규만** 게시일 오름차순 `max+1` 부여(트랜잭션) → short_links 3행(`{no}`,`{no}d`,`{no}c` → `/videos/{videoId}`) 생성
- Shorts 판별: 길이 ≤183초 + `youtube.com/shorts/{id}` 프로브(200 유지 = Shorts, 리다이렉트 = 일반)
- API에서 사라진 영상: 공개 API로는 삭제/비공개 구분 불가 → **자동 변경 없이 경고만**
- 소유자가 비공개 영상 정리 후 `RESEED_CONFIRM=yes tsx scripts/dev/truncate-videos.ts` + 재동기화로 **84개 확정**. ⚠️ 링크 발행 후에는 재시딩 절대 금지
- 검증: `scripts/verify-db.ts` 11항목 (행 수·번호 연속·게시순 일치·링크 3배수·태그 규칙·뷰 존재 등)

### 1-3. 태그 확정 (실데이터 검증)

- 초안 → **84편 전수 매핑**(docs/tag-mapping.md) → 규칙(미분류 3↑ 추가, 0~1개 제거) 적용 → 소유자 확정: **ai-tools·automation·school 추가, grading·classroom 제거** → task 10 + tech 12
- video_tags 221행은 `scripts/seed-video-tags.ts`의 MAP이 원본 (매핑 표를 코드로 옮긴 것)

### 1-4. 템플릿 시딩 — 조사 4경로 (`scripts/survey-links.ts` → `scripts/seed-templates.ts`)

정리 시트 없이 자동 조사로 해결. 경로: ① 설명란 직링크 ② 블로그(cho-ai-lab.blogspot.com) 크롤 — sitemap.xml → 글 속 유튜브 임베드↔구글 링크 매칭 ③ 채널 소유자 고정댓글(commentThreads, **order=relevance** 필수) ④ 단축링크 추적 — **link.cho-ai.com은 Short.io**(CNAME cname.short.io), 구글 로그인 래퍼에 걸리면 `continue=` 파라미터에서 실목적지 추출
- 결과 26개 중 참여용 폼 2건 오탐 제외 → 24개 시딩. 제목은 구글 파일 실제 `<title>` 페치로 확정
- 공유 설정 확인: 제목 조회 실패 = 링크 공유 꺼짐 신호 (2건 소유자가 수정)

### 1-5. 크론 2종과 함정들

- **sync-videos.yml** (cho-ai-web): 시크릿 DATABASE_URL·YOUTUBE_API_KEY + 변수 YT_CHANNEL
- **snapshot.yml** (cho-ai-data 자체 — 크로스 리포 토큰 불필요, permissions: contents: write):
  - ⚠️ **함정 1**: Neon PG 18.4 vs 러너 pg_dump 16 → 버전 불일치 실패. PGDG postgresql-client-18 설치해도 래퍼가 16 선택 → **`/usr/lib/postgresql/18/bin/pg_dump` 절대 경로 호출**로 해결
  - ⚠️ **함정 2 (중대)**: pooler URL로 pg_dump 실행 시 `search_path=''` 세션이 pgbouncer 백엔드에 잔류 → 다른 쿼리가 간헐적으로 "relation does not exist" → **덤프·복원·psql 배치는 반드시 direct 엔드포인트**(호스트에서 `-pooler` 제거)
- 복원 리허설: 같은 프로젝트 별도 DB(`CREATE DATABASE restore_rehearsal`)로 수행, 14개 테이블 행 수 일치 확인 — 절차는 docs/restore.md

## 2. 사이트 (1단계) — 구조와 결정

### 2-1. 스택 구조

```
app/
  layout.tsx          헤더(로고+네비+검색)·푸터(§2-5)·Roboto+Noto Sans KR(next/font)
  globals.css         디자인 토큰 전부 (DESIGN §1 — 유튜브 미러, 라이트/다크 CSS 변수)
  page.tsx            홈: 칩 → 템플릿 6 → 책 배너 → 최신 영상 → 나머지 템플릿
  [code]/route.ts     ★ 짧은 링크 (아래 2-2)
  out/[store]/[isbn]/route.ts  서점 경유 302 + outbound_clicks
  videos/ videos/[id]/ templates/ templates/[slug]/ tags/[tag]/ search/ about/ not-found
  icon.svg            파비콘 (§2-6)
components/           Header, Logo(테마 불변), TemplateCard(+CSS 미리보기 폴백),
                      VideoCard, BookPromo(공용 책 배너), CopyButton(권한 안내 바텀시트),
                      ContextLabel(?via 문구 분기)
src/db/  schema.ts(원본=SPEC §2) app.ts(neon-http, 페이지용) client.ts(postgres-js, 스크립트용)
         schema-route.ts(지연 초기화 — DATABASE_URL 없어도 모듈 로드 성공해야 fail-open 가능)
         queries.ts(페이지 조회 전부)
```

- **정적 우선**: 전 페이지 ISR(revalidate 3600) + generateStaticParams → 정적 136페이지. 동적은 /[code]·/out·/search뿐. 프로덕션에서 `x-vercel-cache: HIT` 확인됨
- 데이터가 작아(84+24) 페이지네이션·무한 스크롤 로직은 아직 불필요 — 전량 렌더

### 2-2. 짧은 링크 라우트 (이 사이트의 심장)

`app/[code]/route.ts`: 정규식 `^\d+[a-z]?$` → 소문자 정규화(/18D→18d) → short_links 조회 → **302** (301 금지 — 브라우저 캐시로 재클릭 유실) → 대상에 `?via={slug}` 부여(표시 문구 분기용) → `after()`로 clicks INSERT(referrer·user_agent 원문). **fail-open**: 조회 실패 시 홈으로 302, INSERT 실패 무시. 존재한 적 없는 번호만 404.

### 2-3. 검색

- ILIKE + pg_trgm 인덱스 (소규모라 충분, FTS는 데이터 커지면)
- **번호 직행**: 검색어가 `^\d{1,6}[a-z]?$`이면 해당 video_no의 상세로 redirect — "18번 자료요" 소통 지원

### 2-4. 책 프로모 (여러 차례 개선 — 최종형)

- 데이터: books(제목/부제/저자/출판사/표지URL/카피) + book_links(서점별 URL — 제휴 전환 시 행만 교체) + video_books(#77~84 직접) + promos(기본 배너 — 그 외 모든 영상)
- **스타일 진화 기록**: 초기 눈썹 "이 채널을 만든 사람의 책" + 카키 박스 → ❌ 폐기 → **서점 스타일 확정**: 카드 배경 + 표지 원본 이미지 + 그림자(box-shadow), 4줄(제목 700 / 부제 secondary / 카피 / **"조현정 저 | 골든래빗"**) + [교보문고][예스24][알라딘] 32px 필 버튼
- 표지 반응형: 모바일 88px / 데스크톱 가로 배너 170px(+텍스트 비례) / 우측 레일 190px
- **노출 위치**: 홈(템플릿 6개 아래) · 모든 태그 페이지(그리드 아래) · 모든 영상 상세(모바일 폴드 내/데스크톱 레일 상단). 템플릿 상세만 의도적 제외(사본 버튼 집중)
- 계측: 서점 버튼 = `/out/{store}/{isbn}?v={videoId}` → outbound_clicks (홈·태그에서는 v 없음 → video_id NULL → 출처 구분 가능)
- 책 메타는 예스24 페이지에서 페치 (og:title, og:image=`https://image.yes24.com/goods/189823964/xl`, ISBN13 9791124516218)

### 2-5. 푸터 (표준화)

2행: ① 소개 · 유튜브 ↗ · GitHub ↗ · creator@cho-ai.com(mailto) ② `© 2026 조현정의AI실험실 · 코드 MIT · 콘텐츠 CC BY 4.0 (출처 표기 후 자유 이용)`. **"Google과 무관" 면책은 /about 전담** — 푸터에 넣지 않는다.

### 2-6. 파비콘

`app/icon.svg` = 헤더 로고 마크와 동일 SVG. ⚠️ 크게 보이려면 **viewBox를 도형에 밀착**(`viewBox="3 1.5 16 19"` — 여백 제거)이 유일한 방법 — 파비콘 슬롯 크기는 브라우저 고정.

### 2-7. 템플릿 미리보기 (자동 수확)

- **드라이브 썸네일 엔드포인트**: `https://drive.google.com/thumbnail?id={fileId}&sz=w1280` — 링크 공유 파일이면 무인증으로 첫 페이지/첫 탭 이미지 반환. `scripts/fetch-previews.ts`가 published 전체 수확 → `public/previews/{slug}.png`(sips 폭 800 최적화) + preview_path 갱신
- 23/24 성공 (드라이브 다운로드 파일만 썸네일 미제공 → CSS 자리표시 유지)
- CSS: `.pv img { object-fit: cover; object-position: center top }` — 세로 긴 문서가 4:3 카드에서 상단부터 보이게
- **운영 원칙: 시트의 첫 탭이 곧 상품 사진** — 새 템플릿은 첫 탭을 안내 페이지로 꾸민다

## 3. 배포 (Vercel + 가비아 DNS)

1. Vercel 대시보드 → Import chohyunjungai/cho-ai-web → env `DATABASE_URL`만 (YouTube 키 불필요 — 동기화는 Actions) → Deploy
2. Domains: **cho-ai.com = Production, www = 308 → apex** (⚠️ Vercel 기본 제안이 반대 방향일 수 있음 — apex가 본체여야 짧은 링크가 산다). Vercel UI에서 리다이렉트 목적지는 Domain 칸이 아니라 우측 "No Redirect" 드롭다운
3. 가비아 DNS 최종 상태 (7 레코드):
   - A `@` → **216.198.79.1** (Vercel 신규 IP — 대시보드 표시값 우선)
   - CNAME `www` → cname.vercel-dns.com
   - **보존 필수**: MX `@` smtp.google.com(이메일!) · CNAME `link` → cname.short.io(기존 단축링크) · TXT 2개 + CNAME q4e7…(구글 소유권)
   - **삭제**: CNAME `@`·`www` → ghs.googlehosted.com (구 구글사이트 연결)
4. ⚠️ apex 인증서는 DNS 반영 후 수 분 걸림 — 그동안 `ERR_CERT_COMMON_NAME_INVALID` 정상
5. ⚠️ **유튜브 설명란·댓글에는 반드시 `https://cho-ai.com/18d` 형식** — https:// 없이는 링크로 인식 안 됨

## 4. 재현 시 주의할 함정 모음 (시간 순)

1. bash `${var/pattern/}` 치환에 URL 넣지 말 것 — `?`가 글롭. `sed` 사용
2. `tsx -e`는 CJS라 top-level await 불가 — async IIFE 또는 파일로
3. dotenv 기본은 `.env`만 — `.env.local`은 `config({ path: ['.env.local', '.env'] })`
4. `.env.local`을 shell `source` 금지 — URL의 `&` 때문에 깨짐. `grep | cut -d= -f2-`
5. Vercel Hobby에서 깃 커밋하는 크론은 부자연 — 스냅샷은 cho-ai-data 자체 Actions에서 (GITHUB_TOKEN으로 자기 저장소 푸시 가능)
6. pooler(pgbouncer) 세션 오염 — §1-5 함정 2. 배치·덤프·복원은 direct 엔드포인트
7. 고정댓글 수집은 commentThreads `order=relevance` (기본 time이면 놓침)
8. `cd`가 포함된 복합 명령은 권한 프롬프트 유발 — `git -C <path>` 사용
9. compound FK·CHECK는 drizzle에서 테이블 3번째 인자 배열로; 뷰·확장은 `drizzle-kit generate --custom`
10. 파비콘 캐시는 끈질김 — 확인은 시크릿 창

## 5. 오늘 결정된 정책 변경 (문서 반영 완료)

- 갤러리 노출 규칙: 홈·영상 갤러리는 **자료 연결 영상만** (SPEC §5-7) — 자료 없는 61편은 상세만 존재
- 매대 카드에 버튼 없음(탐색↔전환 분리, thegoodocs 패턴) — 영상 상세 행형 카드만 [사본 만들기]
- 상세 페이지에 태그 칩 표시 안 함 ("태그는 매대의 필터이지 상세의 장식이 아니다")
- /copy 유지 확정 (template/preview 불채택 — 모바일 인앱에서 취약, 사이트가 미리보기 역할)
- 검색창 번호 직행, 유튜브 게시 https:// 필수 규칙
