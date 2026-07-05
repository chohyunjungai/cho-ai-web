# TASKS.md — 0단계 실행 계획

기준: [SPEC.md](SPEC.md) §7 0단계. 각 작업에 선행 조건 / 소유자 입력 / 완료 판정.

## T0. ✅ 완료 — Shorts 포함 결정 (2026-07-05)

Shorts 포함으로 확정. 일반 영상과 동일하게 video_no를 소비하며, `videos.is_short`로 구분한다 (SPEC.md §2 반영 완료). T4 시딩 차단 해제.

## T1. 저장소 3개 생성

- 선행 조건: 없음
- 소유자 입력: 개인(비학교) 깃허브 계정명 확인
- 작업: `cho-ai-web`(공개) · `cho-ai-templates`(공개) · `cho-ai-data`(**private**) 생성. cho-ai-web에 이 문서 체계(SPEC/CLAUDE/TASKS/REVIEW/OPEN-QUESTIONS + .claude/) 이관. 템플릿 저장소에 LICENSE(MIT + CC BY 4.0 이중 고지) 추가.
- 완료 판정: 3개 저장소 존재, cho-ai-data가 private, cho-ai-web 첫 커밋에 문서 체계 포함

## T2. Neon 프로젝트 + Drizzle 마이그레이션

- 선행 조건: T1 (마이그레이션 파일을 커밋할 곳)
- 소유자 입력: Neon 가입 계정 (구글 로그인이면 어떤 계정인지). 생성된 DATABASE_URL은 환경변수로만 — 커밋 금지
- 작업: Neon 프로젝트 생성 → Next.js 프로젝트 스캐폴드 → SPEC.md §2 스키마 전체를 Drizzle로 작성 → 마이그레이션 생성·적용 (clicks_human 뷰, 인덱스 포함)
- 완료 판정: Neon main에서 `\dt` 결과가 §2와 일치, 마이그레이션 파일이 cho-ai-web에 커밋됨

## T3. 태그 시딩 (초안)

- 선행 조건: T2
- 소유자 입력: 없음 (SPEC.md §4 초안 사용)
- 작업: 태그 20개(task 8 + tech 12) 시딩 스크립트 작성·실행
- 완료 판정: `SELECT count(*) FROM tags` = 20, category 분포 8/12

## T4. 영상 동기화 + video_no 부여

- 선행 조건: T2
- 소유자 입력: ① YouTube Data API 키 (Google Cloud 콘솔에서 발급 — 읽기용, OAuth 불필요) ② 채널 ID
- 작업: 동기화 스크립트(YouTube API → videos upsert, **Shorts 포함** + `is_short` 판별·저장) → 최초 시딩 실행 → 게시일 오름차순으로 video_no 부여(가장 오래된 영상 = 1, Shorts도 동일 연번) → short_links에 영상별 `{no}`/`{no}d`/`{no}c` 행 생성
- 완료 판정: videos ≥ 70행(Shorts 포함), video_no 1부터 연속·게시일 순서와 일치, Shorts 영상에 is_short=true, short_links = 영상 수 × 3, sync-verifier 통과

## T5. GitHub Actions 크론 2종

- 선행 조건: T4 (동기화), T2 (스냅샷)
- 소유자 입력: 저장소 시크릿 등록 (DATABASE_URL, YOUTUBE_API_KEY — 값 전달은 화면 공유·파일 아닌 GitHub Secrets 직접 입력 권장)
- 작업: ① 매일 영상 동기화 워크플로 (workflow_dispatch 수동 트리거 포함) ② 야간 pg_dump + 핵심 테이블 JSON/CSV → cho-ai-data 커밋 워크플로
- 완료 판정: 두 워크플로 각 1회 수동 실행 성공 + cho-ai-data에 이틀 연속 자동 스냅샷 커밋

## T6. 템플릿 시딩

- 선행 조건: T4 (영상이 있어야 연결 가능)
- 소유자 입력: **템플릿 정리 시트 링크** (필수 항목: 영상 URL/videoId, 템플릿 이름, 템플릿 URL / 권장: 유형, 앱스스크립트 여부) + **템플릿별 미리보기 스크린샷** (스토어 카드용, 없으면 시딩 때 시트 열어 일괄 캡처하는 절차로 제작 — 규격 1280×960)
- 작업: 시트 → 변환 스크립트 → templates·video_templates 일괄 INSERT (copy_url 자동 변환 포함). 누락 설명은 content-writer 초안 → 소유자 검수. 전 템플릿 "뷰어+링크 공유" 설정 일괄 점검(소유자가 확인).
- 완료 판정: published 템플릿 전부 copy_url이 /copy로 끝나고 영상과 연결됨, 실제 사본 만들기 1회 성공 확인

## T7. cho-ai-templates + clasp

- 선행 조건: T6 (어떤 템플릿에 스크립트가 있는지 확정)
- 소유자 입력: clasp 로그인 (구글 계정 인증 — 터미널에서 직접), 원본 시트 접근 권한
- 작업: 앱스스크립트 포함 템플릿마다 폴더 + clasp pull → .gs 상단 저작자 고지 주석 → templates.github_path 갱신 → 커밋
- 완료 판정: 스크립트 보유 템플릿 전부 저장소에 .gs 원본 존재, 고지 주석 포함

## T8. 복원 리허설

- 선행 조건: T5 (스냅샷이 존재해야 함)
- 소유자 입력: 없음
- 작업: 최신 스냅샷 → 새 Neon 브랜치에 복원 → 행 수 대조 → 절차를 cho-ai-web 문서로 기록 → 브랜치 삭제
- 완료 판정: 복원된 브랜치의 테이블별 행 수가 원본과 일치, 복원 절차 문서 커밋됨

## T9. 태그 실데이터 검증 → 어휘 확정

- 선행 조건: T4 (영상 70개 제목이 DB에 있어야 함)
- 소유자 입력: 매핑 표 검토·확정 판단
- 작업: 70개 제목 → 태그 초안 매핑 표 생성 → 미분류 3개 이상이면 태그 추가 제안, 0~1개 태그는 제거 제안 → 소유자 확정 → tags 갱신 + video_tags 시딩
- 완료 판정: 전 영상에 업무 태그 1개 이상, 소유자가 어휘 확정을 명시, SPEC.md §4가 확정본으로 갱신됨

---

## 소유자 입력 총정리 (준비물 체크리스트)

| 입력 | 필요한 작업 | 성격 |
|---|---|---|
| ~~Shorts 포함 여부 결정~~ | T0 | ✅ 완료 — 포함 (2026-07-05) |
| 깃허브 계정명 확인 | T1 | 확인 |
| Neon 가입 | T2 | 계정 |
| YouTube API 키 + 채널 ID | T4 | 발급물 |
| GitHub Secrets 등록 | T5 | 계정 작업 |
| 템플릿 정리 시트 링크 | T6 | 자료 |
| clasp 구글 인증 | T7 | 계정 작업 |
| 태그 매핑 표 확정 | T9 | 결정 |
