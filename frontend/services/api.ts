/**
 * API 설정 파일
 * 백엔드 서버와 통신하기 위한 기본 설정
 */

import { Platform } from 'react-native';

// 백엔드 API 주소 설정
// 개발 환경에 따라 변경 필요:
// - iOS 시뮬레이터: http://localhost:8000
// - Android 에뮬레이터: http://10.0.2.2:8000
// - 웹: http://localhost:8000
// - 실제 기기: http://[컴퓨터IP]:8000 (예: http://192.168.0.10:8000)

// 주석(8000->9000)
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:9000/api/v1'  // 웹이면 localhost, 모바일이면 10.0.2.2
  : 'https://your-production-api.com/api/v1';  // 프로덕션 모드

/**
 * API 설정 객체
 */
export const api = {
  baseURL: API_BASE_URL,
};

/**
 * API 호출 헬퍼 함수
 * fetch를 래핑하여 에러 처리 및 JSON 파싱 자동화
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API 요청 실패: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}