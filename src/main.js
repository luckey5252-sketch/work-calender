// 달력 앱의 상태·저장·다이얼로그·입력을 배선하는 진입점 (렌더는 render.js, 날짜는 calendar.js)

import {
  format,
  startOfDay,
  isSameDay,
  isSameMonth,
  addDays,
  addMonths,
  addWeeks,
} from 'date-fns';
import { storage } from './storage.js';
import { auth } from './auth.js';
import { users } from './users.js';
import { weekGrid, calendarWeekEnds, shift, changeStatus } from './calendar.js';
import { renderCalendar, timeLabel } from './render.js';

// ---- 상태 -------------------------------------------------------------------
const state = {
  view: 'week', // 'month' | 'week' — 기본은 주 보기
  cursor: new Date(), // 보고 있는 기준일
  selected: startOfDay(new Date()), // 키보드/선택 포커스 날짜
  editingId: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const root = $('#cal-root');
const periodEl = $('#period');
const formDialog = $('#form-dialog');
const detailDialog = $('#detail-dialog');
const loginDialog = $('#login-dialog');
const loginForm = $('#login-form');
const usersDialog = $('#users-dialog');
const userAddForm = $('#user-add-form');
const authArea = $('#auth-area');
const form = $('#event-form');
const attendeeList = $('#attendee-list');

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// ---- 렌더 -------------------------------------------------------------------
function render() {
  const hadFocus = root.contains(document.activeElement);

  periodEl.textContent =
    state.view === 'month'
      ? `${state.cursor.getFullYear()}년 ${state.cursor.getMonth() + 1}월`
      : weekRangeLabel();

  $('#view-month').setAttribute('aria-selected', String(state.view === 'month'));
  $('#view-week').setAttribute('aria-selected', String(state.view === 'week'));

  renderCalendar(root, {
    view: state.view,
    cursor: state.cursor,
    selected: state.selected,
    events: storage.list(),
    nowMs: Date.now(),
  });

  renderAuth();
  if (hadFocus) focusSelectedCell();
}

// 기간 이동(‹ ›). 주 보기는 아래에 '고른 날'을 펼치므로 주를 넘기면 고른 날도 같은 요일로
// 따라가야 한다 — 안 그러면 상단 줄에 없는 날의 일정이 아래 남는다.
function stepPeriod(dir) {
  const before = state.view === 'week' ? weekGrid(state.cursor) : null;
  state.cursor = shift(state.cursor, state.view, dir);
  if (before) {
    const i = before.findIndex((d) => isSameDay(d, state.selected));
    state.selected = startOfDay(weekGrid(state.cursor)[i < 0 ? 0 : i]);
  }
  render();
}

// 로그인 상태를 헤더에 반영한다. body.is-auth 로 편집 UI(추가 버튼)를 켠다.
function renderAuth() {
  document.body.classList.toggle('is-auth', !!auth.user);
  authArea.innerHTML = '';
  if (auth.user) {
    const who = document.createElement('span');
    who.className = 'auth-user';
    who.textContent = auth.user;
    authArea.append(who);
    if (auth.isAdmin) {
      const manage = document.createElement('button');
      manage.type = 'button';
      manage.className = 'btn-ghost btn-sm';
      manage.textContent = '사용자 관리';
      manage.addEventListener('click', openUsers);
      authArea.append(manage);
    }
    const out = document.createElement('button');
    out.type = 'button';
    out.className = 'btn-ghost btn-sm';
    out.textContent = '로그아웃';
    out.addEventListener('click', doLogout);
    authArea.append(out);
  } else {
    const login = document.createElement('button');
    login.type = 'button';
    login.className = 'btn-ghost';
    login.textContent = '로그인';
    login.addEventListener('click', openLogin);
    authArea.append(login);
  }
}

function weekRangeLabel() {
  const days = weekGrid(state.cursor);
  const a = days[0];
  const b = days[6];
  const left = `${a.getFullYear()}년 ${a.getMonth() + 1}월 ${a.getDate()}일`;
  const right = isSameMonth(a, b) ? `${b.getDate()}일` : `${b.getMonth() + 1}월 ${b.getDate()}일`;
  return `${left} – ${right}`;
}

function focusSelectedCell() {
  const cells = root.querySelectorAll('[role="gridcell"]');
  cells.forEach((c) => (c.tabIndex = -1));
  const target = [...cells].find((c) => isSameDay(new Date(c.dataset.date), state.selected));
  if (target) {
    target.tabIndex = 0;
    target.focus();
  }
}

// ---- 본문 위임 (클릭·포커스·키보드) -----------------------------------------
function onRootClick(e) {
  const chipEl = e.target.closest('[data-event-id]');
  if (chipEl) {
    openDetail(chipEl.dataset.eventId);
    return;
  }
  // 주 보기 상단 날짜 줄은 '고르기'만 한다 — 아래 상세를 바꿀 뿐 폼을 열지 않는다.
  const pickEl = e.target.closest('[data-pick]');
  if (pickEl) {
    state.selected = startOfDay(new Date(pickEl.dataset.date));
    render();
    return;
  }
  const moreEl = e.target.closest('[data-more]');
  if (moreEl) {
    const day = new Date(moreEl.dataset.more);
    state.selected = startOfDay(day);
    state.cursor = new Date(day);
    state.view = 'week';
    render();
    return;
  }
  if (e.target.closest('[data-action="add"]')) {
    openForm(null, state.selected);
    return;
  }
  const cell = e.target.closest('[data-date]');
  if (cell) {
    const day = new Date(cell.dataset.date);
    state.selected = startOfDay(day);
    openForm(null, day);
  }
}

function onRootFocusIn(e) {
  const cell = e.target.closest('[data-date]');
  if (cell) state.selected = startOfDay(new Date(cell.dataset.date));
}

function onRootKey(e) {
  if (!e.target.closest('[role="gridcell"]')) return;
  const sel = state.selected;
  const month = state.view === 'month';
  let next = null;
  switch (e.key) {
    case 'ArrowLeft': next = addDays(sel, -1); break;
    case 'ArrowRight': next = addDays(sel, 1); break;
    // 주 보기 날짜 줄도 가로 한 줄이라 좌우가 ±1일, 상하는 양쪽 다 주 이동이다.
    case 'ArrowUp': next = addDays(sel, -7); break;
    case 'ArrowDown': next = addDays(sel, 7); break;
    // 월 보기는 달력 주(월~일)의 양끝, 주 보기는 오늘 중심 7일 줄의 양끝.
    case 'Home': next = month ? calendarWeekEnds(sel)[0] : weekGrid(sel)[0]; break;
    case 'End': next = month ? calendarWeekEnds(sel)[1] : weekGrid(sel)[6]; break;
    case 'PageUp': next = month ? addMonths(sel, -1) : addWeeks(sel, -1); break;
    case 'PageDown': next = month ? addMonths(sel, 1) : addWeeks(sel, 1); break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      openForm(null, state.selected);
      return;
    default:
      return;
  }
  e.preventDefault();
  state.selected = startOfDay(next);
  // 보고 있는 기간을 벗어나면 따라 이동한다.
  if (month && !isSameMonth(next, state.cursor)) state.cursor = new Date(next);
  if (!month && !weekGrid(state.cursor).some((d) => isSameDay(d, next))) {
    state.cursor = new Date(next);
  }
  render();
  focusSelectedCell();
}

// ---- 입력 폼 ----------------------------------------------------------------
function attendeeRow(att = { name: '' }) {
  const row = document.createElement('div');
  row.className = 'attendee-row';

  const name = document.createElement('input');
  name.type = 'text';
  name.placeholder = '이름';
  name.className = 'att-name';
  name.value = att.name || '';
  name.autocomplete = 'off';

  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'btn-step btn-sm';
  rm.setAttribute('aria-label', '참석자 빼기');
  rm.textContent = '×';
  rm.addEventListener('click', () => row.remove());

  row.append(name, rm);
  return row;
}

// 본부장 참석이면 참석자 명단은 필요 없으니 숨긴다(미참석일 때만 이름 입력).
function syncHeadAttending() {
  const attends = form.elements.headAttending.value === 'yes';
  $('#attendee-field').hidden = attends;
}

function openForm(id, day) {
  if (!auth.user) {
    openLogin(); // 편집은 로그인 필요 — 대신 로그인 창을 연다
    return;
  }
  state.editingId = id;
  form.reset();
  attendeeList.innerHTML = '';

  const ev = id ? storage.get(id) : null;
  $('#form-title').textContent = ev ? '일정 수정' : '새 일정';
  $('#form-delete').hidden = !ev;

  if (ev) {
    const start = new Date(ev.time.start);
    form.elements.title.value = ev.title;
    form.elements.allDay.checked = !!ev.time.allDay;
    form.elements.date.value = format(start, 'yyyy-MM-dd');
    form.elements.start.value = ev.time.allDay ? '' : format(start, 'HH:mm');
    form.elements.end.value = ev.time.end ? format(new Date(ev.time.end), 'HH:mm') : '';
    form.elements.category.value = ev.category || '회의';
    form.elements.priority.checked = ev.priority === 'high';
    form.elements.location.value = ev.location || '';
    form.elements.department.value = ev.department || '';
    form.elements.headAttending.value = ev.headAttending ? 'yes' : 'no';
    (ev.attendees || []).forEach((a) => attendeeList.append(attendeeRow(a)));
  } else {
    const base = day ? new Date(day) : new Date();
    form.elements.date.value = format(base, 'yyyy-MM-dd');
    form.elements.start.value = '09:00';
  }
  syncTimeDisabled();
  syncHeadAttending();
  formDialog.showModal();
  form.elements.title.focus();
}

function syncTimeDisabled() {
  const allDay = form.elements.allDay.checked;
  form.elements.start.disabled = allDay;
  form.elements.end.disabled = allDay;
}

// 서버 변이를 감싼다. 성공하면 다시 그리고 true, 실패(세션만료 등)면 안내 후 false.
async function mutate(fn) {
  try {
    await fn();
    render();
    return true;
  } catch (err) {
    if (err.status === 401) {
      auth.user = null;
      renderAuth();
      alert('로그인이 만료됐어요. 다시 로그인해 주세요.');
      openLogin();
    } else {
      alert(err.message || '요청을 처리하지 못했어요.');
    }
    return false;
  }
}

function openLogin() {
  loginForm.reset();
  $('#login-error').hidden = true;
  loginDialog.showModal();
}

async function doLogout() {
  try {
    await auth.logout();
  } catch {
    auth.user = null; // 서버 응답이 없어도 화면상은 로그아웃 처리
    auth.isAdmin = false;
  }
  render();
}

// ---- 사용자 관리 (관리자 전용) ----------------------------------------------
async function openUsers() {
  userAddForm.reset();
  $('#users-error').hidden = true;
  await renderUsersList();
  usersDialog.showModal();
}

async function renderUsersList() {
  const list = $('#users-list');
  list.innerHTML = '';
  let rows;
  try {
    rows = await users.list();
  } catch (err) {
    list.append(el('li', 'users-error', err.message || '목록을 불러오지 못했어요.'));
    return;
  }
  rows.forEach((u) => {
    const li = el('li', 'users-row');
    li.append(el('span', 'users-name', u.username));
    if (u.isAdmin) li.append(el('span', 'users-badge', '관리자'));
    if (u.username === auth.user) {
      li.append(el('span', 'users-you', '나'));
    } else {
      const del = el('button', 'btn-step btn-sm', '삭제');
      del.type = 'button';
      del.addEventListener('click', async () => {
        if (!confirm(`'${u.username}' 사용자를 삭제할까요?`)) return;
        try {
          await users.remove(u.username);
          await renderUsersList();
        } catch (err) {
          showUsersError(err);
        }
      });
      li.append(del);
    }
    list.append(li);
  });
}

function showUsersError(err) {
  if (err.status === 401 || err.status === 403) {
    usersDialog.close();
    auth.isAdmin = false;
    render();
    alert('권한이 없어요. 다시 로그인해 주세요.');
    return;
  }
  const box = $('#users-error');
  box.textContent = err.message || '처리하지 못했어요.';
  box.hidden = false;
}

// el() 은 render.js 내부 함수라 여기선 간단 버전을 둔다.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function readForm() {
  const fd = form.elements;
  const dateStr = fd.date.value;
  const allDay = fd.allDay.checked;

  // 종일이면 로컬 자정으로. 직접 UTC 계산을 피하려고 로컬 Date를 만들고 ISO로 굳힌다.
  const start = allDay
    ? new Date(`${dateStr}T00:00`)
    : new Date(`${dateStr}T${fd.start.value || '00:00'}`);
  let end = null;
  if (!allDay && fd.end.value) {
    end = new Date(`${dateStr}T${fd.end.value}`);
    if (end <= start) end = null; // 종료가 시작보다 빠르면 버린다
  }

  const headAttending = fd.headAttending.value === 'yes';
  // 본부장 참석이면 명단은 비운다. 미참석이면 이름 적은 참석자만 담는다.
  const attendees = headAttending
    ? []
    : [...attendeeList.querySelectorAll('.attendee-row')]
        .map((row) => ({ name: $('.att-name', row).value.trim() }))
        .filter((a) => a.name);

  return {
    title: fd.title.value.trim(),
    time: { start: start.toISOString(), end: end ? end.toISOString() : null, allDay },
    category: fd.category.value,
    priority: fd.priority.checked ? 'high' : 'normal',
    location: fd.location.value.trim(),
    department: fd.department.value.trim(),
    headAttending,
    attendees,
  };
}

