import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ALL_PUZZLE_IMAGES, colors, DIFFICULTIES, PUZZLE_IMAGES } from "@/constants/puzzles";
import { usePuzzleProgress } from "@/components/puzzle-progress-provider";
import { puzzleKey } from "@/utils/puzzle-progress";

export default function Index() {
  const [imageId, setImageId] = useState(PUZZLE_IMAGES[0].id);
  const [size, setSize] = useState<number>(DIFFICULTIES[0].size);
  const { puzzles } = usePuzzleProgress();
  const inProgress = Object.values(puzzles).filter((puzzle) => puzzle.finishedAt === null);
  const selectedSave = puzzles[puzzleKey(imageId, size)];

  const start = () => {
    router.push({ pathname: "/puzzle", params: { id: imageId, size: String(size) } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {inProgress.length > 0 && (
        <>
          <Text style={styles.heading}>Continue a puzzle</Text>
          {inProgress.map((puzzle) => (
            <Pressable
              key={puzzleKey(puzzle.imageId, puzzle.size)}
              accessibilityRole="button"
              onPress={() => router.push({
                pathname: "/puzzle",
                params: { id: puzzle.imageId, size: String(puzzle.size) },
              })}
              style={styles.resumeCard}
            >
              <Text style={styles.thumbLabel}>
                {ALL_PUZZLE_IMAGES.find((image) => image.id === puzzle.imageId)?.title} ·{" "}
                {DIFFICULTIES.find((level) => level.size === puzzle.size)?.label}
              </Text>
              <Text style={styles.resumeText}>
                {puzzle.snapshot?.pieces.filter((piece) => piece.placed).length ?? 0}/{puzzle.size * puzzle.size} placed · Continue
              </Text>
            </Pressable>
          ))}
        </>
      )}
      <Text style={styles.heading}>Choose an image</Text>
      <View style={styles.grid}>
        {PUZZLE_IMAGES.map((image) => {
          const selected = image.id === imageId;
          return (
            <Pressable
              key={image.id}
              accessibilityRole="button"
              accessibilityLabel={image.title}
              accessibilityState={{ selected }}
              onPress={() => setImageId(image.id)}
              style={[styles.thumb, selected && styles.thumbSelected]}
            >
              <Image source={image.source} style={styles.thumbImage} contentFit="cover" transition={200} />
              <Text style={styles.thumbLabel}>{image.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.heading}>Difficulty</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => {
          const selected = d.size === size;
          return (
            <Pressable
              key={d.size}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSize(d.size)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {d.label} · {d.size * d.size}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={start} style={styles.startButton}>
        <Text style={styles.startText}>{selectedSave ? "Continue puzzle" : "Start puzzle"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, maxWidth: 720, width: "100%", alignSelf: "center" },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700" },
  resumeCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.border },
  resumeText: { color: colors.accent, padding: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  thumb: {
    width: 150,
    flexGrow: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  thumbSelected: { borderColor: colors.accent },
  thumbImage: { width: "100%", aspectRatio: 1 },
  thumbLabel: { color: colors.text, padding: 8, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: "600" },
  chipTextSelected: { color: colors.background },
  startButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startText: { color: colors.background, fontSize: 18, fontWeight: "700" },
});
