// app/index.tsx
// Redirect root → tabs/entry (웹에서도 화면이 2탭만 보이게)
import { Redirect } from "expo-router";
export default function Index() {
  return <Redirect href="/(tabs)/entry" />;
}
