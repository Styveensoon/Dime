import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Dimensions,
  StatusBar
} from 'react-native';

const { width } = Dimensions.get('window');

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

// Definición de los servicios del menú
const MENU_ITEMS = [
  { 
    id: 'tests', 
    titulo: 'Evaluaciones', 
    subtitulo: 'IA y Diagnóstico', 
    icon: '📋', 
    ruta: '/tests' 
  },
  { 
    id: 'chatbot', 
    titulo: 'Asistente Virtual', 
    subtitulo: 'Chat con Claude', 
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
  { 
    id: 'recursos', 
    titulo: 'Recursos', 
    subtitulo: 'Directorio de Ayuda', 
    icon: '📞', 
    ruta: '/resources' 
  },
] as const;

export default function MainScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Superior: Saludo y Perfil */}
        <View style={styles.topHeader}>
          <View>
            <ThemedText style={styles.welcomeText}>Bienvenido,</ThemedText>
            <ThemedText type="title" style={[styles.userName, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              Derechohabiente
            </ThemedText>
          </View>
          
          <Link href="/profile" asChild>
            <TouchableOpacity style={styles.profileBadge}>
              <ThemedText style={styles.badgeText}>DH</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Banner de Acción Rápida (Invitación a Test) */}
        <TouchableOpacity 
          style={[styles.statusBanner, { backgroundColor: IMSS_COLORS.green }]}
          onPress={() => router.push('/tests')}
          activeOpacity={0.9}
        >
          <View style={styles.statusContent}>
            <ThemedText style={styles.statusTitle}>¿Cómo te sientes hoy?</ThemedText>
            <ThemedText style={styles.statusSub}>Realiza una evaluación rápida analizada por nuestra IA.</ThemedText>
          </View>
          <View style={styles.statusButton}>
            <ThemedText style={styles.statusButtonText}>IR</ThemedText>
          </View>
        </TouchableOpacity>

        <ThemedText style={styles.sectionTitle}>Servicios Disponibles</ThemedText>

        {/* Grid de Menú (AQUÍ ESTÁN TUS BOTONES DE VUELTA) */}
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
              
              <View style={styles.itemArrow}>
                <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: '900' }}>→</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Institucional */}
        <View style={styles.footer}>
          <ThemedText style={styles.versionText}>© 2026 IMSS Digital</ThemedText>
          <ThemedText style={styles.versionText}>Seguridad Social para todos</ThemedText>
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
  welcomeText: { fontSize: 16, color: IMSS_COLORS.gray },
  userName: { fontSize: 24, fontWeight: '800' },
  profileBadge: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: IMSS_COLORS.gold, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  badgeText: { color: '#FFF', fontWeight: 'bold' },
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
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 10
  },
  statusButtonText: { color: '#FFF', fontWeight: '900' },
  sectionTitle: { 
    fontSize: 14, 
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
    width: 45, 
    height: 45, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  iconText: { fontSize: 24 },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemSub: { fontSize: 11, color: IMSS_COLORS.gray, marginTop: 4 },
  itemArrow: { marginTop: 10, alignSelf: 'flex-end' },
  footer: { marginTop: 20, alignItems: 'center', paddingBottom: 30 },
  versionText: { fontSize: 11, color: IMSS_COLORS.gray }
});