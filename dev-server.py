"""개발용 정적 서버 — 캐시를 끈다.
브라우저가 옛 app.js/styles.css 를 붙들고 있어 변경이 안 보이는 문제를 막기 위함.
실행: python dev-server.py   (기본 포트 8000)
"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    # ThreadingHTTPServer: 브라우저의 병렬 keep-alive 연결을 동시에 처리한다.
    # (단일 스레드 HTTPServer 는 병렬 연결에서 멈춘다.)
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"http://localhost:{port}/  (no-cache)")
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
