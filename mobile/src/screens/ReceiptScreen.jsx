/**
 * ReceiptScreen.jsx — Itemized Digital Bill after a successful sale
 * Shows animated receipt with itemized multi-product breakdown and remaining van stock
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const C = {
  bg: '#080a12',
  card: '#0f1320',
  border: 'rgba(255,255,255,0.07)',
  brand: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#64748b',
};

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { color: C.text, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

export default function ReceiptScreen({ navigation, route }) {
  const { order } = route.params;

  const stockAfter = Number(order.stockAfter !== undefined ? order.stockAfter : order.vehicleStockAfter || 0);
  const stockColor = stockAfter <= 5 ? C.danger : stockAfter <= 15 ? C.warning : C.success;

  const formatNow = () =>
    new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          name: 'Dosa Batter Box',
          quantity: order.quantity || 1,
          unit: 'Box',
          pricePerUnit: order.pricePerUnit || 60,
          subtotal: order.totalAmount || 60,
        },
      ];

  const handleShare = () => {
    let itemsText = '';
    items.forEach((it) => {
      itemsText += `• ${it.name} (${it.quantity} ${it.unit || 'unit'}) @ ₹${it.pricePerUnit} = ₹${it.subtotal}\n`;
    });

    const msg =
      `🧾 DosaTrack Invoice\n` +
      `──────────────────\n` +
      `Store   : ${order.storeName || order.customerName}\n` +
      `Vehicle : ${order.vehicleName || 'Delivery Vehicle'}\n` +
      `Date    : ${formatNow()}\n` +
      `──────────────────\n` +
      `ITEMS DELIVERED:\n` +
      itemsText +
      `──────────────────\n` +
      `Total Units : ${order.quantity || items.reduce((a, b) => a + b.quantity, 0)}\n` +
      `Grand Total : ₹${order.totalAmount}\n` +
      `Van Remaining Stock: ${stockAfter} units\n` +
      `──────────────────\n` +
      `Thank you for your business! 🙏`;

    Share.share({ message: msg });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Success Banner */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.02)']}
            style={styles.banner}
          >
            <Animated.View entering={ZoomIn.duration(400).delay(100)} style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </Animated.View>
            <Text style={styles.bannerTitle}>Sale Recorded!</Text>
            <Text style={styles.bannerSub}>Itemized receipt synced in real-time to owner dashboard</Text>
          </LinearGradient>
        </Animated.View>

        {/* Receipt Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.receipt}>
          {/* Perforated top */}
          <View style={styles.perfTop} />

          {/* Brand */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptBrand}>🚐 DosaTrack</Text>
            <Text style={styles.receiptSub}>Real-Time Distribution Invoice</Text>
            <Text style={styles.receiptDate}>{formatNow()}</Text>
          </View>
          <View style={styles.divider} />

          {/* Store & Vehicle details */}
          <View style={styles.itemsMeta}>
            <Row label="Customer Store" value={order.storeName || order.customerName} bold />
            {order.vehicleName && <Row label="Delivered By" value={order.vehicleName} />}
            <Row label="Invoice ID" value={`#${(order.id || order._id || '').slice(-6).toUpperCase()}`} />
          </View>
          <View style={styles.divider} />

          {/* Itemized Table Breakdown */}
          <View style={styles.tableWrap}>
            <Text style={styles.tableHeading}>DELIVERED PRODUCTS</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 2 }]}>Product</Text>
              <Text style={[styles.th, { textAlign: 'center', flex: 1 }]}>Qty</Text>
              <Text style={[styles.th, { textAlign: 'right', flex: 1 }]}>Rate</Text>
              <Text style={[styles.th, { textAlign: 'right', flex: 1 }]}>Amount</Text>
            </View>

            {items.map((it, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={{ flex: 2, paddingRight: 4 }}>
                  <Text style={styles.tdName}>{it.name}</Text>
                  <Text style={styles.tdUnit}>{it.unit || 'unit'}</Text>
                </View>
                <Text style={[styles.tdQty, { flex: 1, textAlign: 'center' }]}>{it.quantity}</Text>
                <Text style={[styles.tdRate, { flex: 1, textAlign: 'right' }]}>₹{it.pricePerUnit}</Text>
                <Text style={[styles.tdAmount, { flex: 1, textAlign: 'right' }]}>
                  ₹{(it.subtotal !== undefined ? it.subtotal : it.quantity * it.pricePerUnit).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalUnitsSub}>
                {order.quantity || items.reduce((a, b) => a + b.quantity, 0)} total units
              </Text>
            </View>
            <Text style={styles.totalAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />

          {/* Remaining vehicle stock */}
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.stockLabel}>Van Stock Remaining</Text>
              <Text style={styles.stockSub}>total units after this delivery</Text>
            </View>
            <View style={[styles.stockBadge, { borderColor: stockColor }]}>
              <Text style={[styles.stockNum, { color: stockColor }]}>{stockAfter}</Text>
              <Text style={[styles.stockUnit, { color: stockColor }]}>units</Text>
            </View>
          </View>

          {stockAfter <= 10 && (
            <View style={styles.lowStock}>
              <Text style={styles.lowStockText}>
                {stockAfter === 0
                  ? '🚫 Van is out of stock — please restock from warehouse'
                  : `⚠️ Low stock! Only ${stockAfter} units remaining in van`}
              </Text>
            </View>
          )}

          {/* Perforated bottom */}
          <View style={styles.perfBottom} />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(350).delay(320)} style={styles.actions}>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📤 Share Itemized Invoice (WhatsApp/SMS)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Sale', {
                vehicle: route.params?.vehicle || { id: order.vehicleId, name: order.vehicleName },
              })
            }
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[C.brand, '#8b5cf6']}
              style={styles.newSaleGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.newSaleText}>➕ Record Next Sale</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Home', {
                vehicleId: order.vehicleId,
                vehicle: route.params?.vehicle,
              })
            }
            style={styles.homeBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>← Back to {order.vehicleName || 'Vehicle'} Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={styles.switchBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.switchBtnText}>🔄 Switch Vehicle / Exit Shift</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 50 },

  banner: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 2,
    borderColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkIcon: { fontSize: 26, color: C.success },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 4 },
  bannerSub: { fontSize: 12, color: C.sub, textAlign: 'center' },

  receipt: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  perfTop: {
    height: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.border,
  },
  perfBottom: {
    height: 12,
    backgroundColor: C.bg,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.border,
  },

  receiptHeader: { alignItems: 'center', padding: 18, paddingBottom: 14 },
  receiptBrand: { fontSize: 19, fontWeight: '900', color: C.text },
  receiptSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  receiptDate: { fontSize: 11, color: C.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  itemsMeta: { paddingHorizontal: 18, paddingVertical: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 12, color: C.muted },
  rowValue: { fontSize: 12, color: C.sub, fontWeight: '600' },

  tableWrap: { paddingHorizontal: 18, paddingVertical: 14 },
  tableHeading: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1, marginBottom: 10 },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  th: { fontSize: 10, fontWeight: '800', color: C.muted, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  tdName: { fontSize: 13, fontWeight: '700', color: C.text },
  tdUnit: { fontSize: 10, color: C.muted },
  tdQty: { fontSize: 13, fontWeight: '800', color: C.brandLight },
  tdRate: { fontSize: 12, color: C.muted },
  tdAmount: { fontSize: 13, fontWeight: '800', color: '#c7d2fe' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 11, color: C.muted, fontWeight: '800', letterSpacing: 1 },
  totalUnitsSub: { fontSize: 11, color: C.brandLight, fontWeight: '600', marginTop: 2 },
  totalAmount: { fontSize: 26, fontWeight: '900', color: C.success },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  stockLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
  stockSub: { fontSize: 10, color: C.muted, marginTop: 2 },
  stockBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  stockNum: { fontSize: 20, fontWeight: '900' },
  stockUnit: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  lowStock: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  lowStockText: { fontSize: 12, color: '#fca5a5', textAlign: 'center' },

  actions: { gap: 12 },
  shareBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
  },
  shareBtnText: { color: C.sub, fontSize: 14, fontWeight: '700' },
  newSaleGrad: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  newSaleText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  homeBtn: { alignItems: 'center', paddingVertical: 10 },
  homeBtnText: { color: C.muted, fontSize: 13 },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
  },
  switchBtnText: { color: C.sub, fontSize: 13, fontWeight: '700' },
});
