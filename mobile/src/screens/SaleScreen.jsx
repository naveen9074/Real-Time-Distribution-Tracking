/**
 * SaleScreen.jsx — Multi-Item Selective Record Sale Screen
 * - Displays active vehicle info & assigned inventory
 * - Lets delivery rep pick customer store (with route indicators)
 * - Multi-item selector with per-item steppers, live stock checks, and subtotals
 * - Validates: totalQty >= 1, each item qty <= available vehicle stock
 * - Atomically deducts multi-item stock in Firestore and routes to ReceiptScreen
 */
import React, { useEffect, useState, useMemo } from 'react';
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
import { listenCustomers, listenVehicles, recordSale } from '../firebase';

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
  const initialVehicle = route.params?.vehicle || {
    id: 'van001',
    name: 'Vehicle 1',
    stock: 50,
    pricePerUnit: 60,
  };

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync real-time vehicles data to ensure stock & item catalog updates from web dashboard are live
  useEffect(() => {
    const unsubVehicles = listenVehicles((list) => {
      setVehicles(list);
    });
    const unsubCustomers = listenCustomers((list) => {
      setCustomers(list);
      if (list.length > 0 && !selectedStore) {
        const assigned = list.find((c) => c.assignedVehicleId === initialVehicle.id);
        setSelectedStore(assigned || list[0]);
      }
      setLoading(false);
    });

    return () => {
      unsubVehicles();
      unsubCustomers();
    };
  }, []);

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === initialVehicle.id) || initialVehicle;
  }, [vehicles, initialVehicle]);

  // Extract vehicle items or fallback to single default box item
  const vehicleItems = useMemo(() => {
    if (Array.isArray(activeVehicle.items) && activeVehicle.items.length > 0) {
      return activeVehicle.items;
    }
    return [
      {
        itemId: 'item_001',
        name: 'Dosa Batter (1kg)',
        unit: 'Box',
        stock: activeVehicle.stock !== undefined ? activeVehicle.stock : 50,
        price: activeVehicle.pricePerUnit || 60,
      },
    ];
  }, [activeVehicle]);

  // Customer sorting: customers assigned to this vehicle route appear first
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      const aAssigned = a.assignedVehicleId === activeVehicle.id;
      const bAssigned = b.assignedVehicleId === activeVehicle.id;
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [customers, activeVehicle.id]);

  // Change quantity for a specific item
  const updateQty = (itemId, val, maxStock) => {
    const num = Math.max(0, Math.min(maxStock, parseInt(val, 10) || 0));
    setSelectedQuantities((prev) => ({
      ...prev,
      [itemId]: num,
    }));
  };

  const incrementQty = (itemId, maxStock) => {
    const current = selectedQuantities[itemId] || 0;
    if (current < maxStock) {
      updateQty(itemId, current + 1, maxStock);
    }
  };

  const decrementQty = (itemId, maxStock) => {
    const current = selectedQuantities[itemId] || 0;
    if (current > 0) {
      updateQty(itemId, current - 1, maxStock);
    }
  };

  // Compute bill breakdown
  const billItems = useMemo(() => {
    return vehicleItems
      .map((it) => {
        const qty = selectedQuantities[it.itemId] || 0;
        const price = Number(it.price || 0);
        return {
          itemId: it.itemId,
          name: it.name,
          unit: it.unit || 'Unit',
          quantity: qty,
          pricePerUnit: price,
          subtotal: qty * price,
          availableStock: Number(it.stock || 0),
        };
      })
      .filter((it) => it.quantity > 0);
  }, [vehicleItems, selectedQuantities]);

  const totalQuantity = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [billItems]);

  const totalAmount = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.subtotal, 0);
  }, [billItems]);

  const totalVanStock = useMemo(() => {
    return vehicleItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  }, [vehicleItems]);

  const remainingVanStock = totalVanStock - totalQuantity;

  // Validation
  const hasInvalidItem = vehicleItems.some((it) => {
    const q = selectedQuantities[it.itemId] || 0;
    return q > Number(it.stock || 0);
  });
  const isValid = selectedStore && totalQuantity > 0 && !hasInvalidItem;

  const handleSell = async () => {
    if (!selectedStore) {
      Alert.alert('Select Store', 'Please select a customer store to deliver to.');
      return;
    }
    if (totalQuantity <= 0) {
      Alert.alert('No Items Selected', 'Please select at least 1 item to sell.');
      return;
    }
    if (hasInvalidItem) {
      Alert.alert('Insufficient Stock', 'Some items exceed available stock in your vehicle.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await recordSale({
        vehicleId: activeVehicle.id,
        vehicleName: activeVehicle.name,
        storeName: selectedStore.name,
        items: billItems,
        stockBefore: totalVanStock,
      });

      // Navigate to digital receipt screen
      navigation.replace('Receipt', { order, vehicle: activeVehicle });
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
        <Text style={styles.loadingText}>Loading customer stores & inventory…</Text>
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
          {/* ── Top Header ─────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Record Selective Sale</Text>
              <Text style={styles.vehicleBadgeText}>
                🚐 {activeVehicle.name} {activeVehicle.driverName ? `(${activeVehicle.driverName})` : ''}
              </Text>
            </View>
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>🏷 {totalVanStock} units in van</Text>
            </View>
          </Animated.View>

          {/* ── Store Selection ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(60)} style={styles.card}>
            <View style={styles.cardLabelRow}>
              <Text style={styles.fieldLabel}>Select Customer Store</Text>
              <Text style={styles.storeCountTag}>
                {customers.filter((c) => c.assignedVehicleId === activeVehicle.id).length} on route • {customers.length} total
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10, marginHorizontal: -4 }}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {sortedCustomers.map((c) => {
                const isSelected = selectedStore?.id === c.id;
                const isAssigned = c.assignedVehicleId === activeVehicle.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedStore(c)}
                    style={[
                      styles.storeChip,
                      isSelected && styles.storeChipActive,
                      isAssigned && !isSelected && { borderColor: 'rgba(99,102,241,0.35)', backgroundColor: 'rgba(99,102,241,0.06)' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.storeIcon}>
                      {isSelected ? '✓' : isAssigned ? '★' : '🏪'}
                    </Text>
                    <Text
                      style={[
                        styles.storeChipText,
                        isSelected && styles.storeChipTextActive,
                        isAssigned && !isSelected && { color: '#c7d2fe' },
                      ]}
                    >
                      {c.name}
                    </Text>
                    {isAssigned && (
                      <View style={{ marginLeft: 4, paddingHorizontal: 4, paddingVertical: 1, backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.25)', borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: isSelected ? '#fff' : '#a5b4fc', fontWeight: '700' }}>ROUTE</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedStore?.address && (
              <Text style={styles.selectedStoreAddress}>
                📍 Address: {selectedStore.address}
                {selectedStore.assignedVehicleId === activeVehicle.id ? '  •  ★ Assigned Route' : ''}
              </Text>
            )}
          </Animated.View>

          {/* ── Multi-Item Selector (Core Requirement) ────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(120)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Select Products to Sell</Text>
              <Text style={styles.sectionBadge}>{vehicleItems.length} Products Available</Text>
            </View>

            {vehicleItems.map((item, idx) => {
              const qty = selectedQuantities[item.itemId] || 0;
              const stock = Number(item.stock || 0);
              const price = Number(item.price || 0);
              const isSelected = qty > 0;
              const isOverStock = qty > stock;
              const isOutOfStock = stock <= 0;

              return (
                <View
                  key={item.itemId}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                    isOverStock && styles.itemCardError,
                  ]}
                >
                  <View style={styles.itemTopRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.unitBadge}>
                          <Text style={styles.unitBadgeText}>{item.unit || 'Unit'}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemRateText}>
                        ₹{price} <Text style={{ color: C.muted, fontWeight: '500' }}>/ {item.unit || 'unit'}</Text>
                      </Text>
                    </View>

                    {/* Stock pill */}
                    <View
                      style={[
                        styles.itemStockPill,
                        isOutOfStock
                          ? { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }
                          : stock <= 5
                          ? { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }
                          : { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemStockText,
                          {
                            color: isOutOfStock ? C.danger : stock <= 5 ? C.warning : C.success,
                          },
                        ]}
                      >
                        {isOutOfStock ? '0 in van (Empty)' : `${stock} in van`}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity controls */}
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        onPress={() => decrementQty(item.itemId, stock)}
                        disabled={qty <= 0 || isOutOfStock}
                        style={[styles.stepBtn, (qty <= 0 || isOutOfStock) && styles.stepBtnDisabled]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.stepBtnText, (qty <= 0 || isOutOfStock) && { color: C.muted }]}>−</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.stepInput, isSelected && { borderColor: C.brand, color: '#c7d2fe' }]}
                        value={String(qty)}
                        onChangeText={(v) => updateQty(item.itemId, v.replace(/[^0-9]/g, ''), stock)}
                        keyboardType="numeric"
                        maxLength={3}
                        editable={!isOutOfStock}
                        selectTextOnFocus
                      />

                      <TouchableOpacity
                        onPress={() => incrementQty(item.itemId, stock)}
                        disabled={qty >= stock || isOutOfStock}
                        style={[styles.stepBtn, (qty >= stock || isOutOfStock) && styles.stepBtnDisabled]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.stepBtnText, (qty >= stock || isOutOfStock) && { color: C.muted }]}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick adder pills */}
                    <View style={styles.quickAddersRow}>
                      {[1, 5, 10].map((inc) => {
                        const target = qty + inc;
                        const canAdd = !isOutOfStock && target <= stock;
                        return (
                          <TouchableOpacity
                            key={inc}
                            onPress={() => updateQty(item.itemId, target, stock)}
                            disabled={!canAdd}
                            style={[styles.quickAdderPill, !canAdd && { opacity: 0.35 }]}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.quickAdderText}>+{inc}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Item subtotal */}
                    <View style={styles.itemSubtotalWrap}>
                      <Text style={styles.itemSubtotalLabel}>Subtotal</Text>
                      <Text style={[styles.itemSubtotalValue, isSelected && { color: C.success }]}>
                        ₹{(qty * price).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {isOverStock && (
                    <Text style={styles.errorText}>
                      ⚠️ Quantity cannot exceed vehicle stock ({stock} {item.unit || 'units'})
                    </Text>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* ── Bill Breakdown Preview Card ─────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(180)}
            style={[styles.card, styles.previewCard]}
          >
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Store Customer</Text>
              <Text style={styles.previewValueBold}>{selectedStore?.name || '—'}</Text>
            </View>

            <View style={styles.divider} />

            {/* Selected items list */}
            {billItems.length === 0 ? (
              <Text style={styles.noItemsSelectedText}>No products selected yet. Use + to add items above.</Text>
            ) : (
              billItems.map((bi) => (
                <View key={bi.itemId} style={styles.billItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billItemName}>{bi.name}</Text>
                    <Text style={styles.billItemSub}>
                      {bi.quantity} {bi.unit} × ₹{bi.pricePerUnit}
                    </Text>
                  </View>
                  <Text style={styles.billItemAmount}>₹{bi.subtotal.toLocaleString('en-IN')}</Text>
                </View>
              ))
            )}

            <View style={styles.divider} />

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Items / Units</Text>
              <Text style={styles.previewValueBold}>{totalQuantity} units</Text>
            </View>

            <View style={[styles.previewRow, { marginTop: 6 }]}>
              <Text style={styles.totalLabel}>TOTAL BILL AMOUNT</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.previewRow, { marginTop: 8 }]}>
              <Text style={styles.previewLabel}>Van Total Stock Left</Text>
              <Text
                style={[
                  styles.previewValueBold,
                  {
                    color:
                      remainingVanStock < 0
                        ? C.danger
                        : remainingVanStock <= 10
                        ? C.warning
                        : C.success,
                  },
                ]}
              >
                {remainingVanStock < 0 ? 'Exceeds van capacity' : `${remainingVanStock} units left`}
              </Text>
            </View>
          </Animated.View>

          {/* ── Submit Button ──────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(240)}>
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
                      ? `✓ Confirm Sale (${totalQuantity} items) · ₹${totalAmount.toLocaleString('en-IN')}`
                      : totalQuantity === 0
                      ? 'Select items to sell'
                      : 'Fix item quantities to proceed'}
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
  content: { padding: 18, paddingBottom: 50 },
  loadingText: { color: C.muted, fontSize: 13, marginTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { paddingRight: 10, paddingVertical: 6 },
  backText: { color: C.brandLight, fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: C.text },
  vehicleBadgeText: { fontSize: 11, color: C.brandLight, fontWeight: '700', marginTop: 1 },
  stockBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: { fontSize: 11, color: C.sub, fontWeight: '700' },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
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
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.border,
  },
  storeChipActive: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderColor: C.brand,
  },
  storeIcon: { fontSize: 13 },
  storeChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  storeChipTextActive: { color: C.text, fontWeight: '800' },
  selectedStoreAddress: {
    fontSize: 11,
    color: C.muted,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionBadge: { fontSize: 11, color: C.brandLight, fontWeight: '700' },

  itemCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  itemCardSelected: {
    borderColor: C.brand,
    backgroundColor: 'rgba(99,102,241,0.05)',
  },
  itemCardError: {
    borderColor: C.danger,
    backgroundColor: 'rgba(239,68,68,0.05)',
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: { fontSize: 15, fontWeight: '800', color: C.text },
  unitBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitBadgeText: { fontSize: 10, fontWeight: '700', color: C.sub },
  itemRateText: { fontSize: 13, fontWeight: '800', color: C.brandLight, marginTop: 3 },
  itemStockPill: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  itemStockText: { fontSize: 11, fontWeight: '800' },

  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { fontSize: 20, color: C.brandLight, fontWeight: '800' },
  stepInput: {
    width: 44,
    height: 36,
    backgroundColor: C.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  quickAddersRow: {
    flexDirection: 'row',
    gap: 4,
  },
  quickAdderPill: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
  },
  quickAdderText: { fontSize: 11, fontWeight: '700', color: C.sub },

  itemSubtotalWrap: {
    alignItems: 'flex-end',
  },
  itemSubtotalLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase' },
  itemSubtotalValue: { fontSize: 14, fontWeight: '900', color: C.sub, marginTop: 1 },

  errorText: { color: C.danger, fontSize: 11, marginTop: 8 },

  previewCard: { backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  previewLabel: { fontSize: 12, color: C.muted },
  previewValue: { fontSize: 12, color: C.sub, fontWeight: '600' },
  previewValueBold: { fontSize: 13, color: C.text, fontWeight: '800' },

  noItemsSelectedText: {
    fontSize: 12,
    color: C.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  billItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  billItemName: { fontSize: 13, fontWeight: '700', color: C.text },
  billItemSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  billItemAmount: { fontSize: 13, fontWeight: '800', color: '#c7d2fe' },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  totalLabel: { fontSize: 13, fontWeight: '800', color: C.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: C.success },

  sellBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 6 },
  sellGrad: { paddingVertical: 16, alignItems: 'center' },
  sellText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