// ---- 상세 -------------------------------------------------------------------
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

function detailWhen(ev) {
  const start = new Date(ev.time.start);
  const d = `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 (${
    WEEKDAYS[start.getDay()]
  })`;
  return `${d} · ${timeLabel(ev)}`;
}

function openDetail(id) {
  const ev = storage.get(id);
  if (!ev) return;
  const body = $('#detail-body');
  const change = changeStatus(ev, Date.now());
  const changeLabel = change === 'edited' ? '수정' : '신규';
  const hasHead = !!ev.headAttending;

  const attHtml = (ev.attendees || []).length
    ? `<ul class="att-view">${ev.attendees
        .map((a) => `<li>${escapeHtml(a.name)}</li>`)
        .join('')}</ul>`
    : '<span class="muted">없음</span>';

  body.innerHTML = `
    <div class="detail-head">
      ${hasHead ? '<span class="head-tag detail-head-tag">본부장 참석</span>' : ''}
      ${ev.priority === 'high' ? '<span class="chip-priority">우선</span>' : ''}
      ${change ? `<span class="chip-badge in-detail${change === 'edited' ? ' is-edited' : ''}">${changeLabel}</span>` : ''}
      <button type="button" id="detail-close" class="btn-step" aria-label="닫기">×</button>
    </div>
    <h2 class="detail-title">${escapeHtml(ev.title)}</h2>
    <dl class="detail-list">
      <div><dt>시간</dt><dd>${detailWhen(ev)}</dd></div>
      ${ev.category ? `<div><dt>분류</dt><dd>${escapeHtml(ev.category)}</dd></div>` : ''}
      ${ev.location ? `<div><dt>장소</dt><dd>${escapeHtml(ev.location)}</dd></div>` : ''}
      ${ev.department ? `<div><dt>담당부서</dt><dd>${escapeHtml(ev.department)}</dd></div>` : ''}
      <div><dt>참석자</dt><dd>${attHtml}</dd></div>
    </dl>
    ${
      auth.user
        ? `<footer class="sheet-foot">
      <button type="button" id="detail-delete" class="btn-danger">삭제</button>
      <span class="spacer"></span>
      <button type="button" id="detail-edit" class="btn-primary">수정</button>
    </footer>`
        : ''
    }
  `;

  $('#detail-close', body).addEventListener('click', () => detailDialog.close());
  const editBtn = $('#detail-edit', body);
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      detailDialog.close();
      openForm(ev.id);
    });
  }
  const delBtn = $('#detail-delete', body);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (confirm('이 일정을 삭제할까요?')) {
        if (await mutate(() => storage.remove(ev.id))) detailDialog.close();
      }
    });
  }
  detailDialog.showModal();
}

