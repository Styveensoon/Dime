import { guardarDiario } from '@/app/utils/firebase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface DiaryEntry {
  id: string;
  fecha: string;
  titulo: string;
  contenido: string;
  emociones: string[];
}

export default function DiaryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'list' | 'write'>('list');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [emociones, setEmociones] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const emotions = ['Feliz', 'Triste', 'Ansioso', 'Relajado', 'Motivado', 'Confundido'];

  useEffect(() => {
    const cargarEntradas = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
          // Cargar entradas de Firebase
          const url = `https://firestore.googleapis.com/v1/projects/hack-441ef/databases/(default)/documents/usuarios/${id}/diario`;
          const res = await fetch(`${url}?key=AIzaSyBWg_520tyLRRQZCXCWYNkhS-FCEtmDusA`);
          if (res.ok) {
            const data = await res.json();
            if (data.documents) {
              const loadedEntries = data.documents.map((doc: any) => {
                const fields = doc.fields;
                return {
                  id: doc.name.split('/').pop(),
                  fecha: fields.fecha?.stringValue || 'Sin fecha',
                  titulo: fields.titulo?.stringValue || 'Sin título',
                  contenido: fields.contenido?.stringValue || '',
                  emociones: fields.emociones?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
                };
              });
              setEntries(loadedEntries.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
            }
          }
        }
      } catch (error) {
        console.error('Error cargando entradas:', error);
      }
    };
    cargarEntradas();
  }, []);

  const handleSaveEntry = async () => {
    if (!titulo || !contenido) {
      Alert.alert('Error', 'Por favor completa el título y el contenido');
      return;
    }

    setLoading(true);
    try {
      const entryId = `entrada_${Date.now()}`;
      const newEntry: DiaryEntry = {
        id: entryId,
        fecha: new Date().toISOString(),
        titulo,
        contenido,
        emociones: emociones.split(',').map(e => e.trim()).filter(e => e),
      };

      // Guardar en Firebase
      if (userId) {
        await guardarDiario(userId, newEntry);
      }

      setEntries([newEntry, ...entries]);
      setTitulo('');
      setContenido('');
      setEmociones('');
      setViewMode('list');
      Alert.alert('Éxito', 'Entrada guardada en tu diario');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la entrada');
    } finally {
      setLoading(false);
    }
  };

  if (viewMode === 'write') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.writeContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setViewMode('list')}>
                <ThemedText style={[styles.backText, { color: colors.tint }]}>
                  ← Atrás
                </ThemedText>
              </TouchableOpacity>
              <ThemedText type="title" style={styles.title}>
                Nueva Entrada
              </ThemedText>
            </View>

            <View style={styles.form}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Título
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.icon,
                    color: colors.text,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  },
                ]}
                placeholder="¿Sobre qué quieres escribir?"
                placeholderTextColor={colors.icon}
                value={titulo}
                onChangeText={setTitulo}
              />

              <ThemedText style={[styles.label, { color: colors.text }]}>
                Contenido
              </ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    borderColor: colors.icon,
                    color: colors.text,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  },
                ]}
                placeholder="Escribe tus pensamientos y sentimientos..."
                placeholderTextColor={colors.icon}
                value={contenido}
                onChangeText={setContenido}
                multiline
                numberOfLines={10}
              />

              <ThemedText style={[styles.label, { color: colors.text }]}>
                Emociones (separadas por comas)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.icon,
                    color: colors.text,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  },
                ]}
                placeholder="Ej: Feliz, Motivado"
                placeholderTextColor={colors.icon}
                value={emociones}
                onChangeText={setEmociones}
              />

              <View style={styles.emotionChips}>
                {emotions.map((emotion) => (
                  <TouchableOpacity
                    key={emotion}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: emociones.includes(emotion)
                          ? colors.tint
                          : colorScheme === 'dark'
                          ? '#2a2a2a'
                          : '#f0f0f0',
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={() => {
                      if (emociones.includes(emotion)) {
                        setEmociones(
                          emociones
                            .split(',')
                            .map(e => e.trim())
                            .filter(e => e !== emotion)
                            .join(', ')
                        );
                      } else {
                        setEmociones(emociones ? emociones + ', ' + emotion : emotion);
                      }
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        {
                          color: emociones.includes(emotion) ? '#fff' : colors.text,
                        },
                      ]}
                    >
                      {emotion}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.guardarBtn, { backgroundColor: colors.tint, opacity: loading ? 0.6 : 1 }]}
                onPress={handleSaveEntry}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.guardarText}>Guardar Entrada</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.listContainer}>
        <View style={styles.header}>
          <Link href="/main" asChild>
            <TouchableOpacity>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>
                ← Atrás
              </ThemedText>
            </TouchableOpacity>
          </Link>
          <ThemedText type="title" style={styles.title}>
            Mi Diario
          </ThemedText>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.tint }]}
            onPress={() => setViewMode('write')}
          >
            <ThemedText style={styles.newBtnText}>+ Nueva</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.entriesList}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                No hay entradas aún. ¡Crea tu primera entrada!
              </ThemedText>
            </View>
          ) : (
            entries.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                    borderColor: colors.icon,
                  },
                ]}
              >
                <View style={styles.entryHeader}>
                  <ThemedText type="subtitle" style={styles.entryTitulo}>
                    {entry.titulo}
                  </ThemedText>
                  <ThemedText style={[styles.entryFecha, { color: colors.icon }]}>
                    {entry.fecha}
                  </ThemedText>
                </View>

                <ThemedText
                  style={[styles.entryContenido, { color: colors.text }]}
                  numberOfLines={3}
                >
                  {entry.contenido}
                </ThemedText>

                {entry.emociones.length > 0 && (
                  <View style={styles.emotionsContainer}>
                    {entry.emociones.map((emotion) => (
                      <View
                        key={emotion}
                        style={[
                          styles.emotionBadge,
                          { backgroundColor: colors.tint },
                        ]}
                      >
                        <ThemedText style={styles.emotionBadgeText}>
                          {emotion}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  writeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  newBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  emotionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  guardarBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  guardarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  entriesList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  entryHeader: {
    gap: 4,
  },
  entryTitulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryFecha: {
    fontSize: 12,
  },
  entryContenido: {
    fontSize: 14,
    lineHeight: 20,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  emotionBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emotionBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});
