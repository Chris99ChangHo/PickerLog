// app/_layout.tsx

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import Toast from 'react-native-toast-message';

// 스플래시 스크린이 자동으로 사라지는 것을 막습니다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // useFonts 훅을 새로운 방식으로 사용합니다.
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // 폰트 로딩이 끝나면 스플래시 스크린을 숨깁니다.
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // 폰트가 로딩 중이면 아무것도 보여주지 않습니다 (스플래시 스크린이 보임).
  if (!loaded && !error) {
    return null;
  }
  
  // 폰트 로딩이 끝나면 앱의 나머지 부분과 Toast를 함께 보여줍니다.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {/* ✅ 토스트: 앱 최상단에 Toast 컴포넌트를 렌더링합니다. */}
      <Toast />
    </>
  );
}