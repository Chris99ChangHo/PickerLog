// app/(tabs)/entry.tsx

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from "expo-router"; 
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { computePayV2, type PayType, type PieceUnit } from "../../src/domain";
import { formatCurrencyAUD } from "../../src/ui/format";
import { upsert, loadAll, type LogEntry } from "../../src/storage"; 
import { Picker } from "@react-native-picker/picker";
import { Card, Field, H1, SolidCard } from "../../src/ui/components"; 
import { Button } from '../../src/ui/Button'; 
import { colors } from '../../src/ui/theme';
import Toast from 'react-native-toast-message';

// UI helper constants
const BERRIES = ["Blueberry", "Raspberry", "Blackberry", "Strawberry"] as const;
type Berry = typeof BERRIES[number];
type TaxMode = "whm_15" | "cash_0";
const taxFromMode = (m: TaxMode) => (m === "whm_15" ? 15 : 0);
const modeFromTax = (t: number) => (t === 15 ? "whm_15" : "cash_0");

const WebDatePicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange((e.target as HTMLInputElement).value)}
    style={{ border: "none", height: 48, fontSize: 16, backgroundColor: "transparent", width: "100%", outline: "none" }}
  />
);

export default function EntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editingId = params.id as string | undefined;

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

  useEffect(() => {
    if (!editingId) return;
    loadAll().then((entries) => {
      const e = entries.find((x) => x.id === editingId);
      if (!e) return;
      setDate(e.date);
      setBerry(e.berryType as Berry);
      setPayType(e.payType);
      setPieceUnit(e.pieceUnit ?? "kg");
      setKg(String(e.kg ?? "0"));
      setPunnets(String(e.punnets ?? "0"));
      setHours(String(e.hours ?? "0"));
      setRate(String(e.rate));
      setTaxMode(modeFromTax(e.taxPercent));
      setComment(e.comment ?? "");
    });
  }, [editingId]);

  const taxPercent = taxFromMode(taxMode);
  const preview = useMemo(() => {
    try {
      return computePayV2({
        payType,
        pieceUnit,
        quantity: payType === "piece" ? (pieceUnit === "kg" ? Number(kg) || 0 : Number(punnets) || 0) : undefined,
        hours: payType === "hourly" ? Number(hours) || 0 : undefined,
        rate: Number(rate) || 0,
        taxPercent,
      });
    } catch {
      return undefined;
    }
  }, [payType, pieceUnit, kg, punnets, hours, rate, taxPercent]);

  const onChangeDate = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(dayjs(selectedDate).format("YYYY-MM-DD"));
  };

  // allow decimals to two places
  const asDecimal2 = (raw: string) => {
    let v = (raw ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    const [intP, decP] = v.split('.');
    if (decP !== undefined) v = intP + '.' + decP.slice(0, 2);
    return v;
  };

  const save = useCallback(async () => {
    try {
      const entry: LogEntry = {
        id: editingId ?? String(Date.now()),
        date,
        berryType: berry,
        payType,
        rate: Number(rate) || 0,
        taxPercent,
        comment: comment || undefined,
        pieceUnit,
        kg: pieceUnit === "kg" && payType === "piece" ? Number(kg) || 0 : undefined,
        punnets: pieceUnit === "punnet" && payType === "piece" ? Number(punnets) || 0 : undefined,
        hours: payType === "hourly" ? Number(hours) || 0 : undefined,
      };
      await upsert(entry);
      Toast.show({ type: 'success', text1: editingId ? 'Log Updated' : 'Log Saved', position: 'bottom', visibilityTime: 2000 });
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/calendar');
      }, 2100);
    } catch (e) {
      console.error('Failed to save log:', e);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: 'An error occurred. Please try again.', position: 'bottom' });
    }
  }, [editingId, date, berry, payType, rate, taxPercent, pieceUnit, kg, punnets, hours, comment, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Card>
          <H1>{editingId ? 'Edit Log' : 'New Log'}</H1>

          <Field label="Date">
            {Platform.OS === 'web' ? (
              <WebDatePicker value={date} onChange={setDate} />
            ) : (
              <>
                <Pressable onPress={() => setShowPicker(true)} style={{ paddingVertical: 16 }}>
                  <Text style={{ fontSize: 16 }}>{date} (tap to change)</Text>
                </Pressable>
                {showPicker && (
                  <DateTimePicker
                    value={dayjs(date, 'YYYY-MM-DD').toDate()}
                    mode="date"
                    display="calendar"
                    onChange={onChangeDate}
                  />
                )}
              </>
            )}
          </Field>

          <Field label="Berry type">
            <Picker selectedValue={berry} onValueChange={(v) => setBerry(v as Berry)}>
              {BERRIES.map((b) => (
                <Picker.Item key={b} label={b} value={b} />
              ))}
            </Picker>
          </Field>

          <Field label="Pay type">
            <Picker selectedValue={payType} onValueChange={(v) => setPayType(v as PayType)}>
              <Picker.Item label="Piece rate" value="piece" />
              <Picker.Item label="Hourly" value="hourly" />
            </Picker>
          </Field>

          {payType === 'piece' && (
            <>
              <Field label="Piece unit">
                <Picker selectedValue={pieceUnit} onValueChange={(v) => setPieceUnit(v as PieceUnit)}>
                  <Picker.Item label="kg (kilograms)" value="kg" />
                  <Picker.Item label="punnet (trays)" value="punnet" />
                </Picker>
              </Field>

              {pieceUnit === 'kg' ? (
                <Field label="Picked kg">
                  <TextInput
                    value={kg}
                    onChangeText={(t) => setKg(asDecimal2(t))}
                    keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
                    style={{ height: 48, fontSize: 16 }}
                    onFocus={() => { if (kg === '0') setKg(''); }}
                    onBlur={() => { if (kg === '') setKg('0'); }}
                  />
                </Field>
              ) : (
                <Field label="Punnets picked">
                  <TextInput
                    value={punnets}
                    onChangeText={(t) => setPunnets(asDecimal2(t))}
                    keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
                    style={{ height: 48, fontSize: 16 }}
                    onFocus={() => { if (punnets === '0') setPunnets(''); }}
                    onBlur={() => { if (punnets === '') setPunnets('0'); }}
                  />
                </Field>
              )}

              <Field label={pieceUnit === 'kg' ? 'Rate (AUD/kg)' : 'Rate (AUD/punnet)'}>
                <TextInput
                  value={rate}
                  onChangeText={(t) => setRate(asDecimal2(t))}
                  keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
                  style={{ height: 48, fontSize: 16 }}
                  onFocus={() => { if (rate === '0') setRate(''); }}
                  onBlur={() => { if (rate === '') setRate('0'); }}
                />
              </Field>
            </>
          )}

          {payType === 'hourly' && (
            <>
              <Field label="Hours worked">
                <TextInput
                  value={hours}
                  onChangeText={(t) => setHours(asDecimal2(t))}
                  keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
                  style={{ height: 48, fontSize: 16 }}
                  onFocus={() => { if (hours === '0') setHours(''); }}
                  onBlur={() => { if (hours === '') setHours('0'); }}
                />
              </Field>
              <Field label="Rate (AUD/hour)">
                <TextInput
                  value={rate}
                  onChangeText={(t) => setRate(asDecimal2(t))}
                  keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
                  style={{ height: 48, fontSize: 16 }}
                  onFocus={() => { if (rate === '0') setRate(''); }}
                  onBlur={() => { if (rate === '') setRate('0'); }}
                />
              </Field>
            </>
          )}

          <Field label="Tax mode (auto)">
            <Picker selectedValue={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}>
              <Picker.Item label="WHM registered employer • 15%" value="whm_15" />
              <Picker.Item label="Cash job (no withholding) • 0%" value="cash_0" />
            </Picker>
          </Field>

          <Field label="Comment (optional)">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Notes"
              style={{ height: 48, fontSize: 16 }}
            />
          </Field>
        </Card>

        {preview && (
          <SolidCard style={{ marginTop: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Preview</Text>
            <Text style={{ color: '#fff' }}>
              Gross: {formatCurrencyAUD(preview.gross)} | Tax: {formatCurrencyAUD(preview.taxAmount)} | Net: {formatCurrencyAUD(preview.net)}
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
