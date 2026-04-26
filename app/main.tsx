import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  white: '#FFFFFF',
  softGray: '#F9F9F9',
};

const MENU_ITEMS = [
  { id: 'tests', titulo: 'Evaluaciones', subtitulo: 'IA y Diagnóstico', icon: '📋', ruta: '/tests' },
  { id: 'chatbot', titulo: 'Asistente Virtual', subtitulo: 'Chat con Claude', icon: '💬', ruta: '/chat' },
  { id: 'diario', titulo: 'Seguimiento', subtitulo: 'Mi Diario Personal', icon: '📔', ruta: '/diary' },
  { id: 'recursos', titulo: 'Recursos', subtitulo: 'Directorio de Ayuda', icon: '📞', ruta: '/resources' },
] as const;

export default function MainScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [username, setUsername] = useState('Derechohabiente');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedName = await AsyncStorage.getItem('username');
        if (storedName) setUsername(storedName);
      } catch (e) {
        console.error("Error cargando el nombre", e);
      }
    };
    loadUser();
  }, []);

  const userInitial = username.charAt(0).toUpperCase();

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#121212' : IMSS_COLORS.white,
          // 2. Agregamos el padding dinámico solo para Android
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.topHeader}>
          <View>
            <ThemedText style={styles.welcomeLabel}>Bienvenido,</ThemedText>
            <ThemedText type="title" style={[styles.userName, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              {username}
            </ThemedText>
          </View>
          
          <Link href="/profile" asChild>
            <TouchableOpacity style={styles.profileCircle}>
              <ThemedText style={styles.initialText}>{userInitial}</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity 
          style={styles.heroBanner}
          onPress={() => router.push('/tests')}
          activeOpacity={0.8}
        >
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle}>¿Cómo te sientes hoy?</ThemedText>
            <ThemedText style={styles.heroSub}>Completa tu evaluación de bienestar asistida por IA.</ThemedText>
          </View>
          <View style={styles.heroAction}>
            <ThemedText style={styles.heroActionText}>→</ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Servicios Digitales</ThemedText>
          <View style={styles.goldLine} />
        </View>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.gridCard, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.softGray }]}
              onPress={() => {
                if (item.ruta) {
                  router.push(item.ruta as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#2A2A2A' : '#FFF' }]}>
                <ThemedText style={styles.iconEmoji}>{item.icon}</ThemedText>
              </View>
              <ThemedText style={[styles.cardTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
                {item.titulo}
              </ThemedText>
              <ThemedText style={styles.cardSub}>{item.subtitulo}</ThemedText>
              <View style={styles.cardFooter}>
                <ThemedText style={styles.cardLink}>Acceder</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>© 2026 IMSS Digital</ThemedText>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Se redujo ligeramente el paddingTop del ScrollView ya que ahora SafeAreaView nos separa correctamente
  scrollContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 40 }, 
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 35 
  },
  welcomeLabel: { fontSize: 16, color: IMSS_COLORS.gray, fontWeight: '500' },
  userName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  profileCircle: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5,
    backgroundColor: IMSS_COLORS.green,
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  initialText: { color: '#FFF', fontWeight: 'bold', fontSize: 22 },
  heroBanner: { 
    backgroundColor: IMSS_COLORS.green,
    padding: 24, 
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  heroContent: { flex: 1 },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 },
  heroAction: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    width: 44, height: 44, borderRadius: 15, 
    justifyContent: 'center', alignItems: 'center', marginLeft: 15
  },
  heroActionText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: IMSS_COLORS.gray, textTransform: 'uppercase' },
  goldLine: { height: 3, width: 30, backgroundColor: IMSS_COLORS.gold, marginTop: 6 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { 
    width: (width - 65) / 2, 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 15,
    minHeight: 180 
  },
  iconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 4, height: 32 },
  cardFooter: { marginTop: 12 },
  cardLink: { fontSize: 12, fontWeight: '800', color: IMSS_COLORS.gold },
  footer: { marginTop: 30, alignItems: 'center', opacity: 0.5 },
  footerText: { fontSize: 10, color: IMSS_COLORS.gray }
});