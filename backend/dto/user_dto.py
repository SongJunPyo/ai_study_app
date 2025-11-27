from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserDTO(BaseModel):
    """DB users 테이블과 1:1로 매핑되는 DTO"""
    user_id: int = Field(..., description="사용자 ID")
    email: EmailStr = Field(..., description="사용자 이메일")
    password_hash: str = Field(..., description="비밀번호 해시값")
    created_at: datetime = Field(..., description="생성 시각")

    class Config:
        from_attributes = True


class LoginRequestDTO(BaseModel):
    """로그인 요청 DTO"""
    email: EmailStr = Field(..., description="로그인 이메일")
    password: str = Field(..., min_length=4, description="로그인 비밀번호(평문)")


class LoginResponseDTO(BaseModel):
    """로그인 성공 시 응답 DTO"""
    user_id: int = Field(..., description="사용자 ID")
    email: EmailStr = Field(..., description="사용자 이메일")
