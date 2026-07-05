// 태그 시딩 — SPEC.md §4의 통제 어휘 초안 (T9 실데이터 검증 후 최종 확정).
// upsert(slug 기준)라 재실행 안전. 태그 추가는 "이유 한 줄 기록 후 시딩" 절차로만.
import { db, sql } from '../src/db/client';
import { tags } from '../src/db/schema';

// 2026-07-05 실데이터 검증(84편) 후 확정: ai-tools·automation·school 추가, grading·classroom 제거
const TASK = [
  ['유튜브 운영', 'youtube'],
  ['AI 도구·활용', 'ai-tools'],
  ['업무자동화', 'automation'],
  ['자료취합·문서', 'admin'],
  ['설문·폼', 'survey'],
  ['문자·알림', 'sms-alert'],
  ['AI 학습', 'ai-study'],
  ['데이터 분석', 'data'],
  ['일정·시간표', 'schedule'],
  ['학교·교사', 'school'],
] as const;

const TECH = [
  ['앱스스크립트', 'apps-script'],
  ['트리거·자동실행', 'trigger'],
  ['시트함수', 'formulas'],
  ['QUERY', 'query'],
  ['정규식', 'regex'],
  ['웹앱', 'web-app'],
  ['구글폼 연동', 'forms'],
  ['Gmail 연동', 'gmail'],
  ['캘린더 연동', 'calendar'],
  ['외부 API', 'external-api'],
  ['구글문서', 'docs'],
  ['AI 활용', 'ai'],
] as const;

const rows = [
  ...TASK.map(([name, slug]) => ({ name, slug, category: 'task' as const })),
  ...TECH.map(([name, slug]) => ({ name, slug, category: 'tech' as const })),
];

await db.insert(tags).values(rows).onConflictDoNothing({ target: tags.slug });
const count = await db.$count(tags);
console.log(`tags 시딩 완료 — 현재 ${count}개 (task ${TASK.length} + tech ${TECH.length} 기대)`);
await sql.end();
