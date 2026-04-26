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
};

// --- CATÁLOGO DE CONTENIDO CON RUTAS REALES ---
const CATALOGO_TESTS = [
  { 
    id: 'gad7', 
    titulo: 'Test GAD-7', 
    desc: 'Evaluación inicial de Ansiedad.', 
    icon: '🌊', 
    color: '#FFF3E0', 
    route: '/testGAD7' // Ruta al archivo testGAD7.tsx
  },
  { 
    id: 'phq9', 
    titulo: 'Test PHQ-9', 
    desc: 'Detección de síntomas de depresión.', 
    icon: '🍃', 
    color: '#F1F8E9', 
    route: '/PHQ9' // Ruta al archivo PHQ9.tsx
  },
  { 
    id: 'mmse', 
    titulo: 'Examen MMSE', 
    desc: 'Mini-Examen del Estado Mental.', 
    icon: '📋', 
    color: '#EDE7F6', 
    route: '/testMMSE' // Ruta al archivo testMMSE.tsx
  },
];

export default function TestsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  // Esta función ahora sí te manda al test que elijas
  const handleStartTest = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold' }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>Biblioteca Salud</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Evaluaciones Disponibles</ThemedText>
        </View>

        <View style={styles.grid}>
          {CATALOGO_TESTS.map((test) => (
            <TouchableOpacity 
              key={test.id} 
              style={[styles.testCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
              onPress={() => handleStartTest(test.route)}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2A2A2A' : test.color }]}>
                <ThemedText style={styles.cardIcon}>{test.icon}</ThemedText>
              </View>
              <ThemedText style={[styles.cardTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
                {test.titulo}
              </ThemedText>
              <ThemedText style={styles.cardDesc}>{test.desc}</ThemedText>
              <ThemedText style={styles.actionText}>INICIAR AHORA</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sección de ayuda rápida */}
        <TouchableOpacity 
          style={styles.emergencyCard}
          onPress={() => router.push('/resources')}
        >
          <ThemedText style={styles.emergencyText}>¿Necesitas ayuda inmediata? 🆘</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { marginRight: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 20 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: IMSS_COLORS.gray, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  testCard: { 
    width: (width - 55) / 2, 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
  cardDesc: { fontSize: 10, color: IMSS_COLORS.gray, marginBottom: 12 },
  actionText: { fontSize: 10, fontWeight: '900', color: IMSS_COLORS.gold },
  emergencyCard: { marginTop: 20, padding: 20, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEE' },
  emergencyText: { color: '#D32F2F', fontWeight: 'bold' }
});