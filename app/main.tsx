import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

// Menú actualizado: Eliminamos ejercicios para moverlos a la sección de Tests (Evaluaciones)
const MENU_ITEMS = [
  { 
    id: 'tests', 
    titulo: 'Bienestar', 
    subtitulo: 'Tests y Ejercicios', 
    icon: '📝', 
    ruta: '/tests' // Esta será tu nueva ventana principal de contenido
  },
  { 
    id: 'chatbot', 
    titulo: 'Asistente Virtual', 
    subtitulo: 'Chat de Apoyo', 
    icon: '💬', 
    ruta: '/chat' 
  },
  { 
    id: 'diario', 
    titulo: 'Seguimiento', 
    subtitulo: 'Mi Diario Personal', 
    icon: '📔', 
    ruta: '/diary' 
  },
] as const;

export default function MainScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [username, setUsername] = useState('Usuario');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const name = await AsyncStorage.getItem('username');
        if (name) {
          setUsername(name);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    cargarDatos();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Superior */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.welcomeText}>Bienvenido,</ThemedText>
            <ThemedText type="title" style={[styles.userName, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              {username}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
            style={[styles.profileBadge, { backgroundColor: IMSS_COLORS.gold }]}
          >
            <ThemedText style={styles.badgeText}>
              {username.charAt(0).toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Banner de Acción Rápida - Ahora enfocado a las Evaluaciones/Tests */}
        <TouchableOpacity 
          style={[styles.statusBanner, { backgroundColor: IMSS_COLORS.green }]}
          onPress={() => router.push('/tests')}
          activeOpacity={0.9}
        >
          <View style={styles.statusContent}>
            <ThemedText style={styles.statusTitle}>Módulo de Salud Mental</ThemedText>
            <ThemedText style={styles.statusSub}>Realiza tus tests y ejercicios pendientes aquí.</ThemedText>
          </View>
          <View style={styles.statusButton}>
            <ThemedText style={styles.statusButtonText}>ENTRAR</ThemedText>
          </View>
        </TouchableOpacity>

        <ThemedText style={styles.sectionTitle}>Panel Institucional</ThemedText>

        {/* Grid de Menú Actualizado */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.gridItem, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.white }]}
              onPress={() => router.push(item.ruta)}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F0F4F1' }]}>
                <ThemedText style={styles.iconText}>{item.icon}</ThemedText>
              </View>
              <ThemedText style={[styles.itemTitle, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
                {item.titulo}
              </ThemedText>
              <ThemedText style={styles.itemSub}>{item.subtitulo}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sección de Contactos Ayuda Directa */}
        <ThemedText style={[styles.sectionTitle, { marginTop: 15 }]}>Soporte</ThemedText>
        <TouchableOpacity 
          style={[styles.resourceCard, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.white }]}
          onPress={() => router.push('/resources')}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ color: IMSS_COLORS.green, fontWeight: '700', fontSize: 16 }}>📞 Contactos de Emergencia</ThemedText>
              <ThemedText style={styles.itemSub}>Líneas directas de apoyo institucional.</ThemedText>
            </View>
            <ThemedText style={{ color: IMSS_COLORS.gold, fontSize: 20 }}>→</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity 
          style={styles.logoutFullBtn}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>Cerrar Sesión Segura</ThemedText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={styles.versionText}>© 2026 IMSS Digital</ThemedText>
          <ThemedText style={styles.versionText}>Versión 1.1.0</ThemedText>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
    marginTop: 10 
  },
  welcomeText: { fontSize: 14, color: IMSS_COLORS.gray },
  userName: { fontSize: 24, fontWeight: '800' },
  profileBadge: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
  },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  statusBanner: { 
    padding: 20, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30,
    elevation: 4 
  },
  statusContent: { flex: 1 },
  statusTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  statusSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },
  statusButton: { 
    backgroundColor: IMSS_COLORS.gold, 
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20, 
    marginLeft: 10
  },
  statusButtonText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: IMSS_COLORS.gray, 
    textTransform: 'uppercase', 
    marginBottom: 15,
    letterSpacing: 1
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  gridItem: { 
    width: (width - 55) / 2, 
    padding: 16, 
    borderRadius: 15, 
    marginBottom: 15,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: IMSS_COLORS.gold
  },
  iconContainer: { 
    width: 42, 
    height: 42, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  iconText: { fontSize: 22 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 4, lineHeight: 15 },
  resourceCard: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutFullBtn: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 15 },
  footer: { marginTop: 30, alignItems: 'center', paddingBottom: 30 },
  versionText: { fontSize: 11, color: IMSS_COLORS.gray }
});