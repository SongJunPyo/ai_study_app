import React from 'react';
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
import { formatDate } from '@/utils/dateUtils';

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { folderId, title, content, summary } = params;
  const addMaterial = useStore((state) => state.addMaterial);

  const handleRegenerate = () => {
    // Navigate back to loading screen to regenerate summary
    Alert.alert(
      '요약 다시 생성',
      'AI 요약을 다시 생성하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            router.replace({
              pathname: '/loading',
              params: { folderId, title, content },
            });
          },
        },
      ]
    );
  };

  const handleSave = () => {
    /**
     * [백엔드 연결 필요] 자료 저장
     * 현재: Zustand store에 로컬 저장
     * 백엔드 연결 시: POST /api/materials
     */

    // Save material to store
    const today = new Date();
    addMaterial({
      folderId: folderId as string,
      title: title as string,
      summary: summary as string,
      createdAt: formatDate(today),
      problems: [],
    });

    Alert.alert(
      '저장 완료',
      '학습 자료가 저장되었습니다.',
      [
        {
          text: '확인',
          onPress: () => {
            // Navigate back to library (reset navigation stack)
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    Alert.alert(
      '뒤로 가기',
      '작성 중인 내용이 사라집니다. 정말로 나가시겠습니까?',
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

  return (
    <>
      <Stack.Screen
        options={{
          title: '미리보기',
          headerBackTitle: '뒤로',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack}>
              <Text style={{ fontSize: 24, marginLeft: 8 }}>←</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEmoji}>📝</Text>
              <Text style={styles.summaryTitle}>AI 요약</Text>
            </View>

            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.regenerateButton]}
            onPress={handleRegenerate}
          >
            <Text style={styles.regenerateButtonEmoji}>🔄</Text>
            <Text style={styles.regenerateButtonText}>다시 생성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>저장하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
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
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  regenerateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  regenerateButtonEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  regenerateButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
