import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { R } from '../theme';

type Point = { x: number; y: number };

export type PracticeCanvasRef = {
  undo: () => void;
  clear: () => void;
  strokeCount: number;
};

function pathFor(points: Point[]) {
  if (!points.length) return '';
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} L ${point.x + 0.1} ${point.y + 0.1}`;
  }
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midpoint = { x: (previous.x + current.x) / 2, y: (previous.y + current.y) / 2 };
    path += ` Q ${previous.x} ${previous.y} ${midpoint.x} ${midpoint.y}`;
    if (index === points.length - 1) path += ` T ${current.x} ${current.y}`;
  }
  return path;
}

export const PracticeCanvas = forwardRef<
  PracticeCanvasRef,
  {
    target: string;
    showHint: boolean;
    hintOpacity?: number;
    onStrokeCountChange?: (count: number) => void;
  }
>(function PracticeCanvas({ target, showHint, hintOpacity = 0.28, onStrokeCountChange }, ref) {
  const { theme } = useTheme();
  const [size, setSize] = useState(280);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [activeStroke, setActiveStroke] = useState<Point[]>([]);
  const activeRef = useRef<Point[]>([]);
  const sizeRef = useRef(280);
  const completedCount = useRef(0);
  const frameRef = useRef<number | null>(null);

  const setPoint = useCallback((x: number, y: number) => ({
    x: Math.max(4, Math.min(sizeRef.current - 4, x)),
    y: Math.max(4, Math.min(sizeRef.current - 4, y)),
  }), []);

  const flushActiveStroke = useCallback(() => {
    frameRef.current = null;
    setActiveStroke(activeRef.current.slice());
  }, []);

  const undo = useCallback(() => {
    setStrokes((current) => {
      const next = current.slice(0, -1);
      completedCount.current = next.length;
      onStrokeCountChange?.(next.length);
      return next;
    });
  }, [onStrokeCountChange]);

  const clear = useCallback(() => {
    setStrokes([]);
    activeRef.current = [];
    setActiveStroke([]);
    completedCount.current = 0;
    onStrokeCountChange?.(0);
  }, [onStrokeCountChange]);

  useImperativeHandle(
    ref,
    () => ({
      undo,
      clear,
      strokeCount: strokes.length,
    }),
    [undo, clear, strokes.length]
  );

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const point = setPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
          activeRef.current = [point];
          setActiveStroke([point]);
          onStrokeCountChange?.(completedCount.current + 1);
        },
        onPanResponderMove: (event) => {
          const point = setPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
          const previous = activeRef.current[activeRef.current.length - 1];
          if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 1.8) return;
          activeRef.current.push(point);
          if (frameRef.current === null) frameRef.current = requestAnimationFrame(flushActiveStroke);
        },
        onPanResponderRelease: () => {
          const finished = activeRef.current;
          if (finished.length) {
            setStrokes((current) => [...current, pathFor(finished)]);
            completedCount.current += 1;
            onStrokeCountChange?.(completedCount.current);
          }
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
          activeRef.current = [];
          setActiveStroke([]);
        },
        onPanResponderTerminate: () => {
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
          activeRef.current = [];
          setActiveStroke([]);
          onStrokeCountChange?.(completedCount.current);
        },
      }).panHandlers,
    [flushActiveStroke, onStrokeCountChange, setPoint]
  );

  const glyphFontSize = useMemo(() => {
    if (!target) return 80;
    if (target.length === 1) return Math.round(size * 0.58);
    return Math.min(Math.round(size * 0.42), Math.round((size * 0.85) / target.length));
  }, [size, target]);

  const strokeWidth = Math.max(8, Math.round(size * 0.04));

  return (
    <View
      {...panHandlers}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && Math.abs(width - sizeRef.current) > 2) {
          sizeRef.current = width;
          setSize(width);
        }
      }}
      style={[
        styles.canvas,
        {
          backgroundColor: theme.canvasBg,
          borderColor: theme.canvasBorder,
        },
      ]}
      accessibilityLabel={`Writing area for ${target}`}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        {/* Traditional Japanese Masume (Practice Grid) */}
        <Rect
          x={12}
          y={12}
          width={size - 24}
          height={size - 24}
          fill="none"
          stroke={theme.line}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {/* Center vertical dashed line */}
        <Line
          x1={size / 2}
          y1={12}
          x2={size / 2}
          y2={size - 12}
          stroke={theme.canvasGrid}
          strokeWidth={1}
          strokeDasharray="5 5"
        />
        {/* Center horizontal dashed line */}
        <Line
          x1={12}
          y1={size / 2}
          x2={size - 12}
          y2={size / 2}
          stroke={theme.canvasGrid}
          strokeWidth={1}
          strokeDasharray="5 5"
        />

        {/* Drawn strokes */}
        {strokes.map((stroke, index) => (
          <Path
            key={index}
            d={stroke}
            fill="none"
            stroke={theme.canvasStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Active drawing stroke */}
        {activeStroke.length ? (
          <Path
            d={pathFor(activeStroke)}
            fill="none"
            stroke={theme.canvasStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Single point tap dot */}
        {activeStroke.length === 1 ? (
          <Circle
            cx={activeStroke[0].x}
            cy={activeStroke[0].y}
            r={strokeWidth / 2}
            fill={theme.canvasStroke}
          />
        ) : null}
      </Svg>

      {/* Trace guide watermark */}
      {showHint ? (
        <View pointerEvents="none" style={[styles.targetLayer, { opacity: hintOpacity }]}>
          <Text
            numberOfLines={1}
            style={[
              styles.targetGlyph,
              {
                color: theme.muted,
                fontSize: glyphFontSize,
                lineHeight: Math.round(glyphFontSize * 1.15),
              },
            ]}
          >
            {target}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'crosshair',
      } as const,
      default: {},
    }),
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  targetLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  targetGlyph: {
    textAlign: 'center',
    fontWeight: '600',
    includeFontPadding: false,
  },
});
