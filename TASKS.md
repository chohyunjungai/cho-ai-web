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
