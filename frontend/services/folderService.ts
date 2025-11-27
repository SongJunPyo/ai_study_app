// services/folderService.ts
// 기본 API URL: 환경변수(API_BASE_URL)가 있으면 사용하고, 없으면 로컬 기본값을 사용합니다.
// services/folderService.ts
import { Platform } from 'react-native';
import { FolderDTO } from './types';

// Expo 환경변수(선택) → 없으면 플랫폼별 기본값 사용
const API_BASE_URL: string =
  (typeof process !== 'undefined' && (process.env as any)?.EXPO_PUBLIC_API_BASE_URL) ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:9000'   // 안드로이드 에뮬레이터에서 PC(백엔드)로 가는 주소
    : 'http://localhost:9000'); // iOS 시뮬레이터/웹일 때

export interface GetUserFoldersResponse {
  total: number;
  folders: FolderDTO[];
}

export const folderService = {
  async getUserFolders(userId: number): Promise<GetUserFoldersResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/folders/user/${userId}`);
    if (!res.ok) {
      throw new Error(`폴더 목록 조회 실패 (status: ${res.status})`);
    }
    return res.json();
  },

  async createFolder(userId: number, folderName: string): Promise<FolderDTO> {
    const res = await fetch(`${API_BASE_URL}/api/v1/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, folder_name: folderName }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      const msg = data?.detail || `폴더 생성 실패 (status: ${res.status})`;
      throw new Error(msg);
    }

    return data as FolderDTO;
  },

  async renameFolder(folderId: number, newName: string): Promise<FolderDTO> {
    const res = await fetch(`${API_BASE_URL}/api/v1/folders/${folderId}/name`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newName }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      const msg = data?.detail || `폴더 이름 변경 실패 (status: ${res.status})`;
      throw new Error(msg);
    }

    return data as FolderDTO;
  },

  async deleteFolder(folderId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/folders/${folderId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const text = await res.text();
      let msg: string = `폴더 삭제 실패 (status: ${res.status})`;
      try {
        const data = text ? JSON.parse(text) : null;
        if (data?.detail) msg = data.detail;
      } catch {}
      throw new Error(msg);
    }
  },
};
