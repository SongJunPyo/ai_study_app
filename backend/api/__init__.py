"""
API Layer
모든 API 버전을 통합하는 최상위 라우터
"""
from fastapi import APIRouter
from .v1 import router as v1_router

# API 라우터 생성 (prefix는 main.py에서 지정)
router = APIRouter()

# 각 버전별 라우터 등록
router.include_router(v1_router)
