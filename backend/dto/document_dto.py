from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DocumentDTO(BaseModel):
    """문서 DTO"""
    doc_id : int = Field(..., description="문서 ID")
    user_id : int  = Field(..., description="사용자 ID")
    folder_id: int = Field(..., description="폴더 ID")
    filename : str = Field(..., description="문서 이름", max_length=255)
    storage_path : str = Field(...,description="파일 저장 경로")
    summary_text : str = Field(..., description = "요약문")
    created_at: datetime = Field(..., description="생성 시각")

    class Config:
        from_attributes = True  # ORM 모드 (dict 변환 지원)


# 문서 업로드 시 서버에 저장할 때 사용자 입력 받아 둘 DTO
class DocumentCreateDTO(BaseModel):
    user_id : int
    folder_id : int



# 폴더 내 문서 리스트 조회 시 이용할 DTO
class DocumentListDTO(BaseModel):
    documents : list[DocumentDTO]
    total : int


# 문서 이름 변경 요청 DTO
class DocumentRenameDTO(BaseModel):
    """문서 이름 변경 요청 DTO"""
    new_name: str = Field(..., min_length=1, max_length=200, description="변경할 파일명 (확장자 제외)")


# 문서 폴더 변경 요청 DTO
class DocumentMoveDTO(BaseModel):
    """문서 폴더 변경 요청 DTO"""
    new_folder_id: int = Field(..., gt=0, description="이동할 폴더 ID")
