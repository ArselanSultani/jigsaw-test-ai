import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PuzzleBoard } from "@/components/puzzle-board";
import { colors, DIFFICULTIES, PUZZLE_IMAGES } from "@/constants/puzzles";
import { formatTime } from "@/utils/format-time";

function newSeed() {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function PuzzleScreen() {
  const params = useLocalSearchParams<{ id?: string; size?: string }>();
  const image = PUZZLE_IMAGES.find((i) => i.id === params.id) ?? PUZZLE_IMAGES[0];
  const parsedSize = Number(params.size);
  const size = DIFFICULTIES.some((d) => d.size === parsedSize) ? parsedSize : DIFFICULTIES[0].size;
  const total = size * size;

  const [seed, setSeed] = useState(newSeed);
  const [placed, setPlaced] = useState<boolean[]>(() => Array(total).fill(false));
  const [moves, setMoves] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [startedAt, setStartedAt] = useState(Date.now);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  const placedCount = placed.filter(Boolean).length;
  const elapsedSeconds = (end: number) => Math.floor((end - startedAt) / 1000);

  const restart = () => {
    setSeed(newSeed());
    setPlaced(Array(total).fill(false));
    setMoves(0);
    setStartedAt(Date.now());
    setFinishedAt(null);
  };

  const onDrop = useCallback((index: number, isPlaced: boolean) => {
    setMoves((m) => m + 1);
    if (!isPlaced) return;
    setPlaced((prev) => {
      const next = prev.map((p, i) => (i === index ? true : p));
      if (next.every(Boolean)) setFinishedAt(Date.now());
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ title: image.title }} />
      <View style={styles.toolbar}>
        <View style={styles.stats}>
          <Timer startedAt={startedAt} finishedAt={finishedAt} />
          <Stat label="Moves" value={String(moves)} />
          <Stat label="Placed" value={`${placedCount}/${total}`} />
        </View>
        <View style={styles.actions}>
          <ToolbarButton label={showPreview ? "Hide guide" : "Show guide"} onPress={() => setShowPreview((v) => !v)} />
          <ToolbarButton label="Shuffle" onPress={restart} />
        </View>
      </View>

      <PuzzleBoard
        key={`${image.id}-${size}`}
        imageUri={image.uri}
        size={size}
        seed={seed}
        placed={placed}
        showPreview={showPreview}
        onDrop={onDrop}
      />

      {finishedAt !== null && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Puzzle solved! 🎉</Text>
            <Text style={styles.dialogText}>
              {formatTime(elapsedSeconds(finishedAt))} · {moves} moves
            </Text>
            <View style={styles.actions}>
              <ToolbarButton label="Play again" onPress={restart} primary />
              <ToolbarButton label="New puzzle" onPress={() => router.back()} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Timer({ startedAt, finishedAt }: { startedAt: number; finishedAt: number | null }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (finishedAt !== null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishedAt]);

  const end = finishedAt ?? Math.max(now, startedAt);
  return <Stat label="Time" value={formatTime(Math.floor((end - startedAt) / 1000))} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ToolbarButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, primary && styles.buttonPrimary]}>
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stats: { flexDirection: "row", gap: 20 },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  actions: { flexDirection: "row", gap: 8 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  buttonText: { color: colors.text, fontWeight: "600" },
  buttonTextPrimary: { color: colors.background },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  dialogTitle: { color: colors.text, fontSize: 24, fontWeight: "800" },
  dialogText: { color: colors.muted, fontSize: 16 },
});
