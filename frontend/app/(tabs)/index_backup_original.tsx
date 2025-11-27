import { StyleSheet, FlatList, TouchableOpacity, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import AddFolderModal from '@/components/AddFolderModal';
import RenameModal from '@/components/RenameModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TouchableScale from '@/components/TouchableScale';
import { useStore } from '@/store/useStore';

export default function LibraryScreen() {
  const router = useRouter();

  // Get folders from store
  const folders = useStore((state) => state.folders);
  const addFolder = useStore((state) => state.addFolder);
  const renameFolder = useStore((state) => state.renameFolder);
  const deleteFolder = useStore((state) => state.deleteFolder);

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
  const handleCreateFolder = (folderName: string) => {
    addFolder(folderName);
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
  const handleRenameFolder = (newName: string) => {
    if (selectedFolder) {
      renameFolder(selectedFolder.id, newName);
      setSelectedFolder(null);
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = () => {
    if (selectedFolder) {
      deleteFolder(selectedFolder.id);
      setSelectedFolder(null);
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
});
