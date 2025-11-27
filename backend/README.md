# 📚 Study App - Backend API 명세서 (Non-ORM 버전)

## 프로젝트 개요

간격 반복 학습(Spaced Repetition) 기반의 AI 학습 지원 시스템 백엔드 API

**기술 스택:**
- Python 3.10+
- Flask 3.0 / FastAPI 0.100+
- PostgreSQL 16 + pgvector
- LangChain + OpenAI API
- **psycopg2 (Raw SQL, No ORM)**

---

## 🏗️ 아키텍처 개요

### Layer Architecture (계층 구조)

```
┌─────────────────────────────────────────┐
│         Router Layer (라우터)            │  ← HTTP 요청/응답 처리
│    - 엔드포인트 정의                      │
│    - 요청 검증 (Pydantic)                │
│    - 응답 직렬화                          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│        Service Layer (서비스)            │  ← 비즈니스 로직
│    - 복잡한 비즈니스 규칙                 │
│    - 트랜잭션 관리                        │
│    - 외부 서비스 호출 (RAG, OpenAI)      │
│    - 여러 Repository 조율                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      Repository Layer (리포지토리)       │  ← 데이터 접근 계층
│    - Raw SQL 쿼리 실행                   │
│    - CRUD 연산                           │
│    - 파라미터화된 쿼리 (SQL Injection 방지)│
│    - DB 연결 관리                        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         DTO Layer (데이터 전송 객체)     │  ← 데이터 구조 정의
│    - Python dataclass / Pydantic        │
│    - 타입 안정성                          │
│    - 직렬화/역직렬화                      │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │  ← 데이터 저장소
│    - 테이블 스키마                        │
│    - 인덱스, 제약조건                     │
│    - pgvector 벡터 검색                  │
└─────────────────────────────────────────┘
```

### ORM vs Non-ORM 차이점

| 계층 | ORM 사용 시 | Non-ORM (Raw SQL) |
|------|-------------|-------------------|
| **Router** | 동일 | 동일 |
| **Service** | ORM 엔티티 객체 다룸 | DTO 객체 다룸 |
| **Repository** | ORM 메서드 사용 (`.save()`, `.query()`) | Raw SQL + psycopg2 |
| **Entity/DTO** | SQLAlchemy 모델 클래스 | Pydantic/dataclass DTO |
| **트랜잭션** | Session.commit() | Connection.commit() |

### 디렉토리 구조

```
backend/
├── app.py                      # Flask/FastAPI 앱 진입점
├── config.py                   # 설정 관리
├── requirements.txt
├── .env
│
├── api/                        # Router Layer
│   ├── __init__.py
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── folders.py          # 폴더 라우터
│   │   ├── materials.py        # 학습 자료 라우터
│   │   ├── reviews.py          # 복습 라우터
│   │   ├── statistics.py       # 통계 라우터
│   │   └── auth.py             # 인증 라우터 (Phase 2)
│   └── schemas.py              # Pydantic 스키마 (요청/응답)
│
├── services/                   # Service Layer
│   ├── __init__.py
│   ├── folder_service.py       # 폴더 비즈니스 로직
│   ├── material_service.py     # 자료 비즈니스 로직
│   ├── review_service.py       # 복습 비즈니스 로직
│   ├── statistics_service.py   # 통계 비즈니스 로직
│   ├── rag_service.py          # RAG 통합 로직
│   └── quiz_parser.py          # LLM 출력 파싱
│
├── repositories/               # Repository Layer (Raw SQL)
│   ├── __init__.py
│   ├── base_repository.py      # 공통 DB 연결 로직
│   ├── folder_repository.py
│   ├── material_repository.py
│   ├── document_repository.py
│   ├── problem_repository.py
│   └── review_history_repository.py
│
├── dto/                        # DTO Layer (Data Transfer Objects)
│   ├── __init__.py
│   ├── folder_dto.py           # Folder DTO
│   ├── material_dto.py         # Material DTO
│   ├── problem_dto.py          # Problem DTO
│   └── review_dto.py           # Review DTO
│
├── database/                   # Database Layer
│   ├── __init__.py
│   ├── connection.py           # DB 연결 풀 관리
│   └── schema.sql              # 테이블 스키마 정의
│
├── utils/                      # 유틸리티
│   ├── __init__.py
│   ├── date_utils.py           # 간격 반복 학습 알고리즘
│   ├── file_utils.py           # 파일 업로드/삭제
│   └── response.py             # 표준 응답 포맷
│
├── middleware/                 # 미들웨어
│   ├── __init__.py
│   ├── error_handler.py        # 전역 에러 핸들러
│   └── auth_middleware.py      # 인증 미들웨어
│
└── Ragservice/                 # RAG 모듈 (재사용)
    ├── rag_pipeline.py
    ├── pdf_loader.py
    └── ...
```

---

## 1. Router Layer (라우터 계층)

### 역할
- HTTP 요청을 받아 적절한 서비스로 전달
- 요청 데이터 검증 (Pydantic)
- 응답 직렬화 및 HTTP 상태 코드 반환
- **비즈니스 로직 포함 금지** (Service Layer에 위임)

**ORM과 차이 없음 - Router는 동일하게 작성**

### 1.1 Folders Router (폴더 관리)

**파일:** `api/v1/folders.py`

#### 엔드포인트 명세

##### 1) 폴더 목록 조회
```python
from fastapi import APIRouter, Header, Depends
from api.schemas import FolderListResponse
from services.folder_service import FolderService
from utils.response import success_response

router = APIRouter(prefix="/api/v1", tags=["folders"])

@router.get("/folders", response_model=FolderListResponse)
def get_folders(
    user_id: str = Header(..., alias="X-User-ID"),
    folder_service: FolderService = Depends()
):
    """
    사용자의 모든 폴더 조회

    Headers:
        X-User-ID: 사용자 UUID

    Returns:
        200: 폴더 목록
        401: 인증 실패
    """
    folders = folder_service.get_user_folders(user_id)
    return success_response(folders)
```

