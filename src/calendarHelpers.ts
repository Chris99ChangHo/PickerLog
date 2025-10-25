// src/calendarHelpers.ts
import { type LogEntry } from "./storage";
import { colors } from "./ui/theme";

/**
 * 이 파일은 캘린더 화면에서 필요한 순수 데이터 처리 함수들을 정의합니다.
 * (예: 날짜별로 데이터 그룹핑, 달력에 표시할 데이터 생성 등)
 */

// --- 타입 정의 ---
export type Entry = LogEntry;
export type Group = { day: string; items: Entry[] };


// --- 헬퍼 함수 ---

/**
 * 전체 로그 배열을 받아서 날짜(day)별로 그룹화합니다.
 * @param entries - 전체 LogEntry 배열
 * @returns 날짜별로 그룹화된 배열 (예: [{ day: '2025-10-14', items: [...] }, ...])
 */
export function groupByDay(entries: Entry[]): Group[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    map.set(e.date, [...(map.get(e.date) ?? []), e]);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, items]) => ({ day, items }));
}

/**
 * 달력에 점(marked)과 선택(selected) 표시를 하기 위한 데이터 객체를 생성합니다.
 * @param groups - groupByDay 함수로 그룹화된 데이터
 * @param selected - 현재 사용자가 선택한 날짜 문자열 (YYYY-MM-DD)
 * @returns react-native-calendars 라이브러리가 사용하는 형식의 객체
 */
export function makeMarkedDates(groups: Group[], selected: string) {
  const marks: Record<string, any> = {};
  // 기록이 있는 모든 날짜에 녹색 점을 표시합니다.
  for (const g of groups) {
    // ✅ 디자인 테마: 하드코딩된 색상 대신 테마 색상을 사용합니다.
    marks[g.day] = { marked: true, dotColor: colors.brand };
  }
  // 사용자가 선택한 날짜는 선택됨(selected)으로 표시합니다.
  if (selected) {
    // ✅ 디자인 테마: 하드코딩된 색상 대신 테마 색상을 사용합니다.
    marks[selected] = { ...(marks[selected] || {}), selected: true, selectedColor: colors.brand };
  }
  return marks;
}