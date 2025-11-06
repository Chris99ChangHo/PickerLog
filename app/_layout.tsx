// app/_layout.tsx

import { Stack } from "expo-router";
import { GestureRoot } from '../src/ui/GestureRoot';
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import Toast from 'react-native-toast-message';

// ?ㅽ뵆?섏떆 ?ㅽ겕由곗씠 ?먮룞?쇰줈 ?щ씪吏??寃껋쓣 留됱뒿?덈떎.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // useFonts ?낆쓣 ?덈줈??諛⑹떇?쇰줈 ?ъ슜?⑸땲??
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ?고듃 濡쒕뵫???앸굹硫??ㅽ뵆?섏떆 ?ㅽ겕由곗쓣 ?④퉩?덈떎.
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // ?고듃媛 濡쒕뵫 以묒씠硫??꾨Т寃껊룄 蹂댁뿬二쇱? ?딆뒿?덈떎 (?ㅽ뵆?섏떆 ?ㅽ겕由곗씠 蹂댁엫).
  if (!loaded && !error) {
    return null;
  }
  
  // ?고듃 濡쒕뵫???앸굹硫??깆쓽 ?섎㉧吏 遺遺꾧낵 Toast瑜??④퍡 蹂댁뿬以띾땲??
  return (
    <GestureRoot style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {/* ???좎뒪?? ??理쒖긽?⑥뿉 Toast 而댄룷?뚰듃瑜??뚮뜑留곹빀?덈떎. */}
      <Toast />
    </GestureRoot>
  );
}




