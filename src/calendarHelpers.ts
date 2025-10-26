// src/calendarHelpers.ts

import { type LogEntry } from "./storage";
import { colors } from "./ui/theme";

/**
 * 캘린더 화면에서 필요한 순수 데이터 처리 함수들을 정의합니다.
 * (예: 날짜별 그룹핑, 달력 마킹 데이터 등)
 */

// --- 타입 정의 ---
export type Entry = LogEntry;
export type Group = { day: string; items: Entry[] };

// react-native-calendars의 markedDates에 사용될 마킹 타입(필요 필드만)
export type Marked = {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
};

/**
 * 전체 로그를 날짜(day)별로 그룹화합니다.
 * 저장 포맷(키)은 ISO "YYYY-MM-DD"를 그대로 사용합니다.
 */
export function groupByDay(entries: Entry[]): Group[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    map.set(e.date, [ ...(map.get(e.date) ?? []), e ]);
  }
  // 날짜 문자열(YYYY-MM-DD)을 기준으로 내림차순 정렬
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, items]) => ({ day, items }));
}

/**
 * 달력에 점(marked)과 선택(selected) 표시를 하기 위한 데이터 객체를 생성합니다.
 * @param groups - groupByDay로 그룹화된 데이터
 * @param selected - 현재 선택된 날짜 문자열(YYYY-MM-DD)
 * @returns react-native-calendars의 markedDates용 객체
 */
export function makeMarkedDates(groups: Group[], selected: string) {
  const marks: Record<string, Marked> = {};

  // 기록이 있는 모든 날짜에 점 표시(테마 색상 사용)
  for (const g of groups) {
    marks[g.day] = { marked: true, dotColor: colors.brand };
  }

  // 선택된 날짜 하이라이트(테마 색상 사용)
  if (selected) {
    marks[selected] = {
      ...(marks[selected] || {}),
      selected: true,
      selectedColor: colors.brand,
    };
  }

  return marks;
}
