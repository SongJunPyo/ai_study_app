/**
 * 백엔드 API 응답 타입 정의
 * 백엔드의 DTO(Data Transfer Object)와 일치하도록 작성
 */

/**
 * 폴더 DTO (FolderDTO)
 * 백엔드: backend/dto/folder_dto.py의 FolderDTO와 일치
 */
export interface FolderDTO {
  folder_id: number;
  user_id: number;
  folder_name: string;
  created_at: string; // ISO 8601 format
  document_count: number; // 폴더 내 문서 개수
}

/**
 * 폴더 목록 응답 DTO (FolderListDTO)
 * 백엔드: backend/dto/folder_dto.py의 FolderListDTO와 일치
 */
export interface FolderListResponse {
  folders: FolderDTO[];
  total: number;
}

/**
 * 폴더 생성 요청 DTO (FolderCreateDTO)
 * 백엔드: backend/dto/folder_dto.py의 FolderCreateDTO와 일치
 */
export interface FolderCreateRequest {
  user_id: number;
  folder_name: string;
}

/**
 * 문서 DTO (DocumentDTO)
 * 백엔드: backend/dto/document_dto.py의 DocumentDTO와 일치
 */
export interface DocumentDTO {
  doc_id: number;
  user_id: number;
  folder_id: number;
  filename: string;
  storage_path: string;
  summary_text: string;
  created_at: string; // ISO 8601 format
}

/**
 * 문서 목록 응답 DTO (DocumentListDTO)
 * 백엔드: backend/dto/document_dto.py의 DocumentListDTO와 일치
 */
export interface DocumentListResponse {
  documents: DocumentDTO[];
  total: number;
}

/**
 * 문서 이름 변경 요청 DTO (DocumentRenameDTO)
 * 백엔드: backend/dto/document_dto.py의 DocumentRenameDTO와 일치
 */
export interface DocumentRenameRequest {
  new_name: string; // 변경할 파일명 (확장자 제외)
}

/**
 * API 에러 응답
 */
export interface APIError {
  detail: string;
}
