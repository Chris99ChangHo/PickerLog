# AGENTS Guide (PickerLog)

## Code Style & Conventions
- TypeScript strict. ESLint + Prettier 준수.
- 날짜/시간:
  - 저장 포맷: ISO `"YYYY-MM-DD"` (UTC 기준) — 데이터 키와 로직은 항상 ISO.
  - 표시 포맷: en-AU 로케일, 기본 `"D/MM/YYYY"`.
  - dayjs 사용, `dayjs.locale('en-au')`.
- 구조:
  - `app/(tabs)/*` = 화면 라우트
  - `src/ui/*` = UI 컴포넌트/테마
  - `src/domain.ts` = 비즈니스 로직 (급여계산 등)
  - `src/storage.ts` = 영속/로컬스토리지 IO
  - `src/calendarHelpers.ts` = 달력 표기/그룹핑
- 커밋 규칙: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`…)
- 성능 목표: 목록 필터 O(N), 계산/그룹핑 O(N log N) 이내 유지. 불필요 리렌더 억제(useMemo/useCallback).

## Minimum Quality Gate
- `npm run typecheck` 통과
- `npm run lint` 통과
- (있다면) `npm test` 통과

## Task Template (작업 지시 템플릿)
**Title**: 한 줄 요약 (예: "Stats 탭: 주간 합계 카드 추가")
**Goal**: 어떤 사용자 가치를 주는가? (예: 하루/주 단위 수입 가시화)
**Scope**:
- 포함: 구현 항목 나열 (컴포넌트, 상태, API 등)
- 제외(Out of Scope): 이번 작업에서 다루지 않는 것
**Acceptance Criteria**:
- [ ] 특정 화면에서 특정 요소가 렌더링
- [ ] 입력 X일 때 Y 계산값이 Z로 표시
- [ ] 빈 데이터 시 빈 상태 문구 노출
**Perf/UX**: 리렌더 수, 스켈레톤/로딩, 접근성(폰트/색 대비)
**Tests**(선택): 단위 테스트 또는 수동 체크 절차 3줄
**Telemetry**(선택): 추후 이벤트/메트릭 포인트
**Notes**: 의존성/주의사항

## Example Split (예시 태스크 쪼개기)
1) feat(stats-ui): "주간 합계 카드" 컴포넌트 추가
2) feat(stats-calc): `domain.ts`에 주간 합계 계산 함수 추가 + 테스트 5개
3) refactor(calendar): `groupByDay`를 Map 캐시 적용 (대량 데이터 대비)
4) chore(ci): CI에 `typecheck`, `lint`만 유지 (배포 전 간소화)