**Request:**
```http
GET /api/v1/folders
Headers:
  X-User-ID: 550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "uuid",
        "name": "컴퓨터 과학",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

##### 2) 폴더 생성
```python
@router.post("/folders", response_model=FolderResponse, status_code=201)
def create_folder(
    request: CreateFolderRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    folder_service: FolderService = Depends()
):
    """
    새 폴더 생성

    Body:
        name: 폴더 이름

    Returns:
        201: 생성된 폴더
        400: 잘못된 요청
    """
    folder = folder_service.create_folder(user_id, request.name)
    return success_response(folder, status_code=201)
```

##### 3) 폴더 이름 변경
```python
@router.put("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    request: UpdateFolderRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    folder_service: FolderService = Depends()
):
    """
    폴더 이름 수정

    Path:
        folder_id: 폴더 UUID

    Body:
        name: 새 폴더 이름

    Returns:
        200: 수정된 폴더
        403: 권한 없음
        404: 폴더 없음
    """
    folder = folder_service.update_folder(user_id, folder_id, request.name)
    return success_response(folder)
```

##### 4) 폴더 삭제
```python
from fastapi import Response

@router.delete("/folders/{folder_id}", status_code=204)
def delete_folder(
    folder_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    folder_service: FolderService = Depends()
):
    """
    폴더 삭제 (자료는 folder_id=NULL 처리)

    Path:
        folder_id: 폴더 UUID

    Returns:
        204: 삭제 완료
        403: 권한 없음
        404: 폴더 없음
    """
    folder_service.delete_folder(user_id, folder_id)
    return Response(status_code=204)
```

---

### 1.2 Materials Router (학습 자료 관리)

**파일:** `api/v1/materials.py`

#### 핵심 엔드포인트

##### 1) 자료 생성 (핵심 기능)
```python
from fastapi import UploadFile, File, Form

@router.post("/materials", response_model=MaterialResponse, status_code=201)
async def create_material(
    folder_id: str = Form(...),
    title: str = Form(...),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    user_id: str = Header(..., alias="X-User-ID"),
    material_service: MaterialService = Depends()
):
    """
    학습 자료 생성 (PDF 업로드 또는 텍스트 입력)

    Form Data:
        folder_id: 폴더 UUID
        title: 자료 제목
        file: PDF 파일 (선택)
        text: 직접 입력 텍스트 (선택)

    비즈니스 로직:
        1. PDF/텍스트 처리
        2. RAG 파이프라인 실행 (OCR, 청킹, 임베딩)
        3. AI 요약 생성
        4. 자료 저장 (next_review_date = 1일 후)

    Returns:
        201: 생성된 자료 (요약 포함)
        400: file과 text 둘 다 없거나 둘 다 있음
    """
    if not file and not text:
        raise BadRequestError("file 또는 text 중 하나는 필수입니다.")
    if file and text:
        raise BadRequestError("file과 text는 동시에 제공할 수 없습니다.")

    material = await material_service.create_material(
        user_id=user_id,
        folder_id=folder_id,
        title=title,
        file=file,
        text=text
    )
    return success_response(material, status_code=201)
```

##### 2) 퀴즈 제출 및 채점
```python
@router.post("/materials/{material_id}/submit-review", response_model=ReviewResultResponse)
def submit_review(
    material_id: str,
    request: SubmitReviewRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    review_service: ReviewService = Depends()
):
    """
    퀴즈 제출 및 채점

    Body:
        results: [
          { "problemId": "uuid", "userAnswer": "답변", "isCorrect": true/false }
        ]

    Returns:
        200: {
          "score": 85.0,
          "correctCount": 17,
          "totalCount": 20,
          "nextReview": "2025-01-18T00:00:00Z",
          "reviewCount": 2
        }
    """
    result = review_service.submit_review(user_id, material_id, request.results)
    return success_response(result)
```

---

## 2. Service Layer (서비스 계층)

### 역할
- 비즈니스 로직 구현
- **트랜잭션 관리** (begin, commit, rollback)
- 여러 Repository 조율
- 외부 서비스 호출 (RAG, OpenAI)
- **DTO 객체로 작업** (ORM 엔티티 대신)

### 2.1 FolderService (폴더 서비스)

**파일:** `services/folder_service.py`

```python
from typing import List
from dto.folder_dto import FolderDTO
from repositories.folder_repository import FolderRepository
from database.connection import get_db_connection
from middleware.exceptions import NotFoundError, ForbiddenError, ValidationError

class FolderService:
    """폴더 관리 비즈니스 로직"""

    def __init__(self, folder_repo: FolderRepository):
        self.folder_repo = folder_repo

    def get_user_folders(self, user_id: str) -> List[FolderDTO]:
        """
        사용자의 모든 폴더 조회

        비즈니스 규칙:
            - created_at 내림차순 정렬
        """
        folders = self.folder_repo.find_by_user_id(user_id)
        return folders  # Repository가 이미 DTO 리스트 반환

    def create_folder(self, user_id: str, name: str) -> FolderDTO:
        """
        폴더 생성

        비즈니스 규칙:
            - 이름 중복 허용
            - 이름 길이: 1~255자

        Raises:
            ValidationError: 이름이 비어있거나 너무 긴 경우
        """
        if not name or len(name) > 255:
            raise ValidationError("폴더 이름은 1~255자여야 합니다.")

        # Repository에 DTO 전달
        folder_data = {
            "user_id": user_id,
            "name": name
        }

        saved_folder = self.folder_repo.create(folder_data)
        return saved_folder

    def update_folder(self, user_id: str, folder_id: str, name: str) -> FolderDTO:
        """
        폴더 이름 변경

        Raises:
            NotFoundError: 폴더가 없음
            ForbiddenError: 권한 없음 (다른 사용자의 폴더)
        """
        # 1. 권한 확인
        folder = self.folder_repo.find_by_id(folder_id)
        if not folder:
            raise NotFoundError("폴더를 찾을 수 없습니다.")

        if folder.user_id != user_id:
            raise ForbiddenError("이 폴더에 접근할 권한이 없습니다.")

        # 2. 업데이트
        updated = self.folder_repo.update(folder_id, {"name": name})
        return updated

    def delete_folder(self, user_id: str, folder_id: str) -> None:
        """
        폴더 삭제

        비즈니스 규칙:
            - 폴더 내 자료들은 folder_id=NULL로 설정 (자료는 유지)
            - 트랜잭션으로 묶어서 처리

        Raises:
            NotFoundError: 폴더가 없음
            ForbiddenError: 권한 없음
        """
        # 1. 권한 확인
        folder = self.folder_repo.find_by_id(folder_id)
        if not folder:
            raise NotFoundError("폴더를 찾을 수 없습니다.")

        if folder.user_id != user_id:
            raise ForbiddenError("이 폴더에 접근할 권한이 없습니다.")

        # 2. 트랜잭션 시작
        conn = get_db_connection()
        try:
            # 2-1. 자료들의 folder_id를 NULL로 설정
            self.folder_repo.unlink_materials(folder_id, conn)

            # 2-2. 폴더 삭제
            self.folder_repo.delete(folder_id, conn)

            # 2-3. 커밋
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()
```

---

### 2.2 MaterialService (학습 자료 서비스)

**파일:** `services/material_service.py`

```python
from typing import Optional, List
from fastapi import UploadFile
from dto.material_dto import MaterialDTO, MaterialDetailDTO
from repositories.material_repository import MaterialRepository
from repositories.document_repository import DocumentRepository
from repositories.problem_repository import ProblemRepository
from repositories.review_history_repository import ReviewHistoryRepository
from services.rag_service import RAGService
from utils.file_utils import FileUtils
from utils.date_utils import calculate_next_review_date
from database.connection import get_db_connection
from middleware.exceptions import ValidationError, RAGProcessError
import uuid
from datetime import datetime

