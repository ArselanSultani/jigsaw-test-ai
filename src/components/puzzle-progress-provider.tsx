import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/puzzles";
import {
  decodePuzzleSaves,
  encodePuzzleSaves,
  newPuzzleProgress,
  puzzleKey,
  type PuzzleProgress,
  type PuzzleSaves,
} from "@/utils/puzzle-progress";

const STORAGE_KEY = "jigsaw-progress-v1";
const ProgressContext = createContext<{
  puzzles: PuzzleSaves;
  ensurePuzzle: (imageId: string, size: number) => void;
  updatePuzzle: (key: string, update: (previous: PuzzleProgress) => PuzzleProgress) => void;
} | null>(null);

export function PuzzleProgressProvider({ children }: { children: ReactNode }) {
  const [puzzles, setPuzzles] = useState<PuzzleSaves>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const restored = raw === null ? {} : decodePuzzleSaves(raw);
        if (active) {
          setPuzzles(restored);
          setLoadError(false);
          setLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load puzzle progress", error);
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!loaded) return;
    let active = true;
    // Serialize writes so a slower, older save cannot overwrite newer progress.
    writeQueue.current = writeQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, encodePuzzleSaves(puzzles)))
      .then(() => {
        if (active) setSaveError(false);
      })
      .catch((error: unknown) => {
        console.error("Unable to save puzzle progress", error);
        if (active) setSaveError(true);
      });
    return () => {
      active = false;
    };
  }, [loaded, puzzles]);

  const ensurePuzzle = useCallback((imageId: string, size: number) => {
    const key = puzzleKey(imageId, size);
    const initial = newPuzzleProgress(imageId, size);
    setPuzzles((previous) => (previous[key] ? previous : { ...previous, [key]: initial }));
  }, []);

  const updatePuzzle = useCallback((key: string, update: (previous: PuzzleProgress) => PuzzleProgress) => {
    setPuzzles((previous) => {
      if (!previous[key]) throw new Error(`Puzzle ${key} has not been initialized.`);
      return { ...previous, [key]: update(previous[key]) };
    });
  }, []);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        {loadError ? (
          <>
            <Text style={styles.message}>Could not load saved puzzles. Your saved data has not been overwritten.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLoadError(false);
                setAttempt((n) => n + 1);
              }}
            >
              <Text style={styles.retry}>Retry loading</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading saved puzzles" color={colors.accent} />
        )}
      </View>
    );
  }
  return (
    <ProgressContext.Provider value={{ puzzles, ensurePuzzle, updatePuzzle }}>
      {saveError && (
        <View style={styles.warning}>
          <Text style={styles.message} accessibilityRole="alert">
            Progress could not be saved. Keep the app open and retry before leaving.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setPuzzles((previous) => ({ ...previous }))}>
            <Text style={styles.retry}>Retry saving</Text>
          </Pressable>
        </View>
      )}
      {children}
    </ProgressContext.Provider>
  );
}

export function usePuzzleProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("Puzzle progress requires PuzzleProgressProvider.");
  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  warning: { backgroundColor: colors.surface, padding: 12, gap: 8 },
  message: { color: colors.text },
  retry: { color: colors.accent, padding: 12, fontWeight: "700" },
});
