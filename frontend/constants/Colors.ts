/**
 * Modern Indigo 컬러 팔레트
 * 세련되고 신뢰감 있는 학습 앱 스타일
 */

const Colors = {
  light: {
    // 배경색
    background: '#F3F5F7',      // 메인 배경 (흰색보다 눈이 편한 쿨 그레이)
    surface: '#FFFFFF',          // 카드/컨테이너 배경

    // 메인 컬러
    primary: '#5E5CE6',          // 메인 강조 (세련된 남보라색)
    primaryLight: '#E3F2FD',     // 메인 컬러 밝은 배경
    primaryDark: '#4A48CC',      // 메인 컬러 어두운 버전

    // 서브 컬러
    secondary: '#32D74B',        // 서브 강조/정답 (밝은 초록)
    secondaryLight: '#E8F5E9',   // 정답 배경
    secondaryDark: '#2E7D32',    // 정답 텍스트

    // 경고/오답 컬러
    danger: '#FF3B30',           // 오답/삭제
    dangerLight: '#FFEBEE',      // 오답 배경
    dangerDark: '#C62828',       // 오답 텍스트

    // 텍스트 컬러
    text: '#1C1C1E',             // 제목/강조 텍스트
    textSecondary: '#8E8E93',    // 본문/보조 텍스트
    textTertiary: '#C7C7CC',     // 비활성/힌트 텍스트

    // 보더/구분선
    border: '#E0E0E0',           // 기본 보더
    borderLight: '#F0F0F0',      // 연한 보더

    // 탭바
    tint: '#5E5CE6',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#5E5CE6',
  },

  dark: {
    // 배경색
    background: '#121212',       // 메인 배경
    surface: '#1E1E1E',          // 카드/컨테이너 배경

    // 메인 컬러
    primary: '#0A84FF',          // 네온 블루
    primaryLight: '#1E2A3A',     // 메인 컬러 밝은 배경
    primaryDark: '#0066CC',      // 메인 컬러 어두운 버전

    // 서브 컬러
    secondary: '#30D158',        // 서브 강조/정답
    secondaryLight: '#1E2A1E',   // 정답 배경
    secondaryDark: '#28A745',    // 정답 텍스트

    // 경고/오답 컬러
    danger: '#FF453A',           // 오답/삭제
    dangerLight: '#2A1E1E',      // 오답 배경
    dangerDark: '#FF6B6B',       // 오답 텍스트

    // 텍스트 컬러
    text: '#FFFFFF',             // 제목/강조 텍스트
    textSecondary: '#B3B3B3',    // 본문/보조 텍스트
    textTertiary: '#5E5E5E',     // 비활성/힌트 텍스트

    // 보더/구분선
    border: '#2C2C2E',           // 기본 보더
    borderLight: '#38383A',      // 연한 보더

    // 탭바
    tint: '#0A84FF',
    tabIconDefault: '#B3B3B3',
    tabIconSelected: '#0A84FF',
  },
};

export default Colors;
