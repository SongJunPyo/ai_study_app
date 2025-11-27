import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';

interface QuizResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  totalCount: number;
  incorrectCount: number;
}

export default function QuizResultModal({
  isOpen,
  onClose,
  correctCount,
  totalCount,
  incorrectCount,
}: QuizResultModalProps) {
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Determine color and message based on score
  const getResultStyle = () => {
    if (percentage >= 80) {
      return {
        color: '#32D74B',
        backgroundColor: '#E8F5E9',
        emoji: '🎉',
        title: '훌륭해요!',
        message: '완벽한 복습이었습니다!',
      };
    } else if (percentage >= 60) {
      return {
        color: '#5E5CE6',
        backgroundColor: '#E3F2FD',
        emoji: '👍',
        title: '잘했어요!',
        message: '좋은 성과입니다!',
      };
    } else {
      return {
        color: '#FF9F0A',
        backgroundColor: '#FFF3E0',
        emoji: '💪',
        title: '조금 더 힘내세요!',
        message: '다시 한번 복습해보세요.',
      };
    }
  };

  const resultStyle = getResultStyle();

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop} />

      <View style={styles.container}>
        <View style={styles.modal}>
          {/* Emoji */}
          <Text style={styles.emoji}>{resultStyle.emoji}</Text>

          {/* Title */}
          <Text style={styles.title}>{resultStyle.title}</Text>

          {/* Score Circle */}
          <View
            style={[
              styles.scoreCircle,
              { backgroundColor: resultStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.scorePercentage, { color: resultStyle.color }]}>
              {percentage}%
            </Text>
            <Text style={styles.scoreLabel}>정답률</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>정답</Text>
              <Text style={[styles.detailValue, { color: '#32D74B' }]}>
                {correctCount}/{totalCount}
              </Text>
            </View>

            {incorrectCount > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>틀린 문제</Text>
                <Text style={[styles.detailValue, { color: '#FF3B30' }]}>
                  {incorrectCount}개 저장됨
                </Text>
              </View>
            )}
          </View>

          {/* Message */}
          <Text style={styles.message}>{resultStyle.message}</Text>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: resultStyle.color }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F3F5F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
