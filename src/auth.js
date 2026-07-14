// 로그인 상태와 인증 요청을 다루는 모듈 (세션 쿠키는 브라우저가 자동 전송)

import { api } from './api.js';

export const auth = {
  user: null, // 로그인 사용자명, 비로그인이면 null
  isAdmin: false, // 관리자면 사용자 관리 UI 노출

  async refresh() {
    const r = await api('/auth/me');
    this.user = r.user;
    this.isAdmin = !!r.isAdmin;
    return this.user;
  },

  async login(username, password) {
    const r = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.user = r.user;
    this.isAdmin = !!r.isAdmin;
    return r.user;
  },

  async logout() {
    await api('/auth/logout', { method: 'POST' });
    this.user = null;
    this.isAdmin = false;
  },
};
