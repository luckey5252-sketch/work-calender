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

// 월 보기의 주 시작은 월요일(업무용). date-fns weekStartsOn: 1.
// 주 보기는 아래 weekGrid 처럼 기준일 중심이라 이 옵션을 쓰지 않는다.
const WEEK_OPTS = { weekStartsOn: 1 };

// 월 보기 그리드 — 해당 월을 감싸는 주 단위 날짜 배열(보통 35~42칸).
export function monthGrid(date) {
  const first = startOfWeek(startOfMonth(date), WEEK_OPTS);
  const last = endOfWeek(endOfMonth(date), WEEK_OPTS);
  return eachDayOfInterval({ start: first, end: last });
}

// 주 보기 그리드 — 기준일을 한가운데 둔 7일(앞 3일 + 기준일 + 뒤 3일).
// 월~일 고정이 아니라 기준일 중심이라, 앱을 열면 오늘이 줄 가운데(4번째)에 온다.
// 그래서 요일 순서는 기준일에 따라 돌아간다(예: 수·목·금·토·일·월·화).
export function weekGrid(date) {
  const first = addDays(date, -3);
  return eachDayOfInterval({ start: first, end: addDays(first, 6) });
}

// 월 보기 키보드 Home/End 용 — 그 날이 속한 달력 주(월~일)의 양끝.
// 주 보기는 weekGrid 가 기준일 중심이라 이 함수를 쓰지 않는다.
export function calendarWeekEnds(date) {
  return [startOfWeek(date, WEEK_OPTS), endOfWeek(date, WEEK_OPTS)];
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
