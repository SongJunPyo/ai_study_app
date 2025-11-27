import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import QuizResultModal from '@/components/QuizResultModal';

interface Problem {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { materialId, materialTitle, problems: problemsJson } = params;
  const completeQuiz = useStore((state) => state.completeQuiz);

  // Safely parse problems with error handling
  let problems: Problem[];
  try {
    problems = JSON.parse(problemsJson as string);
    if (!Array.isArray(problems) || problems.length === 0) {
      throw new Error('Invalid problems data');
    }
  } catch (error) {
    Alert.alert('오류', '문제를 불러올 수 없습니다.', [
      { text: '확인', onPress: () => router.back() }
    ]);
    return null;
  }

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(
    Array(problems.length).fill(null)
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    correctCount: number;
    totalCount: number;
    incorrectCount: number;
  } | null>(null);

  const currentProblem = problems[currentQuestionIndex];
  const totalQuestions = problems.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const allAnswered = userAnswers.every((answer) => answer !== null);
  const answeredCount = userAnswers.filter((a) => a !== null).length;

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (!allAnswered) return;

    /**
     * [백엔드 연결 필요] 퀴즈 결과 저장
     * 현재: Zustand store에 로컬 저장
     * 백엔드 연결 시: POST /api/materials/:id/review
     */

    // Grade the quiz
    const results = problems.map((problem, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === problem.correctAnswer;

      return {
        ...problem,
        userAnswer,
        userAnsweredCorrectly: isCorrect,
      };
    });

    const correctCount = results.filter((r) => r.userAnsweredCorrectly).length;
    const totalCount = results.length;
    const incorrectCount = totalCount - correctCount;

    // Save results to store (updates material, review history, next review date)
    completeQuiz(materialId as string, results);

    // Show results modal
    setQuizResults({ correctCount, totalCount, incorrectCount });
    setShowResultModal(true);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    // Navigate back to material detail to see updated stats
    router.replace(`/material/${materialId}`);
  };

  const handleBack = () => {
    Alert.alert(
      '퀴즈 나가기',
      '작성 중인 답변이 사라집니다. 정말로 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => router.back(),
          style: 'destructive',
        },
      ]
    );
  };

  const renderAnswerOptions = () => {
    if (currentProblem.type === 'multiple_choice') {
      return (
        <View style={styles.optionsContainer}>
          {currentProblem.options?.map((option, index) => {
            const isSelected = userAnswers[currentQuestionIndex] === option;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswerSelect(option)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (currentProblem.type === 'true_false') {
      return (
        <View style={styles.trueFalseContainer}>
          <TouchableOpacity
            style={[
              styles.trueFalseButton,
              styles.trueButton,
              userAnswers[currentQuestionIndex] === 'O' &&
                styles.trueButtonSelected,
            ]}
            onPress={() => handleAnswerSelect('O')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.trueFalseText,
                userAnswers[currentQuestionIndex] === 'O' &&
                  styles.trueTextSelected,
              ]}
            >
              O
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.trueFalseButton,
              styles.falseButton,
              userAnswers[currentQuestionIndex] === 'X' &&
                styles.falseButtonSelected,
            ]}
            onPress={() => handleAnswerSelect('X')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.trueFalseText,
                userAnswers[currentQuestionIndex] === 'X' &&
                  styles.falseTextSelected,
              ]}
            >
              X
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: materialTitle as string,
          headerBackTitle: '뒤로',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack}>
              <Text style={{ fontSize: 24, marginLeft: 8 }}>←</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              문제 {currentQuestionIndex + 1}/{totalQuestions}
            </Text>
            <Text style={styles.answeredText}>
              {answeredCount}/{totalQuestions} 답변 완료
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Question Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionEmoji}>
                {currentProblem.type === 'multiple_choice' ? '📝' : '✓'}
              </Text>
              <View style={styles.questionHeaderText}>
                <Text style={styles.questionType}>
                  {currentProblem.type === 'multiple_choice'
                    ? '객관식'
                    : 'O/X 문제'}
                </Text>
                <Text style={styles.questionText}>{currentProblem.question}</Text>
              </View>
            </View>

            {/* Answer Options */}
            {renderAnswerOptions()}
          </View>

          {/* Answer Status */}
          {userAnswers[currentQuestionIndex] !== null && (
            <View style={styles.answerStatus}>
              <Text style={styles.answerStatusText}>
                ✓ 답변이 선택되었습니다
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Question Number Navigation */}
        <View style={styles.questionNavigation}>
          <Text style={styles.navigationTitle}>문제 빠른 선택</Text>
          <View style={styles.questionNumberGrid}>
            {problems.map((_, index) => {
              const isAnswered = userAnswers[index] !== null;
              const isCurrent = index === currentQuestionIndex;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.questionNumberButton,
                    isAnswered && styles.questionNumberAnswered,
                    isCurrent && styles.questionNumberCurrent,
                  ]}
                  onPress={() => setCurrentQuestionIndex(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.questionNumberText,
                      isAnswered && styles.questionNumberTextAnswered,
                      isCurrent && styles.questionNumberTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              isFirstQuestion && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={isFirstQuestion}
          >
            <Text
              style={[
                styles.navButtonText,
                isFirstQuestion && styles.navButtonTextDisabled,
              ]}
            >
              ← 이전
            </Text>
          </TouchableOpacity>

          {!isLastQuestion ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>다음 →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.submitButton,
                !allAnswered && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!allAnswered}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  !allAnswered && styles.submitButtonTextDisabled,
                ]}
              >
                {allAnswered
                  ? '답변 확인하기'
                  : `${totalQuestions - answeredCount}개 문제 남음`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quiz Result Modal */}
        {quizResults && (
          <QuizResultModal
            isOpen={showResultModal}
            onClose={handleCloseResultModal}
            correctCount={quizResults.correctCount}
            totalCount={quizResults.totalCount}
            incorrectCount={quizResults.incorrectCount}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progressSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  answeredText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  questionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  questionHeaderText: {
    flex: 1,
  },
  questionType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1565C0',
    fontWeight: '500',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    paddingVertical: 32,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trueButton: {
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  trueButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  falseButton: {
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  falseButtonSelected: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  trueFalseText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  trueTextSelected: {
    color: '#2E7D32',
  },
  falseTextSelected: {
    color: '#C62828',
  },
  answerStatus: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
  },
  answerStatusText: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Question Number Navigation
  questionNavigation: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navigationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  questionNumberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionNumberButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberAnswered: {
    backgroundColor: '#E3F2FD',
    borderColor: '#5E5CE6',
  },
  questionNumberCurrent: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
    transform: [{ scale: 1.1 }],
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  questionNumberTextAnswered: {
    color: '#5E5CE6',
  },
  questionNumberTextCurrent: {
    color: '#FFFFFF',
  },
  bottomButtons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
    gap: 12,
  },
  navButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButton: {
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
});
