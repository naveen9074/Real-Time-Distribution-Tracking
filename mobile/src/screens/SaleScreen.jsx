/**
 * SaleScreen.jsx — Record Sale Screen
 * - Displays active vehicle info & assigned stock
 * - Lets delivery rep pick customer store
 * - Lets delivery rep choose quantity with stepper (- / +)
 * - Validates: qty >= 1 and qty <= stock
 * - Atomically deducts stock in Firestore and routes to ReceiptScreen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { listenCustomers, recordSale } from '../firebase';

const C = {
  bg: '#080a12',
  card: '#0f1320',
  border: 'rgba(255,255,255,0.08)',
  brand: '#6366f1',
  brandLight: '#818cf8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#64748b',
  inputBg: 'rgba(255,255,255,0.04)',
};

export default function SaleScreen({ navigation, route }) {
  const vehicle = route.params?.vehicle || {
    id: 'van001',
    name: 'Vehicle 1',
    stock: 50,
    pricePerUnit: 60,
  };

  const [customers, setCustomers] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [quantity, setQuantity] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenCustomers((list) => {
      setCustomers(list);
      if (list.length > 0 && !selectedStore) {
        setSelectedStore(list[0]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stock = Number(vehicle.stock || 0);
  const price = Number(vehicle.pricePerUnit || 60);
  const qty = parseInt(quantity, 10) || 0;
  const total = qty * price;
  const remaining = stock - qty;
  const isValid = selectedStore && qty >= 1 && qty <= stock;

  const decQty = () => setQuantity(String(Math.max(1, qty - 1)));
  const incQty = () => setQuantity(String(Math.min(stock, qty + 1)));

  const handleSell = async () => {
    if (!selectedStore) {
      Alert.alert('Select Store', 'Please select a customer store to deliver to.');
      return;
    }
    if (qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter at least 1 box.');
      return;
    }
    if (qty > stock) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${stock} boxes available in ${vehicle.name}. Cannot sell ${qty} boxes.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await recordSale({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        storeName: selectedStore.name,
        quantity: qty,
        pricePerUnit: price,
        stockBefore: stock,
      });

      // Navigate to digital receipt screen
      navigation.replace('Receipt', { order, vehicle });
    } catch (e) {
      Alert.alert('Sale Error', e.message || 'Failed to record sale.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading customer stores from Firestore…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Record Sale</Text>
              <Text style={styles.vehicleBadgeText}>🚐 {vehicle.name} {vehicle.driverName ? `(${vehicle.driverName})` : ''}</Text>
            </View>
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>🏷 {stock} in van</Text>
            </View>
          </Animated.View>

          {/* ── Store Selection (Core Requirement) ───────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(80)} style={styles.card}>
            <View style={styles.cardLabelRow}>
              <Text style={styles.fieldLabel}>Select Customer Store</Text>
              <Text style={styles.storeCountTag}>{customers.length} stores</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10, marginHorizontal: -4 }}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {customers.map((c) => {
                const isSelected = selectedStore?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedStore(c)}
                    style={[styles.storeChip, isSelected && styles.storeChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.storeIcon}>{isSelected ? '✓' : '🏪'}</Text>
                    <Text
                      style={[
                        styles.storeChipText,
                        isSelected && styles.storeChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedStore?.address && (
              <Text style={styles.selectedStoreAddress}>
                📍 Address: {selectedStore.address}
              </Text>
            )}
          </Animated.View>

          {/* ── Quantity Stepper (Core Requirement) ──────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(140)} style={styles.card}>
            <Text style={styles.fieldLabel}>Quantity to Sell (Boxes)</Text>
            <View style={styles.stepRow}>
              <TouchableOpacity onPress={decQty} style={styles.stepBtn} activeOpacity={0.7}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
                selectTextOnFocus
              />
              <TouchableOpacity onPress={incQty} style={styles.stepBtn} activeOpacity={0.7}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {qty > stock && qty > 0 && (
              <Animated.View entering={FadeInDown.duration(200)}>
                <Text style={styles.errorText}>
                  ⚠️ Cannot exceed current van stock ({stock} boxes)
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Price Breakdown Preview ─────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(200)}
            style={[styles.card, styles.previewCard]}
          >
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Store Name</Text>
              <Text style={styles.previewValueBold}>{selectedStore?.name || '—'}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Price per Box</Text>
              <Text style={styles.previewValue}>₹{price}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Quantity</Text>
              <Text style={styles.previewValue}>× {qty} boxes</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.previewRow}>
              <Text style={styles.totalLabel}>Total Bill Amount</Text>
              <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.previewRow, { marginTop: 6 }]}>
              <Text style={styles.previewLabel}>Van Stock After Sale</Text>
              <Text
                style={[
                  styles.previewValueBold,
                  {
                    color:
                      remaining < 0
                        ? C.danger
                        : remaining <= 10
                        ? C.warning
                        : C.success,
                  },
                ]}
              >
                {remaining < 0 ? 'Exceeds van capacity' : `${remaining} boxes`}
              </Text>
            </View>
          </Animated.View>

          {/* ── Submit Button (Auto Deducts & Generates Bill) ─────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(260)}>
            <TouchableOpacity
              onPress={handleSell}
              disabled={!isValid || submitting}
              style={[styles.sellBtn, (!isValid || submitting) && { opacity: 0.5 }]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isValid && !submitting ? [C.brand, '#8b5cf6'] : ['#374151', '#374151']}
                style={styles.sellGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sellText}>
                    {isValid
                      ? `✓ Confirm Sale · ₹${total.toLocaleString('en-IN')}`
                      : 'Select store & enter valid quantity'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  loadingText: { color: C.muted, fontSize: 13, marginTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { paddingRight: 10, paddingVertical: 6 },
  backText: { color: C.brandLight, fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  vehicleBadgeText: { fontSize: 11, color: C.brandLight, fontWeight: '700', marginTop: 1 },
  stockBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stockBadgeText: { fontSize: 12, color: C.sub, fontWeight: '700' },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  cardLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  storeCountTag: { fontSize: 11, color: C.muted, fontWeight: '600' },

  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.border,
  },
  storeChipActive: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderColor: C.brand,
  },
  storeIcon: { fontSize: 14 },
  storeChipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  storeChipTextActive: { color: C.text, fontWeight: '800' },
  selectedStoreAddress: {
    fontSize: 11,
    color: C.muted,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 24, color: C.brandLight, fontWeight: '800' },
  qtyInput: {
    flex: 1,
    height: 48,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.brand,
    color: C.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorText: { color: C.danger, fontSize: 12, marginTop: 8 },

  previewCard: { backgroundColor: 'rgba(255,255,255,0.02)' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  previewLabel: { fontSize: 13, color: C.muted },
  previewValue: { fontSize: 13, color: C.sub, fontWeight: '600' },
  previewValueBold: { fontSize: 13, color: C.text, fontWeight: '800' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  totalValue: { fontSize: 22, fontWeight: '900', color: C.success },

  sellBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  sellGrad: { paddingVertical: 18, alignItems: 'center' },
  sellText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
