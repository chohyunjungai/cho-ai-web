# SPEC.md — cho-ai.com 프로젝트 마스터 명세

확정일: 2026-07-05 · 결정 이력: [REVIEW.md](REVIEW.md) · 실행 계획: [TASKS.md](TASKS.md) · 디자인: [DESIGN.md](DESIGN.md) · 미결: [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)

## 0. 한 줄 목표

유튜브 영상과 템플릿(구글시트/문서)을 관계형 DB로 연결·배포하는 사이트 **cho-ai.com**. 클릭·전환 데이터의 1차 소유자는 나이고, 유튜브에 뿌린 링크는 영원히 죽지 않으며, 이 프로젝트 자체가 SQL·DB 실전 학습 과정이다.

### 사용자층 (확정 2026-07-05)

특정 직업용 사이트가 아니다 — **"구글시트+앱스스크립트로 반복 작업을 자동화하려는 모든 사람"의 사이트**다.

| 그룹 | 대표 관심사 |
|---|---|
| ① 유튜브 운영·자동화 관심자 (**가장 많음**) | 채널 분석, 댓글 관리, 업로드 자동화 |
| ② 교사 | 학교 업무 자동화 (성적, 알림, 행정) |
| ③ 고등학생 | AI 학습 |
| ④ 직장인·자영업자 | 업무 자동화 |

공통 특성: **개발자가 아니다** — "코드"라는 단어에 부담을 느낄 수 있다. 연령대 10대~50대 이상. 콘텐츠·분류·문구는 특정 그룹(예: 교사)만을 전제하지 않는다.

## 1. 확정 스택

| 구성 | 확정 | 역할 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | ISR 정적 서빙, 라우트 핸들러, API |
| DB | Neon (PostgreSQL) | 영상·템플릿·태그·클릭 로그. 브랜칭으로 마이그레이션 리허설 |
| ORM | Drizzle | SQL 투명 계층. 마이그레이션 SQL이 깃에 누적 |
| 호스팅 | Vercel (Hobby) | 배포 + cho-ai.com 연결. www → apex 301 |
| 크론 | **GitHub Actions schedule** | 영상 동기화(매일), 야간 스냅샷. Vercel Cron 사용 안 함 |
| 영상 동기화 | YouTube Data API(읽기 키) → upsert | 설명란 일괄 수정(2단계)만 별도 OAuth 필요 |
| 코드 동기화 | clasp | 앱스스크립트 ↔ cho-ai-templates |
| 검색 | Postgres FTS + pg_trgm → pgvector(3단계) | |
| 분석 | 자체 클릭 로그(1차) + GA4(보조, [미정]) | |
| 인증(3단계) | 요구사항만 고정: 구글 로그인 + RLS 확장 가능. 라이브러리 [미정] | |
| 블로그 | 깃 저장소의 MDX | |

**하이브리드 원칙**: 관계·이벤트·상태는 DB에, 산문(긴 글)과 코드는 깃에.

### 저장소 구성 (3개, 전부 개인(비학교) 계정)

| 저장소 | 공개 | 내용 |
|---|---|---|
| `cho-ai-web` | 공개 | 사이트 코드, Drizzle 마이그레이션, 블로그 MDX. 이 문서 체계(SPEC/CLAUDE/TASKS 등)도 여기로 이관 |
| `cho-ai-templates` | 공개 | 템플릿 모노레포(템플릿별 폴더), clasp 연동 .gs 원본, LICENSE |
| `cho-ai-data` | **private** | 야간 pg_dump + 핵심 테이블 JSON/CSV. 클릭 로그 포함이므로 공개 절대 금지 |

## 2. DB 스키마 (최종)

