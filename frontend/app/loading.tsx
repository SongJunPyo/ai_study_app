import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  // Pulse animation for the emoji
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // Simulate AI processing and navigate to preview after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock AI summary generation
      const mockSummary = `[AI가 생성한 요약 내용]

제목: ${params.title}

이 학습 자료는 ${params.title}에 대한 내용을 다루고 있습니다.

주요 내용:
• 핵심 개념 1: 기본 원리와 이론적 배경
• 핵심 개념 2: 실제 적용 사례와 예시
• 핵심 개념 3: 중요한 특징과 특성

학습 포인트:
- 기본 개념을 이해하고 실무에 적용할 수 있어야 합니다
- 관련 이론을 바탕으로 문제를 해결할 수 있어야 합니다
- 실제 사례를 통해 개념을 확실히 이해해야 합니다

참고사항:
이 요약은 학습 자료의 핵심 내용을 간추린 것입니다.`;

      router.replace({
        pathname: '/preview',
        params: {
          folderId: params.folderId,
          title: params.title,
          content: params.content,
          summary: mockSummary,
        },
      });
    }, 2500); // 2.5초 후 미리보기로 이동

    return () => clearTimeout(timer);
  }, [params]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          ⏳
        </Animated.Text>
        <Text style={styles.message}>AI가 요약을 생성하고 있습니다...</Text>
        <Text style={styles.subMessage}>잠시만 기다려주세요</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
