// app/(tabs)/calendar.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native"; 
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar, DateData } from "react-native-calendars";
import dayjs from "dayjs";
import { loadAll, remove, type LogEntry } from "../../src/storage"; 
import { computePayV2 } from "../../src/domain";
import { groupByDay, makeMarkedDates } from "../../src/calendarHelpers";
import { Card, SolidCard } from "../../src/ui/components"; 
import { colors } from "../../src/ui/theme";

/**
 * 달력과 일별 기록을 보여주는 메인 캘린더 화면 컴포넌트입니다.
 */
export default function CalendarScreen() {
  // --- Hooks & State 정의 ---
  const router = useRouter(); 
  const [refreshId, setRefreshId] = React.useState(0);
  const refreshData = () => setRefreshId(Math.random());
  const [all, setAll] = React.useState<LogEntry[]>([]);
  const [selected, setSelected] = React.useState<string>(dayjs().format("YYYY-MM-DD"));
  // ✅ marked 계산을 useMemo로 변경하여 불필요한 state 제거
  const marked = React.useMemo(() => makeMarkedDates(groupByDay(all), selected), [all, selected]);

  // --- 데이터 로딩 및 처리 ---
  useFocusEffect(React.useCallback(() => {
    loadAll().then(setAll);
  }, [refreshId]));

  const itemsToday = React.useMemo(() => all.filter(e => e.date === selected), [all, selected]);
  const totals = React.useMemo(() => {
    let gross = 0, tax = 0, net = 0;
    for (const e of itemsToday) {
      const r = computePayV2({ payType: e.payType, pieceUnit: e.pieceUnit ?? "kg", quantity: e.payType === "piece" ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.kg || 0)) : undefined, hours: e.payType === "hourly" ? (e.hours || 0) : undefined, rate: e.rate, taxPercent: e.taxPercent, });
      gross += r.gross; tax += r.taxAmount; net += r.net;
    }
    return { gross, tax, net };
  }, [itemsToday]);

  // --- 이벤트 핸들러 ---
  const onDayPress = React.useCallback((day: DateData) => {
    setSelected(day.dateString);
  }, []);

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Log", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => { 
          await remove(id); 
          setAll(prevAll => prevAll.filter(entry => entry.id !== id));
        } 
      },
    ]);
  };

  // --- UI 렌더링 ---
  return (
    // ✅ SafeAreaView 적용
    <SafeAreaView style={styles.safeArea}>
      <Calendar
        markedDates={marked}
        onDayPress={onDayPress}
        initialDate={selected}
        theme={{todayTextColor: colors.brand, selectedDayBackgroundColor: colors.brand, selectedDayTextColor: "#fff", dotColor: colors.brand, arrowColor: colors.brand, monthTextColor: colors.text, textSectionTitleColor: colors.sub, }}
        style={styles.calendar}
      />
      
      <FlatList
        contentContainerStyle={styles.listContent}
        data={itemsToday}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={() => (
          <SolidCard>
            <Text style={styles.headerDate}>{dayjs(selected).format("MMMM D, YYYY")}</Text>
            <Text style={styles.headerTotals}>Gross: ${totals.gross.toFixed(2)} | Tax: ${totals.tax.toFixed(2)} | Net: ${totals.net.toFixed(2)}</Text>
            {itemsToday.length === 0 && <Text style={styles.headerEmpty}>No entries for this day.</Text>}
          </SolidCard>
        )}
        renderItem={({ item: e }) => {
          const r = computePayV2({ payType: e.payType, pieceUnit: e.pieceUnit ?? "kg", quantity: e.payType === "piece" ? (e.pieceUnit === "punnet" ? (e.punnets || 0) : (e.kg || 0)) : undefined, hours: e.payType === "hourly" ? (e.hours || 0) : undefined, rate: e.rate, taxPercent: e.taxPercent, });
          const subtitle = e.payType === "piece" ? (e.pieceUnit === "punnet" ? `punnets ${e.punnets ?? 0} × $${e.rate}/p` : `kg ${e.kg ?? 0} × $${e.rate}/kg`) : `hours ${e.hours ?? 0} × $${e.rate}/h`;
          
          return (
            // ✅ 삭제 버튼 UI 적용
            <View style={styles.itemRow}>
              {/* 기존 내용 영역 (수정 위해 클릭 가능) */}
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/(tabs)/entry?id=${e.id}`)}>
                {/* padding 스타일 Card 자체로 이동 */}
                <Card> 
                  <Text style={styles.itemTitle}>{e.berryType} — Net ${r.net.toFixed(2)}</Text>
                  <Text style={styles.itemSubtitle}>{subtitle} | Tax {e.taxPercent}%</Text>
                  {!!e.comment && <Text style={styles.itemComment}>{e.comment}</Text>}
                </Card>
              </Pressable>
              
              {/* 삭제 버튼 */}
              <Pressable onPress={() => confirmDelete(e.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ✅ 스타일시트 추가 및 정리
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  calendar: {
    margin: 16,
    borderRadius: 18,
    overflow: "hidden",
    // backgroundColor: "#fff", // Card 컴포넌트가 배경색을 처리하므로 제거 가능
    // borderWidth: 1,        // Card 컴포넌트가 테두리를 처리하므로 제거 가능
    // borderColor: colors.border, // Card 컴포넌트가 테두리를 처리하므로 제거 가능
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    gap: 12 
  },
  // 헤더 스타일
  headerDate: { 
    color: "#fff", 
    fontWeight: "700", 
    marginBottom: 8 
  },
  headerTotals: { 
    color: "#fff" 
  },
  headerEmpty: { 
    color: "#fff", 
    opacity: 0.85, 
    marginTop: 6 
  },
  // 항목 스타일 (삭제 버튼 포함)
  itemRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  deleteButton: { 
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFDDDD', 
  },
  deleteButtonText: { 
    color: '#CC0000', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  // 카드 내부 스타일
  itemTitle: { 
    fontWeight: "700", 
    marginBottom: 6, 
    color: colors.text 
  },
  itemSubtitle: { 
    color: colors.sub 
  },
  itemComment: { 
    marginTop: 6, 
    color: colors.sub 
  },
});