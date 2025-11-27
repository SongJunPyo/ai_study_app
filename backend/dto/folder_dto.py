"""
Folder DTO (Data Transfer Object)
계층 간 폴더 데이터 전송을 위한 객체
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FolderDTO(BaseModel):
    """폴더 DTO"""
    folder_id: int = Field(..., description="폴더 ID")
    user_id: int = Field(..., description="사용자 ID")
    folder_name: str = Field(..., description="폴더 이름", max_length=100)
    created_at: datetime = Field(..., description="생성 시각")
    document_count: int = Field(default=0, description="폴더 내 문서 개수")     # updated_at에서 변경

    class Config:
        from_attributes = True  # ORM 모드 (dict 변환 지원)


class FolderCreateDTO(BaseModel):
    """폴더 생성 요청 DTO"""
    user_id: int = Field(..., description="사용자 ID")
    folder_name: str = Field(..., description="폴더 이름", min_length=1, max_length=100)

class FolderListDTO(BaseModel):
    """폴더 목록 응답 DTO"""
    folders: list[FolderDTO] = Field(default_factory=list, description="폴더 목록")
    total: int = Field(..., description="전체 폴더 개수")

class FolderRenameDTO(BaseModel):  # 변경할 파일 이름 검토
    new_name: str = Field(..., min_length=1, max_length=100, description="새 폴더 이름")