# 태그 실데이터 검증 — 영상 84개 → 태그 매핑 (T9)

작성: 2026-07-05 · 상태: **초안 (소유자 확정 대기)** · 근거: SPEC.md §4 검증 규칙 (미분류 3개↑ → 태그 추가, 0~1개 태그 → 제거)

## 검증 결과 요약

| 태그 (task) | 영상 수 | 판정 |
|---|---|---|
| 유튜브 운영 youtube | 19 | ✅ 유지 (최대 그룹 — 사용자층 ①과 일치) |
| **AI 도구·활용 ai-tools** | 16 | 🆕 **추가 제안** — 챗GPT·제미나이·CES 등 AI 도구 리뷰·팁·소식. 초안에 없어 전부 미분류였음 |
| 자료취합·문서 admin | 11 | ✅ 유지 |
| 설문·폼 survey | 10 | ✅ 유지 |
| **자동화 배우기 learn-automation** | 9 | 🆕 **추가 제안** — AI자동화학교 기초·바이브코딩·권한·에러수정 등 "배우는 법" 시리즈 |
| 문자·알림 sms-alert | 6 | ✅ 유지 |
| AI 학습 ai-study | 3 | ✅ 유지 |
| 데이터 분석 data | 3 | ⚠️ 유지하되 관찰 (경계선) |
| 일정·시간표 schedule | 2 | ⚠️ 유지하되 관찰 (경계선) |
| 학급·학사 classroom | 2 | 🔄 **"학교·교사 school"로 개명 제안** — 현 콘텐츠가 교사 행정 2편뿐이라 넓은 이름이 맞음 |
| 성적·평가 grading | **0** | ❌ **제거 제안** — 해당 영상 없음 (규칙: 0~1개 태그 제거) |
| (미분류 — 태그 0 허용) | 5 | 일상·기타 쇼츠 (#4, #7, #44, #45, #52) — 잡탕 태그를 만들지 않고 태그 0 허용 |

제안 반영 시 주 필터 칩 = 10개 (한도 8~10 상한선).

## 전수 매핑 (task / tech)

`?` = 제목만으로 추정 — 소유자 교정 환영. Shorts는 (S).

| # | 제목 요약 | task | tech |
|---|---|---|---|
| 1 | 카톡으로 챗GPT | ai-tools | ai |
| 2 | 스마트폰 챗GPT-4 비밀 글자 | ai-tools | ai |
| 3 | 감마AI PPT | ai-tools | ai |
| 4 | (S) 아이폰 모닝콜 유튜브뮤직 | — | — |
| 5 | (S) 폰으로 PPT 1분 (감마) | ai-tools | ai |
| 6 | (S) AI 애니메이션 | ai-tools | ai |
| 7 | (S) 아이폰 알람 | — | — |
| 8 | (S) 구글설문지 일기 자동화 | survey | forms, docs |
| 9 | 설문 응답→구글문서 자동 변환 | survey, admin | forms, docs, apps-script |
| 10 | (S) 공짠데 왜 안써요? | ai-tools? | ai? |
| 11 | (S) 유튜브 참고영상 모으기 | youtube | apps-script? |
| 12 | 떡상 영상 조사 자동화 | youtube | apps-script, external-api |
| 13 | 유튜브 API 키 발급 | youtube | external-api |
| 14 | 유튜브영상수집시트 | youtube | apps-script, ai |
| 15 | AI 설문지 자동생성 (웨비나) | survey | ai, forms, apps-script |
| 16 | 설문 자동 생성+이메일 발송 | survey | ai, forms, gmail |
| 17 | 유튜브 댓글 수집 (웨비나) | youtube | apps-script, external-api |
| 18 | 유튜브 비밀시트 6종 | youtube | apps-script |
| 19 | 해외영상 3초 수집 시트 | youtube | apps-script, external-api |
| 20 | 솔라피 API 키 발급 | sms-alert | external-api |
| 21 | 구글시트로 문자보내기 | sms-alert | apps-script, external-api |
| 22 | 유튜브 채널 분석 시트 | youtube, data | apps-script, external-api |
| 23 | 쇼츠 수집 시트 | youtube | apps-script, external-api |
| 24 | 고객 이메일→구글시트 | admin | gmail, apps-script |
| 25 | (S) 챗GPT Pro 구경 | ai-tools | ai |
| 26 | (S) CES 중국차 | ai-tools | — |
| 27 | 교사 행정업무 자동화 | school, admin | apps-script |
| 28 | 유튜브채널분석시트 (1000개 채널) | youtube, data | apps-script, external-api |
| 29 | (S) 네이버부동산 구글시트 | data | apps-script, external-api |
| 30 | 챗GPT 프로 재구독 (o1) | ai-tools | ai |
| 31 | 챗GPT 오퍼레이터 | ai-tools | ai |
| 32 | 슬랙 가입·웹훅 URL | sms-alert | external-api |
| 33 | 구글설문지 실시간 알림 | sms-alert, survey | forms, trigger |
| 34 | 케임브리지 의대생 공부법 시트 | ai-study | formulas |
| 35 | [학교01] 문서·시트·폼·캘린더 자동화 | learn-automation, schedule | apps-script, calendar, forms |
| 36 | [학교02] 권한 승인 | learn-automation | apps-script |
| 37 | 플래시카드 앱 | ai-study | apps-script, web-app |
| 38 | AI 과외선생님 (출제·채점) | ai-study | ai |
| 39 | (S) AI 녹음기 | ai-tools | ai |
| 40 | 제미나이 API 키 | ai-tools | ai, external-api |
| 41 | [폼1] 구글설문지 자동생성 3분 | survey | apps-script, forms |
| 42 | [폼2] 제미나이 연동 폼 자동생성 | survey | ai, forms, apps-script |
| 43 | [폼3] 클릭 한 번에 폼 수십 개 | survey | apps-script, forms |
| 44 | (S) 귀찮아서 세계최초로 | —? | ? |
| 45 | (S) 깜빡 잊는 나를 위해 | —? | ? |
| 46 | (S) 0원으로 유튜브 | youtube | ? |
| 47 | 나노바나나 썸네일 10개 자동 | youtube, ai-tools | ai |
| 48 | AI 키워드 (윤석빈 교수) | ai-tools | ai |
| 49 | (S) 유튜브 API 키 | youtube | external-api |
| 50 | [2026] 유튜브 API 키 발급 | youtube | external-api |
| 51 | CES 2026 총정리 | ai-tools | — |
| 52 | (S) 우연한 만남 | — | — |
| 53–55 | (S) CES 후기 3편 | ai-tools | — |
| 56 | [학교03] 바이브코딩 에러 고치기 | learn-automation | apps-script, ai |
| 57 | [학교04] 커스텀 메뉴·사이드바 UI | learn-automation | apps-script |
| 58 | [학교05] 트리거 24시간 자동화 | learn-automation | apps-script, trigger |
| 59 | [학교06] 배치 처리 | learn-automation | apps-script, ai |
| 60 | [학교07] API 키 보안 | learn-automation | apps-script |
| 61 | [학교08] 드라이브 파일 자동 정리 | admin | apps-script, ai |
| 62 | [학교09] 자동 서식 | admin | apps-script |
| 63 | [학교10] 자동화 예찬 (유료코드) | learn-automation | apps-script, ai |
| 64 | [학교11] 견적서 자동화 | admin | apps-script, ai |
| 65 | [학교12] 신청서 웹앱+서명 | survey | apps-script, web-app, forms |
| 66 | [학교13] 이수증·상장 자동 생성 | school, admin | apps-script, docs |
| 67 | [학교14] 시트+캘린더 연동 | schedule | apps-script, calendar |
| 68 | [학교15] 단체 맞춤 메일 | admin | apps-script, gmail |
| 69 | [학교16] PDF 첨부 맞춤 메일 | admin | apps-script, gmail, docs |
| 70 | [학교17] 기념일 자동 메일 | admin | apps-script, gmail, trigger |
| 71 | [학교18] AI 설문지 자동 생성 | survey | apps-script, forms, ai |
| 72 | [학교19] 폼 제출→자동 문자 | sms-alert, survey | apps-script, forms, external-api |
| 73 | [학교20] 예약 문자 (솔라피) | sms-alert | apps-script, external-api, trigger |
| 74 | [학교21] 제미나이 AI 문서 생성기 | admin | apps-script, ai, docs |
| 75 | [학교22] 데이터 보고 이메일 자동화 | admin, data | apps-script, gmail, trigger |
| 76 | [학교23] 부동산 실거래가 대시보드 | data | apps-script, external-api |
| 77 | (S) AI 잘 하고 싶으신 분? | ai-tools? | ai? |
| 78 | 컴맹 남편 시트 자동화 EP.01 | learn-automation | apps-script, ai |
| 79 | (S) 댓글 쓰기 싫어서 | youtube | apps-script? |
| 80 | 슈퍼유튜브시트 노트북LM | youtube, ai-tools | apps-script, ai |
| 81 | [알라딘 라이브] 유튜브 API 트렌드 (중계본) | youtube | apps-script, external-api |
| 82 | [알라딘] 유튜브 API 트렌드 | youtube | apps-script, external-api |
| 83 | 유튜브 댓글 원클릭 수집 | youtube | apps-script, external-api |
| 84 | [교보문고 라이브] 댓글 원클릭 수집 | youtube | apps-script, external-api |

## 확정 후 처리

1. 승인된 어휘 변경을 `tags` 테이블에 반영 (추가 INSERT / 제거 DELETE / 개명 UPDATE)
2. 이 표대로 `video_tags` 시딩 (스크립트)
3. SPEC.md §4를 확정본으로 갱신, 이 문서 상태를 "확정"으로 변경