class MaterialService:
    """학습 자료 관리 비즈니스 로직"""

    def __init__(
        self,
        material_repo: MaterialRepository,
        document_repo: DocumentRepository,
        problem_repo: ProblemRepository,
        review_history_repo: ReviewHistoryRepository,
        rag_service: RAGService,
        file_utils: FileUtils
    ):
        self.material_repo = material_repo
        self.document_repo = document_repo
        self.problem_repo = problem_repo
        self.review_history_repo = review_history_repo
        self.rag_service = rag_service
        self.file_utils = file_utils

    async def create_material(
        self,
        user_id: str,
        folder_id: str,
        title: str,
        file: Optional[UploadFile] = None,
        text: Optional[str] = None
    ) -> MaterialDTO:
        """
        학습 자료 생성 (핵심 비즈니스 로직)

        프로세스:
            1. PDF 업로드 또는 텍스트 저장
            2. documents 테이블에 메타데이터 저장
            3. RAG 파이프라인 실행:
               - PDF OCR / 텍스트 청킹
               - 임베딩 생성 및 저장
            4. AI 요약 생성
            5. materials 테이블에 저장
               - next_review_date = 1일 후

        Raises:
            ValidationError: 입력 데이터 오류
            RAGProcessError: RAG 처리 실패
        """
        conn = get_db_connection()
        doc_id = str(uuid.uuid4())
        file_path = None

        try:
            # 1. 파일 또는 텍스트 처리
            if file:
                # PDF 파일 저장
                file_path = await self.file_utils.save_pdf(file)
                filename = file.filename
                content_type = "pdf"
            else:
                # 텍스트 저장 (파일 없음)
                file_path = None
                filename = f"{title}.txt"
                content_type = "text"

            # 2. Document 레코드 생성
            document_data = {
                "doc_id": doc_id,
                "user_id": user_id,
                "folder_id": folder_id,
                "filename": filename,
                "storage_path": file_path
            }
            self.document_repo.create(document_data, conn)

            # 3. RAG 파이프라인 실행
            if content_type == "pdf":
                await self.rag_service.process_pdf(file_path, doc_id)
            else:
                await self.rag_service.process_text(text, doc_id)

            # 4. AI 요약 생성
            summary = await self.rag_service.generate_summary(doc_id, user_id)

            # 5. Material 레코드 생성
            material_id = str(uuid.uuid4())
            material_data = {
                "material_id": material_id,
                "doc_id": doc_id,
                "folder_id": folder_id,
                "user_id": user_id,
                "title": title,
                "summary": summary,
                "problem_config_mc": 5,
                "problem_config_tf": 5,
                "review_count": 0,
                "average_score": 0.0,
                "next_review_date": calculate_next_review_date(0)  # 1일 후
            }
            saved_material = self.material_repo.create(material_data, conn)

            # 6. 커밋
            conn.commit()

            return saved_material

        except Exception as e:
            # 롤백
            conn.rollback()

            # 저장된 파일 삭제
            if file_path:
                self.file_utils.delete_file(file_path)

            raise RAGProcessError(f"자료 생성 중 오류 발생: {str(e)}")
        finally:
            conn.close()

    def get_materials(
        self,
        user_id: str,
        folder_id: Optional[str] = None
    ) -> List[MaterialDTO]:
        """
        자료 목록 조회

        비즈니스 규칙:
            - folder_id가 있으면 해당 폴더만 필터링
            - created_at 내림차순 정렬
            - review_history JOIN
        """
        if folder_id:
            materials = self.material_repo.find_by_folder(user_id, folder_id)
        else:
            materials = self.material_repo.find_by_user(user_id)

        # review_history 함께 로드
        for material in materials:
            history = self.review_history_repo.find_by_material(material.material_id)
            material.review_history = history

        return materials
```

---

### 2.3 ReviewService (복습 서비스)

**파일:** `services/review_service.py`

```python
from typing import List
from dto.problem_dto import ProblemDTO
from dto.review_dto import ReviewResultDTO, ReviewResultInput
from repositories.material_repository import MaterialRepository
from repositories.problem_repository import ProblemRepository
from repositories.review_history_repository import ReviewHistoryRepository
from services.rag_service import RAGService
from services.quiz_parser import parse_quiz_text
from utils.date_utils import calculate_next_review_date
from database.connection import get_db_connection
from middleware.exceptions import NotFoundError
from datetime import datetime
import uuid

