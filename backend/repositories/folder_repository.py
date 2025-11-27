"""
Folder Repository
폴더 관련 데이터베이스 접근 로직 (Raw SQL)
"""
from typing import Optional, List
from .base_repository import BaseRepository
from dto.folder_dto import FolderDTO


class FolderRepository(BaseRepository):
    """폴더 Repository"""

    @staticmethod
    def find_all_by_user_id(user_id: int, conn=None) -> List[FolderDTO]:
        """
        특정 사용자의 모든 폴더 조회

        Args:
            user_id: 사용자 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            폴더 DTO 리스트
        """
        query = """
            SELECT
                folder_id,
                user_id,
                folder_name,
                created_at
            FROM folders
            WHERE user_id = %s
            ORDER BY created_at DESC
        """

        rows = BaseRepository.execute_query(query, (user_id,), conn)
        return [FolderDTO(**row) for row in rows]

    @staticmethod
    def find_by_id(folder_id: int, conn=None) -> Optional[FolderDTO]:
        """
        폴더 ID로 조회

        Args:
            folder_id: 폴더 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            폴더 DTO 또는 None
        """
        query = """
            SELECT
                folder_id,
                user_id,
                folder_name,
                created_at
            FROM folders
            WHERE folder_id = %s
        """

        rows = BaseRepository.execute_query(query, (folder_id,), conn)
        return FolderDTO(**rows[0]) if rows else None

    @staticmethod
    def count_by_user_id(user_id: int, conn=None) -> int:
        """
        사용자의 폴더 개수 조회

        Args:
            user_id: 사용자 ID
            conn: DB 연결 (트랜잭션용)

        Returns:
            폴더 개수
        """
        query = """
            SELECT COUNT(*) as count
            FROM folders
            WHERE user_id = %s
        """

        rows = BaseRepository.execute_query(query, (user_id,), conn)
        return rows[0]['count'] if rows else 0

    @staticmethod
    def create_folder_by_user_id(user_id: int, folder_name: str, conn=None) -> FolderDTO:
        """
        폴더 생성 (Raw SQL, 파라미터 바인딩)
        """
        query = """
            INSERT INTO folders (user_id, folder_name)
            VALUES (%s, %s)
            RETURNING folder_id, user_id, folder_name, created_at, document_count
        """

        rows = BaseRepository.execute_query(query, (user_id, folder_name), conn)
        return FolderDTO(**rows[0])
    
    @staticmethod
    def rename_folder_by_id(folder_id: int, new_name: str, conn=None) -> FolderDTO:
        query = """
            UPDATE folders
            SET folder_name = %s
            WHERE folder_id = %s
            RETURNING folder_id, user_id, folder_name, created_at, document_count
        """
        rows = BaseRepository.execute_query(query, (new_name, folder_id), conn)
        return FolderDTO(**rows[0]) if rows else None

    @staticmethod
    def remove_folder_by_user_id(folder_id: int, conn=None) -> bool:
        """
        폴더 삭제
        - 삭제된 행이 1개 이상이면 True, 아니면 False 반환
        - conn은 psycopg2 connection (FolderService에서 넘겨줌)
        """
        if conn is None:
            # 보통은 Service에서 conn을 넘겨주니까 여기 안 타지만,
            # 안전하게 방어 코드 한 번 넣어둠.
            from .base_repository import BaseRepository  # 순환 import 피하려면 상단에서 해도 OK
            conn = BaseRepository.get_connection()
            close_conn = True
        else:
            close_conn = False

        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM folders
                    WHERE folder_id = %s
                    """,
                    (folder_id,),
                )
                deleted_rows = cur.rowcount  # 영향받은 행 수

            # Service에서 commit/rollback 관리하므로 여기서는 커밋 안 함
            return deleted_rows > 0
        finally:
            # 만약 여기서 새로 만든 conn이면 정리
            if close_conn:
                conn.close()
