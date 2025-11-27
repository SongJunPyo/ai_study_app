"""
Base Repository
공통 DB 연결 및 쿼리 실행 로직
"""
import psycopg
from psycopg.rows import dict_row
from typing import Optional, Any
import os
from dotenv import load_dotenv
import logging

load_dotenv()   

logger = logging.getLogger(__name__)

class BaseRepository:
    """기본 Repository 클래스"""

    @staticmethod
    def get_connection():
        """DB 연결 생성"""
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")
        database = os.getenv("DB_NAME", "studyapp")
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "")

        logger.info(
            f"Trying DB connection host={host} port={port} db={database} user={user}"
        )

        # psycopg3 (psycopg)
        conn = psycopg.connect(
            host=host,
            port=port,
            dbname=database,     # psycopg3는 dbname 파라미터 사용
            user=user,
            password=password,
            row_factory=dict_row  # SELECT 결과를 dict처럼 다룰 수 있게
        )

        logger.info("✅ DB connection SUCCESS")
        return conn

    @staticmethod
    def execute_query(query: str, params: Optional[tuple] = None, conn=None) -> list[dict]:
        """
        SELECT 쿼리 실행

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터
            conn: 기존 연결 (트랜잭션용)

        Returns:
            쿼리 결과 리스트
        """
        should_close = conn is None
        if conn is None:
            conn = BaseRepository.get_connection()

        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                result = cursor.fetchall()
                return [dict(row) for row in result]
        finally:
            if should_close:
                conn.close()

    @staticmethod
    def execute_update(query: str, params: Optional[tuple] = None, conn=None) -> int:
        """
        INSERT/UPDATE/DELETE 쿼리 실행

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터
            conn: 기존 연결 (트랜잭션용)

        Returns:
            영향받은 행 수
        """
        should_close = conn is None
        if conn is None:
            conn = BaseRepository.get_connection()

        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                if should_close:
                    conn.commit()
                return cursor.rowcount
        except Exception as e:
            if should_close:
                conn.rollback()
            raise e
        finally:
            if should_close:
                conn.close()