class ReviewService:
    """복습 관리 비즈니스 로직"""

    def __init__(
        self,
        material_repo: MaterialRepository,
        problem_repo: ProblemRepository,
        review_history_repo: ReviewHistoryRepository,
        rag_service: RAGService
    ):
        self.material_repo = material_repo
        self.problem_repo = problem_repo
        self.review_history_repo = review_history_repo
        self.rag_service = rag_service

    async def start_review(self, user_id: str, material_id: str) -> List[ProblemDTO]:
        """
        복습 시작 (문제 생성 또는 반환)

        비즈니스 로직:
            1. 기존 문제(틀린 문제)가 있는가?
               YES → 기존 문제 반환
               NO  → AI로 새 문제 생성 후 저장

        Returns:
            문제 목록 (객관식 + O/X)
        """
        # 1. 권한 확인
        material = self.material_repo.find_by_id(material_id)
        if not material or material.user_id != user_id:
            raise NotFoundError("자료를 찾을 수 없습니다.")

        # 2. 기존 문제 확인
        existing_problems = self.problem_repo.find_by_material(material_id)

        if existing_problems:
            # 틀린 문제가 있으면 재사용
            return existing_problems

        # 3. 새 문제 생성
        problems = await self._generate_new_problems(material)

        return problems

    async def _generate_new_problems(self, material) -> List[ProblemDTO]:
        """
        AI로 새 문제 생성

        프로세스:
            1. RAG로 문제 텍스트 생성
            2. LLM 출력 파싱 (텍스트 → JSON)
            3. problems 테이블에 저장
        """
        conn = get_db_connection()

        try:
            # 1. AI 문제 생성
            quiz_text = await self.rag_service.generate_quiz(
                doc_id=material.doc_id,
                user_id=material.user_id,
                mc_count=material.problem_config_mc,
                tf_count=material.problem_config_tf
            )

            # 2. 텍스트 파싱 → JSON
            parsed_problems = parse_quiz_text(quiz_text)

            # 3. problems 테이블에 저장
            problems = []
            for data in parsed_problems:
                problem_data = {
                    "problem_id": str(uuid.uuid4()),
                    "material_id": material.material_id,
                    "type": data['type'],
                    "question": data['question'],
                    "options": data.get('options'),
                    "correct_answer": data['correct_answer'],
                    "explanation": data['explanation']
                }
                saved = self.problem_repo.create(problem_data, conn)
                problems.append(saved)

            conn.commit()
            return problems

        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()

    def submit_review(
        self,
        user_id: str,
        material_id: str,
        results: List[ReviewResultInput]
    ) -> ReviewResultDTO:
        """
        퀴즈 제출 및 채점 (핵심 비즈니스 로직)

        프로세스:
            1. 채점 (score, correctCount, totalCount)
            2. 정답 맞춘 문제 삭제 (틀린 문제만 유지)
            3. review_history 추가
            4. materials 업데이트:
               - reviewCount++
               - averageScore 재계산
               - lastReview = NOW()
               - nextReview = calculate_next_review_date(reviewCount)

        Returns:
            {
              "score": 85.0,
              "correctCount": 17,
              "totalCount": 20,
              "nextReview": "2025-01-18T00:00:00Z",
              "reviewCount": 2
            }
        """
        # 1. 권한 확인
        material = self.material_repo.find_by_id(material_id)
        if not material or material.user_id != user_id:
            raise NotFoundError("자료를 찾을 수 없습니다.")

        conn = get_db_connection()

        try:
            # 2. 채점
            total_count = len(results)
            correct_count = sum(1 for r in results if r.is_correct)
            score = (correct_count / total_count * 100) if total_count > 0 else 0

            # 3. 정답 맞춘 문제 삭제
            correct_problem_ids = [r.problem_id for r in results if r.is_correct]
            if correct_problem_ids:
                self.problem_repo.delete_by_ids(correct_problem_ids, conn)

            # 4. review_history 추가
            history_data = {
                "history_id": str(uuid.uuid4()),
                "material_id": material_id,
                "score": round(score, 2),
                "correct_count": correct_count,
                "total_count": total_count,
                "review_date": datetime.now()
            }
            self.review_history_repo.create(history_data, conn)

            # 5. materials 업데이트
            new_review_count = material.review_count + 1

            # 평균 점수 재계산
            all_history = self.review_history_repo.find_by_material(material_id)
            new_average_score = sum(h.score for h in all_history) / len(all_history)

            # 다음 복습 날짜 계산 (간격 반복 학습)
            next_review_date = calculate_next_review_date(new_review_count)

            update_data = {
                "review_count": new_review_count,
                "average_score": round(new_average_score, 2),
                "last_review_date": datetime.now(),
                "next_review_date": next_review_date
            }
            self.material_repo.update(material_id, update_data, conn)

            # 6. 커밋
            conn.commit()

            return ReviewResultDTO(
                score=round(score, 2),
                correct_count=correct_count,
                total_count=total_count,
                next_review=next_review_date.isoformat(),
                review_count=new_review_count
            )

        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()
```

---

## 3. Repository Layer (리포지토리 계층) - Raw SQL

### 역할
- **Raw SQL 쿼리 실행** (psycopg2 사용)
- CRUD 연산
- **파라미터화된 쿼리** (SQL Injection 방지)
- DB 연결 관리
- **쿼리 결과를 DTO로 변환**

### 3.1 BaseRepository (공통 로직)

**파일:** `repositories/base_repository.py`

```python
import psycopg2
from psycopg2.extras import RealDictCursor
from database.connection import get_db_connection

