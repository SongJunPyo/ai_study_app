"""
User Repository
사용자 관련 DB 접근 로직
"""
from typing import Optional
from .base_repository import BaseRepository
from dto.user_dto import UserDTO


class UserRepository(BaseRepository):
    """사용자 Repository"""

    @staticmethod
    def find_by_email(email: str, conn=None) -> Optional[UserDTO]:
        """
        이메일로 사용자 한 명 조회
        """
        query = """
            SELECT
                user_id,
                email,
                password_hash,
                created_at
            FROM users
            WHERE email = %s
            LIMIT 1
        """
        rows = BaseRepository.execute_query(query, (email,), conn)
        return UserDTO(**rows[0]) if rows else None

    @staticmethod
    def find_by_email_and_password(email: str, password: str, conn=None) -> Optional[UserDTO]:
        """
        이메일 + 비밀번호로 사용자 인증

        여기서 password는 '평문'이고,
        DB에서 pgcrypto의 crypt() 함수로 해시 비교를 한다.
        """
        query = """
            SELECT
                user_id,
                email,
                password_hash,
                created_at
            FROM users
            WHERE email = %s
              AND password_hash = crypt(%s, password_hash)
            LIMIT 1
        """
        rows = BaseRepository.execute_query(query, (email, password), conn)
        return UserDTO(**rows[0]) if rows else None
