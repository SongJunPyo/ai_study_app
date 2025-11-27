"""
API v1 Router
모든 v1 엔드포인트를 통합하는 라우터
"""
from fastapi import APIRouter
from .folders import router as folders_router
from .documents import router as documents_router
from .auth import router as auth_router


# v1 라우터 생성
router = APIRouter(prefix="/v1")

# 각 도메인별 라우터 등록
router.include_router(folders_router)
router.include_router(documents_router)
router.include_router(auth_router)