import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Text from "./Text";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { MonthlyTypeData, OTHER_TYPE } from "../utils/ledger";
import { amountFormat } from "../utils/Utils";

type IMonthlyEarningsChart = {
  data: MonthlyTypeData;
};

type Mode = "bars" | "line";

const CHART_HEIGHT = 150;
// Headroom above the tallest mark for its value label — also keeps the top of
// the line clear of the view toggle sitting above the plot.
const TOP_PAD = 26;
const COLUMN_WIDTH = 34;
const COLUMN_GAP = 14;
const SLOT = COLUMN_WIDTH + COLUMN_GAP;
const SEGMENT_GAP = 2;
const DOT_RADIUS = 4.5;
const DOT_RADIUS_SELECTED = 5.5;

/**
 * Catmull-Rom to cubic-bezier conversion (tension 1/6) — a smooth curve
 * through every point without overshooting past its neighbours, the standard
 * technique for turning a polyline into a natural-looking line chart.
 */
const smoothLinePath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const rupees = (value: number) => `₹ ${amountFormat(Math.round(value))}`;

const trimNum = (n: number) => {
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

/** Compact rupee figure for on-chart labels: 65000 -> "65k", 250000 -> "2.5L". */
const compact = (value: number) => {
  const v = Math.round(value);
  if (v >= 1e7) return `${trimNum(v / 1e7)}Cr`;
  if (v >= 1e5) return `${trimNum(v / 1e5)}L`;
  if (v >= 1e3) return `${trimNum(v / 1e3)}k`;
  return String(v);
};

/** "YYYY-MM" -> "YYYY". */
const yearOf = (key: string) => key.slice(0, 4);

/**
 * Earnings per month, either as stacked columns (height = total, colour = type)
 * or a single-series line of the monthly totals. Bars answer "what was I paid
 * for"; the line answers "which way is it going" at a glance. Both share one
 * vertical scale and the tap-to-pin readout below.
 */
const MonthlyEarningsChart = ({ data }: IMonthlyEarningsChart) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>("line");

  // Colour follows the type's identity (its rank in the fixed `types` order),
  // not its size in any one month — so a type keeps its colour across columns.
  const colorForType = useMemo(() => {
    const map: Record<string, string> = {};
    data.types.forEach((type, index) => {
      map[type] =
        type === OTHER_TYPE
          ? colors.chartOther
          : colors.chartSeries[index % colors.chartSeries.length];
    });
    return map;
  }, [data.types, colors]);

  // Default to the most recent month — the one you most likely came to check.
  const [selectedKey, setSelectedKey] = useState(
    () => data.months[data.months.length - 1]?.key ?? ""
  );
  const selectedIndex = data.months.findIndex((m) => m.key === selectedKey);
  const selected =
    data.months[selectedIndex] ?? data.months[data.months.length - 1];
  const previous = selectedIndex > 0 ? data.months[selectedIndex - 1] : null;
  const delta = previous ? selected.total - previous.total : null;

  const scale = (amount: number) =>
    data.maxTotal > 0 ? (amount / data.maxTotal) * (CHART_HEIGHT - TOP_PAD) : 0;

  const plotWidth = data.months.length * SLOT;

  const renderBars = () =>
    data.months.map((month) => {
      const isSelected = month.key === selected?.key;
      // Top-to-bottom render is the reverse of the bottom-up stack, so the
      // first type sits on the baseline.
      const stack = [...month.segments].reverse();
      return (
        <Pressable
          key={month.key}
          onPress={() => setSelectedKey(month.key)}
          accessibilityRole="button"
          accessibilityLabel={`${month.label}, ${rupees(month.total)}`}
          style={styles.column}
        >
          <View style={styles.bars}>
            {month.total === 0 ? (
              <View style={styles.zeroTick} />
            ) : (
              <>
                {/* Total above the stack — flex-end keeps it just over the top. */}
                <Text style={styles.valueLabel} numberOfLines={1}>
                  {compact(month.total)}
                </Text>
                {stack.map((segment, segmentIndex) => {
                  const height = scale(segment.amount);
                  if (height <= 0) {
                    return null;
                  }
                  return (
                    <View
                      key={segment.type}
                      style={{
                        height,
                        backgroundColor: colorForType[segment.type],
                        // A 2px surface gap separates adjacent fills, and the top
                        // of the whole stack gets rounded data-ends.
                        marginBottom:
                          segmentIndex === stack.length - 1 ? 0 : SEGMENT_GAP,
                        borderTopLeftRadius: segmentIndex === 0 ? 4 : 0,
                        borderTopRightRadius: segmentIndex === 0 ? 4 : 0,
                      }}
                    />
                  );
                })}
              </>
            )}
          </View>
          {/* Fixed height so a year line on some columns doesn't lift their
              bars above the others' baseline. */}
          <View style={styles.barLabels}>
            <Text
              style={[styles.monthLabel, isSelected && styles.monthLabelActive]}
              numberOfLines={1}
            >
              {month.shortLabel}
            </Text>
            <Text style={styles.yearLabel}>{yearOf(month.key)}</Text>
          </View>
        </Pressable>
      );
    });

  // Points at each column's centre, plotted with a smooth Catmull-Rom curve
  // through them via react-native-svg rather than straight rotated segments.
  const points = data.months.map((month, index) => ({
    month,
    x: index * SLOT + COLUMN_WIDTH / 2,
    y: CHART_HEIGHT - scale(month.total),
  }));
  const linePath = useMemo(() => smoothLinePath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${CHART_HEIGHT} L ${first.x} ${CHART_HEIGHT} Z`;
  }, [linePath, points]);

  const renderLine = () => (
    <View style={{ width: plotWidth }}>
      <View style={{ width: plotWidth, height: CHART_HEIGHT }}>
        <Svg width={plotWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="monthlyAreaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.chartAmount} stopOpacity={0.28} />
              <Stop offset="1" stopColor={colors.chartAmount} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {!!areaPath && <Path d={areaPath} fill="url(#monthlyAreaFill)" />}
          {!!linePath && (
            <Path
              d={linePath}
              fill="none"
              stroke={colors.chartAmount}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((point) => {
            const isSelected = point.month.key === selected?.key;
            return (
              <Circle
                key={point.month.key}
                cx={point.x}
                cy={point.y}
                r={isSelected ? DOT_RADIUS_SELECTED : DOT_RADIUS}
                // A surface ring lifts the active point off the line.
                fill={isSelected ? colors.text : colors.chartAmount}
                stroke={colors.card}
                strokeWidth={isSelected ? 2 : 0}
              />
            );
          })}
        </Svg>

        {/* Total above each point, sitting in the headroom left by the scale. */}
        {points.map((point) =>
          point.month.total > 0 ? (
            <Text
              key={point.month.key}
              style={[
                styles.valueLabelAbs,
                { left: point.x - SLOT / 2, top: Math.max(point.y - 18, 0) },
              ]}
              numberOfLines={1}
            >
              {compact(point.month.total)}
            </Text>
          ) : null
        )}

        {/* Hit targets span the full column height, bigger than the dots. */}
        {data.months.map((month, index) => (
          <Pressable
            key={month.key}
            onPress={() => setSelectedKey(month.key)}
            accessibilityRole="button"
            accessibilityLabel={`${month.label}, ${rupees(month.total)}`}
            style={[styles.hitTarget, { left: index * SLOT, width: SLOT }]}
          />
        ))}
      </View>

      {/* Labels are absolute and centred on each point, so they can't drift out
          of step with the columns the way a margin-based row would. */}
      <View style={{ width: plotWidth, height: 36 }}>
        {points.map((point) => (
          <View
            key={point.month.key}
            style={[styles.lineLabelBox, { left: point.x - SLOT / 2 }]}
          >
            <Text
              style={[
                styles.monthLabel,
                point.month.key === selected?.key && styles.monthLabelActive,
              ]}
              numberOfLines={1}
            >
              {point.month.shortLabel}
            </Text>
            <Text style={styles.yearLabel}>{yearOf(point.month.key)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View>
      <View style={styles.topRow}>
        {mode === "bars" ? (
          <View style={styles.legend}>
            {data.types.map((type) => (
              <View key={type} style={styles.legendItem}>
                <View
                  style={[styles.swatch, { backgroundColor: colorForType[type] }]}
                />
                <Text style={styles.legendLabel}>{type}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.legend} />
        )}

        <View style={styles.toggle}>
          {(["line", "bars"] as Mode[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setMode(option)}
              accessibilityRole="button"
              accessibilityLabel={option === "line" ? "Line view" : "Bars view"}
              style={[
                styles.toggleButton,
                mode === option && styles.toggleButtonActive,
              ]}
            >
              <Ionicons
                name={option === "line" ? "pulse-outline" : "stats-chart"}
                size={15}
                color={mode === option ? colors.onPrimary : colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plot}
      >
        {mode === "bars" ? renderBars() : renderLine()}
      </ScrollView>

      {!!selected && (
        <View style={styles.readout}>
          <View style={styles.readoutHeader}>
            <Text style={styles.readoutMonth}>{selected.label}</Text>
            <Text style={styles.readoutTotal}>{rupees(selected.total)}</Text>
          </View>

          {delta !== null && (
            <View style={styles.deltaRow}>
              <Ionicons
                name={
                  delta > 0 ? "arrow-up" : delta < 0 ? "arrow-down" : "remove"
                }
                size={13}
                color={
                  delta > 0
                    ? colors.positive
                    : delta < 0
                    ? colors.negative
                    : colors.textMuted
                }
              />
              <Text style={styles.deltaText}>
                {delta === 0
                  ? "Same as the month before"
                  : `${rupees(Math.abs(delta))} ${
                      delta > 0 ? "more" : "less"
                    } than ${previous?.shortLabel}`}
              </Text>
            </View>
          )}

          <View style={styles.breakdown}>
            {selected.segments
              .filter((segment) => segment.amount > 0)
              .map((segment) => (
                <View key={segment.type} style={styles.breakdownRow}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: colorForType[segment.type] },
                    ]}
                  />
                  <Text style={styles.breakdownType} numberOfLines={1}>
                    {segment.type}
                  </Text>
                  <Text style={styles.breakdownAmount}>
                    {rupees(segment.amount)}
                  </Text>
                </View>
              ))}
            {selected.total === 0 && (
              <Text style={styles.breakdownEmpty}>No earnings this month.</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    legend: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 6,
    },
    swatch: {
      width: 10,
      height: 10,
      borderRadius: 3,
      marginRight: 6,
    },
    legendLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    toggle: {
      flexDirection: "row",
      borderRadius: 9,
      backgroundColor: colors.inputBackground,
      padding: 2,
      marginLeft: 12,
    },
    toggleButton: {
      width: 34,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    plot: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingRight: 4,
    },
    column: {
      width: COLUMN_WIDTH,
      marginRight: COLUMN_GAP,
      alignItems: "center",
    },
    bars: {
      height: CHART_HEIGHT,
      width: COLUMN_WIDTH,
      flexDirection: "column",
      justifyContent: "flex-end",
    },
    zeroTick: {
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.border,
    },
    hitTarget: {
      position: "absolute",
      top: 0,
      height: CHART_HEIGHT,
    },
    valueLabel: {
      width: COLUMN_WIDTH,
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 3,
      fontVariant: ["tabular-nums"],
    },
    valueLabelAbs: {
      position: "absolute",
      width: SLOT,
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    barLabels: {
      height: 36,
      alignItems: "center",
    },
    monthLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 8,
      fontVariant: ["tabular-nums"],
    },
    yearLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
      fontVariant: ["tabular-nums"],
    },
    lineLabelBox: {
      position: "absolute",
      top: 0,
      width: SLOT,
      alignItems: "center",
    },
    monthLabelActive: {
      color: colors.text,
      fontWeight: "700",
    },
    readout: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    readoutHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    readoutMonth: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    readoutTotal: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    deltaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    deltaText: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: 4,
    },
    breakdown: {
      marginTop: 14,
    },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
    },
    breakdownType: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginLeft: 2,
    },
    breakdownAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    breakdownEmpty: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });

export default MonthlyEarningsChart;
