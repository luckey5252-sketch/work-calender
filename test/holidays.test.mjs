// 공휴일 표 검증 — 고정일·음력·대체공휴일 규칙이 표에 정확히 반영됐는지

import assert from 'node:assert';
import { holidayName } from '../src/holidays.js';

let n = 0;
function t(name, fn) {
  fn();
  console.log(`  ok  ${name}`);
  n++;
}

// new Date(연, 월index, 일)은 로컬 날짜 → holidayName의 로컬 키와 일치.
t('신정은 공휴일', () => assert.equal(holidayName(new Date(2026, 0, 1)), '신정'));

t('설날은 3일 모두 표기(2026)', () => {
  assert.equal(holidayName(new Date(2026, 1, 16)), '설날');
  assert.equal(holidayName(new Date(2026, 1, 17)), '설날');
  assert.equal(holidayName(new Date(2026, 1, 18)), '설날');
});

t('부처님오신날 음력 반영(2026-05-24)', () =>
  assert.equal(holidayName(new Date(2026, 4, 24)), '부처님오신날'));

t('삼일절 일요일 → 다음 월요일 대체공휴일(2026)', () => {
  assert.equal(holidayName(new Date(2026, 2, 1)), '삼일절');
  assert.equal(holidayName(new Date(2026, 2, 2)), '대체공휴일');
});

t('추석 토요일 겹침 → 대체공휴일(2026-09-28)', () =>
  assert.equal(holidayName(new Date(2026, 8, 28)), '대체공휴일'));

t('현충일은 토요일이어도 대체 없음(2026-06-06 토)', () => {
  assert.equal(holidayName(new Date(2026, 5, 6)), '현충일');
  assert.equal(holidayName(new Date(2026, 5, 8)), null); // 대체 없음
});

t('평일은 공휴일 아님', () => assert.equal(holidayName(new Date(2026, 6, 9)), null));

// 연도 확장 (2028–2030) — 음력·다일 연휴·대체공휴일 재구성 검증
t('2028 추석·개천절 겹침 → 다음평일 대체', () => {
  assert.equal(holidayName(new Date(2028, 9, 3)), '추석·개천절'); // 10-03 화, 겹침
  assert.equal(holidayName(new Date(2028, 9, 5)), '대체공휴일'); // 10-05 목
});

t('2029 어린이날(토)·부처님(일) 각각 대체', () => {
  assert.equal(holidayName(new Date(2029, 4, 5)), '어린이날'); // 토
  assert.equal(holidayName(new Date(2029, 4, 7)), '대체공휴일'); // 월
  assert.equal(holidayName(new Date(2029, 4, 20)), '부처님오신날'); // 일
  assert.equal(holidayName(new Date(2029, 4, 21)), '대체공휴일'); // 월
});

t('2030 설날 3일 연휴 전체(2/2~2/4) + 대체(2/5)', () => {
  assert.equal(holidayName(new Date(2030, 1, 2)), '설날'); // 토(전날)
  assert.equal(holidayName(new Date(2030, 1, 3)), '설날'); // 일(당일)
  assert.equal(holidayName(new Date(2030, 1, 4)), '설날'); // 월(다음날)
  assert.equal(holidayName(new Date(2030, 1, 5)), '대체공휴일'); // 화
});

t('2030 추석 3일 연휴 전체(9/11~9/13), 평일이라 대체 없음', () => {
  assert.equal(holidayName(new Date(2030, 8, 11)), '추석');
  assert.equal(holidayName(new Date(2030, 8, 12)), '추석');
  assert.equal(holidayName(new Date(2030, 8, 13)), '추석');
  assert.equal(holidayName(new Date(2030, 8, 14)), null); // 대체 없음
});

console.log(`\n${n} passed`);
