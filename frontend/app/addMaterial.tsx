import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '@/store/useStore';
import { documentService } from '@/services/documentService';
import { folderService } from '@/services/folderService';
import { DocumentDTO, FolderDTO } from '@/services/types';

export default function AddMaterialScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams();

  // Get folders from store (fallback)
  const storeFolders = useStore((state) => state.folders);
  const addFolder = useStore((state) => state.addFolder);

  // DB에서 가져온 폴더 목록
  const [dbFolders, setDbFolders] = useState<FolderDTO[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);

  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploadMethod, setUploadMethod] = useState(''); // 'pdf' or 'text'
  const [fileContent, setFileContent] = useState('');
  const [title, setTitle] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // PDF 업로드 관련 상태
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const userId = 1;

  // DB에서 폴더 목록 가져오기
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setIsFoldersLoading(true);
        console.log('[폴더 로드] DB에서 폴더 목록 조회 중...');
        const response = await folderService.getUserFolders(userId);
        console.log('[폴더 로드] 성공:', response);
        setDbFolders(response.folders);
      } catch (error) {
        console.error('[폴더 로드] 실패:', error);
        Alert.alert('오류', '폴더 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsFoldersLoading(false);
      }
    };

    loadFolders();
  }, [userId]);

  // Auto-select folder if preselected
  useEffect(() => {
    if (folderId) {
      setSelectedFolder(folderId as string);
    }
  }, [folderId]);

  // DB 폴더와 로컬 폴더를 합쳐서 사용 (DB 우선)
  const folders = dbFolders.length > 0 ? dbFolders.map(f => ({
    id: f.folder_id.toString(),
    name: f.folder_name,
    materialCount: 0,
  })) : storeFolders;

  const handlePDFSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('PDF 파일 선택됨:', file.name);
        console.log('파일 URI:', file.uri);

        // 파일 정보 저장 (실제 업로드는 제출 시 수행)
        setSelectedFileUri(file.uri);
        setSelectedFileName(file.name);
        setFileContent(`파일 선택됨: ${file.name}`);
        setUploadMethod('pdf');

        // Auto-set title from filename
        if (!title) {
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          setTitle(fileName);
        }
      }
    } catch (error) {
      console.error('PDF 선택 오류:', error);
      Alert.alert('오류', 'PDF 파일을 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleTextInput = () => {
    setUploadMethod('text');
  };

  const handleAddNewFolder = () => {
    if (newFolderName.trim()) {
      // Add folder to store and get the new folder ID
      const newFolderId = addFolder(newFolderName.trim());

      // Select the newly created folder
      setSelectedFolder(newFolderId);

      setShowFolderInput(false);
      setNewFolderName('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFolder || !(uploadMethod || fileContent) || !title.trim()) {
      return;
    }

    try {
      setIsUploading(true);

      // PDF 업로드의 경우 백엔드 API 호출
      if (uploadMethod === 'pdf' && selectedFileUri) {
        console.log('[자료 추가] PDF 업로드 시작...');
        console.log('- 폴더 ID:', selectedFolder);
        console.log('- 파일명:', selectedFileName);
        console.log('- 파일 URI:', selectedFileUri);

        // 백엔드에 PDF 업로드 (사용자가 입력한 제목을 파일명으로 사용)
        const uploadedDocument: DocumentDTO = await documentService.uploadDocument(
          selectedFileUri,
          userId,
          parseInt(selectedFolder),
          title.trim()  // 사용자가 입력한 제목을 파일명으로 전달
        );

        console.log('[자료 추가] PDF 업로드 성공:', uploadedDocument);

        // 업로드된 문서 정보를 loading 화면으로 전달
        router.push({
          pathname: '/loading',
          params: {
            folderId: selectedFolder,
            title: title.trim(),
            docId: uploadedDocument.doc_id.toString(),
            filename: uploadedDocument.filename,
            summaryText: uploadedDocument.summary_text,
            uploadMethod: 'pdf',
          },
        });
      } else if (uploadMethod === 'text') {
        // 텍스트 직접 입력의 경우 기존 방식대로 처리
        console.log('[자료 추가] 텍스트 입력 방식으로 진행...');
        router.push({
          pathname: '/loading',
          params: {
            folderId: selectedFolder,
            title: title.trim(),
            content: fileContent,
            uploadMethod: 'text',
          },
        });
      }
    } catch (error) {
      console.error('[자료 추가] 업로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
      Alert.alert('업로드 실패', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isFormValid = selectedFolder && (uploadMethod || fileContent) && title.trim();

  return (
    <>
      <Stack.Screen
        options={{
          title: '새 학습 자료 추가',
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Step 1: Folder Selection */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>폴더 선택</Text>
            </View>

            {!showFolderInput ? (
              <>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedFolder}
                    onValueChange={(itemValue) => setSelectedFolder(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="폴더를 선택하세요" value="" />
                    {folders.map((folder) => (
                      <Picker.Item key={folder.id} label={folder.name} value={folder.id} />
                    ))}
                  </Picker>
                </View>

                <TouchableOpacity
                  style={styles.addFolderButton}
                  onPress={() => setShowFolderInput(true)}
                >
                  <Text style={styles.addFolderButtonText}>+ 폴더 추가하기</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="새 폴더 이름"
                  placeholderTextColor="#999"
                  autoFocus
                />
                <View style={styles.folderInputButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setShowFolderInput(false);
                      setNewFolderName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.addButton,
                      !newFolderName.trim() && styles.addButtonDisabled,
                    ]}
                    onPress={handleAddNewFolder}
                    disabled={!newFolderName.trim()}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        !newFolderName.trim() && styles.addButtonTextDisabled,
                      ]}
                    >
                      추가
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Step 2: Material Upload */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>학습 자료 업로드</Text>
            </View>

            <View style={styles.uploadArea}>
              <Text style={styles.uploadAreaText}>파일을 선택하거나</Text>
              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePDFSelect}
                >
                  <Text style={styles.uploadButtonText}>[PDF 파일 선택]</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadButton, styles.uploadButtonSecondary]}
                  onPress={handleTextInput}
                >
                  <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>
                    [텍스트 직접 입력]
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {uploadMethod === 'text' && (
              <TextInput
                style={styles.textArea}
                value={fileContent}
                onChangeText={setFileContent}
                placeholder="학습 자료 내용을 직접 입력하세요..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            )}

            {uploadMethod === 'pdf' && fileContent && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✓ 파일이 선택되었습니다</Text>
              </View>
            )}
          </View>

          {/* Step 3: Title Input */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>제목 입력</Text>
            </View>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요"
              placeholderTextColor="#999"
            />
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.bottomCancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.bottomCancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              styles.bottomSubmitButton,
              (!isFormValid || isUploading) && styles.bottomSubmitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.uploadingText}>업로드 중...</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.bottomSubmitButtonText,
                  !isFormValid && styles.bottomSubmitButtonTextDisabled,
                ]}
              >
                다음 →
              </Text>
            )}
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
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addFolderButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addFolderButtonText: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  folderInputButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
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
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    color: '#999',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadAreaText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  uploadButtons: {
    width: '100%',
    gap: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  uploadButtonSecondary: {
    borderColor: '#999',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  uploadButtonTextSecondary: {
    color: '#666',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#000',
    height: 160,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
    borderRadius: 8,
    padding: 16,
  },
  successText: {
    fontSize: 16,
    color: '#2E7D32',
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
  },
  bottomCancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  bottomCancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  bottomSubmitButton: {
    backgroundColor: '#007AFF',
  },
  bottomSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bottomSubmitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  bottomSubmitButtonTextDisabled: {
    color: '#999',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
