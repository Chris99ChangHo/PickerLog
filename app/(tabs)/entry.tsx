// app/(tabs)/entry.tsx

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from "expo-router"; 
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { computePayV2, type PayType, type PieceUnit } from "../../src/domain";
import { upsert, loadAll, type LogEntry } from "../../src/storage"; 
import { Picker } from "@react-native-picker/picker";
import { Card, Field, H1, SolidCard } from "../../src/ui/components"; 
import { Button } from '../../src/ui/Button'; 
import { colors } from '../../src/ui/theme';
import Toast from 'react-native-toast-message';

// --- 상수 및 헬퍼 컴포넌트 정의 (UI) ---
const BERRIES = ["Blueberry", "Raspberry", "Blackberry", "Strawberry"] as const;
type Berry = typeof BERRIES[number];
type TaxMode = "whm_15" | "cash_0";
const taxFromMode = (m: TaxMode) => (m === "whm_15" ? 15 : 0);
const modeFromTax = (t: number) => (t === 15 ? "whm_15" : "cash_0");
const WebDatePicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => ( <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={{ border: "none", height: 48, fontSize: 16, backgroundColor: "transparent", width: "100%", outline: "none", }} /> );

/**
 * 일별 기록을 새로 입력하거나 수정하는 화면 컴포넌트입니다.
 */
