# 비밀번호 해시·검증 (외부 의존 없이 stdlib pbkdf2 사용)

import hashlib
import hmac
import os

_ALGO = "pbkdf2_sha256"
_ITER = 200_000


def hash_password(password: str) -> str:
    """저장용 해시 문자열 pbkdf2_sha256$iter$salt_hex$hash_hex 를 만든다."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITER)
    return f"{_ALGO}${_ITER}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """평문 password 가 저장된 해시와 일치하는지 상수시간 비교로 확인한다."""
    try:
        algo, iter_s, salt_hex, hash_hex = stored.split("$")
        if algo != _ALGO:
            return False
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iter_s)
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, AttributeError):
        return False
