import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { 
  SafeAreaView,
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Dimensions,
  StatusBar,
  Platform // <-- 1. Importamos Platform
} from 'react-native';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  white: '#FFFFFF',
  softGray: '#F5F5F5',
};

// --- GRUPO 1: SALUD MENTAL (Tests Clínicos) ---
const MENTAL_HEALTH = [
  { id: 'gad7', titulo: 'Ansiedad', subtitulo: 'Escala GAD-7', icon: '🧘', ruta: '/testGAD7' },
  { id: 'phq9', titulo: 'Depresión', subtitulo: 'Escala PHQ-9', icon: '📉', ruta: '/TestPHQ9' },
  { id: 'mmse', titulo: 'Deterioro Cognitivo', subtitulo: 'Escala MMSE', icon: '🌋', ruta: '/testMMSE' },
];

// --- GRUPO 2: COGNICIÓN (Actividades Mentales) ---
const COGNITION = [
  { id: 'mem', titulo: 'Memoria', subtitulo: 'Reto de Retención', icon: '🧠', ruta: '/ejercicios/memoria' },
  { id: 'foc', titulo: 'Atención', subtitulo: 'Enfoque Selectivo', icon: '🎯', ruta: '/ejercicios/atencion' },
  { id: 'log', titulo: 'Lógica', subtitulo: 'Razonamiento', icon: '🧩', ruta: '/ejercicios/logica' },
];

export default function UnifiedExercisesScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  const renderCard = (item: any, accentColor: string) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.softGray }]}
      onPress={() => router.push(item.ruta as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFF' }]}>
        <ThemedText style={styles.largeEmoji}>{item.icon}</ThemedText>
      </View>
      
      <View style={styles.cardContent}>
        <ThemedText style={[styles.cardTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
          {item.titulo}
        </ThemedText>
        <ThemedText style={styles.cardSub}>{item.subtitulo}</ThemedText>
      </View>

      <View style={[styles.footerLine, { backgroundColor: accentColor }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#121212' : IMSS_COLORS.white,
          // 2. Padding dinámico para Android
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }
      ]}
    >
      {/* 3. StatusBar transparente */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />
      
      {/* 4. Agregamos el botón de regreso */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.headerTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
            Evaluación Integral
          </ThemedText>
          <ThemedText style={styles.headerSub}>Módulos de diagnóstico y entrenamiento.</ThemedText>
        </View>

        {/* SECCIÓN SALUD MENTAL */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThemedText style={styles.sectionLabel}>Salud Mental</ThemedText>
            <View style={styles.dot} />
          </View>
          <View style={styles.grid}>
            {MENTAL_HEALTH.map(item => renderCard(item, IMSS_COLORS.gold))}
          </View>
        </View>

        {/* SECCIÓN COGNICIÓN */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThemedText style={styles.sectionLabel}>Cognición y Agilidad</ThemedText>
            <View style={styles.dot} />
          </View>
          <View style={styles.grid}>
            {COGNITION.map(item => renderCard(item, IMSS_COLORS.green))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 5. Agregamos estilos para el topBar y backButton
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { paddingVertical: 5, paddingRight: 15 },
  
  scrollContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 50 }, // Reduje un poco el paddingTop para equilibrar el botón nuevo
  header: { marginBottom: 35 },
  headerTitle: { fontSize: 30, fontWeight: '900' },
  headerSub: { fontSize: 15, color: IMSS_COLORS.gray, marginTop: 4 },
  
  section: { marginBottom: 30 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: IMSS_COLORS.gray, textTransform: 'uppercase', letterSpacing: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: IMSS_COLORS.gold },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    width: (width - 65) / 2, 
    borderRadius: 28, 
    marginBottom: 15,
    minHeight: 180,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  iconContainer: { 
    width: 65, 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  largeEmoji: { fontSize: 32 },
  cardContent: { marginTop: 15 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 4, fontWeight: '600' },
  footerLine: { 
    height: 4, 
    width: '40%', 
    borderRadius: 2, 
    marginTop: 15,
    opacity: 0.8
  }
});