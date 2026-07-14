// 사용자 계정 관리 API 래퍼 (관리자 전용 — 서버가 권한을 강제한다)

import { api } from './api.js';

export const users = {
  list() {
    return api('/users');
  },

  create(username, password, isAdmin) {
    return api('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, isAdmin }),
    });
  },

  remove(username) {
    return api(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
  },
};
