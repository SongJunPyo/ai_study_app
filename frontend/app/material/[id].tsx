import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import ReviewCalendar from '@/components/ReviewCalendar';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useStore, Problem } from '@/store/useStore';

// 하드코딩된 자료 데이터 (백업용 - store 사용으로 대체됨)
const MOCK_MATERIALS_BACKUP = {
  'm1': {
    id: 'm1',
    title: '데이터베이스의 개념',
    folderName: '데이터베이스',
    summary: `데이터베이스는 구조화된 정보의 조직화된 모음입니다. 데이터베이스 관리 시스템(DBMS)은 데이터베이스와 상호작용하기 위한 소프트웨어입니다.

주요 개념:
• 데이터의 효율적인 저장 및 검색
• 데이터 무결성 유지
• 여러 사용자의 동시 접근 관리
• 데이터 보안 및 백업

데이터베이스는 현대 애플리케이션의 핵심 구성 요소이며, 웹 서비스부터 모바일 앱까지 모든 곳에서 사용됩니다.`,
    reviewCount: 3,
    averageScore: 85,
    createdAt: '2024.11.10',
    lastReview: '2025.11.17',
    nextReview: '2025.11.22',
    reviewHistory: [
      { date: '2025-11-11', score: 80, correctCount: 12, totalCount: 15 },
      { date: '2025-11-14', score: 86, correctCount: 13, totalCount: 15 },
      { date: '2025-11-17', score: 90, correctCount: 14, totalCount: 15 },
    ],
    problems: [
      {
        id: 'p1',
        type: 'multiple_choice',
        question: '데이터베이스의 정의는?',
        options: ['구조화된 데이터의 집합', '파일의 모음', '프로그램', '네트워크'],
        correctAnswer: '구조화된 데이터의 집합',
      },
      {
        id: 'p2',
        type: 'multiple_choice',
        question: 'DBMS의 역할은?',
        options: ['데이터 관리', '화면 표시', '인쇄', '음악 재생'],
        correctAnswer: '데이터 관리',
      },
      {
        id: 'p3',
        type: 'true_false',
        question: '데이터베이스는 여러 사용자의 동시 접근을 관리할 수 있다.',
        correctAnswer: 'O',
      },
      {
        id: 'p4',
        type: 'true_false',
        question: 'DBMS는 데이터 보안 기능을 제공하지 않는다.',
        correctAnswer: 'X',
      },
    ],
  },
  'm2': {
    id: 'm2',
    title: '관계형 데이터베이스',
    folderName: '데이터베이스',
    summary: `관계형 데이터베이스는 테이블 형태로 데이터를 저장하고 관리하는 데이터베이스 시스템입니다.

핵심 특징:
• 테이블(Table) 구조
• 기본 키(Primary Key)와 외래 키(Foreign Key)
• SQL을 통한 데이터 조작
• ACID 속성 보장

주요 RDBMS: MySQL, PostgreSQL, Oracle, SQL Server 등이 널리 사용됩니다.`,
    reviewCount: 1,
    averageScore: 90,
    createdAt: '2024.11.15',
    lastReview: '2025.11.16',
    nextReview: '2025.11.20',
    reviewHistory: [
      { date: '2025-11-16', score: 90, correctCount: 9, totalCount: 10 },
    ],
    problems: [],
  },
};