```sql
-- ========== 콘텐츠 코어 ==========
CREATE TABLE videos (
  id            text PRIMARY KEY,           -- YouTube videoId (불변)
  video_no      integer UNIQUE NOT NULL,    -- 짧은 링크용 연번 (불변, 재사용 금지)
  title         text NOT NULL,
  published_at  timestamptz NOT NULL,
  thumbnail_url text NOT NULL,              -- i.ytimg.com
  description   text,
  status        text NOT NULL DEFAULT 'public'
                CHECK (status IN ('public','unlisted','private','deleted')),
                -- 영상이 삭제·비공개돼도 행은 삭제하지 않는다 (ID·번호 불변)
  is_short      boolean NOT NULL DEFAULT false,  -- Shorts 포함 (확정 2026-07-05) — 일반 영상과 동일하게 video_no 소비
  synced_at     timestamptz
);

CREATE TABLE templates (
  slug          text PRIMARY KEY,           -- 불변 ID (kebab-case)
  title         text NOT NULL,
  type          text NOT NULL CHECK (type IN ('sheet','doc','form','file')),  -- 2026-07-05 확장: 폼·파일 자료 실존
  status        text NOT NULL CHECK (status IN ('draft','published','deprecated')),
  copy_url      text NOT NULL,              -- 구글 "사본 만들기" 링크 (/copy)
  github_path   text,                       -- cho-ai-templates/{slug}
  version       text,
  requires_auth boolean NOT NULL DEFAULT false,  -- 앱스스크립트 권한 승인 필요 여부
  preview_path  text,                        -- 스토어 카드용 미리보기 스크린샷 (사이트 저장소 /public/previews/{slug}.png)
  body_md       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE template_versions (
  id            serial PRIMARY KEY,
  template_slug text NOT NULL REFERENCES templates(slug),
  version       text NOT NULL,
  note          text,
  released_at   timestamptz NOT NULL DEFAULT now()
);

-- ========== 관계 (N:M은 전부 연결 테이블) ==========
CREATE TABLE video_templates (
  video_id      text NOT NULL REFERENCES videos(id),
  template_slug text NOT NULL REFERENCES templates(slug),
  PRIMARY KEY (video_id, template_slug)
);

CREATE TABLE tags (
  id       serial PRIMARY KEY,
  name     text NOT NULL,                   -- 한국어 표시명
  slug     text UNIQUE NOT NULL,            -- kebab-case
  category text NOT NULL CHECK (category IN ('task','tech'))
);

CREATE TABLE video_tags (
  video_id text NOT NULL REFERENCES videos(id),
  tag_id   integer NOT NULL REFERENCES tags(id),
  PRIMARY KEY (video_id, tag_id)
);

CREATE TABLE template_tags (
  template_slug text NOT NULL REFERENCES templates(slug),
  tag_id        integer NOT NULL REFERENCES tags(id),
  PRIMARY KEY (template_slug, tag_id)
);

-- ========== 짧은 링크 · 클릭 ==========
CREATE TABLE short_links (
  slug        text PRIMARY KEY,             -- '123', '123d', '123c' (소문자)
  video_id    text NOT NULL REFERENCES videos(id),
  position    text NOT NULL CHECK (position IN ('description','comment','other')),
  target_path text NOT NULL,                -- '/videos/{videoId}'
  active      boolean NOT NULL DEFAULT true -- false여도 리다이렉트는 계속된다 (링크 불사)
);

CREATE TABLE clicks (
  id         bigserial PRIMARY KEY,
  link_slug  text NOT NULL REFERENCES short_links(slug),
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer   text,
  user_agent text                           -- 원문 저장. 봇 판별은 기록 시가 아니라 조회 시
);
CREATE INDEX idx_clicks_slug_at ON clicks (link_slug, clicked_at);
CREATE INDEX idx_clicks_at      ON clicks (clicked_at);

-- 봇 제외 집계는 뷰로 정형화 (원시 데이터는 전부 보존)
CREATE VIEW clicks_human AS
  SELECT * FROM clicks
  WHERE user_agent IS NULL
     OR user_agent !~* '(bot|crawler|spider|preview|facebookexternalhit|slurp)';

-- ========== 책 소개 ==========
CREATE TABLE books (
  isbn      text PRIMARY KEY,               -- ISBN-13 (불변)
  title     text NOT NULL,
  author    text,
  cover_url text,
  note      text                            -- 추천 이유 한 줄
);

CREATE TABLE book_links (                   -- 서점 URL 정규화 (제휴 URL 교체 = 행 수정)
  isbn  text NOT NULL REFERENCES books(isbn),
  store text NOT NULL CHECK (store IN ('kyobo','yes24','aladin','other')),
  url   text NOT NULL,
  PRIMARY KEY (isbn, store)
);

CREATE TABLE video_books (
  video_id text NOT NULL REFERENCES videos(id),
  isbn     text NOT NULL REFERENCES books(isbn),
  PRIMARY KEY (video_id, isbn)
);

-- 프로모 슬롯 (영상 상세 상단 배너 — 책·강의 홍보. video_books 연결이 없을 때의 기본값)
CREATE TABLE promos (
  id         serial PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('book','lecture','other')),
  title      text NOT NULL,
  tagline    text,                           -- 배너 카피 한 줄
  image_path text,                           -- 표지·강의 이미지
  target_url text,                           -- 강의 등 외부 링크 (책이면 NULL — 서점 선택 시트가 담당)
  isbn       text REFERENCES books(isbn),    -- kind='book'일 때 연결
  active     boolean NOT NULL DEFAULT true,
  sort       integer NOT NULL DEFAULT 0      -- 낮을수록 우선. 배너는 항상 1개만 노출
);
-- 강의(외부 링크) 클릭 기록은 [미정] — 필요 시 outbound_clicks 확장 또는 promo_clicks 신설로 결정

CREATE TABLE outbound_clicks (
  id         bigserial PRIMARY KEY,
  isbn       text NOT NULL,
  store      text NOT NULL,
  video_id   text REFERENCES videos(id),    -- 어느 영상 페이지에서 눌렀나
  clicked_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  FOREIGN KEY (isbn, store) REFERENCES book_links(isbn, store)
);
CREATE INDEX idx_outbound_video_at ON outbound_clicks (video_id, clicked_at);

-- ========== 3단계 이후 (예정, 지금 만들지 않음) ==========
-- profiles(user_id ...), favorites(user_id, template_slug, ...)
-- template_embeddings(template_slug PRIMARY KEY, embedding vector(1536))
```

