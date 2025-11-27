import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
// import * as Notifications from 'expo-notifications'; //주석

import { useColorScheme } from '@/components/useColorScheme';
// import { registerForPushNotificationsAsync } from '@/utils/notificationUtils'; //주석

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  // 주석 시작 ==================
  // const notificationListener = useRef<any>();
  // const responseListener = useRef<any>();

  // useEffect(() => {
  //   // Request notification permissions
  //   registerForPushNotificationsAsync();

  //   // Listener for notifications received while app is foregrounded
  //   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  //     console.log('Notification received:', notification);
  //   });

  //   // Listener for when user taps on notification
  //   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  //     console.log('Notification response:', response);

  //     const data = response.notification.request.content.data;

  //     // Navigate to review tab when notification is tapped
  //     if (data?.navigateTo === 'review') {
  //       router.push('/(tabs)/review');
  //     }
  //   });

  //   return () => {
  //     if (notificationListener.current) {
  //       Notifications.removeNotificationSubscription(notificationListener.current);
  //     }
  //     if (responseListener.current) {
  //       Notifications.removeNotificationSubscription(responseListener.current);
  //     }
  //   };
  // }, []);

  // 주석 끝 ==================

  // return (
  //   <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
  //     <Stack>
  //       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  //       <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
  //     </Stack>
  //   </ThemeProvider>
  // );
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* 초기 진입을 login으로 설정 */}
      <Stack initialRouteName="login">
        {/* 새로 만든 로그인 스크린 */}
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* 기존 탭 화면 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 기존 모달 화면 */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
