# cho-ai.com

유튜브 채널 **조현정의AI실험실**의 영상·템플릿(구글시트/문서) 연결 배포 사이트.
구글시트+앱스스크립트로 반복 작업을 자동화하려는 모든 사람을 위한 무료 템플릿 스토어입니다.

- 마스터 명세: [SPEC.md](SPEC.md) · 디자인: [DESIGN.md](DESIGN.md) · 불변 규칙: [CLAUDE.md](CLAUDE.md)
- 템플릿 원본: [cho-ai-templates](https://github.com/chohyunjungai/cho-ai-templates)

## 스택

Next.js (1단계 예정) · Neon PostgreSQL · Drizzle ORM · Vercel · GitHub Actions (동기화·백업)

## 개발

```bash
npm install
cp .env.example .env.local   # DATABASE_URL 등 채우기
npm run db:migrate           # 스키마 적용
npm run seed:tags            # 태그 시딩
npm run sync:videos          # 영상 동기화 (YOUTUBE_API_KEY, YT_CHANNEL 필요)
```

## 라이선스

코드 MIT · 템플릿 구조/문서/글 CC BY 4.0 — 출처 `cho-ai.com` 표기.
