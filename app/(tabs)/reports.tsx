import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
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
import { scoreMeal } from "./meals/eatScore";
import { useMeals } from "./meals/meals-context";

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
  gradeDescription: string;
  totalScans: number;
  flaggedCount: number;
  offendingProductCount: number;
  dayOverDayDelta: number;
  flaggedIngredients: FlaggedIngredient[];
  topProducts: OffendingProduct[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);

const toDateString = (d: Date) => d.toISOString().split("T")[0];

const isSameDay = (a: Date, b: Date) => toDateString(a) === toDateString(b);

const formatLabel = (date: Date): string => {
  if (isSameDay(date, today)) {
    return `Today · ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }

  const y = new Date(today);
  y.setDate(y.getDate() - 1);

  if (isSameDay(date, y)) {
    return `Yesterday · ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const scoreColor = (score: number) => {
  if (score >= 85) return colors.success ?? "#639922";
  if (score >= 65) return "#BA7517";
  return colors.danger;
};

const SEVERITY_COLORS: Record<
  Severity,
  { bg: string; text: string; bar: string }
> = {
  high: {
    bg: colors.dangerLight,
    text: colors.dangerText ?? colors.danger,
    bar: colors.danger,
  },
  medium: {
    bg: colors.warningLight,
    text: colors.warningText ?? "#854F0B",
    bar: "#BA7517",
  },
  low: {
    bg: colors.successLight,
    text: colors.successText ?? "#3B6D11",
    bar: "#639922",
  },
};

const getItemName = (item: any) => item?.name ?? "Unknown Product";

const getItemAdditives = (item: any): string[] => {
  return Array.isArray(item?.additives_tags) ? item.additives_tags : [];
};

const getItemNovaGroup = (item: any): number | null => {
  const value =
    item?.nova_group ??
    item?.novaGrade ??
    item?.novaGroup ??
    item?.nova_score ??
    null;

  return typeof value === "number" ? value : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatPill = ({
  label,
  value,
  bad,
  good,
}: {
  label: string;
  value: string;
  bad?: boolean;
  good?: boolean;
}) => (
  <View style={styles.statPill}>
    <Text
      style={[
        styles.statValue,
        bad && { color: colors.danger },
        good && { color: colors.success ?? "#639922" },
      ]}
    >
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
          <Text style={styles.gradeDesc}>{report.gradeDescription}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.statsRow}>
        <StatPill label="Flagged" value={String(report.flaggedCount)} bad />
        <StatPill
          label="Products"
          value={String(report.offendingProductCount)}
          bad
        />
        <StatPill
          label="vs yesterday"
          value={`${deltaPositive ? "+" : ""}${report.dayOverDayDelta}`}
          bad={!deltaPositive}
          good={deltaPositive}
        />
        <StatPill label="Scans" value={String(report.totalScans)} />
      </View>
    </View>
  );
};

const IngredientRow = ({
  ingredient,
  rank,
}: {
  ingredient: FlaggedIngredient;
  rank: number;
}) => {
  const sc = SEVERITY_COLORS[ingredient.severity];

  return (
    <View style={styles.ingredientRow}>
      <Text style={styles.rank}>{rank}</Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.ingName}>{ingredient.name}</Text>
        <Text style={styles.ingProducts}>{ingredient.products.join(", ")}</Text>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${ingredient.severityScore}%`,
                backgroundColor: sc.bar,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.ingRight}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {ingredient.severity.charAt(0).toUpperCase() +
              ingredient.severity.slice(1)}
          </Text>
        </View>
        <Text style={styles.ingCount}>{ingredient.occurrences}× that day</Text>
      </View>
    </View>
  );
};

const ProductRow = ({ product }: { product: OffendingProduct }) => (
  <Pressable
    style={styles.productRow}
    onPress={() => console.log("tapped", product.name)}
  >
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

    <Ionicons
      name="chevron-forward"
      size={18}
      color={colors.textMedium}
    />
  </Pressable>
);

const EmptyDay = ({ date }: { date: Date }) => (
  <View style={styles.emptyState}>
    <Ionicons name="leaf-outline" size={36} color={colors.textLight} />
    <Text style={styles.emptyTitle}>No data for {formatLabel(date)}</Text>
    <Text style={styles.emptyText}>Log some meals to see your report.</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const { loggedMeals } = useMeals();

  const selectedMeals = useMemo(() => {
    const selectedKey = selectedDate.toDateString();
    return loggedMeals.filter(
      (meal) => new Date(meal.loggedAt).toDateString() === selectedKey
    );
  }, [loggedMeals, selectedDate]);

  const yesterdayReportScore = useMemo(() => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousKey = previousDay.toDateString();

    const previousMeals = loggedMeals.filter(
      (meal) => new Date(meal.loggedAt).toDateString() === previousKey
    );

    if (previousMeals.length === 0) return null;

    const scores = previousMeals
      .map((meal) => scoreMeal(meal.items))
      .filter(Boolean);

    if (scores.length === 0) return null;

    return Math.round(
      scores.reduce((sum, s) => sum + s!.total, 0) / scores.length
    );
  }, [loggedMeals, selectedDate]);

  const report = useMemo<DailyReport | null>(() => {
  if (selectedMeals.length === 0) return null;

  const allItems = selectedMeals.flatMap((meal) => meal.items);

  const scores = selectedMeals
    .map((meal) => scoreMeal(meal.items))
    .filter(Boolean);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s!.total, 0) / scores.length)
      : 0;

  const gradeDescription =
    avgScore >= 90
      ? "Excellent day — strong meal quality and low ingredient risk"
      : avgScore >= 80
      ? "Good day — mostly clean choices with a few concerns"
      : avgScore >= 70
      ? "Decent day — room to improve ingredient quality"
      : avgScore >= 60
      ? "Needs work — several concerning ingredients detected"
      : "Poor day — many flagged ingredients across logged meals";

  const concernMap = new Map<string, { count: number; products: Set<string> }>();
  const productMap = new Map<string, Set<string>>();

  allItems.forEach((item: any) => {
    const productName = getItemName(item);
    const additives = getItemAdditives(item);
    const novaGroup = getItemNovaGroup(item);

    const addConcern = (label: string) => {
      if (!concernMap.has(label)) {
        concernMap.set(label, {
          count: 0,
          products: new Set<string>(),
        });
      }

      const entry = concernMap.get(label)!;
      entry.count += 1;
      entry.products.add(productName);

      if (!productMap.has(productName)) {
        productMap.set(productName, new Set<string>());
      }
      productMap.get(productName)!.add(label);
    };

    additives.forEach((tag) => addConcern(tag));

    if (novaGroup === 3 || novaGroup === 4) {
      addConcern(`NOVA ${novaGroup} processed`);
    }

    
    if (additives.length === 0 && novaGroup == null) {
      if ((item?.fat ?? 0) >= 20) addConcern("High fat");
      if ((item?.sugar ?? item?.sugars ?? 0) >= 15) addConcern("High sugar");
      if ((item?.sodium ?? 0) >= 500) addConcern("High sodium");

      
      const singleMealScore = scoreMeal([item])?.total ?? null;
      if (
        singleMealScore !== null &&
        singleMealScore < 65 &&
        !productMap.has(productName)
      ) {
        addConcern("Low nutrition score");
      }
    }
  });

  const flaggedIngredients: FlaggedIngredient[] = Array.from(concernMap.entries())
    .map(([name, value]) => {
      const severity: Severity =
        value.count >= 3 ? "high" : value.count === 2 ? "medium" : "low";

      return {
        name,
        products: Array.from(value.products),
        severity,
        occurrences: value.count,
        severityScore: Math.min(value.count * 30, 100),
      };
    })
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return b.severityScore - a.severityScore;
    })
    .slice(0, 5);

  const topProducts: OffendingProduct[] = Array.from(productMap.entries())
    .map(([name, flagSet]) => ({
      emoji: "🍽️",
      name,
      flags: Array.from(flagSet),
    }))
    .sort((a, b) => b.flags.length - a.flags.length)
    .slice(0, 5);

  const flaggedCount = concernMap.size;
  const offendingProductCount = topProducts.length;
  const dayOverDayDelta =
    yesterdayReportScore === null ? 0 : avgScore - yesterdayReportScore;

  return {
    date: selectedDate,
    score: avgScore,
    gradeDescription,
    totalScans: selectedMeals.length,
    flaggedCount,
    offendingProductCount,
    dayOverDayDelta,
    flaggedIngredients,
    topProducts,
  };
}, [selectedMeals, selectedDate, yesterdayReportScore]);

  const markedDates = useMemo(() => {
    const groupedMeals = new Map<string, number[]>();

    loggedMeals.forEach((meal) => {
      const key = new Date(meal.loggedAt).toISOString().split("T")[0];
      const mealScore = scoreMeal(meal.items)?.total ?? 65;

      if (!groupedMeals.has(key)) {
        groupedMeals.set(key, []);
      }

      groupedMeals.get(key)!.push(mealScore);
    });

    const marks: Record<string, any> = {};

    groupedMeals.forEach((scores, key) => {
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 65;

      marks[key] = {
        marked: true,
        dotColor: scoreColor(avg),
      };
    });

    return marks;
  }, [loggedMeals]);

  const stepDay = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    if (d <= today) setSelectedDate(d);
  };

  const selectedStr = toDateString(selectedDate);

  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20 }}>
      <View style={styles.weekNav}>
        <Pressable onPress={() => stepDay(-1)} style={styles.weekBtn}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={colors.textMedium}
          />
        </Pressable>

        <Pressable
          onPress={() => setShowCalendar(true)}
          style={styles.dateLabelBtn}
        >
          <Text style={styles.weekLabel}>{formatLabel(selectedDate)}</Text>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textMedium}
            style={{ marginLeft: 5 }}
          />
        </Pressable>

        <Pressable
          onPress={() => stepDay(1)}
          disabled={isSameDay(selectedDate, today)}
          style={[
            styles.weekBtn,
            isSameDay(selectedDate, today) && { opacity: 0.3 },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMedium}
          />
        </Pressable>
      </View>

      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a day</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textMedium}
                />
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

      {report ? (
        <>
          <View>
            <Text style={styles.header}>Daily Report Card</Text>
            <ScoreCard report={report} />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Top Nutrition Concerns</Text>
            <View style={[styles.subContainer, { padding: 0, overflow: "hidden" }]}>
              {report.flaggedIngredients.length > 0 ? (
                report.flaggedIngredients.map((ing, i) => (
                  <View key={`${ing.name}-${i}`}>
                    <IngredientRow ingredient={ing} rank={i + 1} />
                    {i < report.flaggedIngredients.length - 1 && (
                      <View
                        style={[
                          styles.separator,
                          { marginVertical: 0, marginHorizontal: 12 },
                        ]}
                      />
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 16 }}>
                  <Text style={styles.emptyText}>
                    No flagged additives or processing concerns for this day.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Top Offending Products</Text>
            <View style={[styles.subContainer, { padding: 0, overflow: "hidden" }]}>
              {report.topProducts.length > 0 ? (
                report.topProducts.map((product, i) => (
                  <View key={`${product.name}-${i}`}>
                    <ProductRow product={product} />
                    {i < report.topProducts.length - 1 && (
                      <View
                        style={[
                          styles.separator,
                          { marginVertical: 0, marginHorizontal: 12 },
                        ]}
                      />
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 16 }}>
                  <Text style={styles.emptyText}>
                    No offending products detected for this day.
                  </Text>
                </View>
              )}
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
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMedium,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  subHeader: {
    color: colors.textMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  separator: {
    height: 1,
    width: "95%",
    backgroundColor: colors.textLight,
    marginVertical: 10,
    alignSelf: "center",
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekBtn: {
    padding: 6,
  },
  dateLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 26,
  },
  scoreDen: {
    fontSize: 11,
    color: colors.textMedium,
  },
  grade: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 32,
  },
  gradeDesc: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statPill: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMedium,
    marginTop: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  rank: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textLight,
    width: 18,
  },
  ingName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textDark,
  },
  ingProducts: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 1,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.textLight + "55",
    borderRadius: 2,
    marginTop: 5,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  ingRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  ingCount: {
    fontSize: 11,
    color: colors.textMedium,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  productIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.textLight + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textDark,
  },
  flagPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  flagPill: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  flagPillText: {
    fontSize: 11,
    color: colors.dangerText ?? colors.danger,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textDark,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
  },
});