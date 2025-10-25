// app/(tabs)/stats.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import 'dayjs/plugin/isoWeek';
import 'dayjs/plugin/advancedFormat';
import { loadAll, type LogEntry } from "../../src/storage";
import { computePayV2 } from "../../src/domain";
import { Card } from "../../src/ui/components";
import { Button } from '../../src/ui/Button';
import { colors } from "../../src/ui/theme";

dayjs.extend(require('dayjs/plugin/isoWeek'));
dayjs.extend(require('dayjs/plugin/advancedFormat'));

type Period = 'weekly' | 'monthly';
interface StatItem { periodLabel: string; net: number; gross: number; }

const formatWeekLabel = (weekKey: string): string => {
  if (!weekKey.includes('-W')) return weekKey;
  const [year, weekNum] = weekKey.split('-W').map(Number);
  if (!year || !weekNum) return weekKey;
  const startOfWeek = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek');
  const endOfWeek = dayjs().year(year).isoWeek(weekNum).endOf('isoWeek');
  return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
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
    const groups: { [key: string]: { net: number; gross: number } } = {};
    allEntries.forEach(entry => {
      const pay = computePayV2({ payType: entry.payType, rate: entry.rate, taxPercent: entry.taxPercent, pieceUnit: entry.pieceUnit, quantity: entry.payType === 'piece' ? (entry.pieceUnit === 'punnet' ? entry.punnets : entry.kg) : undefined, hours: entry.hours });
      let key = period === 'monthly' ? dayjs(entry.date).format('YYYY MMMM') : `${dayjs(entry.date).year()}-W${dayjs(entry.date).isoWeek()}`;
      if (!groups[key]) { groups[key] = { net: 0, gross: 0 }; }
      groups[key]!.net += pay.net;
      groups[key]!.gross += pay.gross;
    });

    return Object.entries(groups)
      .map(([periodLabel, totals]) => ({ periodLabel, ...totals }))
      .sort((a, b) => {
        const dateA = period === 'monthly' ? dayjs(a.periodLabel, 'YYYY MMMM') : dayjs().year(Number(a.periodLabel.split('-W')[0])).isoWeek(Number(a.periodLabel.split('-W')[1]));
        const dateB = period === 'monthly' ? dayjs(b.periodLabel, 'YYYY MMMM') : dayjs().year(Number(b.periodLabel.split('-W')[0])).isoWeek(Number(b.periodLabel.split('-W')[1]));
        return dateB.diff(dateA);
      });
  }, [allEntries, period]);

  const renderItem = ({ item }: { item: StatItem }) => (
    <Card style={{ paddingVertical: 16 }}>
      <View style={styles.itemContainer}>
        <Text style={styles.periodLabel}>
          {period === 'weekly' ? formatWeekLabel(item.periodLabel) : item.periodLabel}
        </Text>
        <View>
          <Text style={styles.amountText}>Net: ${item.net.toFixed(2)}</Text>
          <Text style={styles.amountSubText}>Gross: ${item.gross.toFixed(2)}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 월간/주간 선택 버튼 */}
      <View style={styles.buttonContainer}>
        <Button title="Monthly" onPress={() => setPeriod('monthly')} disabled={period === 'monthly'} />
        <Button title="Weekly" onPress={() => setPeriod('weekly')} disabled={period === 'weekly'} />
      </View>
      {/* 통계 목록 */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={statsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.periodLabel}
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
  amountSubText: { fontSize: 12, color: colors.sub, textAlign: 'right', },
  emptyText: { textAlign: 'center', marginTop: 50, color: colors.sub, }
});