"""
FastAPI Main Application
백엔드 애플리케이션 진입점
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router

# FastAPI 앱 생성
app = FastAPI(
    title="Study App API",
    description="학습 애플리케이션 백엔드 API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 파일 저장할 uploaded_files 디렉터리 생성
UPLOAD_DIR = "uploaded_files"
if not os.path.exists(UPLOAD_DIR):
  os.mkdir(UPLOAD_DIR)

# API 라우터 등록
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["health"])
async def root():
    """헬스 체크 엔드포인트"""
    return {
        "status": "ok",
        "message": "Study App API is running"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9000,
        reload=True
    )
