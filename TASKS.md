# TASKS.md — 0단계 실행 계획

기준: [SPEC.md](SPEC.md) §7 0단계. 각 작업에 선행 조건 / 소유자 입력 / 완료 판정.

## T0. ✅ 완료 — Shorts 포함 결정 (2026-07-05)

Shorts 포함으로 확정. 일반 영상과 동일하게 video_no를 소비하며, `videos.is_short`로 구분한다 (SPEC.md §2 반영 완료). T4 시딩 차단 해제.

## T1. ✅ 완료 (2026-07-05) — 저장소 3개 생성

`chohyunjungai` 계정(채널 동일 계정)에 생성·푸시 완료:
[cho-ai-web](https://github.com/chohyunjungai/cho-ai-web)(공개, 문서 체계 + .claude/ 이관) · [cho-ai-templates](https://github.com/chohyunjungai/cho-ai-templates)(공개, MIT+CC BY 4.0 LICENSE) · [cho-ai-data](https://github.com/chohyunjungai/cho-ai-data)(**private**, 스냅샷 워크플로 포함). **이후 문서의 원본은 cho-ai-web 저장소다.**

## T2. ✅ 완료 (2026-07-05) — Neon + Drizzle 마이그레이션

Neon(PG 18.4)에 마이그레이션 적용 완료 — 테이블 14개 + CHECK 7 + clicks_human 뷰, `\dt` 일치 확인.

## T3. ✅ 완료 (2026-07-05) — 태그 시딩

21개 시딩 (task 9 / tech 12). 최종 어휘는 T9 검증 결과 반영 후 확정.

## T4. ✅ 완료 (2026-07-05) — 영상 시딩·번호 확정

**videos 84행, video_no 1~84 영구 확정** (게시일 오름차순, Shorts 21편 포함, short_links 252행, verify-db 9항목 전체 통과). 소유자가 비공개 영상 정리 후 재시딩을 거쳐 확정함 — 이후 재시딩 금지 (truncate 스크립트는 RESEED_CONFIRM 가드).

<details><summary>원래 계획 (참고)</summary>

- ✅ `scripts/sync-videos.ts`: 업로드 재생목록 전체 수집 → upsert(기존 행의 video_no·status 불변) → 신규만 게시일 오름차순 연번 부여(트랜잭션) → short_links 3행 생성 → Shorts 판별(≤3분 + /shorts/ URL 프로브) → API에서 사라진 영상은 자동 변경 없이 경고만
- ⏳ 소유자 입력: ① **YouTube Data API 키** (Google Cloud 콘솔 → YouTube Data API v3 활성화 → API 키, OAuth 불필요) ② **채널 핸들(@...) 또는 UC 채널 ID**
- 남은 작업: 최초 시딩 실행 + sync-verifier 검증
- 완료 판정: videos ≥ 70행(Shorts 포함), video_no 1부터 연속·게시일 순서와 일치, Shorts 영상에 is_short=true, short_links = 영상 수 × 3, sync-verifier 통과

</details>

## T5. GitHub Actions 크론 2종 — 수동 실행 2종 성공 ✅, 이틀 연속 자동만 대기

- ✅ 시크릿·변수 등록 완료, sync-videos 수동 실행 성공, snapshot 수동 실행 성공(`snapshot 2026-07-05` 커밋: dump.sql + JSON 14개 — pg_dump 18 버전 불일치 2회 수정 거침)
- 남은 판정: cho-ai-data에 **이틀 연속 자동** 스냅샷 커밋 (2026-07-07 확인)

## T6. 템플릿 시딩

- ✅ 시딩 완료 (2026-07-05): 전수 조사(docs/template-inventory.md — 설명란·블로그 크롤·고정댓글·단축링크 4경로) → **templates 24개** (시트 15·문서 7·폼 1·파일 1, 실제 구글 파일 제목 기반, 참여용 폼 2건 오탐 제외) · video_templates 33행 · template_tags 70행(연결 영상 태그 상속). type CHECK를 ('sheet','doc','form','file')로 확장(마이그레이션 0002). verify-db 통과. 향후 자료는 template-registration 절차로 추가
- ⏳ 남은 소유자 확인: ① draft 2건 공유 설정 (automation-school-10-extra, comment-collector-code — 제목 조회가 실패해 링크 공유가 안 돼 있을 가능성) ② 목록에 빠진 자료·제목 교정 ③ 미리보기 스크린샷 (1280×960) ④ 실제 사본 만들기 1회 실측
- 완료 판정: published 템플릿 전부 copy_url이 /copy(파일 제외)·영상 연결 ✅ / 사본 만들기 1회 성공 확인 ⏳

## T7. cho-ai-templates + clasp

- 선행 조건: T6 (어떤 템플릿에 스크립트가 있는지 확정)
- 소유자 입력: clasp 로그인 (구글 계정 인증 — 터미널에서 직접), 원본 시트 접근 권한
- 작업: 앱스스크립트 포함 템플릿마다 폴더 + clasp pull → .gs 상단 저작자 고지 주석 → templates.github_path 갱신 → 커밋
- 완료 판정: 스크립트 보유 템플릿 전부 저장소에 .gs 원본 존재, 고지 주석 포함

## T8. ✅ 완료 (2026-07-06) — 복원 리허설

최신 스냅샷 → 같은 프로젝트의 별도 DB(restore_rehearsal)에 복원 → **14개 테이블 행 수 전부 일치** → 정리. 브랜치 대신 별도 DB로 수행 (검증 목적 동일 — Neon 브랜치 실습은 향후 스키마 변경 리허설에서). 절차 문서: cho-ai-web/docs/restore.md.
부수 성과: pooler 경유 pg_dump가 pgbouncer 백엔드에 search_path='' 세션을 남겨 간헐 오류를 일으키는 문제 규명 → snapshot 워크플로를 direct 엔드포인트로 전환.

## T9. ✅ 완료 (2026-07-05) — 태그 실데이터 검증·어휘 확정

영상 84편 전수 매핑(docs/tag-mapping.md) → 소유자 확정: **task 10개** (ai-tools·automation·school 추가, grading·classroom 제거) + tech 12개 = 22개. video_tags 221행 시딩, verify-db 통과 (일상 쇼츠 5편은 업무 태그 0개 허용). SPEC §4 확정본 갱신.

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
