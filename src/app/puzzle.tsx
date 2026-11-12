import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PuzzleBoard } from "@/components/puzzle-board";
import { ALL_PUZZLE_IMAGES, colors, DIFFICULTIES, PUZZLE_IMAGES } from "@/constants/puzzles";
import { formatTime } from "@/utils/format-time";
import { isEdgePiece } from "@/utils/is-edge-piece";
import { usePuzzleProgress } from "@/components/puzzle-progress-provider";
import { newPuzzleProgress, puzzleKey, type PuzzleProgress, type SavedPieces } from "@/utils/puzzle-progress";

export default function PuzzleScreen() {
  const params = useLocalSearchParams<{ id?: string; size?: string }>();
  const image = ALL_PUZZLE_IMAGES.find((i) => i.id === params.id) ?? PUZZLE_IMAGES[0];
  const parsedSize = Number(params.size);
  const size = DIFFICULTIES.some((d) => d.size === parsedSize) ? parsedSize : DIFFICULTIES[0].size;
  const { puzzles, ensurePuzzle } = usePuzzleProgress();
  const key = puzzleKey(image.id, size);

  useEffect(() => {
    ensurePuzzle(image.id, size);
  }, [ensurePuzzle, image.id, size]);

  const progress = puzzles[key];
  if (!progress) return <ActivityIndicator style={styles.screen} color={colors.accent} />;
  return <PuzzleGame key={key} progress={progress} />;
}

function PuzzleGame({ progress }: { progress: PuzzleProgress }) {
  const { updatePuzzle } = usePuzzleProgress();
  const { imageId, size, seed, moves, showPreview, showEdgesOnly, startedAt, finishedAt, snapshot } = progress;
  const image = ALL_PUZZLE_IMAGES.find((candidate) => candidate.id === imageId) ?? PUZZLE_IMAGES[0];
  const key = puzzleKey(imageId, size);
  const total = size * size;
  const placed = snapshot?.pieces.map((piece) => piece.placed) ?? Array<boolean>(total).fill(false);
  const placedCount = placed.filter(Boolean).length;
  const hasUnplacedEdges = placed.some((isPlaced, index) => !isPlaced && isEdgePiece(index, size));
  const edgesOnly = showEdgesOnly && hasUnplacedEdges;
  const elapsedSeconds = (end: number) => Math.floor((end - startedAt) / 1000);

  const restart = () => {
    const fresh = newPuzzleProgress(imageId, size);
    updatePuzzle(key, () => fresh);
  };

  const onDrop = useCallback(
    (next: SavedPieces) => {
      const completedAt = next.pieces.every((piece) => piece.placed) ? Date.now() : null;
      updatePuzzle(key, (previous) => ({
        ...previous,
        moves: previous.moves + 1,
        snapshot: next,
        finishedAt: completedAt,
      }));
    },
    [key, updatePuzzle],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ title: image.title }} />
      <View style={styles.toolbar}>
        <View style={styles.stats}>
          <Stat label="Placed" value={`${placedCount}/${total}`} />
        </View>
        <View style={styles.actions}>
          <ToolbarButton label="Menu" onPress={() => router.replace("/")} />
          {hasUnplacedEdges && (
            <ToolbarButton
              label={edgesOnly ? "Show all pieces" : "Edges only"}
              onPress={() => updatePuzzle(key, (previous) => ({ ...previous, showEdgesOnly: !previous.showEdgesOnly }))}
              selected={edgesOnly}
              primary={edgesOnly}
            />
          )}
          <ToolbarButton
            label={showPreview ? "Hide guide" : "Show guide"}
            onPress={() => updatePuzzle(key, (previous) => ({ ...previous, showPreview: !previous.showPreview }))}
          />
          <ToolbarButton label="Restart" onPress={restart} />
        </View>
      </View>

      <PuzzleBoard
        key={`${image.id}-${size}-${seed}-${startedAt}`}
        imageSource={image.source}
        size={size}
        seed={seed}
        placed={placed}
        showPreview={showPreview}
        edgesOnly={edgesOnly}
        onDrop={onDrop}
        initialSnapshot={snapshot}
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
              <ToolbarButton label="New puzzle" onPress={() => router.replace("/")} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ToolbarButton({
  label,
  onPress,
  primary,
  selected,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={[styles.button, primary && styles.buttonPrimary]}
    >
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