export default function EntryScreen() {
  // --- Hooks & State 정의 ---
  const router = useRouter();
  const params = useLocalSearchParams();
  const editingId = params.id as string | undefined;

  // (State 선언들은 보내주신 원본과 동일하게 유지)
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showPicker, setShowPicker] = useState(false);
  const [berry, setBerry] = useState<Berry>("Blueberry");
  const [payType, setPayType] = useState<PayType>("piece");
  const [pieceUnit, setPieceUnit] = useState<PieceUnit>("kg");
  const [kg, setKg] = useState("0");
  const [punnets, setPunnets] = useState("0");
  const [hours, setHours] = useState("0");
  const [rate, setRate] = useState("0");
  const [taxMode, setTaxMode] = useState<TaxMode>("whm_15");
  const [comment, setComment] = useState("");

  // --- 데이터 로딩 (수정 기능) ---
  // ✅ 수정 모드 로딩을 useEffect로 (웹/모바일 모두 안정)
  useEffect(() => {
    if (!editingId) return;
    loadAll().then((entries) => {
      const e = entries.find((x) => x.id === editingId);
      if (!e) return;
      setDate(e.date); setBerry(e.berryType as Berry); setPayType(e.payType); setPieceUnit(e.pieceUnit ?? "kg"); setKg(String(e.kg ?? "0")); setPunnets(String(e.punnets ?? "0")); setHours(String(e.hours ?? "0")); setRate(String(e.rate)); setTaxMode(modeFromTax(e.taxPercent)); setComment(e.comment ?? "");
    });
  }, [editingId]);

  // --- 계산 로직 ---
  const taxPercent = taxFromMode(taxMode);
  const preview = useMemo(() => {
    try {
      return computePayV2({ payType, pieceUnit, quantity: payType === "piece" ? (pieceUnit === "kg" ? Number(kg) || 0 : Number(punnets) || 0) : undefined, hours: payType === "hourly" ? Number(hours) || 0 : undefined, rate: Number(rate) || 0, taxPercent });
    } catch { return undefined; }
  }, [payType, pieceUnit, kg, punnets, hours, rate, taxPercent]);

  // --- 이벤트 핸들러 ---
  const onChangeDate = (_: DateTimePickerEvent, selectedDate?: Date) => { setShowPicker(false); if (selectedDate) setDate(dayjs(selectedDate).format("YYYY-MM-DD")); };

  /** 'Save log' 버튼을 눌렀을 때 호출되는 함수 */
  const save = useCallback(async () => {
    try {
      const entry: LogEntry = { id: editingId ?? String(Date.now()), date, berryType: berry, payType, rate: Number(rate) || 0, taxPercent, comment: comment || undefined, pieceUnit, kg: pieceUnit === "kg" && payType === "piece" ? Number(kg) || 0 : undefined, punnets: pieceUnit === "punnet" && payType === "piece" ? Number(punnets) || 0 : undefined, hours: payType === "hourly" ? Number(hours) || 0 : undefined };
      await upsert(entry);

      // ✅ 토스트: 저장 성공 시 토스트 메시지를 보여줍니다.
      Toast.show({
        type: 'success', // 성공 타입 (녹색)
        text1: editingId ? 'Log Updated' : 'Log Saved', // 수정/저장 구분 메시지
        position: 'bottom', // 화면 하단에 표시
        visibilityTime: 2000 // 2초 동안 보여줌
      });

      // ✅ 토스트: 메시지가 사라진 후 (2초 뒤) 이전 화면으로 돌아갑니다.
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          // 웹에서 새로고침 후 저장 등 뒤로 갈 수 없는 경우 캘린더로 직접 이동
          router.replace('/(tabs)/calendar');
        }
      }, 2100); // visibilityTime보다 약간 길게 설정

    } catch (e) {
      console.error("Failed to save log:", e);
      // ✅ 토스트: 에러 발생 시 에러 토스트를 보여줍니다.
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'An error occurred. Please try again.',
        position: 'bottom'
      });
    }
  }, [editingId, date, berry, payType, rate, taxPercent, pieceUnit, kg, punnets, hours, comment, router]);

  // --- UI 렌더링 ---
  return (
    // ✅ SafeAreaView 적용
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Card>
          <H1>{editingId ? "Edit Log" : "New Log"}</H1>

          <Field label="Date">{Platform.OS === "web" ? (<WebDatePicker value={date} onChange={setDate} />) : (<><Pressable onPress={() => setShowPicker(true)} style={{ paddingVertical: 16 }}><Text style={{ fontSize: 16 }}>{date} (tap to change)</Text></Pressable>{showPicker && (<DateTimePicker value={dayjs(date, "YYYY-MM-DD").toDate()} mode="date" display="calendar" onChange={onChangeDate} />)}</>)}</Field>
          <Field label="Berry type"><Picker selectedValue={berry} onValueChange={(v) => setBerry(v as Berry)}>{BERRIES.map((b) => (<Picker.Item key={b} label={b} value={b} />))}</Picker></Field>
          <Field label="Pay type"><Picker selectedValue={payType} onValueChange={(v) => setPayType(v as PayType)}><Picker.Item label="Piece rate" value="piece" /><Picker.Item label="Hourly" value="hourly" /></Picker></Field>
          {payType === "piece" && (<><Field label="Piece unit"><Picker selectedValue={pieceUnit} onValueChange={(v) => setPieceUnit(v as PieceUnit)}><Picker.Item label="kg (kilograms)" value="kg" /><Picker.Item label="punnet (trays)" value="punnet" /></Picker></Field>{pieceUnit === "kg" ? (<Field label="Picked kg"><TextInput value={kg} onChangeText={setKg} keyboardType="numeric" style={{ height: 48, fontSize: 16 }} onFocus={() => { if (kg === '0') setKg(''); }} onBlur={() => { if (kg === '') setKg('0'); }}/></Field>) : (<Field label="Punnets picked"><TextInput value={punnets} onChangeText={setPunnets} keyboardType="numeric" style={{ height: 48, fontSize: 16 }} onFocus={() => { if (punnets === '0') setPunnets(''); }} onBlur={() => { if (punnets === '') setPunnets('0'); }}/></Field>)}<Field label={pieceUnit === "kg" ? "Rate (AUD/kg)" : "Rate (AUD/punnet)"}><TextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={{ height: 48, fontSize: 16 }} onFocus={() => { if (rate === '0') setRate(''); }} onBlur={() => { if (rate === '') setRate('0'); }}/></Field></>)}
          {payType === "hourly" && (<><Field label="Hours worked"><TextInput value={hours} onChangeText={setHours} keyboardType="numeric" style={{ height: 48, fontSize: 16 }} onFocus={() => { if (hours === '0') setHours(''); }} onBlur={() => { if (hours === '') setHours('0'); }}/></Field><Field label="Rate (AUD/hour)"><TextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={{ height: 48, fontSize: 16 }} onFocus={() => { if (rate === '0') setRate(''); }} onBlur={() => { if (rate === '') setRate('0'); }}/></Field></>)}
          <Field label="Tax mode (auto)"><Picker selectedValue={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}><Picker.Item label="WHM registered employer — 15%" value="whm_15" /><Picker.Item label="Cash job (no withholding) — 0%" value="cash_0" /></Picker></Field>
          <Field label="Comment (optional)"><TextInput value={comment} onChangeText={setComment} placeholder="Notes…" style={{ height: 48, fontSize: 16 }}/></Field>
        </Card>

        {preview && (
          <SolidCard style={{ marginTop: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "700", marginBottom: 8 }}>Preview</Text>
            <Text style={{ color: "#fff" }}>
              Gross: ${preview.gross.toFixed(2)} | Tax: ${preview.taxAmount.toFixed(2)} | Net: ${preview.net.toFixed(2)}
            </Text>
          </SolidCard>
        )}

        <View style={{ marginTop: 16 }}>
          <Button title="Save log" onPress={save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
