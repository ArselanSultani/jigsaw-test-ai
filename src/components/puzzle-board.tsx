import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { PuzzlePiece } from "@/components/puzzle-piece";
import { colors } from "@/constants/puzzles";
import { createPuzzleLayout } from "@/utils/puzzle-layout";
import { type Bounds, type PieceGeometry, type PieceState, resizeGroups } from "@/utils/piece-groups";
import { type SavedPieces } from "@/utils/puzzle-progress";

type Props = {
  imageSource: number | string;
  size: number;
  seed: number;
  placed: boolean[];
  showPreview: boolean;
  edgesOnly: boolean;
  onDrop: (snapshot: SavedPieces) => void;
  initialSnapshot: SavedPieces | null;
};

export function PuzzleBoard({ imageSource, size, seed, placed, showPreview, edgesOnly, onDrop, initialSnapshot }: Props) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [savedPieces, setSavedPieces] = useState<SavedPieces | null>(initialSnapshot);

  const handleDrop = useCallback(
    (next: PieceState[], pieceSize: number) => {
      setSavedPieces({ pieces: next, pieceSize });
      onDrop({ pieces: next, pieceSize });
    },
    [onDrop],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width: Math.floor(width), height: Math.floor(height) });
  };

  const layout = useMemo(() => createPuzzleLayout(area, size, seed), [area, size, seed]);

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
              <Image source={imageSource} style={[StyleSheet.absoluteFill, styles.preview]} contentFit="cover" />
            )}
          </View>
          <PuzzlePieces
            key={`${seed}-${area.width}x${area.height}`}
            geometry={layout.pieces}
            pieceSize={layout.pieceSize}
            boardSize={layout.boardSize}
            imageSource={imageSource}
            bounds={area}
            placed={placed}
            edgesOnly={edgesOnly}
            onDrop={handleDrop}
            savedPieces={savedPieces}
          />
        </>
      )}
    </View>
  );
}

function PuzzlePieces({
  geometry,
  placed,
  savedPieces,
  onDrop,
  ...props
}: {
  geometry: PieceGeometry[];
  placed: boolean[];
  pieceSize: number;
  boardSize: number;
  imageSource: number | string;
  bounds: Bounds;
  edgesOnly: boolean;
  onDrop: (pieces: PieceState[], pieceSize: number) => void;
  savedPieces: SavedPieces | null;
}) {
  const [initial] = useState(() =>
    savedPieces
      ? resizeGroups(savedPieces.pieces, savedPieces.pieceSize, geometry, props.bounds)
      : geometry.map((piece, i) => ({
          ...(placed[i] ? piece.target : piece.start),
          group: i,
          placed: placed[i],
          zIndex: placed[i] ? 0 : i + 1,
        })),
  );
  const pieces = useSharedValue<PieceState[]>(initial);
  const activeDrag = useSharedValue(-1);
  const zCounter = useSharedValue(Math.max(...initial.map((piece) => piece.zIndex)) + 1);
  const { pieceSize } = props;
  const handleDrop = useCallback(
    (next: PieceState[]) => {
      onDrop(next, pieceSize);
    },
    [onDrop, pieceSize],
  );
  return geometry.map((piece) => (
    <PuzzlePiece
      key={piece.index}
      {...props}
      index={piece.index}
      geometry={geometry}
      placed={placed[piece.index]}
      pieces={pieces}
      activeDrag={activeDrag}
      zCounter={zCounter}
      onDrop={handleDrop}
    />
  ));
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
