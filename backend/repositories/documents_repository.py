from typing import Optional, List
from .base_repository import BaseRepository
from dto.document_dto import *


class DocumentsRepository(BaseRepository):
    """문서 Repository"""

    @staticmethod
    def insert(doc_data: dict, conn=None) -> int:
        """
        문서 메타데이터 삽입

        Args:
            doc_data: 문서 데이터 (user_id, folder_id, filename, storage_path, summary_text)
            conn: DB 연결 (트랜잭션용)

        Returns:
            생성된 문서 ID
        """
        query = """
            INSERT INTO documents (user_id, folder_id, filename, storage_path, summary_text)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING doc_id
        """

        should_close = conn is None
        if conn is None:
            conn = BaseRepository.get_connection()

        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (
                    doc_data["user_id"],
                    doc_data["folder_id"],
                    doc_data["filename"],
                    doc_data["storage_path"],
                    doc_data["summary_text"]
                ))
                result = cursor.fetchone()
                if should_close:
                    conn.commit()  # 커밋!
                return result['doc_id'] if result else None
        except Exception as e:
            if should_close:
                conn.rollback()
            raise e
        finally:
            if should_close:
                conn.close()

    @staticmethod
    def find_by_doc_id(doc_id: int, conn=None) -> Optional[DocumentDTO]:
        """
        문서 ID로 단건 조회

        Args:
            doc_id: 문서 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            문서 DTO 또는 None
        """
        query = """
            SELECT
                doc_id,
                user_id,
                folder_id,
                filename,
                storage_path,
                summary_text,
                created_at
            FROM documents
            WHERE doc_id = %s
        """
        rows = BaseRepository.execute_query(query, (doc_id,), conn)
        return DocumentDTO(**rows[0]) if rows else None

    @staticmethod
    def find_all_by_folder_id(folder_id: int, conn=None) -> List[DocumentDTO]:
        """
        폴더 내 모든 문서 조회

        Args:
            folder_id: 폴더 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            문서 DTO 리스트
        """
        query = """
            SELECT
                doc_id,
                user_id,
                folder_id,
                filename,
                storage_path,
                summary_text,
                created_at
            FROM documents
            WHERE folder_id = %s
            ORDER BY created_at DESC
        """
        rows = BaseRepository.execute_query(query, (folder_id,), conn)
        return [DocumentDTO(**row) for row in rows]

    @staticmethod
    def count_by_folder_id(folder_id: int, conn=None) -> int:
        """
        폴더 내 문서 개수 조회

        Args:
            folder_id: 폴더 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            문서 개수
        """
        query = """
            SELECT COUNT(*) as count
            FROM documents
            WHERE folder_id = %s
        """
        rows = BaseRepository.execute_query(query, (folder_id,), conn)
        return rows[0]['count'] if rows else 0

    @staticmethod
    def delete_by_doc_id(doc_id: int, conn=None) -> bool:
        """
        문서 삭제

        Args:
            doc_id: 문서 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            삭제 성공 여부
        """
        query = """
            DELETE FROM documents
            WHERE doc_id = %s
        """
        BaseRepository.execute_update(query, (doc_id,), conn)
        return True

    @staticmethod
    def update_filename_and_path(doc_id: int, new_filename: str, new_storage_path: str, conn=None) -> bool:
        """
        문서 파일명 및 저장 경로 업데이트

        Args:
            doc_id: 문서 ID
            new_filename: 새 파일명
            new_storage_path: 새 저장 경로
            conn: DB 연결 (트랜잭션용)

        Returns:
            업데이트 성공 여부
        """
        query = """
            UPDATE documents
            SET filename = %s, storage_path = %s
            WHERE doc_id = %s
        """
        BaseRepository.execute_update(query, (new_filename, new_storage_path, doc_id), conn)
        return True

    @staticmethod
    def update_folder(doc_id: int, new_folder_id: int, new_filename: str, new_storage_path: str, conn=None) -> bool:
        """
        문서 폴더 변경 (폴더 ID, 파일명, 저장 경로 업데이트)

        Args:
            doc_id: 문서 ID
            new_folder_id: 새 폴더 ID
            new_filename: 새 파일명
            new_storage_path: 새 저장 경로
            conn: DB 연결 (트랜잭션용)

        Returns:
            업데이트 성공 여부
        """
        query = """
            UPDATE documents
            SET folder_id = %s, filename = %s, storage_path = %s
            WHERE doc_id = %s
        """
        BaseRepository.execute_update(query, (new_folder_id, new_filename, new_storage_path, doc_id), conn)
        return True
