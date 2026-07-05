# CLAUDE.md — cho-ai.com 프로젝트 불변 규칙

모든 세션이 지켜야 할 규칙. 상세 근거·스키마·로드맵은 [SPEC.md](SPEC.md), 결정 이력은 [REVIEW.md](REVIEW.md).

## 절대 규칙

1. **ID 불변·재사용 금지**: `videos.id`, `video_no`, `templates.slug`, `short_links.slug`, `books.isbn`은 한 번 부여되면 영원히 유지. 영상이 삭제·비공개돼도 행을 지우지 말고 `videos.status`만 변경. 결번은 비워둔다 — 번호 재사용은 과거에 뿌린 링크를 다른 영상으로 보내는 사고다.
2. **발행된 짧은 링크는 영원히 리다이렉트된다**. `short_links` 행 삭제 금지. 루트의 `숫자(+영문 소문자 1자)` 패턴은 짧은 링크 전용 예약.
3. **`videos` 테이블은 기계 전용**: 동기화 크론만 쓴다. 사람·에이전트가 직접 INSERT/UPDATE/DELETE 금지.
4. **태그는 통제 어휘만**: `tags` 테이블에 시딩된 것만 사용. 새 태그는 이유 한 줄 기록 후 시딩 절차로만. 콘텐츠당 업무 1~2 + 기술 0~3개.
5. **학교·개인정보 절대 금지**: 이 프로젝트의 어떤 저장소·DB에도 학교 관련 데이터, 학생·개인 식별 정보를 넣지 않는다.
6. **접속 정보 커밋 금지**: DB URL, API 키는 환경변수로만. private 저장소(cho-ai-data)에도 커밋 금지.
7. **스키마 변경은 Drizzle 마이그레이션으로만**: DB에 직접 DDL 금지. 파괴적 변경은 Neon 브랜치에서 리허설 후 적용.
8. **클릭 로그는 공개 금지**: `clicks`/`outbound_clicks` 데이터(스냅샷 포함)는 private `cho-ai-data`에만. 공개 저장소·공개 API에 노출하지 않는다.
9. **fail-open**: 클릭 기록 실패가 리다이렉트를 막는 코드를 작성하지 않는다.
10. **라이선스**: 코드 MIT, 템플릿 구조·문서·글 CC BY 4.0. 새 `.gs` 파일에는 저작자 고지 주석.

## 관례

- 리다이렉트는 302 (301 금지 — 클릭 집계가 캐시에 먹힌다).
- 클릭 집계는 `clicks` 원본이 아니라 `clicks_human` 뷰 기준.
- 슬러그·파일명은 kebab-case 소문자.
- 미정 사항은 [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) 확인 — 임의로 확정하지 않는다.
- **새 세션은 [NEXT.md](NEXT.md)에서 시작** — 잔여 마감·백로그·착수 순서. 구축 이력·함정은 [docs/BUILD-LOG.md](docs/BUILD-LOG.md).
