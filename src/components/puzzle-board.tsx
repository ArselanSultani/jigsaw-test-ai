import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { PuzzlePiece } from "@/components/puzzle-piece";
import { colors } from "@/constants/puzzles";

type Props = {
  imageUri: string;
  size: number;
  seed: number;
  placed: boolean[];
  showPreview: boolean;
  onDrop: (index: number, placed: boolean) => void;
};

const PADDING = 16;

function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function PuzzleBoard({ imageUri, size, seed, placed, showPreview, onDrop }: Props) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const zCounter = useSharedValue(size * size + 1);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width: Math.floor(width), height: Math.floor(height) });
  };

  const layout = useMemo(() => {
    const { width, height } = area;
    if (width === 0 || height === 0) return null;

    const isWide = width >= 720 && width > height;
    const rawBoard = isWide
      ? Math.min(height - PADDING * 2, (width - PADDING * 3) * 0.55, 640)
      : Math.min(width - PADDING * 2, (height - PADDING * 3) * 0.55, 640);
    const pieceSize = Math.floor(rawBoard / size);
    const boardSize = pieceSize * size;

    const board = isWide
      ? { x: PADDING, y: Math.floor((height - boardSize) / 2) }
      : { x: Math.floor((width - boardSize) / 2), y: PADDING };
    const tray = isWide
      ? {
          x: board.x + boardSize + PADDING,
          y: PADDING,
          width: width - boardSize - PADDING * 3,
          height: height - PADDING * 2,
        }
      : {
          x: PADDING,
          y: board.y + boardSize + PADDING,
          width: width - PADDING * 2,
          height: height - boardSize - PADDING * 3,
        };

    const random = seededRandom(seed);
    const pieces = Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size);
      const col = index % size;
      return {
        index,
        row,
        col,
        target: { x: board.x + col * pieceSize, y: board.y + row * pieceSize },
        start: {
          x: tray.x + random() * Math.max(0, tray.width - pieceSize),
          y: tray.y + random() * Math.max(0, tray.height - pieceSize),
        },
      };
    });

    return { board, boardSize, pieceSize, pieces };
  }, [area, size, seed]);

  return (
    <View style={styles.area} onLayout={onLayout}>
      {layout && (
        <>
          <View
            style={[
              styles.board,
              { left: layout.board.x, top: layout.board.y, width: layout.boardSize, height: layout.boardSize },
            ]}
          >
            {showPreview && (
              <Image source={{ uri: imageUri }} style={[StyleSheet.absoluteFill, styles.preview]} contentFit="cover" />
            )}
          </View>
          {layout.pieces.map((piece) => (
            <PuzzlePiece
              key={`${seed}-${area.width}x${area.height}-${piece.index}`}
              {...piece}
              pieceSize={layout.pieceSize}
              boardSize={layout.boardSize}
              imageUri={imageUri}
              bounds={area}
              placed={placed[piece.index]}
              zCounter={zCounter}
              onDrop={onDrop}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, overflow: "hidden" },
  board: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    boxSizing: "content-box",
    marginLeft: -2,
    marginTop: -2,
  },
  preview: { opacity: 0.25 },
});
