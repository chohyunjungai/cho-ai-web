---
name: template-registration
description: 새 템플릿(구글시트/문서)을 DB·깃허브에 등록하는 표준 절차. /new-template 커맨드 또는 "템플릿 등록해줘" 요청 시 사용.
---

<!-- 필요한 이유: 이 프로젝트의 가장 핵심적인 반복 절차. 순서·검증이 고정돼 있어 스킬화 실익이 가장 크다. -->

# 템플릿 등록 절차

## 필요한 입력 (없으면 먼저 요청)

- 구글시트/문서 URL (원본)
- 제목, 연결할 영상 (videoId 또는 video_no)
- 앱스스크립트 포함 여부 (→ requires_auth)

## 절차

1. **slug 결정**: kebab-case 소문자, 영어. 기존 templates와 중복 확인. 한 번 정하면 불변 — 사용자 확인 받기.
2. **사본 링크 변환**: 원본 URL의 `/edit...`를 `/copy`로 치환 → `copy_url`. 원본이 "뷰어 + 링크 공유" 상태인지 사용자에게 확인 (사본 만들기의 전제).
3. **설명 초안**: body_md가 없으면 content-writer 에이전트로 초안 생성 후 사용자 검수.
4. **INSERT** (트랜잭션 하나로):
   - `templates` (status는 검수 전이면 'draft')
   - `video_templates` 연결 (영상은 videos에 이미 있어야 함 — 없으면 /sync-videos 먼저)
   - `template_tags` — SPEC.md §4 통제 어휘만, 업무 1~2 + 기술 0~3개
5. **깃허브 (앱스스크립트 포함 시)**: cho-ai-templates/{slug}/ 폴더 생성 → clasp으로 .gs 원본 pull → 파일 상단 저작자 고지 주석 확인·추가 → `templates.github_path` 갱신 → 커밋.
5b. **미리보기 스크린샷**: 시트/문서의 대표 화면 캡처(1280×960) → 사이트 저장소 `/public/previews/{slug}.png` 커밋 → `templates.preview_path` 갱신. 스토어 카드의 상품 이미지이므로 누락 금지 — 없으면 소유자에게 캡처 요청.
6. **검증**: sync-verifier 에이전트로 등록 건 점검 (copy_url이 /copy로 끝나는지, 영상 연결·태그 규칙).
7. **발행**: 사용자 확인 후 status를 'published'로. template_versions에 첫 버전 행 추가.

## 금지

- videos 테이블 수정 금지.
- 통제 어휘에 없는 태그 사용 금지 — 새 태그가 필요하면 별도로 "이유 한 줄 + 시딩" 절차를 제안.
- 원본 시트를 수정하지 않는다 (공유 설정 확인 요청만).
