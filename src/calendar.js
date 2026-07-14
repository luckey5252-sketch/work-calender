// 달력 날짜 계산을 모은 순수 함수 모듈 (date-fns 기반, DOM/상태 의존 없음)

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  addDays,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';

// 주 시작은 월요일(업무용). date-fns weekStartsOn: 1.
const WEEK_OPTS = { weekStartsOn: 1 };

// 월 보기 그리드 — 해당 월을 감싸는 주 단위 날짜 배열(보통 35~42칸).
export function monthGrid(date) {
  const first = startOfWeek(startOfMonth(date), WEEK_OPTS);
  const last = endOfWeek(endOfMonth(date), WEEK_OPTS);
  return eachDayOfInterval({ start: first, end: last });
}

// 주 보기 그리드 — 해당 날짜가 속한 한 주(7일).
export function weekGrid(date) {
  const first = startOfWeek(date, WEEK_OPTS);
  const last = endOfWeek(date, WEEK_OPTS);
  return eachDayOfInterval({ start: first, end: last });
}

// 보기 이동. unit: 'month' | 'week', dir: -1 | 1
export function shift(date, unit, dir) {
  return unit === 'week' ? addWeeks(date, dir) : addMonths(date, dir);
}

// 키보드 화살표용 하루 이동.
export function shiftDay(date, dir) {
  return addDays(date, dir);
}

// 일정이 특정 날짜에 속하는지. 종일/시간 일정 모두 start 날짜 기준.
export function eventOnDay(event, day) {
  return isSameDay(parseISO(event.time.start), day);
}

// 같은 달인지(월 보기에서 이웃 달 날짜를 흐리게 처리).
export function inSameMonth(day, ref) {
  return isSameMonth(day, ref);
}

// 일정이 변경 표시 대상인지. now − updatedAt < 24h.
// 저장 데이터에 상태를 박지 않고 매번 파생한다.
export function changeStatus(event, nowMs) {
  const updated = parseISO(event.updatedAt).getTime();
  if (nowMs - updated >= 24 * 60 * 60 * 1000) return null;
  // createdAt == updatedAt 이면 신규, 아니면 수정.
  return event.createdAt === event.updatedAt ? 'new' : 'edited';
}

// 하루 안에서 일정 정렬: 종일 먼저, 그다음 시작 시각 순.
export function sortEventsForDay(events) {
  return [...events].sort((a, b) => {
    if (a.time.allDay !== b.time.allDay) return a.time.allDay ? -1 : 1;
    return a.time.start.localeCompare(b.time.start);
  });
}
