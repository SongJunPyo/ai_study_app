// app/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';

const API_BASE_URL =
    Platform.OS === 'android'
        ? 'http://10.0.2.2:9000' // 👈 에뮬레이터 → 호스트 PC(백엔드)로 가는 예약 IP
        : 'http://localhost:9000'; // iOS 시뮬레이터일 때

export default function LoginScreen() {
    const router = useRouter();
    const setUser = useStore((state) => state.setUser);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onLogin = async () => {
        console.log('[Login] onLogin called');

        if (!email || !password) {
            Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해 주세요.');
            return;
        }

        setLoading(true);

        try {
            // 👇 여기 API_BASE_URL은 네가 맞춰둔 값 그대로 쓰면 돼
            const url = `${API_BASE_URL}/api/v1/auth/login`;
            console.log('[Login] 요청 보냄:', url, { email });

            const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            });

            console.log('[Login] response.status =', response.status);

            // 응답 바디를 일단 text로 받아서, 실패했을 때도 무조건 찍어보자
            const rawText = await response.text();
            console.log('[Login] raw response =', rawText);

            let data: any = null;
            try {
            data = rawText ? JSON.parse(rawText) : null;
            } catch (e) {
            console.log('[Login] JSON 파싱 실패, rawText 그대로 사용');
            }

            if (!response.ok) {
            let message = `로그인에 실패했습니다. (status: ${response.status})`;

            if (data?.detail) {
                // detail이 배열일 경우 (422 validation error)
                if (Array.isArray(data.detail)) {
                message = data.detail
                    .map((err: any) => err.msg ?? JSON.stringify(err))
                    .join('\n');
                }
                // detail이 문자열일 경우 (401 같은 우리 쪽 에러)
                else if (typeof data.detail === 'string') {
                message = data.detail;
                }
            }

            Alert.alert('로그인 실패', message);
            return;
            }

            // 여기까지 왔으면 성공
            console.log('[Login] 로그인 성공:', data);

            setUser({
                id: data.user_id,
                email: data.email,
            });
            console.log('[Login] store에 저장된 유저:', {
                id: data.user_id,
                email: data.email,
            });

            router.replace('/(tabs)');
        } catch (error) {
            console.error('[Login] 로그인 요청 중 오류:', error);
            Alert.alert(
            '네트워크 오류',
            '서버에 연결할 수 없습니다. 백엔드가 실행 중인지, 주소가 맞는지 확인해 주세요.'
            );
        } finally {
            console.log('[Login] finally - setLoading(false)');
            setLoading(false);
        }
    };



    return (
        <View style={styles.container}>
            <Text style={styles.title}>로그인</Text>

            <Text style={styles.label}>이메일</Text>
            <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text style={styles.label}>비밀번호</Text>
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Pressable style={styles.button} onPress={onLogin} disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? '로그인 중...' : '로그인하기'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#3b82f6',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
});
