import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useStore } from '@/store/useStore';

const MAX_PROBLEMS = 15;

export default function ProblemSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { materialId, materialTitle } = params;

  // Get material from store to load saved settings
  const materials = useStore((state) => state.materials);
  const updateMaterialSettings = useStore((state) => state.updateMaterialSettings);

  const material = materials.find(m => m.id === materialId);

  const [multipleChoice, setMultipleChoice] = useState(
    material?.problemSettings?.multipleChoice || 8
  );
  const [trueFalse, setTrueFalse] = useState(
    material?.problemSettings?.trueFalse || 7
  );

  // Update state when material changes
  useEffect(() => {
    if (material) {
      setMultipleChoice(material.problemSettings?.multipleChoice || 8);
      setTrueFalse(material.problemSettings?.trueFalse || 7);
    }
  }, [material]);

  const totalProblems = multipleChoice + trueFalse;

  const handleMultipleChoiceChange = (value: number) => {
    const rounded = Math.round(value);
    const remaining = MAX_PROBLEMS - trueFalse;
    setMultipleChoice(Math.min(rounded, remaining));
  };

  const handleTrueFalseChange = (value: number) => {
    const rounded = Math.round(value);
    const remaining = MAX_PROBLEMS - multipleChoice;
    setTrueFalse(Math.min(rounded, remaining));
  };

  const handleSave = () => {
    if (totalProblems > 0 && materialId) {
      /**
       * [백엔드 연결 필요] 문제 설정 저장
       * 현재: Zustand store에 로컬 저장
       * 백엔드 연결 시: PUT /api/materials/:id/settings
       */
      updateMaterialSettings(materialId as string, { multipleChoice, trueFalse });
      // Go back after saving settings
      router.back();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '문제 유형 조절',
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.settingsCard}>
            <View style={styles.maxProblemsInfo}>
              <Text style={styles.maxProblemsText}>최대 15개 생성</Text>
            </View>

            {/* Multiple Choice Slider */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>객관식</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={MAX_PROBLEMS}
                step={1}
                value={multipleChoice}
                onValueChange={handleMultipleChoiceChange}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#007AFF"
              />
              <View style={styles.sliderValueContainer}>
                <Text style={styles.sliderValue}>{multipleChoice}개</Text>
              </View>
            </View>

            {/* True/False Slider */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>O/X 문제</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={MAX_PROBLEMS}
                step={1}
                value={trueFalse}
                onValueChange={handleTrueFalseChange}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#007AFF"
              />
              <View style={styles.sliderValueContainer}>
                <Text style={styles.sliderValue}>{trueFalse}개</Text>
              </View>
            </View>

            {/* Warning */}
            {totalProblems > MAX_PROBLEMS && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  최대 {MAX_PROBLEMS}개까지 생성 가능합니다
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              styles.saveButton,
              totalProblems === 0 && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={totalProblems === 0}
          >
            <Text
              style={[
                styles.saveButtonText,
                totalProblems === 0 && styles.saveButtonTextDisabled,
              ]}
            >
              설정 확인
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 32,
  },
  maxProblemsInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  maxProblemsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sliderSection: {
    marginBottom: 32,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  bottomButtons: {
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
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});
