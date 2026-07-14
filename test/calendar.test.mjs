// calendar.js 순수 함수의 날짜 경계 검증 (월말, 윤년, 주 시작)

import assert from 'node:assert/strict';
import {
  monthGrid,
  weekGrid,
  shift,
  changeStatus,
  sortEventsForDay,
} from '../src/calendar.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// 그리드는 항상 월요일에서 시작하고 일요일에 끝난다(주 시작 = 월).
test('월 그리드는 월요일에서 시작한다', () => {
  // 2026-06: 6월 1일은 월요일. 그리드 첫 칸은 6/1.
  const grid = monthGrid(new Date(2026, 5, 15));
  assert.equal(grid[0].getDay(), 1); // 월요일
  assert.equal(grid[grid.length - 1].getDay(), 0); // 일요일
});

test('월 그리드는 7의 배수 길이다', () => {
  const grid = monthGrid(new Date(2026, 5, 15));
  assert.equal(grid.length % 7, 0);
  assert.ok(grid.length === 35 || grid.length === 42);
});

// 월말 경계: 2026-02는 28일(평년). 2024-02는 29일(윤년).
test('평년 2월은 28일을 포함하고 29일은 없다', () => {
  const grid = monthGrid(new Date(2026, 1, 10));
  const feb = grid.filter((d) => d.getMonth() === 1);
  const days = feb.map((d) => d.getDate());
  assert.ok(days.includes(28));
  assert.ok(!days.includes(29));
});

test('윤년 2024년 2월은 29일을 포함한다', () => {
  const grid = monthGrid(new Date(2024, 1, 10));
  const feb = grid.filter((d) => d.getMonth() === 1);
  const days = feb.map((d) => d.getDate());
  assert.ok(days.includes(29));
});

test('12월에서 다음 달로 이동하면 해를 넘긴다', () => {
  const next = shift(new Date(2026, 11, 15), 'month', 1);
  assert.equal(next.getFullYear(), 2027);
  assert.equal(next.getMonth(), 0);
});

test('주 그리드는 7일이고 월요일 시작이다', () => {
  const week = weekGrid(new Date(2026, 5, 25)); // 목요일
  assert.equal(week.length, 7);
  assert.equal(week[0].getDay(), 1);
  assert.equal(week[6].getDay(), 0);
});

test('주 이동은 7일을 더한다', () => {
  const d = new Date(2026, 5, 25);
  const next = shift(d, 'week', 1);
  assert.equal(Math.round((next - d) / 86400000), 7);
});

// 변경 표시: now − updatedAt < 24h
test('변경 표시는 24시간 안이면 신규/수정, 밖이면 null', () => {
  const now = new Date('2026-06-25T12:00:00.000Z').getTime();
  const fresh = {
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z',
  };
  const edited = {
    createdAt: '2026-06-24T13:00:00.000Z',
    updatedAt: '2026-06-25T11:00:00.000Z',
  };
  const old = {
    createdAt: '2026-06-23T10:00:00.000Z',
    updatedAt: '2026-06-23T10:00:00.000Z',
  };
  assert.equal(changeStatus(fresh, now), 'new');
  assert.equal(changeStatus(edited, now), 'edited');
  assert.equal(changeStatus(old, now), null);
});

test('정확히 24시간이면 표시가 사라진다(경계)', () => {
  const now = new Date('2026-06-25T12:00:00.000Z').getTime();
  const exactly = {
    createdAt: '2026-06-24T12:00:00.000Z',
    updatedAt: '2026-06-24T12:00:00.000Z',
  };
  assert.equal(changeStatus(exactly, now), null);
});

test('하루 일정 정렬: 종일이 먼저, 그다음 시작 시각 순', () => {
  const evts = [
    { time: { start: '2026-06-25T14:00:00.000Z', allDay: false } },
    { time: { start: '2026-06-25T00:00:00.000Z', allDay: true } },
    { time: { start: '2026-06-25T09:00:00.000Z', allDay: false } },
  ];
  const sorted = sortEventsForDay(evts);
  assert.equal(sorted[0].time.allDay, true);
  assert.equal(sorted[1].time.start, '2026-06-25T09:00:00.000Z');
  assert.equal(sorted[2].time.start, '2026-06-25T14:00:00.000Z');
});

console.log(`\n${passed} passed`);
