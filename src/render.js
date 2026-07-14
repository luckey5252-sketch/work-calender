// 달력 DOM을 데이터에서 그리는 렌더 모듈 (상태·저장·리스너 없음 — main이 위임으로 처리)

import { format, isToday, isSameDay, getDay } from 'date-fns';
import {
  monthGrid,
  weekGrid,
  eventOnDay,
  inSameMonth,
  changeStatus,
  sortEventsForDay,
} from './calendar.js';
import { holidayName } from './holidays.js';

// 주 시작이 월요일이라 라벨도 월→일 순.
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 분류 → 칩 색 클래스. 회의는 기본 중립색이라 클래스 없음.
const CAT_CLASS = {
  회의: '',
  출장: 'cat-field',
  기타: 'cat-personal',
};

const CHANGE_LABEL = { new: '신규', edited: '수정' };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function timeLabel(ev) {
  if (ev.time.allDay) return '종일';
  const s = format(new Date(ev.time.start), 'HH:mm');
  if (ev.time.end) return `${s}–${format(new Date(ev.time.end), 'HH:mm')}`;
  return s;
}

function dowClass(day) {
  const d = getDay(day);
  if (d === 0) return 'is-sun';
  if (d === 6) return 'is-sat';
  return '';
}

// 일정 카드. 분류색 + 라벨, 우선·본부장·변경 단서는 색과 함께 비-색 단서를 병행한다.
export function chip(ev, nowMs) {
  const c = el('button', 'chip');
  c.type = 'button';
  c.dataset.eventId = ev.id;

  const hasHead = (ev.attendees || []).some((a) => a.isHead);
  const catClass = CAT_CLASS[ev.category] || '';
  if (catClass) c.classList.add(catClass);
  if (hasHead) c.classList.add('is-head'); // 본부장이 분류색을 덮어쓴다(강조 우선)

  const change = changeStatus(ev, nowMs);
  if (change) {
    c.classList.add('is-changed');
    c.append(el('span', 'chip-badge', CHANGE_LABEL[change]));
  }
  if (ev.priority === 'high') c.append(el('span', 'chip-priority', '우선'));
  if (ev.category) c.append(el('span', 'chip-cat', ev.category));
  if (hasHead) c.append(el('span', 'chip-head', '본부장'));

  c.append(el('span', 'chip-time', timeLabel(ev)));
  c.append(el('span', 'chip-title', ev.title));

  const parts = [ev.title, timeLabel(ev)];
  if (ev.category) parts.push(ev.category);
  if (ev.priority === 'high') parts.push('우선');
  if (hasHead) parts.push('본부장 참석');
  if (change) parts.push(CHANGE_LABEL[change]);
  c.setAttribute('aria-label', parts.join(' · '));
  return c;
}

function weekdayHeader() {
  const row = el('div', 'weekday-row');
  WEEKDAYS.forEach((label, i) => {
    const cell = el('div', 'weekday', label);
    if (i === 5) cell.classList.add('is-sat');
    if (i === 6) cell.classList.add('is-sun');
    row.append(cell);
  });
  return row;
}

function dayCell(day, { cursor, selected, events, nowMs }) {
  const cell = el('div', 'day');
  cell.setAttribute('role', 'gridcell');
  cell.dataset.date = day.toISOString();
  cell.tabIndex = isSameDay(day, selected) ? 0 : -1;

  if (!inSameMonth(day, cursor)) cell.classList.add('is-outside');
  if (isSameDay(day, selected)) cell.classList.add('is-selected');
  if (isToday(day)) cell.classList.add('today');

  const holiday = holidayName(day);
  const head = el('div', 'day-head');
  const num = el('span', `daynum ${dowClass(day)}`.trim(), String(day.getDate()));
  if (holiday) num.classList.add('is-holiday'); // 공휴일도 일요일처럼 붉게
  if (isToday(day)) num.setAttribute('aria-label', `오늘 ${day.getDate()}일`);
  head.append(num);
  if (holiday) head.append(el('span', 'holiday-name', holiday)); // 색만 아니라 이름도
  cell.append(head);

  const list = el('div', 'day-events');
  const dayEvents = sortEventsForDay(events.filter((e) => eventOnDay(e, day)));
  dayEvents.slice(0, 3).forEach((ev) => list.append(chip(ev, nowMs)));
  if (dayEvents.length > 3) {
    const more = el('button', 'more', `+${dayEvents.length - 3}개 더`);
    more.type = 'button';
    more.dataset.more = day.toISOString();
    list.append(more);
  }
  cell.append(list);
  return cell;
}

function renderMonth(stateData) {
  const wrap = el('div', 'month');
  wrap.append(weekdayHeader());

  const grid = el('div', 'month-grid');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', '월 달력');
  monthGrid(stateData.cursor).forEach((day) => grid.append(dayCell(day, stateData)));
  wrap.append(grid);
  return wrap;
}

function renderWeek(stateData) {
  const { cursor, selected, events, nowMs } = stateData;
  const grid = el('div', 'week-grid');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', '주 달력');

  weekGrid(cursor).forEach((day) => {
    const col = el('div', 'week-col');
    col.setAttribute('role', 'gridcell');
    col.dataset.date = day.toISOString();
    col.tabIndex = isSameDay(day, selected) ? 0 : -1;
    if (isSameDay(day, selected)) col.classList.add('is-selected');
    if (isToday(day)) col.classList.add('today');

    const holiday = holidayName(day);
    const head = el('div', 'week-col-head');
    head.append(el('span', `week-dow ${dowClass(day)}`.trim(), WEEKDAYS[(getDay(day) + 6) % 7]));
    const wnum = el('span', 'week-daynum', String(day.getDate()));
    if (holiday) wnum.classList.add('is-holiday');
    head.append(wnum);
    if (holiday) head.append(el('span', 'holiday-name', holiday));
    col.append(head);

    const list = el('div', 'week-col-events');
    const dayEvents = sortEventsForDay(events.filter((e) => eventOnDay(e, day)));
    if (dayEvents.length === 0) {
      list.append(el('div', 'col-empty', '일정 없음'));
    } else {
      dayEvents.forEach((ev) => list.append(chip(ev, nowMs)));
    }
    col.append(list);
    grid.append(col);
  });
  return grid;
}

function emptyHint() {
  const box = el('div', 'empty-hint');
  box.append(el('strong', null, '아직 일정이 없어요.'));
  box.append(el('span', null, '날짜를 누르거나 ‘일정 더하기’로 첫 일정을 시작하세요.'));
  const btn = el('button', 'btn-primary', '일정 더하기');
  btn.type = 'button';
  btn.dataset.action = 'add';
  box.append(btn);
  return box;
}

// 달력 전체를 root에 다시 그린다. stateData = { view, cursor, selected, events, nowMs }
export function renderCalendar(root, stateData) {
  root.innerHTML = '';
  root.append(stateData.view === 'month' ? renderMonth(stateData) : renderWeek(stateData));
  if (stateData.events.length === 0) root.append(emptyHint());
}