// ---- 배선 -------------------------------------------------------------------
function wire() {
  $('#today').addEventListener('click', () => {
    state.cursor = new Date();
    state.selected = startOfDay(new Date());
    render();
  });
  $('#prev').addEventListener('click', () => stepPeriod(-1));
  $('#next').addEventListener('click', () => stepPeriod(1));
  $('#view-month').addEventListener('click', () => {
    state.view = 'month';
    render();
  });
  $('#view-week').addEventListener('click', () => {
    state.view = 'week';
    // 고른 날이 든 주를 펼친다 — 월 보기에서 다른 주의 날을 고른 채 넘어올 수 있다.
    state.cursor = new Date(state.selected);
    render();
  });
  $('#add').addEventListener('click', () => openForm(null, state.selected));

  root.addEventListener('click', onRootClick);
  root.addEventListener('focusin', onRootFocusIn);
  root.addEventListener('keydown', onRootKey);

  // 폼
  $('#add-attendee').addEventListener('click', () => attendeeList.append(attendeeRow()));
  form.elements.allDay.addEventListener('change', syncTimeDisabled);
  [...form.elements.headAttending].forEach((r) => r.addEventListener('change', syncHeadAttending));
  $('#form-cancel').addEventListener('click', () => formDialog.close());
  $('#form-close').addEventListener('click', () => formDialog.close());
  $('#form-delete').addEventListener('click', async () => {
    if (state.editingId && confirm('이 일정을 삭제할까요?')) {
      const id = state.editingId;
      if (await mutate(() => storage.remove(id))) formDialog.close();
    }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = readForm();
    if (!data.title) {
      form.elements.title.focus();
      return;
    }
    const id = state.editingId;
    const ok = await mutate(() => (id ? storage.update(id, data) : storage.create(data)));
    if (ok) formDialog.close();
  });

  // 로그인
  $('#login-close').addEventListener('click', () => loginDialog.close());
  $('#login-cancel').addEventListener('click', () => loginDialog.close());
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#login-error');
    errEl.hidden = true;
    try {
      await auth.login(loginForm.elements.username.value.trim(), loginForm.elements.password.value);
      loginDialog.close();
      render();
    } catch (ex) {
      errEl.textContent = ex.message || '로그인에 실패했어요.';
      errEl.hidden = false;
    }
  });

  // 사용자 관리
  $('#users-close').addEventListener('click', () => usersDialog.close());
  userAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#users-error').hidden = true;
    const f = userAddForm.elements;
    try {
      await users.create(f.username.value.trim(), f.password.value, f.isAdmin.checked);
      userAddForm.reset();
      await renderUsersList();
    } catch (err) {
      showUsersError(err);
    }
  });

  // 바깥(backdrop) 클릭으로 닫기
  [formDialog, detailDialog, loginDialog, usersDialog].forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  // 변경 표시는 시간이 지나면 사라져야 하므로 1분마다 다시 그린다.
  setInterval(render, 60 * 1000);
}

// 로그인 상태와 일정을 서버에서 받아온 뒤 첫 렌더.
async function init() {
  try {
    await auth.refresh();
  } catch {
    /* 서버가 없으면 비로그인으로 진행 */
  }
  try {
    await storage.sync();
  } catch (err) {
    console.error('일정을 불러오지 못했습니다:', err);
  }
  render();
}

wire();
init();
