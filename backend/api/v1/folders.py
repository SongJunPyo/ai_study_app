"""
Folders Router
폴더 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated
from services.folder_service import FolderService
from dto.folder_dto import FolderListDTO, FolderDTO, FolderCreateDTO, FolderRenameDTO


router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)


def get_folder_service() -> FolderService:
    """FolderService 의존성 주입"""
    return FolderService()


@router.get(
    "/user/{user_id}",
    response_model=FolderListDTO,
    status_code=status.HTTP_200_OK,
    summary="사용자 폴더 목록 조회",
    description="특정 사용자의 모든 폴더를 조회합니다."
)
async def get_user_folders(
    user_id: int,
    folder_service: Annotated[FolderService, Depends(get_folder_service)]
) -> FolderListDTO:
    """
    사용자의 폴더 목록 조회

    Args:
        user_id: 사용자 ID
        folder_service: 폴더 서비스 (의존성 주입)

    Returns:
        FolderListDTO: 폴더 목록 및 총 개수

    Raises:
        HTTPException: 서버 오류 발생 시
    """
    try:
        return folder_service.get_folders_by_user(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve folders: {str(e)}"
        )


@router.get(
    "/{folder_id}",
    response_model=FolderDTO,
    status_code=status.HTTP_200_OK,
    summary="폴더 단건 조회",
    description="폴더 ID로 특정 폴더를 조회합니다."
)
async def get_folder(
    folder_id: int,
    folder_service: Annotated[FolderService, Depends(get_folder_service)]
) -> FolderDTO:
    """
    폴더 ID로 단건 조회

    Args:
        folder_id: 폴더 ID
        folder_service: 폴더 서비스 (의존성 주입)

    Returns:
        FolderDTO: 폴더 정보

    Raises:
        HTTPException: 폴더가 존재하지 않거나 서버 오류 발생 시
    """
    try:
        return folder_service.get_folder_by_id(folder_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve folder: {str(e)}"
        )

@router.post("", response_model=FolderDTO, status_code=status.HTTP_201_CREATED)
def create_folder(payload: FolderCreateDTO, folder_service: FolderService = Depends(get_folder_service)):
    """
    폴더 생성
    - 요청 검증: Pydantic(FolderCreateDTO)
    - 비즈니스 로직: Service에 위임
    - 응답: DTO 직렬화
    """
    try:
        return folder_service.create_folder(
            user_id=payload.user_id,   # Phase 2에서 토큰/세션에서 추출하도록 변경 권장
            folder_name=payload.folder_name
        )
    except ValueError as e:
        # 예: 유니크 충돌 등을 409로 노출
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create folder")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {e}",
        )
    

# patch: 부분 변경
@router.patch(
    "/{folder_id}/name",
    response_model=FolderDTO,   # Fastapi가 응답 스키마 강제, OpenAPI 문서를 자동으로 생성 
    status_code=status.HTTP_200_OK,
    summary="폴더 이름 변경",
    description="folder_id 기준으로 폴더 이름을 변경합니다."
)
async def rename_folder(
    folder_id: int,
    body: FolderRenameDTO, # 변경하고 싶은 필드 값
    folder_service: Annotated[FolderService, Depends(get_folder_service)]
) -> FolderDTO:
    try:
        # 서비스 시그니처를 folder_id + new_name 형태로 맞추는 것을 권장합니다.
        return folder_service.rename_folder(folder_id, body.new_name)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to rename folder: {str(e)}")


# 자원 제거 
@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="폴더 삭제",
    description="folder_id 기준으로 폴더를 삭제합니다."
)
async def delete_folder(
    folder_id: int,
    folder_service: Annotated[FolderService, Depends(get_folder_service)]
) -> None:
    try:
        folder_service.remove_folder(folder_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete folder: {str(e)}")