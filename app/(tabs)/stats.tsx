// app/(tabs)/stats.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "dayjs/locale/en-au";

import { loadAll, type LogEntry } from "../../src/storage";
import { computePayV2 } from "../../src/domain";
import { Card } from "../../src/ui/components";
import { Button } from '../../src/ui/Button';
import { colors } from "../../src/ui/theme";

// ✅ dayjs 설정
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);
dayjs.locale("en-au");

type Period = 'weekly' | 'monthly';

interface StatRow {
  periodLabel: string;  // 화면 표시용 (예: "October 2025" / "20/10–26/10/2025")
  net: number;
  gross: number;
  sortKey: string;      // "YYYY-MM" 또는 "YYYY-W##"
  sortTime: number;     // 정렬용 타임스탬프 (month/isoWeek 시작 시각)
}

/** 주간 라벨: "D/MM–D/MM/YYYY" (예: 20/10–26/10/2025) */
const formatWeekLabelAU = (isoYear: number, isoWeekNum: number): string => {
  const start = dayjs().year(isoYear).isoWeek(isoWeekNum).startOf('isoWeek');
  const end = dayjs().year(isoYear).isoWeek(isoWeekNum).endOf('isoWeek');
  return `${start.format('D/MM')}–${end.format('D/MM/YYYY')}`;
};

export default function StatsScreen() {
  const [allEntries, setAllEntries] = useState<LogEntry[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');

  useFocusEffect(
    React.useCallback(() => {
      loadAll().then(setAllEntries);
    }, [])
  );

  const statsData = useMemo<StatRow[]>(() => {
    // 누적 버킷 (키는 계산/정렬용)
    const buckets: Record<string, { net: number; gross: number }> = {};

    for (const entry of allEntries) {
      const pay = computePayV2({
        payType: entry.payType,
        rate: entry.rate,
        taxPercent: entry.taxPercent,
        pieceUnit: entry.pieceUnit,
        quantity: entry.payType === 'piece'
          ? (entry.pieceUnit === 'punnet' ? entry.punnets : entry.kg)
          : undefined,
        hours: entry.hours
      });

      const d = dayjs(entry.date); // ISO "YYYY-MM-DD"
      const key = (period === 'monthly')
        ? d.format('YYYY-MM')                         // 예: "2025-10"
        : `${d.year()}-W${d.isoWeek()}`;              // 예: "2025-W43"

      if (!buckets[key]) buckets[key] = { net: 0, gross: 0 };
      buckets[key]!.net += pay.net;
      buckets[key]!.gross += pay.gross;
    }

    // 버킷 → 행 변환 (표시 라벨 + 안정 정렬용 타임스탬프 포함)
    const rows: StatRow[] = Object.entries(buckets).map(([key, totals]) => {
      if (period === 'monthly') {
        const d = dayjs(key, 'YYYY-MM');
        return {
          periodLabel: d.format('MMMM YYYY'),     // 예: "October 2025"
          net: totals.net,
          gross: totals.gross,
          sortKey: key,
          sortTime: d.startOf('month').valueOf(), // 월 시작 시각
        };
      } else {
        const [y, wStr] = key.split('-W');
        const isoYear = Number(y);
        const isoW = Number(wStr);
        const start = dayjs().year(isoYear).isoWeek(isoW).startOf('isoWeek');
        return {
          periodLabel: formatWeekLabelAU(isoYear, isoW), // "D/MM–D/MM/YYYY"
          net: totals.net,
          gross: totals.gross,
          sortKey: key,
          sortTime: start.valueOf(),                     // 주 시작 시각
        };
      }
    });

    // 최신순(내림차순) 정렬
    rows.sort((a, b) => b.sortTime - a.sortTime);

    return rows;
  }, [allEntries, period]);

  const renderItem = ({ item }: { item: StatRow }) => (
    <Card style={{ paddingVertical: 16 }}>
      <View style={styles.itemContainer}>
        <Text style={styles.periodLabel}>{item.periodLabel}</Text>
        <View>
          <Text style={styles.amountText}>Net: ${item.net.toFixed(2)}</Text>
          <Text style={styles.amountSubText}>Gross: ${item.gross.toFixed(2)}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 월간/주간 선택 */}
      <View style={styles.buttonContainer}>
        <Button title="Monthly" onPress={() => setPeriod('monthly')} disabled={period === 'monthly'} />
        <Button title="Weekly" onPress={() => setPeriod('weekly')} disabled={period === 'weekly'} />
      </View>

      {/* 통계 목록 */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={statsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.sortKey}
        ListEmptyComponent={<Text style={styles.emptyText}>No data to display.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  amountText: { fontSize: 16, fontWeight: '700', textAlign: 'right', color: colors.text },
  amountSubText: { fontSize: 12, color: colors.sub, textAlign: 'right' },
  emptyText: { textAlign: 'center', marginTop: 50, color: colors.sub }
});
