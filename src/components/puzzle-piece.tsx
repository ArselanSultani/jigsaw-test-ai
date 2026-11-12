import { memo, useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from "react-native-svg";

import {
  type Bounds,
  type PieceGeometry,
  type PieceState,
  type Point,
  isGroupVisible,
  moveGroup,
  snapGroup,
} from "@/utils/piece-groups";

type Props = {
  index: number;
  pieceSize: number;
  boardSize: number;
  imageSource: number | string;
  geometry: PieceGeometry[];
  bounds: Bounds;
  placed: boolean;
  edgesOnly: boolean;
  pieces: SharedValue<PieceState[]>;
  activeDrag: SharedValue<number>;
  zCounter: SharedValue<number>;
  onDrop: (pieces: PieceState[]) => void;
};

export const PuzzlePiece = memo(function PuzzlePiece({
  index,
  pieceSize,
  boardSize,
  imageSource,
  geometry,
  bounds,
  placed,
  edgesOnly,
  pieces,
  activeDrag,
  zCounter,
  onDrop,
}: Props) {
  const { row, col, shape } = geometry[index];
  const clipId = `piece-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const origin = useSharedValue<PieceState[] | null>(null);
  const pointerDown = useSharedValue<Point>({ x: 0, y: 0 });
  const snapDistance = pieceSize * 0.3;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!placed)
        .onBegin((event) => {
          pointerDown.set({ x: event.absoluteX, y: event.absoluteY });
        })
        .onStart(() => {
          const current = pieces.get();
          if (
            activeDrag.get() !== -1 ||
            current[index].placed ||
            !isGroupVisible(current, index, geometry, edgesOnly)
          ) return;
          activeDrag.set(index);
          const nextZ = zCounter.get() + 1;
          zCounter.set(nextZ);
          const group = current[index].group;
          const raised = current.map((piece) => (piece.group === group ? { ...piece, zIndex: nextZ } : piece));
          origin.set(raised);
          pieces.set(raised);
        })
        .onUpdate((event) => {
          const start = origin.get();
          if (activeDrag.get() !== index || !start) return;
          const pointer = pointerDown.get();
          pieces.set(moveGroup(start, index, event.absoluteX - pointer.x, event.absoluteY - pointer.y, geometry, bounds));
        })
        .onEnd((_event, success) => {
          if (!success || activeDrag.get() !== index) return;
          const next = snapGroup(pieces.get(), index, geometry, bounds, snapDistance, edgesOnly);
          pieces.set(next);
          scheduleOnRN(onDrop, next);
        })
        .onFinalize((_event, success) => {
          if (activeDrag.get() !== index) return;
          const start = origin.get();
          if (!success && start) pieces.set(start);
          origin.set(null);
          activeDrag.set(-1);
        }),
    [placed, pieces, index, geometry, edgesOnly, activeDrag, zCounter, origin, pointerDown, bounds, snapDistance, onDrop],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const current = pieces.get();
    const piece = current[index];
    const dragging = activeDrag.get() >= 0 && current[activeDrag.get()].group === piece.group;
    return {
      display: isGroupVisible(current, index, geometry, edgesOnly) ? "flex" : "none",
      zIndex: piece.zIndex,
      transform: [{ translateX: piece.x }, { translateY: piece.y }],
      shadowOpacity: dragging ? 0.4 : 0,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLabel={`Piece row ${row + 1}, column ${col + 1}${placed ? ", placed" : ""}`}
        style={[
          styles.piece,
          { left: -shape.left, top: -shape.top, width: shape.width, height: shape.height },
          placed && styles.placed,
          animatedStyle,
        ]}
      >
        <View style={styles.imageClip}>
          <Svg width={shape.width} height={shape.height} viewBox={`0 0 ${shape.width} ${shape.height}`}>
            <Defs>
              <ClipPath id={clipId}>
                <Path d={shape.path} />
              </ClipPath>
            </Defs>
            <SvgImage
              href={imageSource}
              x={shape.left - col * pieceSize}
              y={shape.top - row * pieceSize}
              width={boardSize}
              height={boardSize}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
            <Path
              d={shape.path}
              fill="none"
              stroke={placed ? "rgba(15,23,42,0.2)" : "rgba(255,255,255,0.7)"}
              strokeWidth={placed ? 0.5 : 1}
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    cursor: "pointer",
  },
  placed: { cursor: "auto" },
  imageClip: { ...StyleSheet.absoluteFill, pointerEvents: "none" },
});
