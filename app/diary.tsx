import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, 
  ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Dimensions,
  StatusBar // <-- 1. Importamos StatusBar
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// --- PALETA OFICIAL IMSS MODERNIZADA ---
const IMSS_COLORS = {
  green: '#1F4529',     // Verde IMSS
  gold: '#B38E5D',      // Dorado Institucional
  lightBg: '#F4F7F5',   // Gris muy claro (clínico)
  white: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#8E8E93',
  danger: '#D32F2F'
};

const MOODS = [
  { label: 'Crítico', icon: '😫', color: '#D32F2F', val: 1 },
  { label: 'Bajo', icon: '😔', color: '#F57C00', val: 2 },
  { label: 'Estable', icon: '😐', color: '#1F4529', val: 3 },
  { label: 'Óptimo', icon: '😄', color: '#2E7D32', val: 4 }
];

interface DiaryEntry {
  id: string;
  fecha: string;
  valor_animo: number;
  texto_diario: string;
}

export default function DiaryScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'write'>('list');
  const [mood, setMood] = useState<number | null>(null);
  const [nota, setNota] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0); // Funcionalidad de Racha

  useEffect(() => { 
    cargarEntradas(); 
  }, []);

  const cargarEntradas = async () => {
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/hack-441ef/databases/(default)/documents/usuarios/${id}/diario?key=AIzaSyBWg_520tyLRRQZCXCWYNkhS-FCEtmDusA`);
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          const loaded: DiaryEntry[] = data.documents.map((doc: any) => ({
            id: doc.name.split('/').pop(),
            fecha: doc.fields.fecha?.stringValue || '',
            valor_animo: parseInt(doc.fields.valor_animo?.integerValue || '0'),
            texto_diario: doc.fields.texto_diario?.stringValue || '',
          }));
          const sorted = loaded.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          setEntries(sorted);
          setStreak(sorted.length); // Ejemplo simple de racha por cantidad
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveEntry = async () => {
    if (!mood || nota.length < 5) return Alert.alert("Atención", "Complete su reporte de estado.");
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem('userId');
      const entryId = `entry_${Date.now()}`;
      const payload = {
        fields: {
          fecha: { stringValue: new Date().toISOString() },
          valor_animo: { integerValue: String(mood) },
          texto_diario: { stringValue: nota },
        }
      };

      await fetch(`https://firestore.googleapis.com/v1/projects/hack-441ef/databases/(default)/documents/usuarios/${id}/diario/${entryId}?key=AIzaSyBWg_520tyLRRQZCXCWYNkhS-FCEtmDusA`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      setNota(''); setMood(null); setViewMode('list'); cargarEntradas();
    } catch (e) { Alert.alert("Error", "Sincronización fallida"); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView 
      style={[
        styles.root,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
        </TouchableOpacity>
        
        <View style={styles.streakBadge}>
          <ThemedText style={styles.streakTxt}>🔥 {streak} días</ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {viewMode === 'list' ? (
          <>
            <ThemedText style={styles.mainTitle}>Mi Diario <ThemedText style={{color: IMSS_COLORS.gold}}>Salud</ThemedText></ThemedText>
            <ThemedText style={styles.subTitle}>Seguimiento de adherencia emocional</ThemedText>

            <TouchableOpacity style={styles.mainActionBtn} onPress={() => setViewMode('write')}>
              <ThemedText style={styles.mainActionBtnTxt}>+ REGISTRAR ESTADO HOY</ThemedText>
            </TouchableOpacity>

            <View style={styles.historySection}>
              <ThemedText style={styles.historyTitle}>Historial Reciente</ThemedText>
              {loading ? <ActivityIndicator color={IMSS_COLORS.green} /> : 
                entries.map(item => (
                  <View key={item.id} style={styles.logCard}>
                    <View style={[styles.moodIndicator, { backgroundColor: MOODS.find(m=>m.val===item.valor_animo)?.color || IMSS_COLORS.green }]} />
                    <View style={styles.logInfo}>
                      <ThemedText style={styles.logDate}>{new Date(item.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}</ThemedText>
                      <ThemedText style={styles.logText} numberOfLines={1}>{item.texto_diario}</ThemedText>
                    </View>
                    <ThemedText style={styles.logEmoji}>{MOODS.find(m=>m.val===item.valor_animo)?.icon}</ThemedText>
                  </View>
                ))
              }
            </View>
          </>
        ) : (
          <KeyboardAvoidingView behavior="padding">
            <ThemedText style={styles.mainTitle}>Nueva Entrada</ThemedText>
            <ThemedText style={styles.subTitle}>¿Cómo se siente en este momento?</ThemedText>

            <View style={styles.moodSelector}>
              {MOODS.map(m => (
                <TouchableOpacity 
                  key={m.val} 
                  onPress={() => setMood(m.val)} 
                  style={[styles.moodCircle, mood === m.val && { borderColor: m.color, backgroundColor: m.color + '10', borderWidth: 2 }]}
                >
                  <ThemedText style={{ fontSize: 28, lineHeight: 34, includeFontPadding: false }}>
                    {m.icon}
                  </ThemedText>
                  <ThemedText style={[styles.moodLbl, mood === m.val && { color: m.color, fontWeight: '700' }]}>{m.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputBox}>
              <ThemedText style={styles.inputLabel}>NOTAS DEL PACIENTE</ThemedText>
              <TextInput 
                style={styles.textInput} 
                placeholder="Describa síntomas o pensamientos..." 
                multiline 
                value={nota} 
                onChangeText={setNota}
              />
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveEntry}>
              <ThemedText style={styles.confirmBtnTxt}>SINCRONIZAR CON MI EXPEDIENTE</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setViewMode('list')} style={{marginTop: 20, alignItems: 'center'}}>
              <ThemedText style={{color: IMSS_COLORS.danger, fontWeight: '600'}}>Cancelar registro</ThemedText>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IMSS_COLORS.lightBg },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: IMSS_COLORS.white 
  },
  backButton: { paddingVertical: 5, paddingRight: 15 },
  
  streakBadge: { backgroundColor: IMSS_COLORS.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakTxt: { color: IMSS_COLORS.white, fontSize: 12, fontWeight: 'bold' },
  
  scrollContent: { padding: 25 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: IMSS_COLORS.green },
  subTitle: { fontSize: 15, color: IMSS_COLORS.muted, marginBottom: 30, marginTop: 5 },

  mainActionBtn: { backgroundColor: IMSS_COLORS.green, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 4 },
  mainActionBtnTxt: { color: IMSS_COLORS.white, fontWeight: 'bold', letterSpacing: 1 },

  historySection: { marginTop: 40 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: IMSS_COLORS.green, marginBottom: 20 },
  logCard: { backgroundColor: IMSS_COLORS.white, marginBottom: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 15, elevation: 1 },
  moodIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 15 },
  logInfo: { flex: 1 },
  logDate: { fontSize: 12, color: IMSS_COLORS.muted, textTransform: 'capitalize' },
  logText: { fontSize: 15, fontWeight: '500', color: IMSS_COLORS.text, marginTop: 2 },
  logEmoji: { fontSize: 22 },

  moodSelector: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 30 },
  moodCircle: { width: width * 0.2, alignItems: 'center', padding: 10, borderRadius: 15, backgroundColor: IMSS_COLORS.white},
  moodLbl: { fontSize: 10, marginTop: 15, color: IMSS_COLORS.muted },

  inputBox: { backgroundColor: IMSS_COLORS.white, padding: 20, borderRadius: 15 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: IMSS_COLORS.gold, marginBottom: 10 },
  textInput: { fontSize: 16, color: IMSS_COLORS.text, minHeight: 120, textAlignVertical: 'top' },

  confirmBtn: { backgroundColor: IMSS_COLORS.green, marginTop: 30, padding: 20, borderRadius: 15, alignItems: 'center' },
  confirmBtnTxt: { color: IMSS_COLORS.white, fontWeight: '900', fontSize: 13 }
});