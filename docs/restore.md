# DB 복원 절차 (T8 리허설로 검증됨 — 2026-07-06)

cho-ai-data의 야간 스냅샷(dumps/dump.sql)은 어떤 PostgreSQL로든 복원 가능하다 — Neon 락인 없음.
리허설 결과: 14개 테이블 행 수 전부 일치, clicks_human 뷰 포함 복원 확인.

## 절차

```bash
# 0) 항상 direct(비-pooler) 엔드포인트를 쓴다 — 호스트명에서 '-pooler' 제거
#    (pooler 경유 복원·덤프는 search_path='' 세션이 pgbouncer 백엔드에 남아
#     다른 쿼리를 간헐적으로 깨뜨린다: "relation ... does not exist")
DIRECT="$(printf '%s' "$DATABASE_URL" | sed 's/-pooler//')"

# 1) 복원 대상 준비 — 새 DB(같은 프로젝트) 또는 새 Neon 브랜치/다른 Postgres
psql "$DIRECT" -c "CREATE DATABASE restore_target"

# 2) 최신 스냅샷 확보
git -C cho-ai-data pull

# 3) 복원 (psql 메이저 버전 ≥ 서버 버전 권장, 현재 서버 PG 18)
RESTORE_URL="$(printf '%s' "$DIRECT" | sed 's|/neondb?|/restore_target?|')"
psql "$RESTORE_URL" -v ON_ERROR_STOP=1 -f cho-ai-data/dumps/dump.sql

# 4) 검증 — 행 수 대조 (스키마 명시 필수)
for t in videos templates short_links tags; do
  psql "$RESTORE_URL" -Atc "SELECT '$t', count(*) FROM public.$t";
done

# 5) 리허설이었다면 정리
psql "$DIRECT" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='restore_target'" \
              -c "DROP DATABASE restore_target"
```

## 주의

- **URL 치환에 bash `${var/…}` 패턴을 쓰지 말 것** — URL의 `?`가 글롭으로 해석돼 문자열이 깨진다. `sed` 사용.
- 실 장애 복구 시에는 새 DB가 아니라 새 Neon 프로젝트(또는 브랜치)에 복원한 뒤 DATABASE_URL을 교체한다.
- 리허설 주기: 연 1회 이상 + 대형 스키마 변경 후.
