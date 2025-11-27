"""
Auth Router
로그인 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated
from services.auth_service import AuthService
from dto.user_dto import LoginRequestDTO, LoginResponseDTO


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


def get_auth_service() -> AuthService:
    """AuthService 의존성 주입"""
    return AuthService()


@router.post(
    "/login",
    response_model=LoginResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="로그인",
    description="이메일과 비밀번호로 사용자 로그인"
)
def login(
    login_dto: LoginRequestDTO,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """
    로그인 엔드포인트

    Request Body:
        {
          "email": "test1@naver.com",
          "password": "0000"
        }
    """
    try:
        user = auth_service.login(login_dto.email, login_dto.password)
        return LoginResponseDTO(user_id=user.user_id, email=user.email)
    except ValueError as e:
        # 인증 실패
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        # 서버 내부 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다."
        )
