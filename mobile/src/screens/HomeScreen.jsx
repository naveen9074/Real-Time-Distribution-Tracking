/**
 * HomeScreen.jsx — Delivery Rep Mobile Screen
 * - Selects delivery vehicle (Vehicle 1 / Vehicle 2)
 * - Shows current stock assigned to that vehicle (real-time from Firestore)
 * - Shows Today's revenue & boxes delivered
 * - "Record a Sale" action button
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { listenVehicles, getTodayStats } from '../firebase';

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
};

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}30` }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation, route }) {
  const [vehicles, setVehicles] = useState([]);
  const initialVehicleId = route.params?.vehicleId || route.params?.vehicle?.id || 'van001';
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [stats, setStats] = useState({ totalRevenue: 0, totalBoxes: 0, orderCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  // Sync state if navigated with a specific vehicleId from Login or Receipt
  useEffect(() => {
    const passedId = route.params?.vehicleId || route.params?.vehicle?.id;
    if (passedId && passedId !== selectedVehicleId) {
      setSelectedVehicleId(passedId);
    }
  }, [route.params?.vehicleId, route.params?.vehicle?.id]);

  const stockScale = useSharedValue(1);
  const stockAnim = useAnimatedStyle(() => ({
    transform: [{ scale: stockScale.value }],
  }));

  useEffect(() => {
    const unsub = listenVehicles((list) => {
      setVehicles(list);
      // spring pulse animation when stock changes
      stockScale.value = withSequence(
        withSpring(1.18, { damping: 3, stiffness: 400 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    });
    loadStats();
    return () => unsub();
  }, [selectedVehicleId]);

  const loadStats = async () => {
    try {
      const s = await getTodayStats(selectedVehicleId);
      setStats(s);
    } catch {}
    setRefreshing(false);
  };

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || {
      id: 'van001',
      name: 'Vehicle 1',
      driverName: 'Ramesh Kumar',
      stock: 50,
      pricePerUnit: 60,
    };

  const stock = Number(activeVehicle.stock || 0);
  const price = Number(activeVehicle.pricePerUnit || 60);
  const stockPct = Math.min((stock / 50) * 100, 100);
  const stockColor = stock <= 5 ? C.danger : stock <= 15 ? C.warning : C.success;
  const stockLabel =
    stock <= 5 ? '🔴 Critically Low' : stock <= 15 ? '🟡 Running Low' : '🟢 Well Stocked';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
      >
        {/* ── Top Header with Vehicle Selector & Switcher ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.logo}>🚐 DosaTrack</Text>
            <Text style={styles.subtitle}>Delivery Sales App</Text>
          </View>

          <View style={styles.headerActions}>
            {/* Vehicle Switcher Pill */}
            <TouchableOpacity
              onPress={() => setShowVehiclePicker(true)}
              style={styles.vehiclePill}
              activeOpacity={0.8}
            >
              <View style={styles.dot} />
              <Text style={styles.vehiclePillText}>{activeVehicle.name}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>

            {/* Direct Switch Vehicle / Logout Button */}
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              style={styles.switchVehicleHeaderBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.switchVehicleHeaderBtnText}>🚪 Switch</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Assigned Driver Banner */}
        <View style={styles.driverBanner}>
          <View style={styles.driverBannerLeft}>
            <Text style={styles.driverLabel}>Active Vehicle & Rep:</Text>
            <Text style={styles.driverName}>
              {activeVehicle.name} · {activeVehicle.driverName || 'Delivery Rep'} {activeVehicle.regNo ? `(${activeVehicle.regNo})` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={styles.changeVehicleBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.changeVehicleBtnText}>Switch 🔄</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stock Display Card (Core Module 1 Requirement) ─────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <LinearGradient
            colors={['#0f1320', '#141a30']}
            style={styles.stockCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.stockCardTop}>
              <Text style={styles.stockCardLabel}>ASSIGNED VEHICLE STOCK</Text>
              <Text style={styles.liveTag}>LIVE SYNC</Text>
            </View>

            {/* Big Stock Number with Reanimated pulse */}
            <Animated.Text style={[styles.stockNumber, { color: stockColor }, stockAnim]}>
              {stock}
            </Animated.Text>
            <Text style={styles.stockUnit}>boxes in van</Text>

            <View style={styles.stockMeta}>
              <Text style={[styles.stockStatus, { color: stockColor }]}>{stockLabel}</Text>
              <Text style={styles.priceTag}>₹{price}/box</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${stockPct}%`, backgroundColor: stockColor }]} />
            </View>
            <View style={styles.barMetaRow}>
              <Text style={styles.barMeta}>{stock} boxes remaining</Text>
              <Text style={styles.barMeta}>Total Value: ₹{stock * price}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Today's Performance ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Text style={styles.sectionTitle}>Today's Delivery Stats</Text>
          <View style={styles.statsRow}>
            <StatCard
              icon="💰"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
              label="Collected"
              color={C.success}
            />
            <StatCard
              icon="📦"
              value={stats.totalBoxes}
              label="Boxes Sold"
              color={C.brand}
            />
            <StatCard
              icon="🧾"
              value={stats.orderCount}
              label="Stores"
              color={C.warning}
            />
          </View>
        </Animated.View>

        {/* ── Primary CTA Button (Record a Sale) ─────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <TouchableOpacity
            style={[styles.ctaWrap, stock === 0 && { opacity: 0.45 }]}
            onPress={() =>
              navigation.navigate('Sale', {
                vehicle: activeVehicle,
              })
            }
            disabled={stock === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={stock === 0 ? ['#374151', '#374151'] : [C.brand, '#8b5cf6']}
              style={styles.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>
                {stock === 0 ? '🚫 Out of Stock' : '➕ Record New Sale'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {stock === 0 && (
            <Text style={styles.emptyNote}>
              Vehicle is empty. Ask the business owner to assign more boxes from the web console.
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Vehicle Picker Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showVehiclePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVehiclePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVehiclePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Delivery Vehicle</Text>
            <Text style={styles.modalSubtitle}>
              Choose which vehicle you are driving today:
            </Text>

            {vehicles.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicleId === v.id && styles.vehicleOptionActive,
                ]}
                onPress={() => {
                  setSelectedVehicleId(v.id);
                  setShowVehiclePicker(false);
                }}
              >
                <View style={styles.vehicleOptionLeft}>
                  <Text style={styles.vehicleOptionIcon}>🚐</Text>
                  <View>
                    <Text style={styles.vehicleOptionName}>{v.name}</Text>
                    <Text style={styles.vehicleOptionDriver}>
                      Driver: {v.driverName || 'Rep'} {v.regNo ? `(${v.regNo})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleOptionRight}>
                  <Text style={styles.vehicleOptionStock}>{v.stock || 0} boxes</Text>
                  {selectedVehicleId === v.id && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.switchLoginBtn}
              onPress={() => {
                setShowVehiclePicker(false);
                navigation.replace('Login');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.switchLoginBtnText}>🚪 Go to Vehicle Login Page</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowVehiclePicker(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: { fontSize: 22, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 11, color: C.muted, marginTop: 1 },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchVehicleHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  switchVehicleHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
  },

  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  vehiclePillText: { fontSize: 12, fontWeight: '800', color: C.text },
  chevron: { fontSize: 12, color: C.brandLight, fontWeight: '900' },

  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  driverBannerLeft: {
    flex: 1,
  },
  driverLabel: { fontSize: 11, color: C.muted, fontWeight: '600' },
  driverName: { fontSize: 12, color: C.brandLight, fontWeight: '700' },
  changeVehicleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  changeVehicleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.brandLight,
  },

  stockCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  stockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockCardLabel: {
    fontSize: 10,
    color: C.sub,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  liveTag: {
    fontSize: 9,
    fontWeight: '900',
    color: C.success,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockNumber: { fontSize: 80, fontWeight: '900', lineHeight: 86, textAlign: 'center' },
  stockUnit: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 14 },
  stockMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockStatus: { fontSize: 13, fontWeight: '700' },
  priceTag: { fontSize: 14, color: C.brandLight, fontWeight: '700' },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barMeta: { fontSize: 11, color: C.muted },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: {
    fontSize: 9,
    color: C.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  emptyNote: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 10 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: C.muted, marginBottom: 18 },
  vehicleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  vehicleOptionActive: {
    borderColor: C.brand,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  vehicleOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleOptionIcon: { fontSize: 24 },
  vehicleOptionName: { fontSize: 14, fontWeight: '800', color: C.text },
  vehicleOptionDriver: { fontSize: 11, color: C.muted, marginTop: 2 },
  vehicleOptionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleOptionStock: { fontSize: 13, fontWeight: '800', color: C.brandLight },
  checkMark: { fontSize: 16, fontWeight: '900', color: C.success },
  switchLoginBtn: {
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    alignItems: 'center',
  },
  switchLoginBtnText: {
    color: C.brandLight,
    fontWeight: '800',
    fontSize: 13,
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  closeBtnText: { color: C.text, fontWeight: '700', fontSize: 14 },
});
