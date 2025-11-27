import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';

export default function ReviewScreen() {
  const router = useRouter();

  // Get data from store
  const materials = useStore((state) => state.materials);
  const folders = useStore((state) => state.folders);

  // Filter materials that are due for review today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDueMaterials = materials.filter(material => {
    if (!material.nextReview) return false;

    const reviewDate = new Date(material.nextReview);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });

  const isEmpty = reviewDueMaterials.length === 0;
  const noMaterials = materials.length === 0;

  // Get folder name for a material
  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : '폴더';
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const handleStartReview = (materialId: string, materialTitle: string) => {
    // Get saved settings from material or use defaults
    const material = materials.find(m => m.id === materialId);
    const multipleChoice = material?.problemSettings?.multipleChoice || 8;
    const trueFalse = material?.problemSettings?.trueFalse || 7;

    router.push({
      pathname: '/problemLoading',
      params: {
        materialId,
        materialTitle,
        multipleChoice: multipleChoice.toString(),
        trueFalse: trueFalse.toString(),
      },
    });
  };

  const handleAddMaterial = () => {
    router.push('/addMaterial');
  };

  // Empty state: No materials at all
  if (noMaterials) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>아직 학습 세트가 없어요</Text>
          <Text style={styles.emptyDescription}>
            첫 학습 자료를 추가하고{'\n'}복습을 시작해보세요
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddMaterial}>
            <Text style={styles.emptyButtonText}>+ 첫 학습 자료 추가하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state: No reviews due today
  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>오늘 복습할 카드가 없습니다</Text>
          <Text style={styles.emptyDescription}>다음 복습 일정을 기다려주세요</Text>
        </View>
      </View>
    );
  }

  const renderMaterialCard = ({ item, index }: { item: typeof reviewDueMaterials[0], index: number }) => (
    <View style={styles.materialCard}>
      {/* Folder Badge */}
      <View style={styles.folderBadge}>
        <Text style={styles.folderBadgeEmoji}>📁</Text>
        <Text style={styles.folderBadgeText}>{getFolderName(item.folderId)}</Text>
      </View>

      {/* Material Title */}
      <Text style={styles.materialTitle}>{item.title}</Text>

      {/* Material Info */}
      <View style={styles.materialInfo}>
        {item.problems && item.problems.length > 0 ? (
          <View style={[styles.infoBadge, styles.infoBadgeDanger]}>
            <Text style={styles.infoBadgeEmoji}>📋</Text>
            <Text style={styles.infoBadgeText}>틀린 문제 {item.problems.length}개</Text>
          </View>
        ) : (
          <View style={[styles.infoBadge, styles.infoBadgePrimary]}>
            <Text style={styles.infoBadgeEmoji}>📝</Text>
            <Text style={styles.infoBadgeText}>요약 복습</Text>
          </View>
        )}
        {item.reviewCount > 0 && (
          <Text style={styles.reviewCountText}>복습 {item.reviewCount}회</Text>
        )}
      </View>

      {/* Start Review Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => handleStartReview(item.id, item.title)}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonEmoji}>🎯</Text>
        <Text style={styles.startButtonText}>복습 시작하기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{formatDate(today)}</Text>
        <Text style={styles.headerSeparator}>•</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>복습할 자료 {reviewDueMaterials.length}개</Text>
        </View>
      </View>

      {/* Review Materials List */}
      <FlatList
        data={reviewDueMaterials}
        renderItem={renderMaterialCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  headerSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  countBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  // List
  listContainer: {
    padding: 16,
  },
  // Material Card
  materialCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  folderBadgeEmoji: {
    fontSize: 12,
    marginRight: 6,
  },
  folderBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  materialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  materialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoBadgePrimary: {
    backgroundColor: '#E3F2FD',
  },
  infoBadgeDanger: {
    backgroundColor: '#FFEBEE',
  },
  infoBadgeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  infoBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
  },
  reviewCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  startButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Empty States
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
    color: '#000',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