class BaseRepository:
    """Repository 공통 기능"""

    def execute_query(self, query: str, params: tuple = None, conn=None):
        """
        SELECT 쿼리 실행

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터 (튜플)
            conn: DB 연결 (없으면 자동 생성 및 종료)

        Returns:
            결과 리스트 (dict 형태)
        """
        should_close = False
        if conn is None:
            conn = get_db_connection()
            should_close = True

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            return results
        finally:
            if should_close:
                conn.close()

    def execute_one(self, query: str, params: tuple = None, conn=None):
        """단일 레코드 조회"""
        results = self.execute_query(query, params, conn)
        return results[0] if results else None

    def execute_insert(self, query: str, params: tuple = None, conn=None, returning=True):
        """
        INSERT 쿼리 실행

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터
            conn: DB 연결
            returning: RETURNING 절 포함 여부

        Returns:
            생성된 레코드 (RETURNING 사용 시)
        """
        should_close = False
        if conn is None:
            conn = get_db_connection()
            should_close = True

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)

            if returning:
                result = cursor.fetchone()
            else:
                result = None

            cursor.close()

            if should_close:
                conn.commit()

            return result
        finally:
            if should_close:
                conn.close()

    def execute_update(self, query: str, params: tuple = None, conn=None):
        """UPDATE/DELETE 쿼리 실행"""
        should_close = False
        if conn is None:
            conn = get_db_connection()
            should_close = True

        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rowcount = cursor.rowcount
            cursor.close()

            if should_close:
                conn.commit()

            return rowcount
        finally:
            if should_close:
                conn.close()
```

---

### 3.2 FolderRepository

**파일:** `repositories/folder_repository.py`

```python
from typing import List, Optional
from repositories.base_repository import BaseRepository
from dto.folder_dto import FolderDTO

class FolderRepository(BaseRepository):
    """폴더 데이터 접근 계층 (Raw SQL)"""

    def find_by_id(self, folder_id: str) -> Optional[FolderDTO]:
        """
        ID로 폴더 조회

        SQL:
            SELECT * FROM folders WHERE folder_id = %s
        """
        query = """
            SELECT folder_id, user_id, name, created_at
            FROM folders
            WHERE folder_id = %s
        """

        result = self.execute_one(query, (folder_id,))

        if result:
            return FolderDTO(
                id=str(result['folder_id']),
                user_id=str(result['user_id']),
                name=result['name'],
                created_at=result['created_at'].isoformat()
            )
        return None

    def find_by_user_id(self, user_id: str) -> List[FolderDTO]:
        """
        사용자의 모든 폴더 조회 (created_at 내림차순)

        SQL:
            SELECT * FROM folders
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        query = """
            SELECT folder_id, user_id, name, created_at
            FROM folders
            WHERE user_id = %s
            ORDER BY created_at DESC
        """

        results = self.execute_query(query, (user_id,))

        return [
            FolderDTO(
                id=str(row['folder_id']),
                user_id=str(row['user_id']),
                name=row['name'],
                created_at=row['created_at'].isoformat()
            )
            for row in results
        ]

    def create(self, folder_data: dict, conn=None) -> FolderDTO:
        """
        폴더 생성

        SQL:
            INSERT INTO folders (folder_id, user_id, name)
            VALUES (gen_random_uuid(), %s, %s)
            RETURNING *
        """
        query = """
            INSERT INTO folders (folder_id, user_id, name)
            VALUES (gen_random_uuid(), %s, %s)
            RETURNING folder_id, user_id, name, created_at
        """

        result = self.execute_insert(
            query,
            (folder_data['user_id'], folder_data['name']),
            conn
        )

        return FolderDTO(
            id=str(result['folder_id']),
            user_id=str(result['user_id']),
            name=result['name'],
            created_at=result['created_at'].isoformat()
        )

    def update(self, folder_id: str, update_data: dict, conn=None) -> FolderDTO:
        """
        폴더 업데이트

        SQL:
            UPDATE folders
            SET name = %s
            WHERE folder_id = %s
            RETURNING *
        """
        query = """
            UPDATE folders
            SET name = %s
            WHERE folder_id = %s
            RETURNING folder_id, user_id, name, created_at
        """

        result = self.execute_insert(
            query,
            (update_data['name'], folder_id),
            conn,
            returning=True
        )

        return FolderDTO(
            id=str(result['folder_id']),
            user_id=str(result['user_id']),
            name=result['name'],
            created_at=result['created_at'].isoformat()
        )

    def delete(self, folder_id: str, conn=None) -> None:
        """
        폴더 삭제

        SQL:
            DELETE FROM folders WHERE folder_id = %s
        """
        query = "DELETE FROM folders WHERE folder_id = %s"
        self.execute_update(query, (folder_id,), conn)

    def unlink_materials(self, folder_id: str, conn=None) -> None:
        """
        폴더 내 자료들의 folder_id를 NULL로 설정

        SQL:
            UPDATE materials
            SET folder_id = NULL
            WHERE folder_id = %s
        """
        query = """
            UPDATE materials
            SET folder_id = NULL
            WHERE folder_id = %s
        """
        self.execute_update(query, (folder_id,), conn)
```

---

### 3.3 MaterialRepository

**파일:** `repositories/material_repository.py`

```python
from typing import List, Optional
from repositories.base_repository import BaseRepository
from dto.material_dto import MaterialDTO

class MaterialRepository(BaseRepository):
    """학습 자료 데이터 접근 계층 (Raw SQL)"""

    def find_by_id(self, material_id: str) -> Optional[MaterialDTO]:
        """
        ID로 자료 조회

        SQL:
            SELECT * FROM materials WHERE material_id = %s
        """
        query = """
            SELECT
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, last_review_date, next_review_date,
                created_at, updated_at
            FROM materials
            WHERE material_id = %s
        """

        result = self.execute_one(query, (material_id,))

        if result:
            return self._row_to_dto(result)
        return None

    def find_by_user(self, user_id: str) -> List[MaterialDTO]:
        """
        사용자의 모든 자료 조회 (created_at 내림차순)

        SQL:
            SELECT * FROM materials
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        query = """
            SELECT
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, last_review_date, next_review_date,
                created_at, updated_at
            FROM materials
            WHERE user_id = %s
            ORDER BY created_at DESC
        """

        results = self.execute_query(query, (user_id,))

        return [self._row_to_dto(row) for row in results]

    def find_by_folder(self, user_id: str, folder_id: str) -> List[MaterialDTO]:
        """
        특정 폴더의 자료 조회

        SQL:
            SELECT * FROM materials
            WHERE user_id = %s AND folder_id = %s
            ORDER BY created_at DESC
        """
        query = """
            SELECT
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, last_review_date, next_review_date,
                created_at, updated_at
            FROM materials
            WHERE user_id = %s AND folder_id = %s
            ORDER BY created_at DESC
        """

        results = self.execute_query(query, (user_id, folder_id))

        return [self._row_to_dto(row) for row in results]

    def create(self, material_data: dict, conn=None) -> MaterialDTO:
        """
        자료 생성

        SQL:
            INSERT INTO materials (...)
            VALUES (...)
            RETURNING *
        """
        query = """
            INSERT INTO materials (
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, next_review_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, last_review_date, next_review_date,
                created_at, updated_at
        """

        result = self.execute_insert(
            query,
            (
                material_data['material_id'],
                material_data['doc_id'],
                material_data['folder_id'],
                material_data['user_id'],
                material_data['title'],
                material_data['summary'],
                material_data['problem_config_mc'],
                material_data['problem_config_tf'],
                material_data['review_count'],
                material_data['average_score'],
                material_data['next_review_date']
            ),
            conn
        )

        return self._row_to_dto(result)

    def update(self, material_id: str, update_data: dict, conn=None) -> MaterialDTO:
        """
        자료 업데이트 (동적 필드)

        SQL:
            UPDATE materials
            SET field1 = %s, field2 = %s, ...
            WHERE material_id = %s
            RETURNING *
        """
        # 동적으로 SET 절 생성
        set_clauses = []
        params = []

        for key, value in update_data.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)

        params.append(material_id)

        query = f"""
            UPDATE materials
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE material_id = %s
            RETURNING
                material_id, doc_id, folder_id, user_id, title, summary,
                problem_config_mc, problem_config_tf,
                review_count, average_score, last_review_date, next_review_date,
                created_at, updated_at
        """

        result = self.execute_insert(query, tuple(params), conn, returning=True)

        return self._row_to_dto(result)

    def delete(self, material_id: str, conn=None) -> None:
        """
        자료 삭제 (CASCADE로 관련 레코드도 삭제)

        SQL:
            DELETE FROM materials WHERE material_id = %s
        """
        query = "DELETE FROM materials WHERE material_id = %s"
        self.execute_update(query, (material_id,), conn)

    def _row_to_dto(self, row) -> MaterialDTO:
        """DB 레코드 → DTO 변환"""
        return MaterialDTO(
            id=str(row['material_id']),
            doc_id=str(row['doc_id']),
            folder_id=str(row['folder_id']) if row['folder_id'] else None,
            user_id=str(row['user_id']),
            title=row['title'],
            summary=row['summary'],
            problem_config={"multipleChoice": row['problem_config_mc'], "trueFalse": row['problem_config_tf']},
            review_count=row['review_count'],
            average_score=float(row['average_score']),
            last_review=row['last_review_date'].isoformat() if row['last_review_date'] else None,
            next_review=row['next_review_date'].isoformat() if row['next_review_date'] else None,
            created_at=row['created_at'].isoformat(),
            review_history=[]  # Service에서 별도로 채움
        )
