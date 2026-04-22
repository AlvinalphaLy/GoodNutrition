import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { colors } from "../lib/colors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "high" | "medium" | "low";

type FlaggedIngredient = {
  name: string;
  products: string[];
  severity: Severity;
  occurrences: number;
  severityScore: number;
};

type OffendingProduct = {
  emoji: string;
  name: string;
  flags: string[];
};

type DailyReport = {
  date: Date;
  score: number;
  grade: string;
  gradeDescription: string;
  totalScans: number;
  flaggedCount: number;
  offendingProductCount: number;
  dayOverDayDelta: number;
  flaggedIngredients: FlaggedIngredient[];
  topProducts: OffendingProduct[];
};

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const REPORTS: DailyReport[] = [
  {
    date: today,
    score: 70,
    grade: "B–",
    gradeDescription: "Room to improve — 8 harmful ingredients detected across 5 scans",
    totalScans: 5,
    flaggedCount: 8,
    offendingProductCount: 3,
    dayOverDayDelta: -6,
    flaggedIngredients: [
      { name: "High fructose corn syrup", products: ["Granola Bar", "Yogurt Parfait"], severity: "high", occurrences: 2, severityScore: 90 },
      { name: "Sodium nitrite", products: ["Deli Turkey"], severity: "high", occurrences: 1, severityScore: 72 },
      { name: "Carrageenan", products: ["Almond Milk"], severity: "medium", occurrences: 1, severityScore: 45 },
      { name: "Artificial flavor", products: ["Protein Shake", "Granola Bar"], severity: "medium", occurrences: 2, severityScore: 38 },
    ],
    topProducts: [
      { emoji: "🍫", name: "Nature Valley Granola Bar", flags: ["HFCS", "Artificial flavor", "TBHQ"] },
      { emoji: "🥪", name: "Oscar Mayer Deli Turkey", flags: ["Sodium nitrite", "Modified starch"] },
      { emoji: "🥛", name: "Silk Almond Milk", flags: ["Carrageenan", "Sunflower lecithin"] },
    ],
  },
  {
    date: yesterday,
    score: 84,
    grade: "B+",
    gradeDescription: "Good day — only 2 harmful ingredients found across 4 scans",
    totalScans: 4,
    flaggedCount: 2,
    offendingProductCount: 1,
    dayOverDayDelta: 14,
    flaggedIngredients: [
      { name: "Carrageenan", products: ["Almond Milk"], severity: "medium", occurrences: 1, severityScore: 45 },
      { name: "Artificial color", products: ["Sports Drink"], severity: "medium", occurrences: 1, severityScore: 30 },
    ],
    topProducts: [
      { emoji: "🥛", name: "Silk Almond Milk", flags: ["Carrageenan"] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateString = (d: Date) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

const isSameDay = (a: Date, b: Date) => toDateString(a) === toDateString(b);

const getReport = (date: Date): DailyReport | null =>
  REPORTS.find((r) => isSameDay(r.date, date)) ?? null;

const formatLabel = (date: Date): string => {
  if (isSameDay(date, today)) return `Today · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (isSameDay(date, y)) return `Yesterday · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

const scoreColor = (score: number) => {
  if (score >= 85) return colors.success ?? "#639922";
  if (score >= 65) return "#BA7517";
  return colors.danger;
};

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; bar: string }> = {
  high:   { bg: colors.dangerLight,  text: colors.dangerText  ?? colors.danger, bar: colors.danger },
  medium: { bg: colors.warningLight, text: colors.warningText ?? "#854F0B",      bar: "#BA7517"     },
  low:    { bg: colors.successLight, text: colors.successText ?? "#3B6D11",      bar: "#639922"     },
};

// Dot markers for days that have report data
const markedDates = REPORTS.reduce((acc, r) => {
  acc[toDateString(r.date)] = {
    marked: true,
    dotColor: scoreColor(r.score),
  };
  return acc;
}, {} as Record<string, any>);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatPill = ({ label, value, bad, good }: { label: string; value: string; bad?: boolean; good?: boolean }) => (
  <View style={styles.statPill}>
    <Text style={[styles.statValue, bad && { color: colors.danger }, good && { color: colors.success ?? "#639922" }]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ScoreCard = ({ report }: { report: DailyReport }) => {
  const fill = scoreColor(report.score);
  const deltaPositive = report.dayOverDayDelta >= 0;
  return (
    <View style={styles.subContainer}>
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, { borderColor: fill }]}>
          <Text style={[styles.scoreNum, { color: fill }]}>{report.score}</Text>
          <Text style={styles.scoreDen}>/100</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.subHeader}>CLEAN EATING SCORE</Text>
          <Text style={[styles.grade, { color: fill }]}>{report.grade}</Text>
          <Text style={styles.gradeDesc}>{report.gradeDescription}</Text>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={styles.statsRow}>
        <StatPill label="Flagged"      value={String(report.flaggedCount)}          bad />
        <StatPill label="Products"     value={String(report.offendingProductCount)} bad />
        <StatPill label="vs yesterday" value={`${deltaPositive ? "+" : ""}${report.dayOverDayDelta}`} bad={!deltaPositive} good={deltaPositive} />
        <StatPill label="Scans"        value={String(report.totalScans)} />
      </View>
    </View>
  );
};

const IngredientRow = ({ ingredient, rank }: { ingredient: FlaggedIngredient; rank: number }) => {
  const sc = SEVERITY_COLORS[ingredient.severity];
  return (
    <View style={styles.ingredientRow}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.ingName}>{ingredient.name}</Text>
        <Text style={styles.ingProducts}>{ingredient.products.join(", ")}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${ingredient.severityScore}%`, backgroundColor: sc.bar }]} />
        </View>
      </View>
      <View style={styles.ingRight}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {ingredient.severity.charAt(0).toUpperCase() + ingredient.severity.slice(1)}
          </Text>
        </View>
        <Text style={styles.ingCount}>{ingredient.occurrences}× today</Text>
      </View>
    </View>
  );
};

const ProductRow = ({ product }: { product: OffendingProduct }) => (
  <Pressable style={styles.productRow} onPress={() => console.log("tapped", product.name)}>
    <View style={styles.productIcon}>
      <Text style={{ fontSize: 20 }}>{product.emoji}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.productName}>{product.name}</Text>
      <View style={styles.flagPills}>
        {product.flags.map((flag, i) => (
          <View key={i} style={styles.flagPill}>
            <Text style={styles.flagPillText}>{flag}</Text>
          </View>
        ))}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textMedium} />
  </Pressable>
);

const EmptyDay = ({ date }: { date: Date }) => (
  <View style={styles.emptyState}>
    <Ionicons name="leaf-outline" size={36} color={colors.textLight} />
    <Text style={styles.emptyTitle}>No data for {formatLabel(date)}</Text>
    <Text style={styles.emptyText}>Scan some meals to see your report.</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);

  const report = getReport(selectedDate);

  const stepDay = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    if (d <= today) setSelectedDate(d);
  };

  const selectedStr = toDateString(selectedDate);

  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20 }}>

      {/* ── Day navigation ── */}
      <View style={styles.weekNav}>
        <Pressable onPress={() => stepDay(-1)} style={styles.weekBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.textMedium} />
        </Pressable>

        <Pressable onPress={() => setShowCalendar(true)} style={styles.dateLabelBtn}>
          <Text style={styles.weekLabel}>{formatLabel(selectedDate)}</Text>
          <Ionicons name="calendar-outline" size={14} color={colors.textMedium} style={{ marginLeft: 5 }} />
        </Pressable>

        <Pressable
          onPress={() => stepDay(1)}
          disabled={isSameDay(selectedDate, today)}
          style={[styles.weekBtn, isSameDay(selectedDate, today) && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textMedium} />
        </Pressable>
      </View>

      {/* ── Calendar modal ── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a day</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={22} color={colors.textMedium} />
              </Pressable>
            </View>

            <Calendar
              current={selectedStr}
              maxDate={toDateString(today)}
              markedDates={{
                ...markedDates,
                [selectedStr]: {
                  ...(markedDates[selectedStr] ?? {}),
                  selected: true,
                  selectedColor: colors.danger,
                },
              }}
              onDayPress={(day) => {
                const d = new Date(day.dateString);
                d.setHours(0, 0, 0, 0);
                setSelectedDate(d);
                setShowCalendar(false);
              }}
              theme={{
                backgroundColor: colors.cardBg,
                calendarBackground: colors.cardBg,
                textSectionTitleColor: colors.textMedium,
                selectedDayBackgroundColor: colors.danger,
                selectedDayTextColor: "#ffffff",
                todayTextColor: colors.danger,
                dayTextColor: colors.textDark,
                textDisabledColor: colors.textLight,
                dotColor: colors.danger,
                selectedDotColor: "#ffffff",
                arrowColor: colors.textDark,
                monthTextColor: colors.textDark,
                textDayFontWeight: "500",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "500",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Content ── */}
      {report ? (
        <>
          <View>
            <Text style={styles.header}>Daily Report Card</Text>
            <ScoreCard report={report} />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Top Flagged Ingredients</Text>
            <View style={[styles.subContainer, { padding: 0, overflow: "hidden" }]}>
              {report.flaggedIngredients.map((ing, i) => (
                <View key={ing.name}>
                  <IngredientRow ingredient={ing} rank={i + 1} />
                  {i < report.flaggedIngredients.length - 1 && (
                    <View style={[styles.separator, { marginVertical: 0, marginHorizontal: 12 }]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Top Offending Products</Text>
            <View style={[styles.subContainer, { padding: 0, overflow: "hidden" }]}>
              {report.topProducts.map((product, i) => (
                <View key={product.name}>
                  <ProductRow product={product} />
                  {i < report.topProducts.length - 1 && (
                    <View style={[styles.separator, { marginVertical: 0, marginHorizontal: 12 }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        <EmptyDay date={selectedDate} />
      )}

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header:         { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  sectionTitle:   { fontSize: 13, fontWeight: "500", color: colors.textMedium, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 },
  subHeader:      { color: colors.textMedium, fontSize: 11, letterSpacing: 0.5, marginBottom: 3 },
  subContainer:   { padding: 12, borderRadius: 12, backgroundColor: colors.cardBg, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 5 },
  separator:      { height: 1, width: "95%", backgroundColor: colors.textLight, marginVertical: 10, alignSelf: "center" },
  weekNav:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  weekBtn:        { padding: 6 },
  dateLabelBtn:   { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.cardBg },
  weekLabel:      { fontSize: 14, fontWeight: "500", color: colors.textDark },
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", paddingHorizontal: 20 },
  modalCard:      { borderRadius: 16, backgroundColor: colors.cardBg, overflow: "hidden" },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  modalTitle:     { fontSize: 16, fontWeight: "600", color: colors.textDark },
  scoreRow:       { flexDirection: "row", alignItems: "center" },
  scoreCircle:    { width: 76, height: 76, borderRadius: 38, borderWidth: 5, alignItems: "center", justifyContent: "center" },
  scoreNum:       { fontSize: 22, fontWeight: "bold", lineHeight: 26 },
  scoreDen:       { fontSize: 11, color: colors.textMedium },
  grade:          { fontSize: 28, fontWeight: "bold", lineHeight: 32 },
  gradeDesc:      { fontSize: 13, color: colors.textMedium, marginTop: 3 },
  statsRow:       { flexDirection: "row", justifyContent: "space-around" },
  statPill:       { alignItems: "center" },
  statValue:      { fontSize: 18, fontWeight: "bold", color: colors.textDark },
  statLabel:      { fontSize: 11, color: colors.textMedium, marginTop: 2 },
  ingredientRow:  { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  rank:           { fontSize: 13, fontWeight: "500", color: colors.textLight, width: 18 },
  ingName:        { fontSize: 14, fontWeight: "500", color: colors.textDark },
  ingProducts:    { fontSize: 12, color: colors.textMedium, marginTop: 1 },
  barTrack:       { height: 4, backgroundColor: colors.textLight + "55", borderRadius: 2, marginTop: 5, overflow: "hidden" },
  barFill:        { height: 4, borderRadius: 2 },
  ingRight:       { alignItems: "flex-end", gap: 4 },
  badge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText:      { fontSize: 11, fontWeight: "500" },
  ingCount:       { fontSize: 11, color: colors.textMedium },
  productRow:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  productIcon:    { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.textLight + "33", alignItems: "center", justifyContent: "center" },
  productName:    { fontSize: 14, fontWeight: "500", color: colors.textDark },
  flagPills:      { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  flagPill:       { backgroundColor: colors.dangerLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  flagPillText:   { fontSize: 11, color: colors.dangerText ?? colors.danger, fontWeight: "500" },
  emptyState:     { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle:     { fontSize: 15, fontWeight: "500", color: colors.textDark },
  emptyText:      { fontSize: 13, color: colors.textLight },
});