### 스키마 불변 원칙

1. **ID 불변·재사용 금지**: `videos.id`, `video_no`, `templates.slug`, `short_links.slug`, `books.isbn`은 영원히 유지. 영상 삭제·비공개 시 행 삭제가 아니라 `status` 변경.
2. **기계/사람 소유 분리**: `videos`는 동기화 크론 전용 — 사람·에이전트가 직접 UPDATE 금지. 나머지는 사람이 관리.
3. **관계는 연결 테이블 한 곳에만**. 무결성은 FK·CHECK로 DB가 강제.
4. **스키마 변경은 Drizzle 마이그레이션으로만** — Neon 브랜치에서 리허설 후 main 적용.

## 3. URL 구조와 영구 불변 규칙

```
/                      홈: 최신 영상 + 인기 템플릿(클릭 집계) + 최신 글
/123 , /123d , /123c   짧은 링크 → 클릭 기록(fail-open) 후 영상 상세로 302
/videos                영상 갤러리 (검색·필터)
/videos/{videoId}      영상 상세: 임베드 + 템플릿 카드 + 책 섹션 + 관련 글
/templates             템플릿 갤러리
/templates/{slug}      상세: 미리보기, [사본 만들기], 버전 이력, 깃허브 링크
/blog , /blog/{slug}   블로그 (+ /blog/{slug}.md 원문)
/tags/{tag}            태그 통합 뷰 (영상+템플릿+글 한 페이지)
/about                 소개, 라이선스, 출처 표기 안내
/out/{store}/{isbn}    서점 경유: outbound_clicks 기록 후 302 (유튜브 비노출, 버튼 전용)
/api/...               공개 읽기 JSON (캐시 헤더 필수, rate limit은 문제 발생 시)
```

**영구 규칙** (어길 수 없음):

