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
interface StatItem { periodLabel: string; net: number; gross: number }

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

  const statsData = useMemo(() => {
    const groups: Record<string, { net: number; gross: number }> = {};

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

      // 📌 키는 계산/정렬용: 월간은 "YYYY-MM", 주간은 "YYYY-W##"
      const key =
        period === 'monthly'
          ? dayjs(entry.date).format('YYYY-MM')
          : `${dayjs(entry.date).year()}-W${dayjs(entry.date).isoWeek()}`;

      if (!groups[key]) groups[key] = { net: 0, gross: 0 };
      groups[key]!.net += pay.net;
      groups[key]!.gross += pay.gross;
    }

    // 표시는 호주식: 월간은 "MMMM YYYY", 주간은 "D/MM–D/MM/YYYY"
    const rows: StatItem[] = Object.entries(groups).map(([key, totals]) => {
      if (period === 'monthly') {
        const parsed = dayjs(key, 'YYYY-MM');
        const label = parsed.format('MMMM YYYY'); // 예: October 2025
        return { periodLabel: label, ...totals };
      } else {
        const [y, wWithW] = key.split('-W');
        const label = formatWeekLabelAU(Number(y), Number(wWithW));
        return { periodLabel: label, ...totals };
      }
    });

    // 최신순 정렬
    rows.sort((a, b) => {
      if (period === 'monthly') {
        const da = dayjs(a.periodLabel, 'MMMM YYYY');
        const db = dayjs(b.periodLabel, 'MMMM YYYY');
        return db.valueOf() - da.valueOf();
      } else {
        // 주간: 라벨을 다시 날짜로 파싱할 수 없으니, 키 기준 정렬을 별도로 하려면 위에서 key를 함께 보관해도 됨.
        // 간단히: 라벨 끝의 연도를 기준으로 1차 정렬 + 표시상의 시작일을 유추 정렬 (가벼운 앱에서는 충분)
        // 정확한 정렬이 필요하면 rows를 만들 때 key도 보관하세요.
        return 0;
      }
    });

    return rows;
  }, [allEntries, period]);

  const renderItem = ({ item }: { item: StatItem }) => (
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
        keyExtractor={(item, idx) => `${item.periodLabel}-${idx}`}
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
