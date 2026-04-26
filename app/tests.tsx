import React from 'react';
import { 
  ScrollView, StyleSheet, TouchableOpacity, 
  View, Alert, StatusBar, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
  accent: '#E8F5E1',
  emergency: '#B71C1C'
};

const CATALOGO_TESTS = [
  { id: 't1', titulo: 'Ansiedad (GAD-7)', desc: 'Evalúa niveles de inquietud.', icon: '🌊', color: '#E3F2FD' },
  { id: 't2', titulo: 'Depresión (PHQ-9)', desc: 'Seguimiento de ánimo.', icon: '🍃', color: '#F1F8E9' },
  { id: 't3', titulo: 'Estrés Percibido', desc: 'Control de presión diaria.', icon: '🧠', color: '#FFF3E0' },
  { id: 't4', titulo: 'Higiene de Sueño', desc: 'Calidad del descanso.', icon: '🌙', color: '#EDE7F6' },
];

const CATALOGO_EJERCICIOS = [
  { id: 'e1', titulo: 'Respiración Profunda', duracion: '3 min', icon: '🫁' },
  { id: 'e2', titulo: 'Meditación Guiada', duracion: '10 min', icon: '🧘' },
  { id: 'e3', titulo: 'Pausa Activa', duracion: '5 min', icon: '🤸' },
  { id: 'e4', titulo: 'Escritura Libre', duracion: 'Libre', icon: '✍️' },
];

export default function TestsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  const handlePress = (titulo: string) => {
    Alert.alert("Vista Previa", `Has seleccionado: ${titulo}\n(La conexión a base de datos está pausada)`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold' }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>Biblioteca Salud</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Tests Rápidos</ThemedText>
        </View>

        <View style={styles.grid}>
          {CATALOGO_TESTS.map((test) => (
            <TouchableOpacity 
              key={test.id} 
              style={[styles.testCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
              onPress={() => handlePress(test.titulo)}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2A2A2A' : test.color }]}>
                <ThemedText style={styles.cardIcon}>{test.icon}</ThemedText>
              </View>
              <ThemedText style={[styles.cardTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>{test.titulo}</ThemedText>
              <ThemedText style={styles.cardDesc}>{test.desc}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <ThemedText style={styles.sectionTitle}>Ejercicios</ThemedText>
        </View>

        {CATALOGO_EJERCICIOS.map((ej) => (
          <TouchableOpacity 
            key={ej.id} 
            style={[styles.exerciseItem, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => handlePress(ej.titulo)}
          >
            <View style={styles.exerciseIconContainer}>
              <ThemedText style={{ fontSize: 24 }}>{ej.icon}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.ejTitle, { color: isDark ? '#EEE' : '#222' }]}>{ej.titulo}</ThemedText>
              <ThemedText style={styles.ejMeta}>{ej.duracion}</ThemedText>
            </View>
            <View style={styles.openBadge}>
              <ThemedText style={styles.openText}>INICIAR</ThemedText>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={styles.emergencyBtn}
          onPress={() => router.push('/resources')}
        >
          <ThemedText style={styles.emergencyBtnText}>🆘 APOYO EN CRISIS</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  backButton: { marginRight: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: IMSS_COLORS.green, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  testCard: { 
    width: (width - 55) / 2, 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
  cardDesc: { fontSize: 10, color: IMSS_COLORS.gray },
  exerciseItem: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: IMSS_COLORS.gold,
    elevation: 2
  },
  exerciseIconContainer: { marginRight: 15 },
  ejTitle: { fontSize: 15, fontWeight: '700' },
  ejMeta: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 2 },
  openBadge: { backgroundColor: IMSS_COLORS.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  openText: { fontSize: 10, color: '#FFF', fontWeight: '900' },
  emergencyBtn: { marginTop: 40, padding: 18, borderRadius: 12, backgroundColor: IMSS_COLORS.emergency, alignItems: 'center' },
  emergencyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});