1. 루트의 `숫자(+영문 소문자 1자)` 패턴은 영원히 짧은 링크 전용으로 예약.
2. 한 번 발행된 짧은 링크는 **영원히 리다이렉트된다**. `active=false`는 표지일 뿐 링크를 죽이지 않는다.
3. `video_no`는 게시일 오름차순 연번, 최초 시딩 시 가장 오래된 영상 = 1번. 신규 영상은 동기화가 `max(video_no)+1`을 트랜잭션 안에서 부여. 결번 허용, 재사용 금지, 패딩 없음(`/7`, `/007` 아님).
4. 위치 접미사: `d` = 설명란, `c` = 고정댓글, 무접미사 = 기타(프로필·커뮤니티 등). 확장은 소문자 1자 추가로만.
5. 슬러그는 소문자로 정규화 후 매칭 (`/123D` → `/123d`).
6. 도메인 표기는 `cho-ai.com` (www 없이). www는 apex로 301.
7. 리다이렉트는 302 — 301은 브라우저가 캐시해 재클릭이 집계되지 않는다.
8. 짧은 링크의 302 대상에는 `?via={slug}`를 붙인다 (예: `/123d` → `/videos/{videoId}?via=123d`) — 유입 경로별 문구 분기용(DESIGN.md §3-2c). 분석은 여전히 `clicks` 테이블이 담당하며 이 쿼리는 표시용일 뿐이다.

## 4. 태그 어휘와 운영 규칙

**확정본 (2026-07-05, 영상 84편 전수 매핑 검증 완료 — cho-ai-web/docs/tag-mapping.md)**. 검증 규칙(미분류 3개↑ → 추가, 0~1개 태그 → 제거)에 따라 초안에서 ai-tools·automation·school 추가, grading·classroom 제거:

**업무 축 (category='task', 주 필터, 10개)**: 유튜브 운영(youtube — 채널 분석·댓글·수집, 19편), AI 도구·활용(ai-tools — AI 서비스 리뷰·팁·소식, 16편), 업무자동화(automation — AI자동화학교·바이브코딩 시리즈, 9편), 자료취합·문서(admin — 파일·메일·문서 자동화, 11편), 설문·폼(survey, 10편), 문자·알림(sms-alert, 6편), AI 학습(ai-study — 공부법·학습 도구, 3편), 데이터 분석(data, 3편), 일정·시간표(schedule, 2편), 학교·교사(school — 교사 행정, 2편). 일상·기타 쇼츠는 업무 태그 0개 허용(5편).

**기술 축 (category='tech', 보조 필터, 12개 이내)**: 앱스스크립트(apps-script), 트리거·자동실행(trigger), 시트함수(formulas), QUERY(query), 정규식(regex), 웹앱(web-app), 구글폼 연동(forms), Gmail 연동(gmail), 캘린더 연동(calendar), 외부 API(external-api), 구글문서(docs), AI 활용(ai)

**운영 규칙**:
1. 태그는 `tags` 테이블에 시딩된 통제 어휘만 사용 — FK가 오타를 원천 차단.
2. 새 태그 추가는 "이유 한 줄 기록 후 시딩" 절차로만.
3. 콘텐츠당 업무 태그 1~2개 + 기술 태그 0~3개. 5개 초과는 소음.
4. 한 태그에 콘텐츠 15개 이상 쌓이면 하위 분화 검토. 통합은 쉽고 분화는 노동이므로 거칠게 시작.
5. 난이도 같은 단일 선택 속성은 태그가 아니라 컬럼으로.

## 5. 렌더링·클릭 기록 원칙

1. **정적 우선(static-first)**: 방문자 페이지는 전부 ISR 정적 HTML로 서빙. DB는 재생성 시에만 접근 — DB 장애가 방문자에게 보이지 않는다.
2. **짧은 링크는 루트 동적 라우트 핸들러** `app/[code]/route.ts` (Node 런타임): 정규식 `^\d+[a-z]?$` 매칭 → `short_links` 조회 → 302 응답 → `after()`로 클릭 INSERT 비동기 실행. 이름 있는 라우트(/videos 등)가 항상 우선 매칭되므로 예약 규칙과 충돌 없음.
3. **fail-open**: 클릭 INSERT 실패가 리다이렉트를 절대 막지 않는다. 최악은 로그 몇 행 유실.
4. 클릭 INSERT는 Neon serverless HTTP 드라이버 사용 (커넥션 풀 부담 없음).
5. 봇은 기록 시 차단하지 않고 전부 기록, 집계는 `clicks_human` 뷰로 — 원시 데이터 보존이 데이터 소유권 전제에 부합.
6. `/out/{store}/{isbn}?v={videoId}`도 동일 원칙 (기록 후 302, fail-open).
7. **갤러리 노출 규칙 (2026-07-05 확정)**: 홈·영상 갤러리에는 자료(템플릿·강의안) 연결이 있는 영상만 노출한다. 자료 없는 영상의 상세 페이지도 존재하지만(짧은 링크는 영원하다) 탐색 동선에는 나타나지 않는다. 한 영상에 자료 여러 개 연결 가능(video_templates N:M).

