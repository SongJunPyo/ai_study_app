"""
Auth Service
로그인 관련 비즈니스 로직
"""
from repositories.user_repository import UserRepository
from dto.user_dto import UserDTO


class AuthService:
    """인증 서비스"""

    def __init__(self):
        self.user_repo = UserRepository()

    def login(self, email: str, password: str) -> UserDTO:
        """
        이메일 + 비밀번호로 로그인

        Returns:
            UserDTO (성공 시)

        Raises:
            ValueError: 이메일 또는 비밀번호가 틀린 경우
        """
        user = self.user_repo.find_by_email_and_password(email, password)

        if not user:
            # 이메일이 없거나 비번이 틀린 경우 모두 여기로
            raise ValueError("이메일 또는 비밀번호가 올바르지 않습니다.")

        return user
