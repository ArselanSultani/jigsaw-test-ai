import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "@/constants/puzzles";
import { PuzzleProgressProvider } from "@/components/puzzle-progress-provider";
import { FullscreenProvider } from "@/components/fullscreen-provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <FullscreenProvider>
        <PuzzleProgressProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: "Jigsaw" }} />
            <Stack.Screen name="puzzle" options={{ title: "Puzzle", headerShown: false }} />
          </Stack>
        </PuzzleProgressProvider>
      </FullscreenProvider>
    </GestureHandlerRootView>
  );
}