```

---

### 3.4 ProblemRepository

**파일:** `repositories/problem_repository.py`

```python
from typing import List
from repositories.base_repository import BaseRepository
from dto.problem_dto import ProblemDTO
import json

class ProblemRepository(BaseRepository):
    """문제 데이터 접근 계층 (Raw SQL)"""

    def find_by_material(self, material_id: str) -> List[ProblemDTO]:
        """
        자료의 모든 문제 조회 (틀린 문제만)

        SQL:
            SELECT * FROM problems WHERE material_id = %s
        """
        query = """
            SELECT
                problem_id, material_id, type, question,
                options, correct_answer, explanation, created_at
            FROM problems
            WHERE material_id = %s
        """

        results = self.execute_query(query, (material_id,))

        return [self._row_to_dto(row) for row in results]

    def create(self, problem_data: dict, conn=None) -> ProblemDTO:
        """
        문제 생성

        SQL:
            INSERT INTO problems (...)
            VALUES (...)
            RETURNING *
        """
        query = """
            INSERT INTO problems (
                problem_id, material_id, type, question,
                options, correct_answer, explanation
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING
                problem_id, material_id, type, question,
                options, correct_answer, explanation, created_at
        """

        # options를 JSONB로 변환
        options_json = json.dumps(problem_data.get('options')) if problem_data.get('options') else None

        result = self.execute_insert(
            query,
            (
                problem_data['problem_id'],
                problem_data['material_id'],
                problem_data['type'],
                problem_data['question'],
                options_json,
                problem_data['correct_answer'],
                problem_data['explanation']
            ),
            conn
        )

        return self._row_to_dto(result)

    def delete_by_ids(self, problem_ids: List[str], conn=None) -> None:
        """
        문제 일괄 삭제 (정답 맞춘 문제)

        SQL:
            DELETE FROM problems WHERE problem_id = ANY(%s)
        """
        query = "DELETE FROM problems WHERE problem_id = ANY(%s)"
        self.execute_update(query, (problem_ids,), conn)

    def _row_to_dto(self, row) -> ProblemDTO:
        """DB 레코드 → DTO 변환"""
        return ProblemDTO(
            id=str(row['problem_id']),
            type=row['type'],
            question=row['question'],
            options=row['options'] if row['options'] else None,  # JSONB는 자동으로 파싱됨
            correct_answer=row['correct_answer'],
            explanation=row['explanation']
        )
```

---

### Repository Layer 설계 원칙 (Non-ORM)

1. **Raw SQL Only**: 모든 쿼리를 SQL 문자열로 작성
2. **Parameterized Queries**: SQL Injection 방지 (%s 플레이스홀더 사용)
3. **DTO Conversion**: 쿼리 결과(dict)를 DTO로 변환
4. **Transaction Support**: conn 파라미터로 트랜잭션 제어 지원
5. **No Business Logic**: Repository는 순수 데이터 접근만

---

## 4. DTO Layer (데이터 전송 객체)

### 역할
- 계층 간 데이터 전송
- 타입 안정성 (Pydantic)
- 직렬화/역직렬화
- **ORM 엔티티 대신 사용**

### 4.1 FolderDTO

**파일:** `dto/folder_dto.py`

```python
from pydantic import BaseModel
from typing import Optional

