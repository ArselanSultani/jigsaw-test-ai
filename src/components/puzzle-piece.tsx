import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Point = { x: number; y: number };

type Props = {
  index: number;
  row: number;
  col: number;
  pieceSize: number;
  boardSize: number;
  imageUri: string;
  start: Point;
  target: Point;
  bounds: { width: number; height: number };
  placed: boolean;
  zCounter: SharedValue<number>;
  onDrop: (index: number, placed: boolean) => void;
};

export const PuzzlePiece = memo(function PuzzlePiece({
  index,
  row,
  col,
  pieceSize,
  boardSize,
  imageUri,
  start,
  target,
  bounds,
  placed,
  zCounter,
  onDrop,
}: Props) {
  const x = useSharedValue(placed ? target.x : start.x);
  const y = useSharedValue(placed ? target.y : start.y);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(placed ? 0 : index + 1);
  const locked = useSharedValue(placed);

  const snapDistance = pieceSize * 0.3;
  const maxX = Math.max(0, bounds.width - pieceSize);
  const maxY = Math.max(0, bounds.height - pieceSize);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!placed)
        .onBegin(() => {
          if (locked.value) return;
          const nextZ = zCounter.get() + 1;
          zCounter.set(nextZ);
          zIndex.value = nextZ;
          originX.value = x.value;
          originY.value = y.value;
          scale.value = withTiming(1.06, { duration: 120 });
        })
        .onUpdate((e) => {
          if (locked.value) return;
          x.value = Math.min(Math.max(originX.value + e.translationX, 0), maxX);
          y.value = Math.min(Math.max(originY.value + e.translationY, 0), maxY);
        })
        .onFinalize(() => {
          if (locked.value) return;
          scale.value = withTiming(1, { duration: 120 });
          const isClose = Math.abs(x.value - target.x) < snapDistance && Math.abs(y.value - target.y) < snapDistance;
          if (isClose) {
            locked.value = true;
            zIndex.value = 0;
            x.value = withSpring(target.x, { damping: 18, stiffness: 220 });
            y.value = withSpring(target.y, { damping: 18, stiffness: 220 });
          }
          scheduleOnRN(onDrop, index, isClose);
        }),
    [
      placed,
      index,
      target.x,
      target.y,
      snapDistance,
      maxX,
      maxY,
      onDrop,
      zCounter,
      locked,
      zIndex,
      x,
      y,
      originX,
      originY,
      scale,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: zIndex.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    shadowOpacity: scale.value > 1 ? 0.4 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLabel={`Piece row ${row + 1}, column ${col + 1}${placed ? ", placed" : ""}`}
        style={[styles.piece, { width: pieceSize, height: pieceSize }, placed && styles.placed, animatedStyle]}
      >
        <View style={styles.imageClip}>
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{
              position: "absolute",
              width: boardSize,
              height: boardSize,
              left: -col * pieceSize,
              top: -row * pieceSize,
            }}
          />
        </View>
        {!placed && <View style={styles.edge} />}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
    borderRadius: 4,
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    cursor: "pointer",
  },
  placed: {
    borderRadius: 0,
    cursor: "auto",
  },
  imageClip: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
  },
  edge: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
});
