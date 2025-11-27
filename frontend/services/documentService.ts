/**
 * 문서 관련 API 서비스
 * 백엔드 API: /api/v1/documents/*
 */

import axios from 'axios';
import { api } from './api';
import { DocumentDTO, DocumentListResponse } from './types';

/**
 * 문서 업로드
 * API: POST /api/v1/documents/upload
 *
 * @param fileUriOrFile - 업로드할 PDF 파일 URI (모바일) 또는 File 객체 (웹)
 * @param userId - 사용자 ID
 * @param folderId - 폴더 ID
 * @param customFilename - 사용자 지정 파일명 (확장자 제외, 선택사항)
 * @returns 업로드된 문서 정보
 */
export async function uploadDocument(
  fileUriOrFile: string | File,
  userId: number,
  folderId: number,
  customFilename?: string
): Promise<DocumentDTO> {
  const url = `${api.baseURL}/documents/upload`;

  try {
    console.log(`[API 호출] 문서 업로드 중...`);
    console.log('- URL:', url);
    console.log('- userId:', userId);
    console.log('- folderId:', folderId);
    console.log('- fileUriOrFile type:', typeof fileUriOrFile);
    console.log('- fileUriOrFile:', fileUriOrFile);

    // FormData 생성
    const formData = new FormData();

    // 웹 환경 vs 모바일 환경 구분
    if (typeof fileUriOrFile === 'string') {
      // 모바일: URI 문자열
      const filename = fileUriOrFile.split('/').pop() || 'document.pdf';
      console.log('- [모바일] filename:', filename);

      formData.append('file', {
        uri: fileUriOrFile,
        type: 'application/pdf',
        name: filename,
      } as any);
    } else {
      // 웹: File 객체
      console.log('- [웹] filename:', fileUriOrFile.name);
      formData.append('file', fileUriOrFile, fileUriOrFile.name);
    }

    formData.append('user_id', userId.toString());
    formData.append('folder_id', folderId.toString());

    // 사용자 지정 파일명이 있으면 추가
    if (customFilename) {
      formData.append('filename', customFilename);
    }

    // axios를 사용하여 업로드
    const response = await axios.post<DocumentDTO>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30초 타임아웃
    });

    console.log('[API 응답] status:', response.status);
    console.log('[API 응답] 문서 업로드 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API 에러]', error);

    if (axios.isAxiosError(error)) {
      console.error('[API 에러 상세]', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });

      // 422 에러의 경우 validation error 상세 정보 출력
      if (error.response?.status === 422) {
        console.error('[Validation Error]', JSON.stringify(error.response?.data, null, 2));
      }

      // 응답이 있는 경우
      if (error.response) {
        const errorMessage = error.response?.data?.detail ||
                            `문서 업로드 실패: ${error.response.status} ${error.response.statusText}`;
        throw new Error(errorMessage);
      }

      // 네트워크 에러 (응답 없음)
      if (error.request) {
        throw new Error(`네트워크 에러: 서버에 연결할 수 없습니다. (${error.message})`);
      }

      // 요청 설정 에러
      throw new Error(`요청 설정 에러: ${error.message}`);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('문서 업로드 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 폴더 내 문서 목록 조회
 * API: GET /api/v1/documents/folder/{folder_id}
 *
 * @param folderId - 폴더 ID
 * @returns 문서 목록
 */
export async function getFolderDocuments(folderId: number): Promise<DocumentListResponse> {
  const url = `${api.baseURL}/documents/folder/${folderId}`;

  try {
    console.log(`[API 호출] 폴더 ${folderId}의 문서 목록 조회 중...`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `문서 목록 조회 실패: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log('[API 응답]', result);
    console.log(`총 ${result.total}개의 문서를 받았습니다.`);
    return result;
  } catch (error) {
    console.error('[API 에러]', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('문서 목록 조회 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 문서 삭제
 * API: DELETE /api/v1/documents/{doc_id}
 *
 * @param docId - 문서 ID
 * @returns 삭제 성공 메시지
 */
export async function deleteDocument(docId: number): Promise<{ message: string }> {
  const url = `${api.baseURL}/documents/${docId}`;

  try {
    console.log(`[API 호출] 문서 ${docId} 삭제 중...`);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `문서 삭제 실패: ${response.status} ${response.statusText}`
      );
    }

    // 204 No Content는 응답 본문이 없으므로 JSON 파싱 안 함
    if (response.status === 204) {
      console.log('[API 응답] 문서 삭제 성공 (204 No Content)');
      return { message: '문서가 삭제되었습니다.' };
    }

    const result = await response.json();
    console.log('[API 응답] 문서 삭제 성공:', result);
    return result;
  } catch (error) {
    console.error('[API 에러]', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('문서 삭제 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 문서 이름 변경
 * API: PATCH /api/v1/documents/{doc_id}/rename
 *
 * @param docId - 문서 ID
 * @param newName - 새로운 파일명 (확장자 제외)
 * @returns 업데이트된 문서 정보
 */
export async function renameDocument(docId: number, newName: string): Promise<DocumentDTO> {
  const url = `${api.baseURL}/documents/${docId}/rename`;

  try {
    console.log(`[API 호출] 문서 ${docId} 이름 변경 중...`);
    console.log('- 새 이름:', newName);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_name: newName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `문서 이름 변경 실패: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log('[API 응답] 문서 이름 변경 성공:', result);
    return result;
  } catch (error) {
    console.error('[API 에러]', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('문서 이름 변경 중 알 수 없는 오류가 발생했습니다.');
  }
}

export const documentService = {
  uploadDocument,
  getFolderDocuments,
  deleteDocument,
  renameDocument,
};
