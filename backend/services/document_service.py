import os, shutil
from repositories.documents_repository import *
from repositories.folder_repository import * 
from dto.document_dto import DocumentCreateDTO, DocumentDTO
from fastapi import UploadFile



class DocumentService:
    def __init__(self):
        self.folder_repo = FolderRepository()
        self.document_repo = DocumentsRepository()

    #문서 업로드 구현
    def upload_file(
            self,
            file:  UploadFile,
            create_dto : DocumentCreateDTO,
            custom_filename: str = None
    ) -> DocumentDTO :
        print(f"[문서 업로드 서비스] 요청 받음")
        print(f"  - 원본 파일명: {file.filename}")
        print(f"  - 사용자 지정 파일명: {custom_filename}")
        print(f"  - 파일 타입: {file.content_type}")
        print(f"  - 사용자 ID: {create_dto.user_id}")
        print(f"  - 폴더 ID: {create_dto.folder_id}")

        #1. 폴더 존재 확인
        folder = self.folder_repo.find_by_id(create_dto.folder_id)
        if not folder:
            print(f"[에러] 폴더를 찾을 수 없음: {create_dto.folder_id}")
            raise ValueError(f"Folder with id {create_dto.folder_id} not found")

        #2. 파일명 처리
        # 사용자가 파일명을 지정한 경우 사용, 아니면 원본 파일명 사용
        if custom_filename and custom_filename.strip():
            # 확장자 추출
            _, ext = os.path.splitext(file.filename)
            # 사용자 지정 이름 + 확장자
            safe_filename = f"{custom_filename.strip()}{ext}"
        else:
            # 원본 파일명 그대로 사용
            safe_filename = file.filename

        #3. 저장 경로 생성
        storage_path = f"pdf_files/{create_dto.user_id}/{create_dto.folder_id}/{safe_filename}"

        #4. 파일 저장
        self._save_file(file, storage_path)

        #5. DB삽입 데이터 준비
        doc_data = {
        "user_id": create_dto.user_id,
        "folder_id": create_dto.folder_id,
        "filename": safe_filename,
        "storage_path": storage_path,
        "summary_text": ""  # 초기값 (나중에 AI 요약 기능 추가 가능)
        }

        #6. Repository 호출
        doc_id = self.document_repo.insert(doc_data)
        print(f"[문서 업로드 서비스] DB에 삽입된 문서 ID: {doc_id}")

        if not doc_id:
            print(f"[에러] 문서 삽입 실패 - doc_id가 None입니다")
            raise ValueError("문서 삽입에 실패했습니다")

        #7. 생성된 문서 반환
        result = self.document_repo.find_by_doc_id(doc_id)
        print(f"[문서 업로드 서비스] 조회된 문서: {result}")

        if not result:
            print(f"[에러] 문서 조회 실패 - doc_id {doc_id}로 문서를 찾을 수 없습니다")
            raise ValueError(f"문서 ID {doc_id}를 찾을 수 없습니다")

        return result


    #문서 조회
    def get_documents_by_folder(self, folder_id: int) -> DocumentListDTO:
        #1. 폴더 존재 확인
        folder = self.folder_repo.find_by_id(folder_id)
        if not folder:
            raise ValueError(f"Folder with id {folder_id} not found")

        #2. 문서 목록 조회
        documents = self.document_repo.find_all_by_folder_id(folder_id)

        #3. 총 개수 조회
        total = self.document_repo.count_by_folder_id(folder_id)

        #4. DocumentListDTO 반환
        return DocumentListDTO(
            documents=documents,
            total=total
        )

    #문서 상세 조회
    def get_document_detail(self, doc_id: int) -> DocumentDTO:
        #1. 문서 조회
        doc = self.document_repo.find_by_doc_id(doc_id)

        #2. 문서 없으면 ValueError
        if not doc:
            raise ValueError(f"Document with id {doc_id} not found")

        #3. 반환
        return doc
    
    #문서 삭제
    def delete_document(self, doc_id: int) -> bool:
        #1. 문서 조회
        doc = self.document_repo.find_by_doc_id(doc_id)

        #2. 문서 존재 확인
        if not doc:
            raise ValueError(f"Document with id {doc_id} not found")

        #3. 파일 경로 저장 (DB 삭제 전에 저장)
        file_path = doc.storage_path

        #4. DB에서 삭제
        self.document_repo.delete_by_doc_id(doc_id)

        #5. 물리적 파일 삭제 (DB 삭제 후)
        if os.path.exists(file_path):
            os.remove(file_path)

        #6. 성공 반환
        return True

    #문서 이름 변경
    def rename_document(self, doc_id: int, new_name: str) -> DocumentDTO:
        """
        문서 이름 변경 (파일명 + 물리적 파일)

        Args:
            doc_id: 문서 ID
            new_name: 새 파일명 (확장자 제외)

        Returns:
            변경된 문서 정보

        Raises:
            ValueError: 문서가 존재하지 않을 경우
        """
        #1. 문서 조회
        doc = self.document_repo.find_by_doc_id(doc_id)

        #2. 문서 존재 확인
        if not doc:
            raise ValueError(f"Document with id {doc_id} not found")

        #3. 기존 파일 확장자 추출
        _, ext = os.path.splitext(doc.filename)

        #4. 새 파일명 생성 (새이름.확장자)
        new_filename = f"{new_name}{ext}"

        #5. 새 저장 경로 생성
        new_storage_path = f"pdf_files/{doc.user_id}/{doc.folder_id}/{new_filename}"

        #6. 물리적 파일명 변경
        old_path = doc.storage_path
        if os.path.exists(old_path):
            os.rename(old_path, new_storage_path)

        #7. DB 업데이트
        self.document_repo.update_filename_and_path(doc_id, new_filename, new_storage_path)

        #8. 변경된 문서 반환
        return self.document_repo.find_by_doc_id(doc_id)

    #문서 폴더 변경 (이동)
    def move_document(self, doc_id: int, new_folder_id: int) -> DocumentDTO:
        """
        문서 폴더 변경 (폴더 이동 + 파일 이동)

        Args:
            doc_id: 문서 ID
            new_folder_id: 이동할 폴더 ID

        Returns:
            변경된 문서 정보

        Raises:
            ValueError: 문서 또는 폴더가 존재하지 않을 경우
        """
        #1. 문서 조회
        doc = self.document_repo.find_by_doc_id(doc_id)
        if not doc:
            raise ValueError(f"Document with id {doc_id} not found")

        #2. 새 폴더 존재 확인
        new_folder = self.folder_repo.find_by_id(new_folder_id)
        if not new_folder:
            raise ValueError(f"Folder with id {new_folder_id} not found")

        #3. 기존 파일명 그대로 사용 (폴더명 접두사 없음)
        new_filename = doc.filename

        #5. 새 저장 경로 생성
        new_storage_path = f"pdf_files/{doc.user_id}/{new_folder_id}/{new_filename}"

        #6. 새 디렉터리 생성
        os.makedirs(os.path.dirname(new_storage_path), exist_ok=True)

        #7. 물리적 파일 이동
        old_path = doc.storage_path
        if os.path.exists(old_path):
            shutil.move(old_path, new_storage_path)

        #8. DB 업데이트 (folder_id, filename, storage_path)
        self.document_repo.update_folder(doc_id, new_folder_id, new_filename, new_storage_path)

        #9. 변경된 문서 반환
        return self.document_repo.find_by_doc_id(doc_id)




    def _generate_unique_filename(self, folder_name: str, original_filename: str) -> str:
        """
        폴더명_파일명.pdf 형식으로 파일명 생성

        Args:
            folder_name: 폴더 이름
            original_filename: 원본 파일명 (예: simpledocument.pdf)

        Returns:
            생성된 파일명 (예: 수학_simpledocument.pdf)
        """
        # 파일명과 확장자 분리
        name, ext = os.path.splitext(original_filename)

        # 폴더명_파일명.확장자 형식으로 결합
        return f"{folder_name}_{name}{ext}"

    def _save_file(self, file: UploadFile, storage_path: str):
        """
        물리적 파일 저장

        Args:
            file: 업로드된 파일 객체
            storage_path: 저장할 경로 (예: pdf_files/1/2/수학_simpledocument.pdf)
        """
        # 디렉터리 생성 (부모 디렉터리가 없으면 자동 생성)
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)

        # 파일 저장
        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)


     
    