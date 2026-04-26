import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Dimensions,
  ActivityIndicator
} from 'react-native';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  lightGreen: '#2E5A35',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

const MENU_ITEMS = [
  { id: 'tests', titulo: 'Evaluaciones', subtitulo: 'Tests y Diagnóstico', icon: '📋', ruta: '/tests' },
  { id: 'chatbot', titulo: 'Asistente Virtual', subtitulo: 'Chat de Apoyo', icon: '💬', ruta: '/chat' },
  { id: 'diario', titulo: 'Seguimiento', subtitulo: 'Mi Diario Personal', icon: '📔', ruta: '/diary' },
  { id: 'recursos', titulo: 'Recursos', subtitulo: 'Material de Apoyo', icon: '📚', ruta: '/login' },
] as const;

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // --- LÓGICA FUNCIONAL ---
  const [evaluacionCompletada, setEvaluacionCompletada] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const handleStartEvaluation = () => {
    if (evaluacionCompletada) {
      Alert.alert(
        "Evaluación completada",
        "Ya has registrado tu estado de ánimo esta semana. ¿Deseas ver tus estadísticas?",
        [
          { text: "Cerrar", style: "cancel" },
          { text: "Ver Historial", onPress: () => router.push('/tests') }
        ]
      );
      return;
    }

    Alert.alert(
      "Evaluación Semanal",
      "Esta evaluación toma 2 minutos y nos ayuda a medir tu progreso emocional. ¿Comenzar ahora?",
      [
        { text: "Después", style: "cancel" },
        { 
          text: "Iniciar", 
          onPress: () => {
            setProcesando(true);
            // Simulamos una carga o transición al test
            setTimeout(() => {
              setProcesando(false);
              router.push({
                pathname: '/tests',
                params: { mode: 'weekly' }
              });
            }, 1000);
          } 
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Desea finalizar su sesión actual de forma segura?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: () => router.replace('/login') },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header con Perfil */}
        <View style={styles.topHeader}>
          <View>
            <ThemedText style={styles.welcomeText}>Buen día,</ThemedText>
            <ThemedText type="title" style={[styles.userName, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              Derechohabiente
            </ThemedText>
          </View>
          <View style={styles.profileBadge}>
            <ThemedText style={styles.badgeText}>DH</ThemedText>
          </View>
        </View>

        {/* BANNER DINÁMICO FUNCIONAL */}
        <View style={[
          styles.statusBanner, 
          { backgroundColor: evaluacionCompletada ? IMSS_COLORS.lightGreen : IMSS_COLORS.green }
        ]}>
          <View style={styles.statusContent}>
            <ThemedText style={styles.statusTitle}>
              {evaluacionCompletada ? "✅ Salud al día" : "Bienestar Emocional"}
            </ThemedText>
            <ThemedText style={styles.statusSub}>
              {evaluacionCompletada 
                ? "Has completado tus tareas de esta semana. ¡Sigue así!" 
                : "Realiza tu evaluación de seguimiento para generar tu reporte."}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.statusButton, 
              { backgroundColor: evaluacionCompletada ? 'transparent' : IMSS_COLORS.gold,
                borderWidth: evaluacionCompletada ? 1 : 0,
                borderColor: '#FFF'
              }
            ]}
            onPress={handleStartEvaluation}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <ThemedText style={styles.statusButtonText}>
                {evaluacionCompletada ? "REVISAR" : "INICIAR"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.sectionTitle}>Servicios Disponibles</ThemedText>

        {/* Grid de Menú */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <Link key={item.id} href={item.ruta} asChild>
              <TouchableOpacity 
                style={[
                  styles.gridItem, 
                  { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.white }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F0F4F1' }]}>
                  <ThemedText style={styles.iconText}>{item.icon}</ThemedText>
                </View>
                <ThemedText style={[styles.itemTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
                  {item.titulo}
                </ThemedText>
                <ThemedText style={styles.itemSub}>{item.subtitulo}</ThemedText>
                <View style={styles.itemArrow}>
                  <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: '900' }}>→</ThemedText>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* Footer Informativo */}
        <View style={styles.footerSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <ThemedText style={[styles.logoutText, { color: IMSS_COLORS.green }]}>
              Cerrar Sesión Segura
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.versionText}>
            © 2026 Instituto Mexicano del Seguro Social
          </ThemedText>
          <ThemedText style={styles.versionText}>Versión 1.0.0 - Dime v2</ThemedText>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  welcomeText: { fontSize: 16, color: IMSS_COLORS.gray },
  userName: { fontSize: 26, fontWeight: '800' },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IMSS_COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  statusBanner: {
    padding: 22,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    elevation: 5,
  },
  statusContent: { flex: 1, marginRight: 10 },
  statusTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  statusSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  statusButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: IMSS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: (width - 55) / 2, 
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: IMSS_COLORS.gold,
  },
  iconContainer: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconText: { fontSize: 22 },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemSub: { fontSize: 12, color: IMSS_COLORS.gray, marginTop: 4, lineHeight: 16 },
  itemArrow: { marginTop: 10, alignSelf: 'flex-end' },
  footerSection: { marginTop: 30, paddingBottom: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 25 },
  logoutBtn: { marginBottom: 15 },
  logoutText: { fontWeight: '700', fontSize: 15, textDecorationLine: 'underline' },
  versionText: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 4, textAlign: 'center' },
});