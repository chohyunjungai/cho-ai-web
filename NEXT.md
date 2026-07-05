# NEXT.md — 다음 세션 길잡이

> 새 세션은 여기서 시작한다. 현재 상태는 [docs/BUILD-LOG.md](docs/BUILD-LOG.md), 명세는 [SPEC.md](SPEC.md)·[DESIGN.md](DESIGN.md).
> 갱신 규칙: 완료 항목은 지우지 말고 ✅ + 날짜, 새 요구는 백로그에 추가.

## 세션 시작 체크리스트

```bash
cd /Users/hj/Documents/코딩/cho-ai-web
npx tsx scripts/verify-db.ts                      # 무결성 11항목
gh run list -R chohyunjungai/cho-ai-web --limit 2  # 동기화 크론
gh run list -R chohyunjungai/cho-ai-data --limit 2 # 스냅샷 크론
curl -sI https://cho-ai.com/18d | head -2          # 짧은 링크 생존
```

## A. 잔여 마감 (작음, 먼저 치울 것)

| # | 항목 | 비고 |
|---|---|---|
| A1 | T5 이틀 연속 자동 스냅샷 확인 | 2026-07-07 이후 `gh api repos/chohyunjungai/cho-ai-data/commits` 로 확인 → 0단계 공식 종료 |
| A2 | 설명란 https:// 링크 게시 확인 | 소유자 게시 후 1단계 판정 6/6 |
| A3 | fail-open 프리뷰 실측 | Vercel 프리뷰 배포에서 DATABASE_URL 제거 → /18d가 홈으로 302하는지 |
| A4 | T7 나머지 시트 14개 clasp | 소유자가 스크립트 ID 제공 시 — 절차는 king-youtube-sheet 커밋과 동일 (`clasp --user templates clone-script <ID>` → 폴더 README 고지 → github_path 갱신) |
| A5 | 슬랙 가이드 미리보기 1개 | 소유자 수동 캡처 → public/previews/slack-webhook-guide.png 교체 |
| A6 | creator@cho-ai.com 수신 확인 | 구글 워크스페이스 별칭 존재 여부 |

## B. 신규 백로그 (2026-07-06 소유자 요구 — 각각 설계 후 착수)

### B1. 기존 영상 설명·고정댓글 링크 일괄 교체 자동화 ★우선

- **목표**: 84편의 설명란·고정댓글에 있는 옛 링크(blogspot, link.cho-ai.com, 직링크)를 `https://cho-ai.com/{no}d`·`{no}c`로 교체
- **선행 조건**: YouTube **OAuth 쓰기 권한** (읽기 API 키와 별개 — Google Cloud 콘솔에서 OAuth 클라이언트 생성 → 채널 계정 동의. `videos.update`는 snippet 전체 재전송 방식이라 주의)
- **설계 스케치**: ① 현황 스캔(설명·고정댓글에서 교체 대상 링크 추출 — survey-links.ts 재활용) → ② **dry-run 리포트**(영상별 before/after diff 표) → ③ 소유자 승인 → ④ 실행 전 **원본 설명 전문을 cho-ai-data에 백업** → ⑤ 배치 실행(rate limit 고려) → ⑥ 검증 리포트
- 고정댓글 수정: `comments.update` (본인 댓글만 가능 — 소유자 댓글이므로 OK)
- ⚠️ 되돌릴 수 없는 대량 수정 — dry-run·백업 없이 실행 금지

### B2. 새 영상 온보딩 템플릿화 ★우선

- **목표**: 새 영상 업로드 → 짧은 링크 생성 → 설명란·고정댓글 문구까지 원클릭 수준으로
- **설계 스케치**: `/new-video` 커맨드(.claude/commands) — ① `/sync-videos`로 번호 부여 ② 템플릿 연결(template-registration 절차 or 기존 템플릿 선택) ③ **복붙 블록 자동 생성**: 설명란용(`https://cho-ai.com/{no}d` + 템플릿 안내 문구)·고정댓글용(`{no}c`) ④ (B1의 OAuth 확보 후) API로 직접 삽입까지 자동화
- 지금도 가능한 반자동: 동기화 로그가 "신규 #85 → cho-ai.com/85d"를 출력함

