/**
 * LoginScreen.jsx — Delivery Rep & Vehicle Login Screen
 * - Displays active vehicles from Firestore (Vehicle 1 & Vehicle 2)
 * - Shows driver name, registration plate, current van stock, and delivery status
 * - Allows 1-tap quick login for fast testing between vehicles
 * - Directs straight into the selected vehicle's dashboard
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { listenVehicles } from '../firebase';
import COLORS from '../theme/colors';

const C = {
  bg: '#080a12',
  card: '#0f1320',
  cardActive: '#141a30',
  border: 'rgba(255,255,255,0.08)',
  brand: '#6366f1',
  brandLight: '#818cf8',
  brandGlow: 'rgba(99, 102, 241, 0.18)',
  emerald: '#10b981',
  emeraldGlow: 'rgba(16, 185, 129, 0.18)',
  amber: '#f59e0b',
  danger: '#ef4444',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#64748b',
};

// Preset palette per vehicle index for visual separation
const VEHICLE_THEMES = [
  {
    primary: '#6366f1',
    border: 'rgba(99, 102, 241, 0.4)',
    glow: 'rgba(99, 102, 241, 0.15)',
    gradient: ['#141933', '#0f1320'],
    tag: 'VAN 01',
  },
  {
    primary: '#10b981',
    border: 'rgba(16, 185, 129, 0.4)',
    glow: 'rgba(16, 185, 129, 0.15)',
    gradient: ['#0d2222', '#0f1320'],
    tag: 'VAN 02',
  },
  {
    primary: '#8b5cf6',
    border: 'rgba(139, 92, 246, 0.4)',
    glow: 'rgba(139, 92, 246, 0.15)',
    gradient: ['#1e1433', '#0f1320'],
    tag: 'VAN 03',
  },
];

export default function LoginScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('van001');
  const [pin, setPin] = useState('1234');
  const [usePinAuth, setUsePinAuth] = useState(false);

  useEffect(() => {
    const unsub = listenVehicles((list) => {
      const items = list && list.length > 0 ? list : [
        { id: 'van001', name: 'Vehicle 1', regNo: 'KA-01-AB-1234', driverName: 'Ramesh Kumar', stock: 50, pricePerUnit: 60 },
        { id: 'van002', name: 'Vehicle 2', regNo: 'KA-05-CD-5678', driverName: 'Suresh Nair', stock: 30, pricePerUnit: 60 },
      ];
      setVehicles(items);
      if (!selectedVehicleId && items[0]) {
        setSelectedVehicleId(items[0].id);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || {
      id: 'van001',
      name: 'Vehicle 1',
      driverName: 'Ramesh Kumar',
      stock: 50,
      pricePerUnit: 60,
    };

  const handleLogin = (vehicleToLogin = null) => {
    const target = vehicleToLogin || activeVehicle;
    if (!target) {
      Alert.alert('Error', 'Please choose a vehicle first.');
      return;
    }

    if (usePinAuth && pin.trim().length === 0) {
      Alert.alert('Enter PIN', 'Please enter your 4-digit driver PIN (demo default: 1234).');
      return;
    }

    // Direct into selected vehicle's dashboard
    navigation.replace('Home', {
      vehicleId: target.id,
      vehicle: target,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Brand & Header ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.logoBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoIcon}>🚐</Text>
          </LinearGradient>
          <Text style={styles.appTitle}>DosaTrack</Text>
          <Text style={styles.appSubtitle}>Field Sales & Delivery Portal</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.screenHeading}>Select Delivery Vehicle</Text>
          <Text style={styles.screenSub}>
            Choose your vehicle to start shift and sync van inventory
          </Text>
        </Animated.View>

        {/* ── Loading Indicator ───────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.brand} />
            <Text style={styles.loadingText}>Syncing vehicles from Firestore…</Text>
          </View>
        ) : (
          /* ── Vehicle Cards (Vehicle 1 & Vehicle 2) ────────────────────────── */
          <View style={styles.vehiclesSection}>
            {vehicles.map((v, index) => {
              const isSelected = v.id === selectedVehicleId;
              const theme = VEHICLE_THEMES[index % VEHICLE_THEMES.length];
              const stock = Number(v.stock || 0);
              const isLow = stock <= 10;

              return (
                <Animated.View
                  key={v.id}
                  entering={FadeInDown.duration(400).delay(80 + index * 60)}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedVehicleId(v.id)}
                    activeOpacity={0.88}
                    style={[
                      styles.vehicleCard,
                      {
                        borderColor: isSelected ? theme.primary : C.border,
                        backgroundColor: isSelected ? C.cardActive : C.card,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={isSelected ? theme.gradient : ['#0f1320', '#0f1320']}
                      style={styles.cardInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {/* Top Row: Tag & Status */}
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.vehicleTag,
                            { backgroundColor: `${theme.primary}25`, borderColor: theme.primary },
                          ]}
                        >
                          <Text style={[styles.vehicleTagText, { color: theme.primary }]}>
                            {theme.tag}
                          </Text>
                        </View>

                        <View style={styles.cardTopRight}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isLow ? C.amber : C.emerald },
                            ]}
                          />
                          <Text style={styles.statusLabel}>
                            {isLow ? 'Low Stock' : 'Ready'}
                          </Text>

                          {/* Selected Checkmark */}
                          {isSelected && (
                            <Animated.View
                              entering={ZoomIn.duration(250)}
                              style={[styles.checkCircle, { backgroundColor: theme.primary }]}
                            >
                              <Text style={styles.checkIcon}>✓</Text>
                            </Animated.View>
                          )}
                        </View>
                      </View>

                      {/* Middle: Vehicle Title & Reg No */}
                      <View style={styles.cardMain}>
                        <Text style={styles.vehicleName}>{v.name}</Text>
                        <Text style={styles.regNo}>
                          Plate: {v.regNo || (index === 0 ? 'KA-01-AB-1234' : 'KA-05-CD-5678')}
                        </Text>
                      </View>

                      {/* Driver & Stock Details */}
                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Assigned Driver</Text>
                          <Text style={styles.detailValue}>
                            👤 {v.driverName || (index === 0 ? 'Ramesh Kumar' : 'Suresh Nair')}
                          </Text>
                        </View>

                        <View style={styles.detailItemRight}>
                          <Text style={styles.detailLabel}>Van Inventory</Text>
                          <Text
                            style={[
                              styles.stockValue,
                              { color: isLow ? C.amber : C.emerald },
                            ]}
                          >
                            📦 {stock} boxes
                          </Text>
                        </View>
                      </View>

                      {/* Quick 1-Tap Direct Login Button */}
                      <TouchableOpacity
                        style={[
                          styles.quickActionBtn,
                          {
                            borderColor: `${theme.primary}50`,
                            backgroundColor: isSelected ? theme.primary : 'rgba(255,255,255,0.04)',
                          },
                        ]}
                        onPress={() => {
                          setSelectedVehicleId(v.id);
                          handleLogin(v);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.quickActionText,
                            isSelected && { color: '#ffffff', fontWeight: '800' },
                          ]}
                        >
                          {isSelected ? `👉 Enter as ${v.name}` : `Select & Log In`}
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── Optional Driver Passcode Section ───────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.authCard}>
          <TouchableOpacity
            style={styles.authToggleRow}
            onPress={() => setUsePinAuth(!usePinAuth)}
            activeOpacity={0.8}
          >
            <Text style={styles.authToggleLabel}>
              {usePinAuth ? '🔒 Driver PIN Verification (Active)' : '⚡ Quick Test Mode (Enabled)'}
            </Text>
            <Text style={styles.authToggleAction}>
              {usePinAuth ? 'Switch to 1-Tap' : 'Add PIN'}
            </Text>
          </TouchableOpacity>

          {usePinAuth && (
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Enter Driver PIN (Demo: 1234):</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                placeholder="1234"
                placeholderTextColor={C.muted}
              />
            </View>
          )}
        </Animated.View>

        {/* ── Main Start Shift / Login Action Button ──────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(280)}>
          <TouchableOpacity
            style={styles.mainLoginBtn}
            onPress={() => handleLogin()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.mainLoginGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.mainLoginText}>
                🚀 Start Shift with {activeVehicle.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerHelp}>
            Switching test note: You can return here anytime using "Switch Vehicle" on the dashboard.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoIcon: { fontSize: 30 },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: C.sub,
    marginTop: 2,
    fontWeight: '500',
  },
  headerDivider: {
    width: 48,
    height: 3,
    backgroundColor: 'rgba(99,102,241,0.5)',
    borderRadius: 2,
    marginVertical: 16,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  screenSub: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 18,
  },

  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: C.sub,
    fontSize: 13,
    marginTop: 12,
  },

  vehiclesSection: {
    gap: 16,
    marginBottom: 20,
  },
  vehicleCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  vehicleTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: C.sub,
    fontWeight: '600',
    marginRight: 4,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  cardMain: {
    marginBottom: 14,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
  },
  regNo: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
    fontWeight: '600',
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailItem: {
    flex: 1,
  },
  detailItemRight: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: '700',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '900',
  },

  quickActionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: C.sub,
    fontSize: 13,
    fontWeight: '700',
  },

  authCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  authToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authToggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  authToggleAction: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brandLight,
  },
  pinContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  pinLabel: {
    fontSize: 12,
    color: C.sub,
    marginBottom: 8,
  },
  pinInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: C.text,
    letterSpacing: 4,
  },

  mainLoginBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  mainLoginGrad: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLoginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  footerHelp: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 17,
  },
});
