/**
 * ReceiptScreen.jsx — Digital bill after a successful sale
 * Shows animated receipt with order summary and remaining van stock
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const C = {
  bg: '#080a12', card: '#0f1320', border: 'rgba(255,255,255,0.07)',
  brand: '#6366f1', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  text: '#f1f5f9', sub: '#94a3b8', muted: '#4b5563',
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

  const stockColor = order.stockAfter <= 5 ? C.danger : order.stockAfter <= 15 ? C.warning : C.success;

  const formatNow = () => new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const handleShare = () => Share.share({
    message:
      `🧾 DosaTrack Receipt\n` +
      `──────────────────\n` +
      `Store : ${order.storeName}\n` +
      `Item  : Dosa Batter Box\n` +
      `Qty   : ${order.quantity} boxes\n` +
      `Rate  : ₹${order.pricePerUnit}/box\n` +
      `Total : ₹${order.totalAmount}\n` +
      `──────────────────\n` +
      `Date  : ${formatNow()}\n` +
      `Van remaining: ${order.stockAfter} boxes\n` +
      `Thank you! 🙏`,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Success Banner */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.02)']} style={styles.banner}>
            <Animated.View entering={ZoomIn.duration(400).delay(100)} style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </Animated.View>
            <Text style={styles.bannerTitle}>Sale Recorded!</Text>
            <Text style={styles.bannerSub}>Receipt generated · synced to dashboard</Text>
          </LinearGradient>
        </Animated.View>

        {/* Receipt Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.receipt}>
          {/* Perforated top */}
          <View style={styles.perfTop} />

          {/* Brand */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptBrand}>🚐 DosaTrack</Text>
            <Text style={styles.receiptSub}>Fresh Dosa Batter Delivery</Text>
            <Text style={styles.receiptDate}>{formatNow()}</Text>
          </View>
          <View style={styles.divider} />

          {/* Line items */}
          <View style={styles.items}>
            <Row label="Customer"  value={order.storeName} bold />
            {order.vehicleName && <Row label="Vehicle" value={order.vehicleName} />}
            <Row label="Item"      value="Dosa Batter Box" />
            <Row label="Quantity"  value={`${order.quantity} boxes`} />
            <Row label="Rate"      value={`₹${order.pricePerUnit} / box`} />
          </View>
          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />

          {/* Remaining stock */}
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.stockLabel}>Van Stock Remaining</Text>
              <Text style={styles.stockSub}>after this sale</Text>
            </View>
            <View style={[styles.stockBadge, { borderColor: stockColor }]}>
              <Text style={[styles.stockNum, { color: stockColor }]}>{order.stockAfter}</Text>
              <Text style={[styles.stockUnit, { color: stockColor }]}>boxes</Text>
            </View>
          </View>

          {order.stockAfter <= 10 && (
            <View style={styles.lowStock}>
              <Text style={styles.lowStockText}>
                {order.stockAfter === 0 ? '🚫 Van is empty — contact owner' : `⚠️ Low stock! Only ${order.stockAfter} boxes left`}
              </Text>
            </View>
          )}

          {/* Perforated bottom */}
          <View style={styles.perfBottom} />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(350).delay(320)} style={styles.actions}>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📤  Share Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Sale', {
                vehicle: route.params?.vehicle || { id: order.vehicleId, name: order.vehicleName },
              })
            }
            activeOpacity={0.8}
          >
            <LinearGradient colors={[C.brand, '#8b5cf6']} style={styles.newSaleGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.newSaleText}>➕  New Sale</Text>
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
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },

  banner: { alignItems: 'center', padding: 28, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 2, borderColor: C.success, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  checkIcon:   { fontSize: 28, color: C.success },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
  bannerSub:   { fontSize: 13, color: C.sub },

  receipt: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden' },
  perfTop:    { height: 12, backgroundColor: C.bg, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: C.border },
  perfBottom: { height: 12, backgroundColor: C.bg, borderTopWidth: 2, borderStyle: 'dashed', borderColor: C.border },

  receiptHeader: { alignItems: 'center', padding: 20, paddingBottom: 16 },
  receiptBrand:  { fontSize: 20, fontWeight: '900', color: C.text },
  receiptSub:    { fontSize: 12, color: C.muted, marginTop: 2 },
  receiptDate:   { fontSize: 11, color: C.muted, marginTop: 6 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  items: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  row:   { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: C.muted },
  rowValue: { fontSize: 13, color: C.sub, fontWeight: '600' },

  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  totalLabel:  { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 1 },
  totalAmount: { fontSize: 28, fontWeight: '900', color: C.success },

  stockRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  stockLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
  stockSub:   { fontSize: 11, color: C.muted, marginTop: 2 },
  stockBadge: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  stockNum:   { fontSize: 22, fontWeight: '900' },
  stockUnit:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  lowStock:     { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  lowStockText: { fontSize: 12, color: '#fca5a5', textAlign: 'center' },

  actions:   { gap: 12 },
  shareBtn:  { borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: 'center' },
  shareBtnText: { color: C.sub, fontSize: 15, fontWeight: '700' },
  newSaleGrad: { borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  newSaleText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  homeBtn:     { alignItems: 'center', paddingVertical: 10 },
  homeBtnText: { color: C.muted, fontSize: 14 },
  switchBtn:   { alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border },
  switchBtnText: { color: C.sub, fontSize: 13, fontWeight: '700' },
});
