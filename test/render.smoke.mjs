// render.js가 jsdom에서 실제로 칩·배지·태그를 생성하는지 확인하는 스모크 테스트

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// 아래 일정들은 UTC 문자열이라 "어느 날에 속하는지"를 로컬 시간대가 정한다. 주 보기 테스트는
// "6/25 하루에 셋 다"를 전제하므로 시간대를 고정한다. import 는 끌어올려지니 여기(본문 첫 줄)가
// 이 파일에서 Date 를 만들기 전 가장 이른 지점이다 — Node 는 이후 Date 부터 바뀐 TZ 를 쓴다.
process.env.TZ = 'Asia/Seoul';

const dom = new JSDOM('<!doctype html><body><main id="root"></main></body>');
globalThis.document = dom.window.document;
globalThis.window = dom.window;

const { renderCalendar, chip, startTimeLabel } = await import('../src/render.js');

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
    headAttending: true, // 본부장 참석은 일정 속성
    attendees: [],
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z', // 신규
  },
  {
    id: 'b',
    title: '보고서 마감',
    time: { start: '2026-06-25T08:00:00.000Z', allDay: false },
    category: '기타',
    priority: 'high',
    headAttending: false,
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
    headAttending: false,
    department: '안전총괄부',
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

test('본부장 참석(headAttending) 칩은 is-head + "본부장" 라벨을 가진다', () => {
  const c = chip(events[0], nowMs);
  assert.ok(c.classList.contains('is-head'));
  assert.match(c.textContent, /본부장/);
});

test('참석자에 본부장이 없어도 headAttending 이면 is-head', () => {
  const c = chip({ ...events[1], headAttending: true }, nowMs);
  assert.ok(c.classList.contains('is-head'));
});

test('신규 일정은 is-changed + "신규" 배지', () => {
  const c = chip(events[0], nowMs);
  assert.ok(c.classList.contains('is-changed'));
  assert.ok([...c.querySelectorAll('.chip-badge')].some((e) => e.textContent === '신규'));
});

test('수정 일정은 "수정" 배지 + is-edited(채운 앰버)', () => {
  const c = chip(events[2], nowMs);
  assert.ok(c.classList.contains('is-changed'));
  const badge = [...c.querySelectorAll('.chip-badge')].find((e) => e.textContent === '수정');
  assert.ok(badge);
  assert.ok(badge.classList.contains('is-edited'));
});

test('신규 배지는 is-edited 가 아니다(파란 테두리 유지)', () => {
  const badge = [...chip(events[0], nowMs).querySelectorAll('.chip-badge')].find(
    (e) => e.textContent === '신규',
  );
  assert.ok(badge && !badge.classList.contains('is-edited'));
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

test('주 보기 칩은 담당부서를 별도 줄로 보인다', () => {
  const c = chip(events[2], nowMs, { showDepartment: true });
  const dept = c.querySelector('.chip-dept');
  assert.ok(dept && dept.textContent === '안전총괄부');
});

test('월 보기 칩은 담당부서를 보이지 않는다', () => {
  const c = chip(events[2], nowMs);
  assert.equal(c.querySelector('.chip-dept'), null);
});

// 주 보기 = 상단 날짜 줄(7칸) + 하단에 '고른 날' 하나만 펼침.
const weekState = { view: 'week', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events, nowMs };

test('주 보기는 날짜 줄 7칸과 하루 상세를 그린다', () => {
  renderCalendar(root, weekState);
  assert.equal(root.querySelectorAll('.week-strip .strip-day').length, 7);
  assert.ok(root.querySelector('.day-panel'));
});

test('날짜 줄 칸은 폼이 아니라 고르기다(data-pick)', () => {
  renderCalendar(root, weekState);
  assert.equal(root.querySelectorAll('.strip-day[data-pick]').length, 7);
});

test('고른 날만 is-selected 이고 그 날 일정만 상세에 나온다', () => {
  renderCalendar(root, weekState);
  assert.equal(root.querySelectorAll('.strip-day.is-selected').length, 1);
  assert.equal(root.querySelectorAll('.day-panel-list .chip').length, events.length);
});

test('일정 있는 날만 날짜 줄에 점이 켜진다', () => {
  renderCalendar(root, weekState);
  assert.equal(root.querySelectorAll('.strip-mark.has-events').length, 1); // 셋 다 6/25
});

test('상세는 시간순이다 — 01:00 회의 → 05:00 점검 → 08:00 마감', () => {
  renderCalendar(root, weekState);
  const titles = [...root.querySelectorAll('.day-panel-list .chip-title')].map((e) => e.textContent);
  assert.deepEqual(titles, ['주간 본부 회의', '현장 점검', '보고서 마감']);
});

test('일정 없는 날을 고르면 상세가 다음 행동을 준다', () => {
  renderCalendar(root, { ...weekState, selected: new Date(2026, 5, 26) });
  assert.equal(root.querySelector('.day-panel-list .chip'), null);
  const empty = root.querySelector('.day-empty');
  assert.ok(empty && empty.querySelector('[data-action="add"]'));
});

test('주 보기 상세 칩은 장소를 보인다', () => {
  const c = chip({ ...events[2], location: '남부지사' }, nowMs, { showLocation: true });
  assert.equal(c.querySelector('.chip-loc').textContent, '남부지사');
});

test('월 보기 칩은 장소를 보이지 않는다', () => {
  assert.equal(chip({ ...events[2], location: '남부지사' }, nowMs).querySelector('.chip-loc'), null);
});

// 월 보기는 좁은 화면에서 제목+시작시간만 남긴다. 끝시간이 붙으면 칸을 넘친다.
test('시작시간 라벨은 끝시간을 붙이지 않는다', () => {
  const ranged = { time: { start: '2026-06-25T01:00:00.000Z', end: '2026-06-25T04:00:00.000Z', allDay: false } };
  const label = startTimeLabel(ranged);
  assert.match(label, /^\d{2}:\d{2}$/); // 시간대와 무관하게 "HH:mm" 한 개
  assert.ok(!label.includes('–'));
});

test('종일 일정의 시작시간 라벨은 "종일"', () => {
  assert.equal(startTimeLabel({ time: { start: '2026-06-25T01:00:00.000Z', allDay: true } }), '종일');
});

test('월 보기 칩은 시작시간 줄을 가진다', () => {
  const c = chip(events[2], nowMs, { showStartTime: true });
  const start = c.querySelector('.chip-start');
  assert.ok(start);
  assert.ok(!start.textContent.includes('–'));
});

test('주 보기 칩엔 시작시간 줄이 없다', () => {
  assert.equal(chip(events[2], nowMs, { showDepartment: true }).querySelector('.chip-start'), null);
});

test('월 달력을 그리면 칩에 시작시간 줄이 붙는다', () => {
  renderCalendar(root, { view: 'month', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events, nowMs });
  assert.ok(root.querySelector('.day-events .chip-start'));
});

test('일정이 없으면 empty-hint를 보인다', () => {
  renderCalendar(root, { view: 'month', cursor: new Date(2026, 5, 25), selected: new Date(2026, 5, 25), events: [], nowMs });
  assert.ok(root.querySelector('.empty-hint'));
});

console.log(`\n${passed} passed`);
