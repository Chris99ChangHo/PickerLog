// src/ui/theme.ts
export const colors = {
  brand: "#50D94D",
  brand600: "#3BB33A",
  brandSoft: "#EAFBEA",
  bg: "#f5fff0",
  card: "#FFFFFF",
  text: "#111111",
  sub: "rgba(0,0,0,0.6)",
  border: "#E5E9EE",
  infoBg: "#E9EEFC",
};
export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };
export const spacing = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 };
export const type = {
  h1: { fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  body: { fontSize: 16, fontFamily: "Inter_400Regular" },
  label: { fontSize: 13, color: "#666", fontFamily: "Inter_600SemiBold" },
};

