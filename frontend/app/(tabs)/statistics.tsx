import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { useMemo } from 'react';

export default function StatisticsScreen() {
  const materials = useStore((state) => state.materials);
  const folders = useStore((state) => state.folders);

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalMaterials = materials.length;
    const totalReviews = materials.reduce((sum, m) => sum + m.reviewCount, 0);
    const averageScore = materials.length > 0
      ? Math.round(materials.reduce((sum, m) => sum + m.averageScore, 0) / materials.length)
      : 0;

    return { totalMaterials, totalReviews, averageScore };
  }, [materials]);

  // Calculate last 7 days activity
  const last7DaysActivity = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Count reviews on this date
      let count = 0;
      materials.forEach(material => {
        material.reviewHistory.forEach(review => {
          const reviewDate = new Date(review.date);
          reviewDate.setHours(0, 0, 0, 0);
          if (reviewDate.getTime() === date.getTime()) {
            count++;
          }
        });
      });

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        count: count
      });
    }

    return days;
  }, [materials]);

  // Calculate upcoming reviews grouped by date
  const upcomingReviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = materials
      .filter(m => m.nextReview)
      .map(m => ({
        material: m,
        nextReview: new Date(m.nextReview!)
      }))
      .filter(item => {
        const reviewDate = new Date(item.nextReview);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate >= today;
      })
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());

    // Group by date
    const grouped: { [key: string]: typeof materials } = {};
    upcoming.forEach(item => {
      const dateKey = item.nextReview.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item.material);
    });

    // Convert to array and get label
    const result = Object.entries(grouped).map(([dateKey, mats]) => {
      const date = new Date(dateKey);
      const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let label;
      if (diffDays === 0) label = '오늘';
      else if (diffDays === 1) label = '내일';
      else label = `${diffDays}일 후`;

      return { label, date, materials: mats };
    });

    return result.slice(0, 5); // Show only next 5 dates
  }, [materials]);

  // Calculate folder statistics
  const folderStats = useMemo(() => {
    return folders.map(folder => {
      const folderMaterials = materials.filter(m => m.folderId === folder.id);
      const avgScore = folderMaterials.length > 0
        ? Math.round(folderMaterials.reduce((sum, m) => sum + m.averageScore, 0) / folderMaterials.length)
        : 0;

      return {
        folder,
        count: folderMaterials.length,
        avgScore
      };
    }).filter(f => f.count > 0); // Only show folders with materials
  }, [folders, materials]);

  const maxActivityCount = Math.max(...last7DaysActivity.map(d => d.count), 1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>종합 통계</Text>
          <Text style={styles.headerSubtitle}>전체 학습 활동을 한눈에 확인하세요</Text>
        </View>

        {/* Overall Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>📚</Text>
            <Text style={styles.summaryValue}>{stats.totalMaterials}</Text>
            <Text style={styles.summaryLabel}>총 자료 수</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🔄</Text>
            <Text style={styles.summaryValue}>{stats.totalReviews}</Text>
            <Text style={styles.summaryLabel}>총 복습 횟수</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🎯</Text>
            <Text style={styles.summaryValue}>{stats.averageScore}%</Text>
            <Text style={styles.summaryLabel}>평균 정답률</Text>
          </View>
        </View>

        {/* Last 7 Days Activity Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>최근 7일 활동</Text>

          <View style={styles.chartContainer}>
            {last7DaysActivity.map((day, index) => (
              <View key={index} style={styles.chartBarContainer}>
                {/* Bar */}
                <View style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: day.count > 0
                          ? `${(day.count / maxActivityCount) * 100}%`
                          : 8,
                        opacity: day.count > 0 ? 1 : 0.3,
                      }
                    ]}
                  >
                    {day.count > 0 && (
                      <Text style={styles.chartBarText}>{day.count}</Text>
                    )}
                  </View>
                </View>

                {/* Day label */}
                <Text style={styles.chartDayLabel}>{day.dayName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Reviews */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>다가오는 복습 일정</Text>

          {upcomingReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>예정된 복습이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.upcomingList}>
              {upcomingReviews.map((group, index) => (
                <View key={index} style={styles.upcomingGroup}>
                  <View style={styles.upcomingGroupHeader}>
                    <Text style={styles.upcomingGroupLabel}>{group.label}</Text>
                    <Text style={styles.upcomingGroupCount}>({group.materials.length}개)</Text>
                  </View>

                  <View style={styles.upcomingMaterials}>
                    {group.materials.map((material) => (
                      <View key={material.id} style={styles.upcomingMaterialCard}>
                        <Text style={styles.upcomingMaterialEmoji}>📄</Text>
                        <Text style={styles.upcomingMaterialTitle}>{material.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Folder Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>폴더별 현황</Text>

          {folderStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📁</Text>
              <Text style={styles.emptyText}>학습 자료가 없습니다</Text>
            </View>
          ) : (
            <View style={styles.folderList}>
              {folderStats.map((stat, index) => (
                <View key={index} style={styles.folderStatCard}>
                  <View style={styles.folderStatLeft}>
                    <Text style={styles.folderStatEmoji}>📁</Text>
                    <View style={styles.folderStatInfo}>
                      <Text style={styles.folderStatName}>{stat.folder.name}</Text>
                      <Text style={styles.folderStatCount}>자료 {stat.count}개</Text>
                    </View>
                  </View>

                  <View style={styles.folderStatRight}>
                    <Text style={styles.folderStatScore}>{stat.avgScore}%</Text>
                    <Text style={styles.folderStatScoreLabel}>평균</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  // Summary Cards
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  // Chart Card
  chartCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
    minHeight: 8,
  },
  chartBarText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  chartDayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Card
  card: {
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
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  // Upcoming Reviews
  upcomingList: {
    gap: 16,
  },
  upcomingGroup: {
    gap: 8,
  },
  upcomingGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingGroupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  upcomingGroupCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  upcomingMaterials: {
    gap: 8,
  },
  upcomingMaterialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  upcomingMaterialEmoji: {
    fontSize: 14,
  },
  upcomingMaterialTitle: {
    fontSize: 13,
    color: '#1C1C1E',
    flex: 1,
  },
  // Folder Statistics
  folderList: {
    gap: 12,
  },
  folderStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  folderStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  folderStatEmoji: {
    fontSize: 24,
  },
  folderStatInfo: {
    flex: 1,
  },
  folderStatName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  folderStatCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  folderStatRight: {
    alignItems: 'flex-end',
  },
  folderStatScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  folderStatScoreLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
});
