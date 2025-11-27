import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function ProblemLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { materialId, materialTitle, multipleChoice, trueFalse } = params;
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

  // Simulate AI problem generation and navigate to quiz after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Safely parse problem counts with validation
      const mcCount = parseInt(multipleChoice as string) || 0;
      const tfCount = parseInt(trueFalse as string) || 0;

      // Mock AI problem generation
      const mockProblems = generateMockProblems(mcCount, tfCount);

      router.replace({
        pathname: '/quiz',
        params: {
          materialId,
          materialTitle,
          problems: JSON.stringify(mockProblems),
        },
      });
    }, 2500); // 2.5초 후 퀴즈로 이동

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
          🧠
        </Animated.Text>
        <Text style={styles.message}>AI가 문제를 생성하고 있습니다...</Text>
        <Text style={styles.subMessage}>잠시만 기다려주세요</Text>
      </View>
    </>
  );
}

// Mock problem generator
function generateMockProblems(multipleChoiceCount: number, trueFalseCount: number) {
  const problems = [];

  // Generate multiple choice problems
  for (let i = 0; i < multipleChoiceCount; i++) {
    problems.push({
      id: `mc_${i + 1}`,
      type: 'multiple_choice',
      question: `객관식 문제 ${i + 1}: 다음 중 올바른 설명은 무엇입니까?`,
      options: [
        '첫 번째 선택지입니다',
        '두 번째 선택지입니다',
        '세 번째 선택지입니다',
        '네 번째 선택지입니다',
      ],
      correctAnswer: '첫 번째 선택지입니다',
    });
  }

  // Generate true/false problems
  for (let i = 0; i < trueFalseCount; i++) {
    problems.push({
      id: `tf_${i + 1}`,
      type: 'true_false',
      question: `O/X 문제 ${i + 1}: 이 설명은 올바른 설명입니까?`,
      correctAnswer: i % 2 === 0 ? 'O' : 'X', // Alternate between O and X
    });
  }

  return problems;
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
