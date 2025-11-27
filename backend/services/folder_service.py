"""
Folder Service
폴더 관련 비즈니스 로직
"""
from typing import List
from repositories.folder_repository import FolderRepository
from repositories.documents_repository import DocumentsRepository
from dto.folder_dto import FolderDTO, FolderListDTO
import psycopg2

class FolderService:
    """폴더 서비스"""

    def __init__(self):
        self.folder_repo = FolderRepository()
        self.document_repo = DocumentsRepository()

    def get_folders_by_user(self, user_id: int) -> FolderListDTO:
        """
        사용자의 폴더 목록 조회

        Args:
            user_id: 사용자 ID

        Returns:
            FolderListDTO (폴더 목록 + 총 개수)
        """
        # 폴더 목록 조회
        folders = self.folder_repo.find_all_by_user_id(user_id)

        # 각 폴더의 문서 개수 조회 및 추가
        folders_with_count = []
        for folder in folders:
            # 폴더 내 문서 개수 조회
            doc_count = self.document_repo.count_by_folder_id(folder.folder_id)

            # FolderDTO를 dict로 변환
            folder_dict = folder.model_dump()

            # document_count 필드 추가
            folder_dict['document_count'] = doc_count

            # dict를 다시 FolderDTO로 변환
            folders_with_count.append(FolderDTO(**folder_dict))

        # 총 개수 조회
        total = self.folder_repo.count_by_user_id(user_id)

        return FolderListDTO(
            folders=folders_with_count,
            total=total
        )

    def get_folder_by_id(self, folder_id: int) -> FolderDTO:
        """
        폴더 ID로 단건 조회

        Args:
            folder_id: 폴더 ID

        Returns:
            FolderDTO

        Raises:
            ValueError: 폴더가 존재하지 않을 경우
        """
        folder = self.folder_repo.find_by_id(folder_id)

        if not folder:
            raise ValueError(f"Folder with id {folder_id} not found")

        return folder

    def create_folder(self, user_id: int, folder_name: str) -> FolderDTO:
        conn = self.folder_repo.get_connection()
        try:
            folder = self.folder_repo.create_folder_by_user_id(user_id, folder_name, conn=conn)
            conn.commit()
            return folder
        except psycopg2.errors.UniqueViolation as e:
            conn.rollback()
            # 상위(라우터)에서 409로 변환
            raise ValueError("동일한 이름의 폴더가 이미 존재합니다.")
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def rename_folder(self, folder_id: int, new_name: str) -> FolderDTO:
        conn = self.folder_repo.get_connection()
        try:
            folder = self.folder_repo.rename_folder_by_id(folder_id, new_name, conn=conn)
            if not folder:
                raise ValueError("입력하신 폴더가 존재하지 않습니다.")
            conn.commit()
            return folder
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            raise ValueError("동일한 이름의 폴더가 이미 존재합니다.")
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def remove_folder(self, folder_id: int) -> None:
        conn = self.folder_repo.get_connection()

        try:
            ok = self.folder_repo.remove_folder_by_user_id(folder_id, conn=conn)
            if not ok:
                raise ValueError("입력하신 폴더가 존재하지 않습니다.")
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()