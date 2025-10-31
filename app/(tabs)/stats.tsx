// app/(tabs)/stats.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import DonutChart from "../../src/ui/DonutChart";
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
import { formatCurrencyAUD } from "../../src/ui/format";

// dayjs 설정
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

// Improved weekly label for display: "D–D MMM YYYY" or "D MMM–D MMM YYYY"
const formatWeekLabelAU2 = (isoYear: number, isoWeekNum: number): string => {
  const start = dayjs().year(isoYear).isoWeek(isoWeekNum).startOf('isoWeek');
  const end = dayjs().year(isoYear).isoWeek(isoWeekNum).endOf('isoWeek');
  const sameMonth = start.month() === end.month();
  if (sameMonth) return `${start.format('D')}–${end.format('D MMM YYYY')}`;
  return `${start.format('D MMM')}–${end.format('D MMM YYYY')}`;
};

export default function StatsScreen() {
  const [allEntries, setAllEntries] = useState<LogEntry[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [legendExpanded, setLegendExpanded] = useState<boolean>(false);

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

    // Week label formatting for display
    if (period === 'weekly') {
      for (const r of rows) {
        const [y, wStr] = r.sortKey.split('-W');
        const isoYear = Number(y);
        const isoW = Number(wStr);
        r.periodLabel = formatWeekLabelAU2(isoYear, isoW);
      }
    }

    // 최신순(내림차순) 정렬
    rows.sort((a, b) => b.sortTime - a.sortTime);

    return rows;
  }, [allEntries, period]);

  // Pie(도넛) 차트: 현재 선택된 기간(가장 최신 버킷)의 베리별(net) 비중
  type Slice = { x: string; y: number };
  const currentPeriodKey = statsData[0]?.sortKey;

  const berrySlices: Slice[] = useMemo(() => {
    if (!currentPeriodKey) return [];

    const isInCurrentBucket = (d: dayjs.Dayjs) => {
      if (period === 'monthly') {
        const key = d.format('YYYY-MM');
        return key === currentPeriodKey;
      } else {
        const key = `${d.year()}-W${d.isoWeek()}`;
        return key === currentPeriodKey;
      }
    };

    const byBerry: Record<string, number> = {};
    for (const e of allEntries) {
      const d = dayjs(e.date);
      if (!isInCurrentBucket(d)) continue;
      const pay = computePayV2({
        payType: e.payType,
        rate: e.rate,
        taxPercent: e.taxPercent,
        pieceUnit: e.pieceUnit,
        quantity: e.payType === 'piece' ? (e.pieceUnit === 'punnet' ? e.punnets : e.kg) : undefined,
        hours: e.hours,
      });
      const key = e.berryType || 'Unknown';
      byBerry[key] = (byBerry[key] || 0) + pay.net;
    }

    const entries = Object.entries(byBerry)
      .map(([k, v]) => ({ x: k, y: +v.toFixed(2) }))
      .filter((s) => s.y > 0)
      .sort((a, b) => b.y - a.y);

    return entries;
  }, [allEntries, currentPeriodKey, period]);

  const piePalette = [
    colors.brand,
    colors.brand600,
    '#6BD168',
    '#94E28F',
    '#BFEFC0',
    '#E2F7E2',
  ];

  const renderItem = ({ item }: { item: StatRow }) => (
    <Card style={{ paddingVertical: 16 }}>
      <View style={styles.itemContainer}>
        <Text style={styles.periodLabel}>{item.periodLabel}</Text>
        <View>
          <Text style={styles.amountText}>Net: {formatCurrencyAUD(item.net)}</Text>
          <Text style={styles.amountSubText}>Gross: {formatCurrencyAUD(item.gross)}</Text>
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

      {/* 도넛 차트 카드 (현재 버킷의 베리별 비중) */}
      <Card style={styles.pieCard}>
        <Text style={styles.pieTitle}>
          {period === 'monthly' ? 'This Month Breakdown' : 'This Week Breakdown'}
        </Text>
        {berrySlices.length === 0 ? (
          <Text style={styles.emptyText}>No data for current period.</Text>
        ) : (
          <View>
            <View style={styles.pieCenter}>
              <DonutChart
                data={berrySlices.map((s, i) => ({ value: s.y, color: piePalette[i % piePalette.length], label: s.x }))}
                size={200}
                innerRadiusRatio={0.6}
                showPercentLabels
                labelColor="#FFFFFF"
                labelFontSize={12}
                labelMinPercent={8}
              />
            </View>
            <View style={styles.legendGrid}>
              {(() => {
                const shown = legendExpanded ? berrySlices : berrySlices.slice(0, 4);
                const hidden = Math.max(0, berrySlices.length - shown.length);
                return shown.map((s, i) => (
                  <View key={`${s.x}-${i}`} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendSwatch, { backgroundColor: piePalette[i % piePalette.length] }]} />
                      <Text style={styles.legendText} numberOfLines={1}>{s.x}</Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendValueStrong}>{formatCurrencyAUD(s.y)}</Text>
                    </View>
                  </View>
                )).concat(
                  hidden > 0
                    ? [
                        <View key="legend-more" style={styles.legendMoreRow}>
                          <Text style={styles.legendMoreText} onPress={() => setLegendExpanded(true)}>
                            Show all (+{hidden})
                          </Text>
                        </View>
                      ]
                    : []
                );
              })()}
            </View>
          </View>
        )}
      </Card>

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
  pieCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  pieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  legendItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    marginLeft: 8,
    color: colors.text,
    fontSize: 13,
  },
  legendRight: { alignItems: 'flex-end' },
  legendValueStrong: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  legendMoreRow: {
    width: '100%',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  legendMoreText: {
    color: colors.brand600,
    fontSize: 13,
    fontWeight: '700',
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
    paddingBottom: 8,
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
