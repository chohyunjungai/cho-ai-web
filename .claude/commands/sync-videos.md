---
description: 영상 동기화를 수동 실행하고 무결성 검증 보고를 받는다 (GitHub Actions 야간 크론의 수동 트리거 버전)
---

<!-- 필요한 이유: 신규 영상 업로드 직후 크론을 기다리지 않고 즉시 동기화·검증하는 일이 반복된다. -->

영상 동기화를 실행하고 검증하라:

1. 동기화 스크립트 실행 (GitHub Actions workflow_dispatch 트리거 또는 로컬 스크립트 — 저장소의 실행 방법 문서 확인).
2. 완료 후 sync-verifier 에이전트로 무결성 검증 (행 수 증감, video_no 연속성·순서, synced_at).
3. 신규 영상이 있으면: 부여된 video_no와 짧은 링크(`cho-ai.com/{no}d`, `/{no}c`)를 표로 보고 — 설명란에 붙일 수 있는 형태로.
4. 실패 시 원인 보고만 하고 videos 테이블을 직접 고치려 하지 마라 (기계 전용 테이블).

$ARGUMENTS
