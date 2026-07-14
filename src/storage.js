// 일정 저장을 백엔드 REST API로 위임하는 storage 모듈 (UI는 이 인터페이스만 안다)
// list()/get()은 캐시에서 동기 반환 → 렌더는 동기 유지. sync()로 서버에서 캐시를 채운다.

import { api } from './api.js';

let cache = [];

export const storage = {
  // 캐시에서 동기 반환. 렌더 직전에 sync()로 최신화한다.
  list() {
    return cache;
  },

  get(id) {
    return cache.find((e) => e.id === id) ?? null;
  },

  // 서버에서 일정 목록을 받아 캐시를 갱신한다.
  async sync() {
    cache = await api('/events');
    return cache;
  },

  // createdAt/updatedAt은 서버가 채운다. 성공 후 캐시를 다시 맞춘다.
  async create(event) {
    const created = await api('/events', { method: 'POST', body: JSON.stringify(event) });
    await this.sync();
    return created;
  },

  // updatedAt은 서버가 갱신한다 ← 변경 표시의 근거.
  async update(id, patch) {
    const updated = await api(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    await this.sync();
    return updated;
  },

  async remove(id) {
    await api(`/events/${id}`, { method: 'DELETE' });
    await this.sync();
    return true;
  },
};
