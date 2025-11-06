// app/(tabs)/info.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Image as RNImage } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import dayjs from 'dayjs';
import 'dayjs/locale/en-au';

import { colors } from '../../src/ui/theme';
import { Card, SolidCard } from '../../src/ui/components';
import { FadeOnFocus } from '../../src/ui/animations';
import { loadAustralianPostcodes, type PostcodeRecord } from '../../src/infoData';

dayjs.locale('en-au');

const GOV_GUIDE_URL = 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417/specified-work';

const STATES = ['ALL','NSW','VIC','QLD','SA','WA','TAS','NT','ACT'] as const;
type StateFilter = typeof STATES[number];

export default function InfoScreen() {
  const [query, setQuery] = React.useState('');
  const [stateFilter, setStateFilter] = React.useState<StateFilter>('ALL');
  const [eligibleOnly, setEligibleOnly] = React.useState(false);
  const [data, setData] = React.useState<PostcodeRecord[]>([]);

  React.useEffect(() => {
    loadAustralianPostcodes().then(setData).catch(() => setData([]));
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (eligibleOnly && !r.eligible) return false;
      if (stateFilter !== 'ALL' && r.state !== stateFilter) return false;
      if (!q) return true;
      return (
        r.postcode.toLowerCase().includes(q) ||
        r.suburb.toLowerCase().includes(q)
      );
    });
  }, [data, query, stateFilter, eligibleOnly]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FadeOnFocus>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
            <RNImage source={require('../../assets/PickerLog-Brand.png')} style={{ width: 160, height: 24, resizeMode: 'contain' }} />
          </View>
        </View>

        <SolidCard style={{ marginHorizontal: 16 }}>
          <Text style={styles.title}>Extension Info & Postcodes</Text>
          <Text style={styles.subtitle}>Search eligible regions by postcode or suburb.</Text>
          <Pressable onPress={() => Linking.openURL(GOV_GUIDE_URL)}>
            <Text style={styles.link}>View official guidance →</Text>
          </Pressable>
        </SolidCard>

        <Card style={{ marginHorizontal: 16, marginTop: 12 }}>
          <View style={styles.filtersRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Search postcode or suburb"
                placeholderTextColor={colors.sub as any}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.filtersRow}>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={stateFilter}
                onValueChange={(v) => setStateFilter(v as StateFilter)}
                style={{ height: 40 }}
              >
                {STATES.map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>
            <Pressable onPress={() => setEligibleOnly((x) => !x)} style={[styles.toggle, eligibleOnly && styles.toggleOn]}>
              <Text style={[styles.toggleText, eligibleOnly && styles.toggleTextOn]}>{eligibleOnly ? 'Eligible Only: ON' : 'Eligible Only: OFF'}</Text>
            </Pressable>
          </View>
        </Card>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(r) => `${r.postcode}-${r.suburb}`}
          ListEmptyComponent={<Text style={styles.empty}>No results.</Text>}
          renderItem={({ item: r }) => (
            <Card>
              <View style={styles.rowMain}>
                {/* 왼쪽: 정보 영역 */}
                <View style={styles.rowLeft}>
                  <Text style={styles.postcode}>{r.postcode}</Text>
                  <Text style={styles.suburb} numberOfLines={2}>{r.suburb}</Text>
                  <Text style={styles.state}>{r.state}</Text>
                </View>

                {/* 오른쪽: 자격 뱃지 */}
                <View>
                  <Text style={[styles.eligible, r.eligible ? styles.eligibleYes : styles.eligibleNo]}>
                    {r.eligible ? 'Eligible' : 'Not eligible'}
                  </Text>
                </View>
              </View>

              {/* 하단: 노트 */}
              {!!r.note && <Text style={styles.note}>{r.note}</Text>}
            </Card>
          )}
        />
      </FadeOnFocus>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  title: { color: '#fff', fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { color: '#fff', opacity: 0.9, fontFamily: 'Inter_400Regular' },
  link: { color: '#fff', textDecorationLine: 'underline', marginTop: 8, fontFamily: 'Inter_600SemiBold' },

  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 40,
    borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: 'Inter_400Regular'
  },
  pickerWrap: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
  toggle: { paddingHorizontal: 12, height: 40, borderRadius: 10, backgroundColor: '#eef3ee', alignItems: 'center', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.brandSoft },
  toggleText: { color: colors.sub, fontFamily: 'Inter_600SemiBold' },
  toggleTextOn: { color: colors.brand },

  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12, marginTop: 12 },
  
  // 레이아웃 개선 스타일
  rowMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowLeft: { flex: 1, marginRight: 8 },
  postcode: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 2 },
  suburb: { fontSize: 16, color: colors.text, fontFamily: 'Inter_500Medium' },
  state: { fontSize: 14, color: colors.sub, fontFamily: 'Inter_400Regular', marginTop: 4 },
  
  eligible: { fontSize: 12, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  eligibleYes: { backgroundColor: colors.brandSoft, color: colors.brand },
  eligibleNo: { backgroundColor: '#FEEAEA', color: '#CC0000' },
  note: { marginTop: 8, color: colors.sub, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 24, color: colors.sub, fontFamily: 'Inter_400Regular' },
});