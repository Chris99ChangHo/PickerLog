// app/(tabs)/calendar.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar, DateData } from "react-native-calendars";
import dayjs from "dayjs";
import "dayjs/locale/en-au";

import { loadAll, remove, type LogEntry } from "../../src/storage";
import { computePayV2 } from "../../src/domain";
import { groupByDay, makeMarkedDates } from "../../src/calendarHelpers";
import { Card, SolidCard } from "../../src/ui/components";
import { colors } from "../../src/ui/theme";
import { formatCurrencyAUD } from "../../src/ui/format";

import { confirmAsync } from "../../src/ui/confirm";
// ???쒖떆 濡쒖??쇱? en-AU濡?????щ㎎? 湲곗〈 ISO ?좎?)
dayjs.locale("en-au");

/**
 * ?щ젰怨??쇰퀎 湲곕줉??蹂댁뿬二쇰뒗 硫붿씤 罹섎┛???붾㈃ 而댄룷?뚰듃?낅땲??
 */
export default function CalendarScreen() {
  // --- Hooks & State ?뺤쓽 ---
  const router = useRouter();
  const [refreshId, setRefreshId] = React.useState(0);
  const refreshData = () => setRefreshId(Math.random());

  const [all, setAll] = React.useState<LogEntry[]>([]);
  const [selected, setSelected] = React.useState<string>(dayjs().format("YYYY-MM-DD"));

  // ??marked 怨꾩궛??useMemo濡?(遺덊븘?뷀븳 state ?쒓굅)
  const marked = React.useMemo(
    () => makeMarkedDates(groupByDay(all), selected),
    [all, selected]
  );

  // --- ?곗씠??濡쒕뵫 ---
  useFocusEffect(
    React.useCallback(() => {
      loadAll().then(setAll);
    }, [refreshId])
  );

  // --- ?뚯깮 ?곗씠??---
  const itemsToday = React.useMemo(
    () => all.filter(e => e.date === selected),
    [all, selected]
  );

  const totals = React.useMemo(() => {
    let gross = 0, tax = 0, net = 0;
    for (const e of itemsToday) {
      const r = computePayV2({
        payType: e.payType,
        pieceUnit: e.pieceUnit ?? "kg",
        quantity: e.payType === "piece"
          ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.kg || 0))
          : undefined,
        hours: e.payType === "hourly" ? (e.hours || 0) : undefined,
        rate: e.rate,
        taxPercent: e.taxPercent,
      });
      gross += r.gross;
      tax   += r.taxAmount;
      net   += r.net;
    }
    return { gross, tax, net };
  }, [itemsToday]);

  // --- ?대깽???몃뱾??---
  const onDayPress = React.useCallback((day: DateData) => {
    // ????щ㎎? ISO "YYYY-MM-DD" ?좎?
    setSelected(day.dateString);
  }, []);

  const confirmDelete = async (id: string) => {
  const ok = await confirmAsync("Delete Log", "Are you sure?");
  if (!ok) return;
  await remove(id);
  setAll(prevAll => prevAll.filter(entry => entry.id !== id));
};

  // --- UI ?뚮뜑留?---
  return (
    <SafeAreaView style={styles.safeArea}>
      <Calendar
        markedDates={marked}
        onDayPress={onDayPress}
        initialDate={selected}
        theme={{
          todayTextColor: colors.brand,
          selectedDayBackgroundColor: colors.brand,
          selectedDayTextColor: "#fff",
          dotColor: colors.brand,
          arrowColor: colors.brand,
          monthTextColor: colors.text,
          textSectionTitleColor: colors.sub,
        }}
        style={styles.calendar}
      />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={itemsToday}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={() => (
          <SolidCard>
            {/* ???쒖떆留?en-AU: "D/MM/YYYY" (?? 31/12/2025) */}
            <Text style={styles.headerDate}>
              {dayjs(selected).format("D/MM/YYYY")}
            </Text>
            <Text style={styles.headerTotals}>
              Gross: {formatCurrencyAUD(totals.gross)} | Tax: {formatCurrencyAUD(totals.tax)} | Net: {formatCurrencyAUD(totals.net)}
            </Text>
            {itemsToday.length === 0 && (
              <Text style={styles.headerEmpty}>No entries for this day.</Text>
            )}
          </SolidCard>
        )}
        renderItem={({ item: e }) => {
          const r = computePayV2({
            payType: e.payType,
            pieceUnit: e.pieceUnit ?? "kg",
            quantity: e.payType === "piece"
              ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.kg || 0))
              : undefined,
            hours: e.payType === "hourly" ? (e.hours || 0) : undefined,
            rate: e.rate,
            taxPercent: e.taxPercent,
          });

          const subtitle =
            e.payType === "piece"
              ? (e.pieceUnit === "punnet"
                  ? `punnets ${e.punnets ?? 0} 횞 $${e.rate}/p`
                  : `kg ${e.kg ?? 0} 횞 $${e.rate}/kg`)
              : `hours ${e.hours ?? 0} 횞 $${e.rate}/h`;

          return (
            <View style={styles.itemRow}>
              {/* ??ぉ ?섏젙 ?붾㈃?쇰줈 ?대룞 */}
              <Pressable
                style={{ flex: 1 }}
                onPress={() => router.push(`/(tabs)/entry?id=${e.id}`)}
              >
                <Card>
                  <Text style={styles.itemTitle}>
                    {e.berryType} ??Net ${r.net.toFixed(2)}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {subtitle} | Tax {e.taxPercent}%
                  </Text>
                  {!!e.comment && (
                    <Text style={styles.itemComment}>{e.comment}</Text>
                  )}
                </Card>
              </Pressable>

              {/* ??젣 踰꾪듉 */}
              <Pressable onPress={() => confirmDelete(e.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>×</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ???ㅽ???
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  calendar: {
    margin: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerDate: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
  },
  headerTotals: {
    color: "#fff",
  },
  headerEmpty: {
    color: "#fff",
    opacity: 0.85,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FFDDDD",
  },
  deleteButtonText: {
    color: "#CC0000",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemTitle: {
    fontWeight: "700",
    marginBottom: 6,
    color: colors.text,
  },
  itemSubtitle: {
    color: colors.sub,
  },
  itemComment: {
    marginTop: 6,
    color: colors.sub,
  },
});





