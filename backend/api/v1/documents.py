from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import Annotated
from services.document_service import DocumentService
from dto.document_dto import DocumentDTO, DocumentCreateDTO, DocumentListDTO, DocumentRenameDTO, DocumentMoveDTO


router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)


def get_document_service() -> DocumentService:
    """DocumentService 의존성 주입"""
    return DocumentService()

#문서 업로드 + 파일 저장
@router.post(
    "/upload",
    response_model=DocumentDTO,
    status_code=status.HTTP_201_CREATED,
    summary="문서 업로드",
    description="PDF 파일을 업로드하고 메타데이터를 DB에 저장합니다."
)
async def upload_document(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    folder_id: int = Form(...),
    filename: str = Form(None),
    document_service: DocumentService = Depends(get_document_service)
) -> DocumentDTO:
    """
    문서 업로드

    Args:
        file: 업로드할 파일
        user_id: 사용자 ID
        folder_id: 폴더 ID
        filename: 사용자 지정 파일명 (확장자 제외, 선택사항)
        document_service: 문서 서비스 (의존성 주입)

    Returns:
        DocumentDTO: 생성된 문서 정보

    Raises:
        HTTPException: 폴더가 존재하지 않거나 업로드 실패 시
    """
    print(f"[문서 업로드 API] 요청 받음")
    print(f"  - file: {file}")
    print(f"  - user_id: {user_id}")
    print(f"  - folder_id: {folder_id}")
    print(f"  - filename: {filename}")

    try:
        create_dto = DocumentCreateDTO(
            user_id=user_id,
            folder_id=folder_id
        )
        return document_service.upload_file(file, create_dto, custom_filename=filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


# 폴더 내 문서 목록 조회 라우터 
@router.get(
    "/folder/{folder_id}",
    response_model=DocumentListDTO,
    status_code=status.HTTP_200_OK,
    summary="폴더 내 문서 목록 조회",
    description="특정 폴더에 속한 모든 문서를 조회"
)
async def get_documents_by_folder(
    folder_id: int,
    document_service: Annotated[DocumentService, Depends(get_document_service)]
) -> DocumentListDTO:
    try:
        return document_service.get_documents_by_folder(folder_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}"
        )
    
# 폴더 내 문서의 문서 상세 정보 조회 
@router.get(
        "/{doc_id}", 
        response_model = DocumentDTO,
        status_code = status.HTTP_200_OK,
        summary = "폴더 내 문서 상세 조회",
        description ="문서 id로 접근해서 문서에 대한 정보 상세 정보 조회"
)
async def get_document_detail(
    doc_id : int,
    document_service : Annotated[DocumentService , Depends(get_document_service)]
    ) -> DocumentDTO :
    try:
        return document_service.get_document_detail(doc_id)
    except ValueError as e:
        raise HTTPException(
             status_code = status.HTTP_404_NOT_FOUND,
             detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Failed to retrieve documents : {str(e)}"
        )

# 폴더 내 문서 삭제 (업로드한 파일도 삭제)
@router.delete(
    "/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="문서 삭제",
    description="문서를 DB에서 삭제하고 업로드된 파일도 삭제합니다."
)

async def delete_document(
    doc_id: int,
    document_service: Annotated[DocumentService, Depends(get_document_service)]
):
    try:
        document_service.delete_document(doc_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


# 문서 이름 변경
@router.patch(
    "/{doc_id}/rename",
    response_model=DocumentDTO,
    status_code=status.HTTP_200_OK,
    summary="문서 이름 변경",
    description="문서의 파일명을 변경하고 물리적 파일도 함께 변경합니다."
)
async def rename_document(
    doc_id: int,
    rename_dto: DocumentRenameDTO,
    document_service: Annotated[DocumentService, Depends(get_document_service)]
) -> DocumentDTO:
    try:
        return document_service.rename_document(doc_id, rename_dto.new_name)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rename document: {str(e)}"
        )


# 문서 폴더 변경 (이동)
@router.patch(
    "/{doc_id}/move",
    response_model=DocumentDTO,
    status_code=status.HTTP_200_OK,
    summary="문서 폴더 변경",
    description="문서를 다른 폴더로 이동하고 물리적 파일도 함께 이동합니다."
)
async def move_document(
    doc_id: int,
    move_dto: DocumentMoveDTO,
    document_service: Annotated[DocumentService, Depends(get_document_service)]
) -> DocumentDTO:
    try:
        return document_service.move_document(doc_id, move_dto.new_folder_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to move document: {str(e)}"
        )

