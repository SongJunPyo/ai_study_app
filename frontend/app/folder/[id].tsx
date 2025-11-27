import { StyleSheet, FlatList, TouchableOpacity, ActionSheetIOS, Platform, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import RenameModal from '@/components/RenameModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useStore } from '@/store/useStore';
import { documentService } from '@/services/documentService';
import { folderService } from '@/services/folderService';
import { DocumentDTO, FolderDTO } from '@/services/types';

export default function FolderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 로컬 상태 관리
  const [folder, setFolder] = useState<FolderDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from store (fallback - for rename/delete)
  const renameMaterial = useStore((state) => state.renameMaterial);
  const deleteMaterial = useStore((state) => state.deleteMaterial);

  // 모달 상태 관리
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDTO | null>(null);

  const folderIdNumber = typeof id === 'string' ? parseInt(id, 10) : 0;

  /**
   * 📡 백엔드에서 폴더 정보와 문서 목록 가져오기
   */
  const fetchFolderData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[API 호출] 폴더 ${folderIdNumber} 정보 및 문서 목록 조회 중...`);

      // 폴더 정보와 문서 목록을 병렬로 조회
      const [folderResponse, documentsResponse] = await Promise.all([
        folderService.getFolder(folderIdNumber),
        documentService.getFolderDocuments(folderIdNumber),
      ]);

      console.log('[API 응답] 폴더 정보:', folderResponse);
      console.log('[API 응답] 문서 목록:', documentsResponse);

      setFolder(folderResponse);
      setDocuments(documentsResponse.documents);

    } catch (err) {
      console.error('[API 에러]', err);
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 데이터 로드
   */
  useEffect(() => {
    if (folderIdNumber > 0) {
      fetchFolderData();
    }
  }, [folderIdNumber]);

  const handleAddMaterial = () => {
    // 자료 추가 화면으로 이동 (현재 폴더 ID 전달)
    router.push(`/addMaterial?folderId=${id}`);
  };

  // 자료 메뉴 열기
  const handleMaterialMenu = (document: DocumentDTO) => {
    console.log('Menu clicked for document:', document.filename);
    setSelectedDocument(document);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '이름 수정', '삭제하기'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setRenameModalOpen(true);
          } else if (buttonIndex === 2) {
            setDeleteModalOpen(true);
          }
        }
      );
    } else {
      // Android용 Alert
      Alert.alert(
        document.filename,
        '어떤 작업을 하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '이름 수정',
            onPress: () => setRenameModalOpen(true),
          },
          {
            text: '삭제하기',
            onPress: () => setDeleteModalOpen(true),
            style: 'destructive',
          },
        ]
      );
    }
  };

  // 자료 이름 수정
  const handleRenameMaterial = async (newName: string) => {
    if (selectedDocument) {
      try {
        // 확장자 제거 (.pdf 등)
        const nameWithoutExtension = newName.replace(/\.[^/.]+$/, '');

        console.log(`[API 호출] 문서 ${selectedDocument.doc_id} 이름 변경 중...`);
        console.log('- 기존 이름:', selectedDocument.filename);
        console.log('- 새 이름:', nameWithoutExtension);

        await documentService.renameDocument(selectedDocument.doc_id, nameWithoutExtension);

        Alert.alert('성공', '문서 이름이 변경되었습니다.');

        // 문서 목록 다시 로드
        fetchFolderData();
        setSelectedDocument(null);
      } catch (error) {
        console.error('[이름 변경 실패]', error);
        const errorMessage = error instanceof Error ? error.message : '문서 이름 변경에 실패했습니다.';
        Alert.alert('오류', errorMessage);
      }
    }
  };

  // 자료 삭제
  const handleDeleteMaterial = async () => {
    if (selectedDocument) {
      try {
        console.log(`[API 호출] 문서 ${selectedDocument.doc_id} 삭제 중...`);
        await documentService.deleteDocument(selectedDocument.doc_id);

        Alert.alert('성공', '문서가 삭제되었습니다.');

        // 문서 목록 다시 로드
        fetchFolderData();
        setSelectedDocument(null);
      } catch (error) {
        console.error('[삭제 실패]', error);
        Alert.alert('오류', '문서 삭제에 실패했습니다.');
      }
    }
  };

  /**
   * 로딩 화면
   */
  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '폴더',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>자료 목록을 불러오는 중...</Text>
          </View>
        </View>
      </>
    );
  }

  /**
   * 에러 화면
   */
  if (error || !folder) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '폴더',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>오류가 발생했습니다</Text>
            <Text style={styles.errorMessage}>{error || '폴더를 찾을 수 없습니다.'}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchFolderData}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  const isEmpty = documents.length === 0;

  const handleMaterialPress = (docId: number) => {
    // TODO: 문서 상세 화면으로 이동
    router.push(`/material/${docId}`);
  };

  const renderMaterialCard = ({ item }: { item: DocumentDTO }) => (
    <View style={styles.materialCard}>
      <TouchableOpacity
        style={styles.materialCardPressable}
        onPress={() => handleMaterialPress(item.doc_id)}
        activeOpacity={0.7}
      >
        <View style={styles.materialContent}>
          <Text style={styles.materialEmoji}>📄</Text>
          <Text style={styles.materialTitle}>{item.filename}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleMaterialMenu(item)}
        style={styles.menuButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Text style={styles.menuButtonText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📄</Text>
      <Text style={styles.emptyTitle}>자료가 없습니다</Text>
      <Text style={styles.emptyDescription}>
        새로운 학습 자료를 추가해보세요
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleAddMaterial}
      >
        <Text style={styles.emptyButtonText}>+ 새 자료 추가하기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: folder.folder_name,
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        {isEmpty ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={documents}
            renderItem={renderMaterialCard}
            keyExtractor={(item) => item.doc_id.toString()}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMaterial}
              >
                <Text style={styles.addButtonText}>+ 새 자료 추가하기</Text>
              </TouchableOpacity>
            }
          />
        )}

        {/* Rename Modal */}
        <RenameModal
          isOpen={renameModalOpen}
          onClose={() => {
            setRenameModalOpen(false);
            setSelectedDocument(null);
          }}
          onConfirm={handleRenameMaterial}
          currentName={selectedDocument?.filename}
          title="자료 이름 수정"
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedDocument(null);
          }}
          onConfirm={handleDeleteMaterial}
          title="자료 삭제"
          message="정말로 삭제하시겠습니까? 이 학습 자료가 삭제됩니다."
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  // Material Card Styles
  materialCard: {
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  materialCardPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  materialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  materialEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
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
  // Add Material Button
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
    color: '#666',
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
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#666',
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