class FolderDTO(BaseModel):
    """폴더 DTO"""
    id: str
    user_id: str
    name: str
    created_at: str

    class Config:
        from_attributes = True  # DB 레코드에서 직접 생성 가능
```

---

### 4.2 MaterialDTO

**파일:** `dto/material_dto.py`

```python
from pydantic import BaseModel
from typing import Optional, List, Dict

class MaterialDTO(BaseModel):
    """학습 자료 DTO"""
    id: str
    doc_id: str
    folder_id: Optional[str]
    user_id: str
    title: str
    summary: str
    problem_config: Dict[str, int]  # {"multipleChoice": 5, "trueFalse": 5}
    review_count: int
    average_score: float
    last_review: Optional[str]
    next_review: Optional[str]
    created_at: str
    review_history: List['ReviewHistoryDTO'] = []

    class Config:
        from_attributes = True

class MaterialDetailDTO(MaterialDTO):
    """자료 상세 DTO (문제 포함)"""
    problems: List['ProblemDTO'] = []
```

---

### 4.3 ProblemDTO

**파일:** `dto/problem_dto.py`

```python
from pydantic import BaseModel
from typing import Optional, List

class ProblemDTO(BaseModel):
    """문제 DTO"""
    id: str
    type: str  # 'multiple_choice' or 'true_false'
    question: str
    options: Optional[List[str]]  # 객관식만 해당
    correct_answer: str
    explanation: str

    class Config:
        from_attributes = True
```

---

### 4.4 ReviewDTO

**파일:** `dto/review_dto.py`

```python
from pydantic import BaseModel
from typing import List

class ReviewHistoryDTO(BaseModel):
    """복습 기록 DTO"""
    date: str
    score: float
    correct_count: int
    total_count: int

    class Config:
        from_attributes = True

class ReviewResultInput(BaseModel):
    """퀴즈 제출 입력 DTO"""
    problem_id: str
    user_answer: str
    is_correct: bool

class ReviewResultDTO(BaseModel):
    """퀴즈 결과 DTO"""
    score: float
    correct_count: int
    total_count: int
    next_review: str
    review_count: int
```

---

## 5. Database Layer (데이터베이스 계층)

### 5.1 Connection Pool

**파일:** `database/connection.py`

```python
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

# 커넥션 풀 생성 (애플리케이션 시작 시 1번만)
connection_pool = None

def init_connection_pool():
    """커넥션 풀 초기화"""
    global connection_pool
    connection_pool = psycopg2.pool.SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD")
    )

def get_db_connection():
    """
    커넥션 풀에서 연결 가져오기

    Returns:
        psycopg2 Connection 객체
    """
    if connection_pool is None:
        init_connection_pool()

    return connection_pool.getconn()

def return_connection(conn):
    """커넥션 풀에 연결 반환"""
    if connection_pool:
        connection_pool.putconn(conn)

def close_all_connections():
    """모든 연결 종료 (애플리케이션 종료 시)"""
    if connection_pool:
        connection_pool.closeall()
