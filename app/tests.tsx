import React, { useState } from 'react';
import { 
  ScrollView, StyleSheet, TouchableOpacity, 
  View, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
// Versión moderna para evitar el Warning de Deprecated
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Constants from 'expo-constants';

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
  accent: '#E8F5E1',
  emergency: '#B71C1C'
};

const EVALUACIONES = [
  { id: '1', titulo: 'Salud Mental General', icon: '🧠', prompt: 'síntomas generales de estrés' },
  { id: '2', titulo: 'Detección de Depresión', icon: '🍃', prompt: 'síntomas depresivos (PHQ-9)' },
  { id: '3', titulo: 'Nivel de Ansiedad', icon: '🌊', prompt: 'ansiedad e inquietud' },
  { id: '4', titulo: 'Estrés Laboral', icon: '💼', prompt: 'burnout profesional' },
  { id: '5', titulo: 'Consumo de Sustancias', icon: '⚠️', prompt: 'riesgos de alcohol o tabaco' }
];

export default function TestsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // --- FUNCIÓN DE LLAMADA A CLAUDE CORREGIDA ---
  const analizarConIA = async (testTitulo: string, contexto: string) => {
    // Intenta obtener la clave de tu configuración de Expo
    const apiKey = Constants.expoConfig?.extra?.CLAUDE_APY_KEY || "TU_KEY_AQUI";

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          // USAMOS EL MODELO ACTUALIZADO PARA EVITAR EL NOT_FOUND_ERROR
          model: 'claude-3-5-haiku-latest', 
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `Eres un asistente médico del IMSS. El usuario terminó un test de ${testTitulo} (${contexto}). Da una recomendación médica muy breve (máximo 3 líneas), empática y profesional en español.`
            }
          ],
        }),
      });

      const data = await response.json();

      // Si la API responde pero con error (como el de modelo no encontrado)
      if (!response.ok) {
        console.error("Error detallado de Claude:", data);
        return `Aviso: ${data.error?.message || 'Servicio temporalmente fuera de línea'}`;
      }

      // Verificación de seguridad para evitar "Cannot convert undefined value to object"
      if (data && data.content && data.content.length > 0) {
        return data.content[0].text;
      } else {
        return "El análisis está listo, pero no se pudo generar el texto. Por favor consulte a su médico.";
      }

    } catch (error) {
      console.error("Error de conexión:", error);
      return "Hubo un problema de red. Por favor, revisa tu conexión a internet e intenta de nuevo.";
    }
  };

  const handleStartTest = async (test: typeof EVALUACIONES[0]) => {
    setLoadingId(test.id);
    const recomendacionIA = await analizarConIA(test.titulo, test.prompt);
    setLoadingId(null);

    Alert.alert(
      test.titulo,
      recomendacionIA,
      [
        { text: "Cerrar", style: "cancel" },
        { 
          text: "VER RECURSOS", 
          onPress: () => router.push('/resources'),
          style: "default" 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold' }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>Evaluación IA</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <ThemedText style={styles.bannerText}>
            Selecciona un área para recibir orientación profesional procesada por Claude 3.5.
          </ThemedText>
        </View>

        {EVALUACIONES.map((test) => (
          <TouchableOpacity 
            key={test.id} 
            style={[styles.testCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => handleStartTest(test)}
            disabled={loadingId !== null}
            activeOpacity={0.7}
          >
            <View style={styles.testIconContainer}>
              <ThemedText style={styles.testIcon}>{test.icon}</ThemedText>
            </View>
            <View style={styles.testInfo}>
              <ThemedText style={[styles.testTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
                {test.titulo}
              </ThemedText>
              <ThemedText style={styles.testMeta}>Protocolo Institucional</ThemedText>
            </View>
            <View style={styles.actionContainer}>
              {loadingId === test.id ? (
                <ActivityIndicator color={IMSS_COLORS.gold} />
              ) : (
                <ThemedText style={styles.startBtn}>ANALIZAR</ThemedText>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={styles.emergencyBtn}
          onPress={() => router.push('/resources')}
        >
          <ThemedText style={styles.emergencyBtnText}>☎️ Ayuda Inmediata</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { marginRight: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  infoBanner: { padding: 12, backgroundColor: IMSS_COLORS.accent, borderRadius: 8, marginBottom: 20 },
  bannerText: { fontSize: 12, color: IMSS_COLORS.green, textAlign: 'center', fontWeight: '600' },
  testCard: { flexDirection: 'row', padding: 18, borderRadius: 12, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center' },
  testIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F4F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  testIcon: { fontSize: 22 },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 15, fontWeight: '700' },
  testMeta: { fontSize: 11, color: IMSS_COLORS.gold, marginTop: 2, fontWeight: 'bold' },
  actionContainer: { marginLeft: 10 },
  startBtn: { fontSize: 12, fontWeight: '900', color: IMSS_COLORS.gold },
  emergencyBtn: { marginTop: 10, padding: 15, borderRadius: 10, backgroundColor: IMSS_COLORS.emergency, alignItems: 'center' },
  emergencyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});