### B3. 깃허브 자동 업로드 워크플로우

- **목표(소유자 표현)**: "마음에 드는 내용으로 자동 업로드 가능한 워크플로우"
- **해석 후보** (착수 전 소유자에게 확인): (a) 템플릿 앱스스크립트 자동 백업 — Actions가 주기적으로 clasp pull → 변경 시 cho-ai-templates 커밋 (선행: T7 스크립트 ID 전체 + clasp 토큰을 Actions 시크릿으로) (b) 블로그 글 자동 발행 파이프라인 (c) 그 외
- clasp 인증을 CI에 올릴 때는 `~/.clasprc.json`을 시크릿으로 — 토큰 만료 주기 확인 필요

### B4. 필터/네비 개편 — "유튜버용·교사용" 우선 (DESIGN 개정 필요)

- **문제**: 현재 태그 칩(전체·학교교사·자료취합문서…)이 소유자 마음에 안 듦. 핵심 사용자층(유튜버, 교사)이 자기 것을 더 빨리 찾아야 함
- **설계 방향 후보** (설계 세션에서 결정):
  - (a) **대상(audience) 축 신설**: tags에 category='audience'(유튜버·교사·학생·직장인) 추가, 칩 1열 = 대상, 2열 = 업무 — 파셋 2단
  - (b) **허브 페이지**: /for/youtuber, /for/teacher — 대상별 큐레이션(시리즈+템플릿+글)
  - (c) 홈 상단 세그먼트 토글(유튜버|교사|전체) + localStorage 기억
- 원칙 유지: 통제 어휘·파셋, 유튜브 칩 문법. **실데이터로 결정** — 어느 안이든 84편 매핑 시뮬레이션 먼저

### B5. 영상 시스템 확장 — 시리즈 + 노출 규칙 개정 (SPEC 개정 필요)

- **문제**: 지금은 자료 있는 영상만 노출(SPEC §5-7). 그런데 시리즈물(AI자동화학교 23강, AI구글폼자동화 3탄, 유튜브AI비서고용하기)·유튜버용 강의 영상은 자료가 없어도 "유튜브에서보다 쉽게 필요한 영상을 파악"하게 보여줘야 함
- **설계 스케치**: `series(slug, title, description)` + `video_series(video_id, series_slug, position)` 테이블 → 시리즈 페이지(/series/{slug} — 순서대로 정주행 UI) → 노출 규칙 개정: "자료 연결 **또는 시리즈 소속** 영상 노출" → 영상 상세에 "이 시리즈의 다음 강" 내비
- 실존 시리즈 3개는 제목 패턴(`[AI자동화학교NN강]` 등)으로 자동 시딩 가능

### B6. 글 자료(블로그) — 2단계 본편

- MDX 블로그 + `/blog/{slug}.md` 원문 + RSS + JSON-LD (SPEC §7 2단계 그대로)
- 기존 blogspot 글 15개 이관 여부 = OPEN-QUESTIONS Q11
- 소유자: "글로 쓰는 자료 계속 업로드 예정" — 템플릿 없는 지식 콘텐츠의 집

### B7. LLM 친화 강화

- `/llms.txt` + `/llms-full.txt` (사이트 구조·전 콘텐츠 인덱스), robots.txt AI 크롤러 허용, sitemap.xml, 공개 읽기 `/api/templates`·`/api/videos`(캐시 헤더)
- 콘텐츠 원칙: 모든 글에 첫 줄 요약, 명확한 헤딩 계층, .md 원문 병행 서빙 (SPEC §6)

## 권장 착수 순서

1. **A1~A3** (마감 확인, 10분) → 2. **B4+B5 설계 세션** (필터·시리즈는 한 몸 — DESIGN/SPEC 개정 후 구현) → 3. **B1 OAuth 준비 + dry-run** (링크 교체는 B5로 노출이 넓어진 뒤가 효율적) → 4. **B2** (B1의 OAuth 재사용) → 5. **B6·B7** (블로그+LLM) → 6. **B3** (T7 완료 후)
