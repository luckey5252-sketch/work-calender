// render.js가 jsdom에서 실제로 칩·배지·태그를 생성하는지 확인하는 스모크 테스트

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><main id="root"></main></body>');
globalThis.document = dom.window.document;
globalThis.window = dom.window;

const { renderCalendar, chip } = await import('../src/render.js');

const root = document.getElementById('root');
const nowMs = new Date('2026-06-25T12:00:00.000Z').getTime();

// 같은 날 일정 셋: 본부장 회의(신규), 기타(우선), 출장(수정)
const events = [
  {
    id: 'a',
    title: '주간 본부 회의',
    time: { start: '2026-06-25T01:00:00.000Z', allDay: false },
    category: '회의',
    priority: 'normal',
    attendees: [{ name: '김본부', isHead: true }],
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z', // 신규
  },
  {
    id: 'b',
    title: '보고서 마감',
    time: { start: '2026-06-25T08:00:00.000Z', allDay: false },
    category: '기타',
    priority: 'high',
    attendees: [],
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z', // 24h 밖 → 변경 없음
  },
  {
    id: 'c',
    title: '현장 점검',
    time: { start: '2026-06-25T05:00:00.000Z', allDay: false },
    category: '출장',
    priority: 'normal',
    attendees: [],
    createdAt: '2026-06-24T13:00:00.000Z',
    updatedAt: '2026-06-25T09:00:00.000Z', // 수정
  },
];

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

test('월 보기가 7의 배수 칸을 그린다', () => {
  renderCalendar(root, { view: 'month', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events, nowMs });
  const cells = root.querySelectorAll('.day');
  assert.equal(cells.length % 7, 0);
});

test('오늘이 아닌 빈 캘린더는 empty-hint를 보이지 않는다(일정 있음)', () => {
  assert.equal(root.querySelector('.empty-hint'), null);
});

test('본부장 칩은 is-head + "본부장" 라벨을 가진다', () => {
  const c = chip(events[0], nowMs);
  assert.ok(c.classList.contains('is-head'));
  assert.match(c.textContent, /본부장/);
});

test('신규 일정은 is-changed + "신규" 배지', () => {
  const c = chip(events[0], nowMs);
  assert.ok(c.classList.contains('is-changed'));
  assert.ok([...c.querySelectorAll('.chip-badge')].some((e) => e.textContent === '신규'));
});

test('수정 일정은 "수정" 배지', () => {
  const c = chip(events[2], nowMs);
  assert.ok(c.classList.contains('is-changed'));
  assert.ok([...c.querySelectorAll('.chip-badge')].some((e) => e.textContent === '수정'));
});

test('24h 밖 일정은 변경 배지가 없다', () => {
  const c = chip(events[1], nowMs);
  assert.ok(!c.classList.contains('is-changed'));
});

test('기타는 cat-personal, 우선은 "우선" 태그', () => {
  const c = chip(events[1], nowMs);
  assert.ok(c.classList.contains('cat-personal'));
  assert.ok([...c.querySelectorAll('.chip-priority')].some((e) => e.textContent === '우선'));
});

test('출장은 cat-field + "출장" 분류 라벨', () => {
  const c = chip(events[2], nowMs);
  assert.ok(c.classList.contains('cat-field'));
  assert.ok([...c.querySelectorAll('.chip-cat')].some((e) => e.textContent === '출장'));
});

test('주 보기도 throw 없이 그려진다', () => {
  renderCalendar(root, { view: 'week', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events, nowMs });
  assert.ok(root.querySelector('.week-grid'));
});

test('일정이 없으면 empty-hint를 보인다', () => {
  renderCalendar(root, { view: 'month', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events: [], nowMs });
  assert.ok(root.querySelector('.empty-hint'));
});

console.log(`\n${passed} passed`);
