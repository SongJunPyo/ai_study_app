// D:\Project_Mobile 2\Project_Mobile\app\(tabs)\index.tsx
import { StyleSheet, FlatList, TouchableOpacity, ActionSheetIOS, Platform, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import AddFolderModal from '@/components/AddFolderModal';
import RenameModal from '@/components/RenameModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TouchableScale from '@/components/TouchableScale';
import { useStore } from '@/store/useStore';
// 백엔드 API 서비스 import
import { folderService } from '@/services/folderService';
import { FolderDTO } from '@/services/types';

// 백엔드 폴더 타입을 UI 폴더 타입으로 변환하는 헬퍼 함수
function transformFolderFromAPI(folder: FolderDTO) {
  return {
    id: folder.folder_id.toString(),
    name: folder.folder_name,
    materialCount: folder.document_count, // 백엔드에서 받아온 문서 개수
  };
}

export default function LibraryScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const userId = user?.id;
  // 로컬 상태 관리 (백엔드에서 가져온 데이터 저장)
  const [folders, setFolders] = useState<Array<{ id: string; name: string; materialCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Zustand store에서 폴더 관련 액션 가져오기 (로컬 상태 업데이트용)
  const addFolder = useStore((state) => state.addFolder);
  const renameFolder = useStore((state) => state.renameFolder);
  const deleteFolder = useStore((state) => state.deleteFolder);

  // 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  

  /**
   * 📡 백엔드에서 폴더 목록 가져오기
   * API: GET /api/v1/folders/user/{user_id}
   */
  const fetchFolders = async () => {
    if (!userId) {
      console.log('[API 호출 스킵] 로그인된 사용자 없음');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[API 호출] 사용자 ${userId}의 폴더 목록 조회 중...`);
      const response = await folderService.getUserFolders(userId);

      console.log('[API 응답]', response);
      console.log(`총 ${response.total}개의 폴더를 받았습니다.`);

      // 백엔드 응답을 UI 형식으로 변환
      const transformedFolders = response.folders.map(transformFolderFromAPI);
      setFolders(transformedFolders);

    } catch (err) {
      console.error('[API 에러]', err);
      const errorMessage = err instanceof Error ? err.message : '폴더 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);

      // 에러 발생 시 사용자에게 알림
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 화면이 포커스될 때마다 폴더 목록 다시 로드
   * (다른 화면에서 돌아왔을 때 문서 개수 업데이트)
   */
  useFocusEffect(
    useCallback(() => {
      console.log('[내 라이브러리] 화면 포커스 - 폴더 목록 새로고침');
      fetchFolders();
    }, [userId])
  );

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<typeof folders[0] | null>(null);

  const isEmpty = folders.length === 0;

  // 모달 열기/닫기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // 폴더 생성
  const handleCreateFolder = async (folderName: string) => {
    if (!userId) {
      console.log('[API 호출 스킵] 로그인된 사용자 없음');
      return;
    }
  
    try {
      setLoading(true);
      console.log('[폴더 생성] 요청:', folderName);

      await folderService.createFolder(userId, folderName);

      // 모달 닫기
      setIsModalOpen(false);

      // 서버에서 최신 목록 다시 로드
      await fetchFolders();
    } catch (err) {
      console.error('[폴더 생성 에러]', err);
      const msg = err instanceof Error ? err.message : '폴더 생성에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };


  const handleFolderPress = (folder: typeof folders[0]) => {
    // 폴더 상세 화면으로 이동
    router.push(`/folder/${folder.id}`);
  };

  const handleAddMaterial = () => {
    // 자료 추가 화면으로 이동
    router.push('/addMaterial');
  };

  // 폴더 메뉴 열기
  const handleFolderMenu = (folder: typeof folders[0]) => {
    console.log('Menu clicked for folder:', folder.name);
    setSelectedFolder(folder);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '이름 수정', '삭제하기'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          console.log('Button index:', buttonIndex);
          if (buttonIndex === 1) {
            setRenameModalOpen(true);
          } else if (buttonIndex === 2) {
            setDeleteModalOpen(true);
          }
        }
      );
    } else {
      // Android용 Alert
      console.log('Showing Android alert');
      Alert.alert(
        folder.name,
        '어떤 작업을 하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '이름 수정',
            onPress: () => {
              console.log('Rename selected');
              setRenameModalOpen(true);
            },
          },
          {
            text: '삭제하기',
            onPress: () => {
              console.log('Delete selected');
              setDeleteModalOpen(true);
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  // 폴더 이름 수정
  const handleRenameFolder = async (newName: string) => {
    if (!selectedFolder) return;

    try {
      setLoading(true);
      console.log('[폴더 이름 변경] 요청:', selectedFolder.id, '->', newName);

      await folderService.renameFolder(Number(selectedFolder.id), newName);

      setRenameModalOpen(false);
      setSelectedFolder(null);

      await fetchFolders();
    } catch (err) {
      console.error('[폴더 이름 변경 에러]', err);
      const msg = err instanceof Error ? err.message : '폴더 이름 변경에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;

    try {
      setLoading(true);
      console.log('[폴더 삭제] 요청:', selectedFolder.id);

      await folderService.deleteFolder(Number(selectedFolder.id));

      setDeleteModalOpen(false);
      setSelectedFolder(null);

      await fetchFolders();
    } catch (err) {
      console.error('[폴더 삭제 에러]', err);
      const msg = err instanceof Error ? err.message : '폴더 삭제에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderFolderCard = ({ item }: { item: typeof folders[0] }) => (
    <TouchableScale>
      <View style={styles.folderCard}>
        <TouchableOpacity
          style={styles.folderCardPressable}
          onPress={() => handleFolderPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.folderCardContent}>
            <View style={styles.folderIcon}>
              <Text style={styles.folderEmoji}>📁</Text>
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName}>{item.name}</Text>
              <Text style={styles.materialCount}>자료 {item.materialCount}개</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFolderMenu(item)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>
    </TouchableScale>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📚</Text>
      <Text style={styles.emptyTitle}>학습 자료가 없습니다</Text>
      <Text style={styles.emptyDescription}>
        새로운 폴더를 만들고{'\n'}학습 자료를 추가해보세요
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={openModal}
      >
        <Text style={styles.emptyButtonText}>+ 새 폴더 만들기</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * 로딩 화면
   */
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 라이브러리</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>폴더 목록을 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  /**
   * 에러 화면
   */
  if (error && folders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 라이브러리</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>오류가 발생했습니다</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFolders}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 라이브러리</Text>
        <TouchableOpacity
          onPress={handleAddMaterial}
          activeOpacity={0.7}
          style={styles.headerAddButton}
        >
          <Text style={styles.headerAddButtonIcon}>+</Text>
          <Text style={styles.headerAddButtonText}>새 자료</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={folders}
          renderItem={renderFolderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={
            <TouchableScale>
              <TouchableOpacity
                style={styles.addButton}
                onPress={openModal}
              >
                <Text style={styles.addButtonText}>+ 새 폴더 만들기</Text>
              </TouchableOpacity>
            </TouchableScale>
          }
        />
      )}

      {/* Add Folder Modal */}
      <AddFolderModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCreateFolder={handleCreateFolder}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setSelectedFolder(null);
        }}
        onConfirm={handleRenameFolder}
        currentName={selectedFolder?.name}
        title="폴더 이름 수정"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFolder(null);
        }}
        onConfirm={handleDeleteFolder}
        title="폴더 삭제"
        message="정말로 삭제하시겠습니까? 폴더 안의 모든 학습 자료가 함께 삭제됩니다."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  headerAddButtonIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
  },
  headerAddButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  // Folder Card Styles
  folderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  folderCardPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  folderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderEmoji: {
    fontSize: 24,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  materialCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  // Add Folder Button
  addButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
  },
  addButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  // 에러 상태
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