```

---

### 5.2 Database Schema

**파일:** `database/schema.sql`

```sql
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 폴더 테이블
CREATE TABLE IF NOT EXISTS folders (
    folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- 문서 메타데이터 테이블
CREATE TABLE IF NOT EXISTS documents (
    doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(folder_id) ON DELETE SET NULL,
    filename VARCHAR(255),
    storage_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- 문서 청크 테이블 (벡터 저장)
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID REFERENCES documents(doc_id) ON DELETE CASCADE,
    chunk_text TEXT,
    page_number INTEGER,
    embedding VECTOR(3072),  -- OpenAI text-embedding-3-large
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_l2_ops);

-- 학습 자료 테이블
CREATE TABLE IF NOT EXISTS materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID REFERENCES documents(doc_id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(folder_id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    problem_config_mc INTEGER DEFAULT 5,
    problem_config_tf INTEGER DEFAULT 5,
    review_count INTEGER DEFAULT 0,
    average_score NUMERIC(5,2) DEFAULT 0.0,
    last_review_date TIMESTAMP,
    next_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_folder_id ON materials(folder_id);
CREATE INDEX IF NOT EXISTS idx_materials_next_review ON materials(user_id, next_review_date);

-- 문제 테이블 (틀린 문제만 저장)
CREATE TABLE IF NOT EXISTS problems (
    problem_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('multiple_choice', 'true_false')),
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_material_id ON problems(material_id);

-- 복습 기록 테이블
CREATE TABLE IF NOT EXISTS review_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    review_date TIMESTAMP DEFAULT NOW(),
    score NUMERIC(5,2),
    correct_count INTEGER,
    total_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_history_material_id ON review_history(material_id);
CREATE INDEX IF NOT EXISTS idx_review_history_date ON review_history(review_date);

-- pgvector 확장 생성
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 6. 유틸리티 및 공통 모듈

### 6.1 날짜 유틸리티

**파일:** `utils/date_utils.py`

```python
from datetime import datetime, timedelta

def calculate_next_review_date(review_count: int) -> datetime:
    """
    간격 반복 학습 알고리즘

    Args:
        review_count: 현재까지 복습 횟수

    Returns:
        다음 복습 예정 날짜
    """
    intervals = {
        0: 1,    # 첫 복습: 1일 후
        1: 3,    # 2번째: 3일 후
        2: 7,    # 3번째: 7일 후 (1주)
        3: 14,   # 4번째: 14일 후 (2주)
        4: 30,   # 5번째 이상: 30일 후 (1개월)
    }

    days = intervals.get(review_count, 30)
    return datetime.now() + timedelta(days=days)
```

---

### 6.2 파일 유틸리티

**파일:** `utils/file_utils.py`

```python
import os
import uuid
from fastapi import UploadFile
from middleware.exceptions import ValidationError

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 10))

class FileUtils:
    """파일 업로드/삭제 유틸리티"""

    async def save_pdf(self, file: UploadFile) -> str:
        """
        PDF 파일 저장

        Raises:
            ValidationError: 파일 크기 초과 또는 PDF가 아님
        """
        # 1. 파일 타입 검증
        if not file.filename.endswith('.pdf'):
            raise ValidationError("PDF 파일만 업로드 가능합니다.")

        # 2. 파일 크기 검증
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValidationError(f"파일 크기는 {MAX_FILE_SIZE_MB}MB 이하여야 합니다.")

        # 3. 업로드 폴더 생성
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # 4. 유니크한 파일명 생성
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        # 5. 파일 저장
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return file_path

    def delete_file(self, file_path: str) -> None:
        """파일 삭제"""
        if os.path.exists(file_path):
            os.remove(file_path)
```

---

### 6.3 응답 포맷 유틸리티

**파일:** `utils/response.py`

```python
from typing import Any, Optional

def success_response(data: Any, message: Optional[str] = None, status_code: int = 200):
    """
    표준 성공 응답 포맷

    Returns:
        {
          "success": true,
          "data": { ... },
          "message": "..." (선택)
        }
    """
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response

def error_response(code: str, message: str, status_code: int = 400):
    """
    표준 에러 응답 포맷

    Returns:
        {
          "success": false,
          "error": {
            "code": "VALIDATION_ERROR",
            "message": "입력 데이터가 올바르지 않습니다."
          }
        }
    """
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
```

---

## 7. 의존성 주입 (Dependency Injection)

**파일:** `api/dependencies.py`

```python
from repositories.folder_repository import FolderRepository
from repositories.material_repository import MaterialRepository
from repositories.document_repository import DocumentRepository
from repositories.problem_repository import ProblemRepository
from repositories.review_history_repository import ReviewHistoryRepository
from services.folder_service import FolderService
from services.material_service import MaterialService
from services.review_service import ReviewService
from services.rag_service import RAGService
from utils.file_utils import FileUtils

# Repository 의존성
def get_folder_repository() -> FolderRepository:
    return FolderRepository()

def get_material_repository() -> MaterialRepository:
    return MaterialRepository()

def get_document_repository() -> DocumentRepository:
    return DocumentRepository()

def get_problem_repository() -> ProblemRepository:
    return ProblemRepository()

def get_review_history_repository() -> ReviewHistoryRepository:
    return ReviewHistoryRepository()

# Service 의존성
def get_folder_service(
    folder_repo: FolderRepository = Depends(get_folder_repository)
) -> FolderService:
    return FolderService(folder_repo)

def get_material_service(
    material_repo: MaterialRepository = Depends(get_material_repository),
    document_repo: DocumentRepository = Depends(get_document_repository),
    problem_repo: ProblemRepository = Depends(get_problem_repository),
    review_history_repo: ReviewHistoryRepository = Depends(get_review_history_repository),
    rag_service: RAGService = Depends(get_rag_service),
    file_utils: FileUtils = Depends(get_file_utils)
) -> MaterialService:
    return MaterialService(
        material_repo,
        document_repo,
        problem_repo,
        review_history_repo,
        rag_service,
        file_utils
    )

def get_rag_service() -> RAGService:
    return RAGService()

def get_file_utils() -> FileUtils:
    return FileUtils()
```

---

## 8. 개발 체크리스트

### Phase 1: MVP (필수 기능)

**Database:**
- [ ] PostgreSQL 연결 풀 설정 (`database/connection.py`)
- [ ] 테이블 스키마 생성 (`database/schema.sql`)
- [ ] pgvector 확장 설치

**DTO Layer:**
- [ ] FolderDTO, MaterialDTO, ProblemDTO, ReviewDTO

**Repository Layer (Raw SQL):**
- [ ] BaseRepository (공통 쿼리 실행 로직)
- [ ] FolderRepository (5개 메서드)
- [ ] MaterialRepository (6개 메서드)
- [ ] DocumentRepository
- [ ] ProblemRepository
- [ ] ReviewHistoryRepository

**Service Layer:**
- [ ] FolderService
- [ ] MaterialService (create_material 핵심)
- [ ] ReviewService (start_review, submit_review 핵심)
- [ ] RAGService (RAG 통합)

**Router Layer:**
- [ ] FoldersRouter (4개 엔드포인트)
- [ ] MaterialsRouter (6개 엔드포인트)
- [ ] ReviewsRouter (2개 엔드포인트)
- [ ] Pydantic 스키마 정의

**Utils:**
- [ ] calculate_next_review_date() (간격 반복 학습)
- [ ] FileUtils (PDF 업로드/삭제)
- [ ] parse_quiz_text() (LLM 출력 파싱)

**Middleware:**
- [ ] Error Handler (전역 에러 처리)
- [ ] CORS 설정

---

## 9. ORM vs Non-ORM 비교표

| 항목 | ORM (SQLAlchemy) | Non-ORM (Raw SQL) |
|------|------------------|-------------------|
| **코드 길이** | 짧음 | 길음 (SQL 직접 작성) |
| **학습 곡선** | 높음 (ORM 문법) | 낮음 (SQL 지식만) |
| **타입 안정성** | 높음 (Python 클래스) | 중간 (DTO로 보완) |
| **쿼리 최적화** | 어려움 (자동 생성) | 쉬움 (직접 제어) |
| **디버깅** | 어려움 | 쉬움 (SQL 로그) |
| **성능** | 중간 (오버헤드) | 높음 |
| **유지보수** | ORM 버전 의존 | SQL 표준 기반 |
| **트랜잭션** | Session 관리 | Connection 관리 |
| **마이그레이션** | Alembic 등 도구 | 수동 SQL 스크립트 |
| **권장 사용처** | 복잡한 관계, CRUD | 성능 중시, 커스텀 쿼리 |

---

## 10. 참고 자료

- **프론트엔드**: `/frontend/src/App.jsx`, `/frontend/백엔드수정사항.txt`
- **RAG 시스템**: `/Ragservice/README.md`
- **데이터베이스**: PostgreSQL 16 + pgvector
- **프레임워크**: FastAPI 공식 문서
- **psycopg2**: https://www.psycopg.org/docs/

---

**작성일**: 2025-01-15
**버전**: 2.0.0 (Non-ORM)