## 6. 크론·백업

| 작업 | 위치 | 주기 |
|---|---|---|
| 영상 동기화 (YouTube API → videos upsert + video_no 부여) | GitHub Actions | 매일 |
| 야간 스냅샷 (pg_dump + 핵심 테이블 JSON/CSV → `cho-ai-data` 커밋) | GitHub Actions | 매일 |

- Actions 실패 시 GitHub 기본 이메일 알림으로 감지.
- 동기화는 upsert — 실패해도 기존 행 안전. 삭제·비공개 영상은 행 유지 + `status` 변경.
- **복원 리허설**: 스냅샷 → 새 Neon 브랜치 복원을 0단계에서 1회 검증하고 절차를 문서화. 이후 연 1회.

## 7. 단계별 로드맵 (완료 판정 기준 포함)

### 0단계 — 데이터 기반

작업: Neon 프로젝트 + Drizzle 마이그레이션, 태그 시딩, GitHub Actions 동기화(영상 70개 + video_no), 템플릿 시딩, cho-ai-templates + clasp + 라이선스, cho-ai-data + 야간 스냅샷, 복원 리허설. 상세: [TASKS.md](TASKS.md)

**완료 판정**:
- [ ] §2 스키마 전체가 Drizzle 마이그레이션 파일로 존재하고 Neon main에 적용됨
- [x] `SELECT count(*) FROM tags` = 22 (task 10 + tech 12 — 2026-07-05 실데이터 검증 후 확정)
- [ ] `SELECT count(*) FROM videos` ≥ 70, `video_no` 1부터 연속 부여, 게시일 오름차순과 일치
- [ ] published 템플릿 전부: `copy_url`이 `/copy`로 끝나고 영상과 `video_templates`로 연결됨
- [ ] cho-ai-templates에 템플릿별 폴더 + `.gs` 원본 + LICENSE + 저작자 고지 주석
- [ ] cho-ai-data에 이틀 연속 자동 스냅샷 커밋 존재
- [x] 스냅샷 → 별도 DB 복원 1회 성공 (14개 테이블 행 수 일치, 2026-07-06), 절차 문서화(docs/restore.md)
- [ ] 영상 70개 제목 → 태그 매핑 표 검증 완료, 태그 어휘 최종 확정

### 1단계 — MVP 사이트

작업: 홈·영상/템플릿 갤러리·상세·태그·about (전부 ISR), 검색·필터(FTS + pg_trgm), 짧은 링크 라우트 + clicks 로깅, Vercel 배포 + cho-ai.com 연결, 신규 영상부터 설명란에 짧은 링크.

**완료 판정**:
- [x] `cho-ai.com/18d` → 302 → 영상 상세, `clicks` 기록 (2026-07-06 프로덕션 실측 — 실브라우저 UA 포함)
- [ ] DB 연결을 끊은 프리뷰 환경에서도 리다이렉트가 성공한다 (fail-open — 코드는 try/catch+홈 폴백으로 보장, 프리뷰 실측 남음)
- [x] 방문자 페이지 전부 정적 서빙 (x-vercel-cache: HIT 확인, 정적 136페이지)
- [x] 검색어·태그 필터로 템플릿 도달 가능 (/search?q=댓글 200)
- [x] www.cho-ai.com → cho-ai.com 308 영구 리다이렉트
- [ ] 신규 영상 1개 이상의 설명란에 짧은 링크 게시됨 (소유자)

### 2단계 — 블로그 + 보조 측정

작업: MDX 블로그(.md 원문, llms.txt, RSS, JSON-LD), 기존 영상 설명란 일괄 업데이트(YouTube OAuth 쓰기 — 선행 조건), 클릭 대시보드(내부용, 보호 방식은 착수 시 확정), (선택·[미정]) GA4 + BigQuery 조기 활성화.