export default function MaterialDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'problems', 'history'

  // Get material from store
  const materials = useStore((state) => state.materials);
  const folders = useStore((state) => state.folders);
  const deleteProblem = useStore((state) => state.deleteProblem);

  const material = materials.find(m => m.id === id);
  const folder = material ? folders.find(f => f.id === material.folderId) : null;

  // State for problem deletion
  const [deleteProblemModalOpen, setDeleteProblemModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  if (!material) {
    return (
      <View style={styles.container}>
        <Text>자료를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const renderTabButton = (tabId: string, label: string) => (
    <TouchableOpacity
      key={tabId}
      style={[styles.tab, activeTab === tabId && styles.activeTab]}
      onPress={() => setActiveTab(tabId)}
    >
      <Text style={[styles.tabText, activeTab === tabId && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSummaryTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryEmoji}>📝</Text>
          <Text style={styles.summaryTitle}>AI 요약</Text>
        </View>
        <Text style={styles.summaryText}>{material.summary}</Text>
      </View>

      {/* Info Message */}
      <View style={styles.infoBox}>
        <Text style={styles.infoEmoji}>💡</Text>
        <Text style={styles.infoText}>
          복습은 "오늘의 복습" 탭에서 시작할 수 있습니다
        </Text>
      </View>
    </ScrollView>
  );

  const handleOpenProblemSettings = () => {
    router.push({
      pathname: '/problemSettings',
      params: {
        materialId: material.id,
        materialTitle: material.title,
      },
    });
  };

  const handleDeleteProblem = (problem: any) => {
    setSelectedProblem(problem);
    setDeleteProblemModalOpen(true);
  };

  const confirmDeleteProblem = () => {
    if (selectedProblem && material) {
      deleteProblem(material.id, selectedProblem.id);
      setDeleteProblemModalOpen(false);
      setSelectedProblem(null);
    }
  };

  const renderProblemsTab = () => {
    const problems = material.problems || [];
    const multipleChoiceProblems = problems.filter(p => p.type === 'multiple_choice');
    const trueFalseProblems = problems.filter(p => p.type === 'true_false');
    const isEmpty = problems.length === 0;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
        {/* Header */}
        <View style={styles.problemsHeader}>
          <View style={styles.problemsHeaderLeft}>
            <Text style={styles.problemsHeaderEmoji}>📋</Text>
            <Text style={styles.problemsHeaderText}>틀린 문제 ({problems.length}개)</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenProblemSettings}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {isEmpty ? (
          // Empty State
          <View style={styles.problemsEmptyCard}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>틀린 문제가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              복습하면서 틀린 문제가{'\n'}여기에 저장됩니다
            </Text>
          </View>
        ) : (
          <>
            {/* Multiple Choice Section */}
            {multipleChoiceProblems.length > 0 && (
              <View style={styles.problemSection}>
                <Text style={styles.sectionTitle}>객관식 {multipleChoiceProblems.length}개</Text>
                {multipleChoiceProblems.map((problem, index) => (
                  <View key={problem.id} style={styles.problemCard}>
                    <View style={[styles.problemBorder, { backgroundColor: '#007AFF' }]} />
                    <View style={styles.problemContent}>
                      <View style={styles.problemHeader}>
                        <Text style={styles.problemQuestion}>
                          {index + 1}. {problem.question}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteProblem(problem)}
                          style={styles.deleteProblemButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.deleteProblemButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.optionsContainer}>
                        {problem.options?.map((option, i) => (
                          <Text key={i} style={styles.optionText}>• {option}</Text>
                        ))}
                      </View>
                      <Text style={styles.answerText}>답: {problem.correctAnswer}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* True/False Section */}
            {trueFalseProblems.length > 0 && (
              <View style={styles.problemSection}>
                <Text style={styles.sectionTitle}>O/X {trueFalseProblems.length}개</Text>
                {trueFalseProblems.map((problem, index) => (
                  <View key={problem.id} style={styles.problemCard}>
                    <View style={[styles.problemBorder, { backgroundColor: '#34C759' }]} />
                    <View style={styles.problemContent}>
                      <View style={styles.problemHeader}>
                        <Text style={styles.problemQuestion}>
                          {index + 1}. {problem.question}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteProblem(problem)}
                          style={styles.deleteProblemButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.deleteProblemButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.answerText}>답: {problem.correctAnswer}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  const renderHistoryTab = () => {
    const reviewHistory = material.reviewHistory || [];

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
        {/* 복습 캘린더 */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>📅 복습 기록</Text>
          <ReviewCalendar reviewHistory={reviewHistory} nextReview={material.nextReview} />
        </View>

        {/* 학습 통계 카드 */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsEmoji}>📊</Text>
            <Text style={styles.statsTitle}>학습 통계</Text>
          </View>

          {/* 복습 일정 */}
          <View style={styles.scheduleSection}>
            <Text style={styles.scheduleSectionTitle}>📋 복습 일정</Text>

            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>생성일:</Text>
              <Text style={styles.scheduleValue}>{material.createdAt}</Text>
            </View>

            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>마지막 복습:</Text>
              <Text style={styles.scheduleValue}>
                {material.lastReview || '-'}
              </Text>
            </View>

            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>다음 복습:</Text>
              <Text style={[styles.scheduleValue, { color: '#007AFF' }]}>
                {material.nextReview || '-'}
              </Text>
            </View>

            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>복습 횟수:</Text>
              <Text style={styles.scheduleValue}>{material.reviewCount}회</Text>
            </View>

            <View style={[styles.scheduleRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.scheduleLabel}>평균 정답률:</Text>
              <Text style={[styles.scheduleValue, { color: '#34C759' }]}>
                {material.averageScore}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: material?.title || '자료 상세',
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('summary', '요약')}
          {renderTabButton('problems', '문제 목록')}
          {renderTabButton('history', '복습 기록')}
        </View>

        {/* Tab Content */}
        {activeTab === 'summary' && renderSummaryTab()}
        {activeTab === 'problems' && renderProblemsTab()}
        {activeTab === 'history' && renderHistoryTab()}

        {/* Delete Problem Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteProblemModalOpen}
          onClose={() => {
            setDeleteProblemModalOpen(false);
            setSelectedProblem(null);
          }}
          onConfirm={confirmDeleteProblem}
          title="문제 삭제"
          message="이 문제를 삭제하시겠습니까?"
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
  // Info Card Styles
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Tab Content Styles
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
  },
  // Summary Tab Styles
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    flex: 1,
    lineHeight: 20,
  },
  // Empty State Styles
  emptyStateContainer: {
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
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  // History Tab Styles
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  scheduleSection: {
    marginBottom: 24,
  },
  scheduleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleLabel: {
    fontSize: 15,
    color: '#666',
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  historySection: {
    marginTop: 8,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  historyRecordCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyRecordDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  historyRecordScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  historyRecordDetail: {
    fontSize: 13,
    color: '#666',
  },
  // Problems Tab Styles
  problemsHeader: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  problemsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  problemsHeaderEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  problemsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
  },
  problemsEmptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemSection: {
    marginBottom: 16,
  },
  problemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  problemBorder: {
    width: 4,
  },
  problemContent: {
    flex: 1,
    padding: 16,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
    lineHeight: 22,
    flex: 1,
  },
  deleteProblemButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteProblemButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
});
