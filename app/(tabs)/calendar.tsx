// app/(tabs)/calendar.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Image as RNImage, Platform } from "react-native";
import { Swipeable } from '../../src/ui/Swipeable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { FadeOnFocus } from "../../src/ui/animations";

import { confirmAsync } from "../../src/ui/confirm";
// 지역화: en-AU 로케일 사용(표시는 로컬, 내부 값은 ISO 포맷)
dayjs.locale("en-au");

/**
 * 수확/근무 로그를 달력과 리스트로 보여주는 메인 화면입니다.
 */
export default function CalendarScreen() {
  // --- Hooks & State 정의 ---
  const router = useRouter();
  const [refreshId, setRefreshId] = React.useState(0);
  const refreshData = () => setRefreshId(Math.random());

  const [all, setAll] = React.useState<LogEntry[]>([]);
  const [selected, setSelected] = React.useState<string>(dayjs().format("YYYY-MM-DD"));

  // marked 계산: useMemo로 파생 상태를 분리(불필요한 렌더 방지)
  const marked = React.useMemo(
    () => makeMarkedDates(groupByDay(all), selected),
    [all, selected]
  );

  // --- 데이터 로딩 ---
  useFocusEffect(
    React.useCallback(() => {
      loadAll().then(setAll);
    }, [refreshId])
  );

  // --- 파생 데이터 ---
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
        quantity: e.payType === "piece" ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.pieceUnit === "bucket" ? ((e as any).buckets || 0) : (e.kg || 0)))
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

  // --- 이벤트 핸들러 ---
  const onDayPress = React.useCallback((day: DateData) => {
    // dateString은 ISO "YYYY-MM-DD" 형식
    setSelected(day.dateString);
  }, []);

  const confirmDelete = async (id: string) => {
    // 삭제 확인 후 실제 삭제 수행
    const ok = await confirmAsync("Delete Log", "Are you sure?");
    if (!ok) return;
    await remove(id);
    setAll(prevAll => prevAll.filter(entry => entry.id !== id));
  };

  // --- UI 렌더링 ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <FadeOnFocus>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
            <RNImage source={require('../../assets/PickerLog-Brand.png')} style={{ width: 160, height: 24, resizeMode: 'contain' }} />
          </View>
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
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={itemsToday}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={() => (
            <SolidCard>
              {/* 날짜 표시(en-AU): "D/MM/YYYY" (예: 31/12/2025) */}
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
              quantity: e.payType === "piece" ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.pieceUnit === "bucket" ? ((e as any).buckets || 0) : (e.kg || 0)))
                : undefined,
              hours: e.payType === "hourly" ? (e.hours || 0) : undefined,
              rate: e.rate,
              taxPercent: e.taxPercent,
            });

            return (
              <Swipeable
                renderRightActions={() => (
                  <View style={styles.swipeActionsContainer}>
                    <Pressable
                      onPress={() => confirmDelete(e.id)}
                      style={styles.swipeDelete}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Delete entry"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
                      <Text style={styles.swipeDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                )}
                rightThreshold={32}
                overshootRight={false}
              >
                <View style={styles.itemRow}>
                  {/* 항목 터치 시 편집 화면으로 이동 */}
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/(tabs)/entry?id=${e.id}`)}
                  >
                    <Card style={{ paddingVertical: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.itemTitle, { color: berryColor(e.berryType) }]}>{e.berryType}</Text>
                      <Text style={styles.mono}>
                        {e.payType === 'piece'
                          ? (e.pieceUnit === 'punnet'
                              ? `${e.punnets ?? 0} punnets`
                              : (e.pieceUnit === 'bucket'
                                  ? `${(e as any).buckets ?? 0} buckets`
                                  : `${e.kg ?? 0} kg`))
                          : `${e.hours ?? 0} hours`}
                      </Text>
                      </View>
                      <Text style={styles.itemSubtitle}>
                        Gross: {formatCurrencyAUD(r.gross)} | Tax: {formatCurrencyAUD(r.taxAmount)} | Net: {formatCurrencyAUD(r.net)}
                      </Text>
                      {!!e.comment && (
                        <>
                          <View style={styles.hr} />
                          <Text style={styles.itemComment}>{e.comment}</Text>
                        </>
                      )}
                    </Card>
                  </Pressable>

                </View>
              </Swipeable>
            );
          }}
        />
      </FadeOnFocus>
    </SafeAreaView>
  );
}

// 스타일
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  calendar: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
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
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  headerTotals: {
    color: "#fff",
    fontFamily: 'Inter_400Regular',
  },
  headerEmpty: {
    color: "#fff",
    opacity: 0.85,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitleRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  mono: {
    fontFamily: 'Inter_400Regular',
    color: colors.sub,
    includeFontPadding: false,
  },
  opIcon: {
    marginHorizontal: 2,
    color: colors.sub,
  },
  dotSep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sub,
    opacity: 0.6,
    marginHorizontal: 4,
  },
  subtle: {
    fontFamily: 'Inter_400Regular',
    color: colors.sub,
    opacity: 0.9,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFEBEB",
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: "#CC0000",
    fontWeight: "bold",
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeDelete: {
    width: 88,
    height: '100%',
    backgroundColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  itemTitle: {
    fontWeight: "700",
    marginBottom: 0,  
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  itemSubtitle: {
    color: colors.sub,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  itemComment: {
    marginTop: 6,
    color: colors.sub,
    fontFamily: 'Inter_400Regular',
  },
  hr: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
    marginBottom: 4,
  },
});

  // Berry color mapping (match stats for consistency)
  const berryColor = React.useCallback((name: string) => {
    const key = (name || 'unknown').toLowerCase();
    if (key.includes('strawberry')) return '#FF5964';
    if (key.includes('blueberry')) return '#4F7BFF';
    if (key.includes('raspberry')) return '#FF5FA2';
    if (key.includes('blackberry')) return '#6A56C8';
    return colors.brand;
  }, []);
