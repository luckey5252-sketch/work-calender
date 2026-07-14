// 백엔드 접속 설정 (URL을 코드 곳곳에 하드코딩하지 않고 이 한 곳에서만 정한다)

// 기본은 동일 출처('') — FastAPI가 프론트 정적파일도 같이 서빙하므로 상대경로면 된다.
// 다른 호스트의 백엔드를 쓸 때만 여기(또는 window.CAL_API_BASE)를 바꾼다.
export const API_BASE = window.CAL_API_BASE ?? '';