**완료 판정**:
- [ ] 블로그 글 1편이 /blog/{slug}와 /blog/{slug}.md 양쪽에서 서빙됨, llms.txt·RSS·JSON-LD 유효
- [ ] 기존 영상 70개 설명란에 각자의 짧은 링크 반영됨
- [ ] 클릭 대시보드에서 영상별·위치별 집계가 보이고, 비인가 접근이 차단됨

### 3단계 — 지능형 기능

작업: pgvector 의미 검색, localStorage 즐겨찾기 → 수요 확인 후 로그인([미정] 라이브러리) + favorites + RLS, 클릭 기반 인기·추천.

**완료 판정**:
- [ ] "문자 보내는 거 자동으로 하는 시트" 류 자연어 질의가 관련 템플릿을 상위에 반환
- [ ] 인기 자료 섹션이 `clicks_human` 집계로 렌더링됨

### SQL 학습 결합 (각 단계에서 실전으로 배우는 것)

0단계: DDL·PK/FK/CHECK·정규화·N:M | 동기화: upsert·트랜잭션 | 갤러리: SELECT·JOIN·페이지네이션 | 검색: FTS·인덱스·EXPLAIN | 클릭 분석: GROUP BY·윈도우 함수 | 백업: pg_dump·COPY·뷰 | 브랜칭: 마이그레이션 리허설 | 로그인: RLS | 맞춤 검색: pgvector

## 8. 라이선스·저작권

- 코드(사이트·앱스스크립트) MIT, 템플릿 구조·문서·글 CC BY 4.0. `/about`에 명시.
- cho-ai-templates 커밋 타임스탬프 = 창작 시점의 공적 증거.
- 모든 `.gs` 상단 저작자 고지 주석 + 시트 첫 탭에 출처·라이선스 안내.
- 목표는 완전 차단이 아니라 자연스러운 출처 인지 + 분쟁 시 증거.
- 서점 제휴 가입 시([미정]) 공정위 표시광고법에 따라 수수료 고지 문구를 버튼 근처에 명시.

## 9. LLM 친화 전략

- 대외: `/blog/{slug}.md` 원문, `/llms.txt` + `/llms-full.txt`, RSS, sitemap, JSON-LD(VideoObject/Article/HowTo/SoftwareApplication), robots.txt AI 크롤러 허용, 공개 읽기 `/api`(캐시 헤더).
- 작업 환경: Neon MCP로 Claude Code가 스키마 조회·SQL 직접 실행. 야간 스냅샷 = 파일 기반 도구 호환 사본.

## 10. 리스크 대응

| 리스크 | 대응 |
|---|---|
| Neon 콜드 스타트 (~0.5초) | 방문자 페이지 정적 서빙이라 체감 없음. 짧은 링크 첫 클릭만 미세 지연 |
| Neon 무료 티어 정책 변화 (Databricks 인수) | 야간 스냅샷으로 락인 없음 — 어떤 Postgres로든 복원 가능 |
| DB 장애·유실 | 야간 pg_dump + 복원 절차 문서화 + 리허설. 클릭은 fail-open |
| 클릭 봇·스팸 | 전부 기록 후 `clicks_human` 뷰로 필터. 필요 시 rate limit 추가 |
| 접속 정보 유출 | 환경변수로만. 깃 커밋 금지 (private 저장소 포함) |
| 클릭 로그 유출 | cho-ai-data는 private 고정. 공개 저장소에 로그 커밋 금지 |
| 구글시트 공유 설정 실수 | 전 템플릿 "뷰어+링크 공유" 일괄 점검 (0단계 체크) |
| 원본 시트 실수 수정 | 원본 전용 드라이브 폴더 분리, 코드는 깃허브에 존재 |
| 학교·개인정보 | 이 프로젝트의 모든 저장소·DB에 절대 금지 |
| URL 변경 압력 | 불변 원칙. 부득이하면 short_links 행 추가로 영구 리다이렉트 |
| YouTube API 실패 | upsert라 기존 행 안전. Actions 실패 알림 |
