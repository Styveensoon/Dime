import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    StyleSheet, View, TouchableOpacity, TextInput, 
    ActivityIndicator, ScrollView, Image,
    SafeAreaView, Platform, StatusBar, 
    Alert 
} from "react-native";
import { Audio } from 'expo-av';
import { useRouter, Stack } from "expo-router"; 
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GROQ_KEY, FB_API_KEY, FB_BASE_URL, ANTHROPIC_KEY } from '../constants';

const IMAGENES_REGISTRO: Record<string, any> = {
    "Balón":   require('@/assets/images/testMMSE/Sec1/Balon.jpg'),
    "Bandera": require('@/assets/images/testMMSE/Sec1/Bandera.jpg'),
    "Árbol":   require('@/assets/images/testMMSE/Sec1/Arbol.jpg'),
    "Silla":   require('@/assets/images/testMMSE/Sec1/Silla.jpg'),
    "Llave":   require('@/assets/images/testMMSE/Sec1/Llave.jpg'),
    "Reloj":   require('@/assets/images/testMMSE/Sec1/Reloj.jpg'),
    "Libro":   require('@/assets/images/testMMSE/Sec1/Libro.jpg'),
    "Lápiz":   require('@/assets/images/testMMSE/Sec1/Lapiz.jpg'),
};

const IMAGENES_DENOMINACION: Record<string, any> = {
    "Lápiz":   require('@/assets/images/testMMSE/Sec2/Lapiz.jpg'),
    "Reloj":   require('@/assets/images/testMMSE/Sec2/Reloj.jpg'),
    "Celular": require('@/assets/images/testMMSE/Sec2/Celular.jpg'),
    "Lentes":  require('@/assets/images/testMMSE/Sec2/Lentes.jpg'),
    "Moneda":  require('@/assets/images/testMMSE/Sec2/Moneda.jpg'),
    "Taza":    require('@/assets/images/testMMSE/Sec2/Taza.jpg'),
};

const C = {
    bg: '#F0EDE8',
    surface: '#FFFFFF',
    accent: '#B38E5D',
    primary: '#1F4529',
    text: '#0D0D0F',
    textMuted: '#6B6860',
    border: '#2A2A2E',
    surfaceAlt: '#F8F4EF',
};

const NOMBRES_REGISTRO    = Object.keys(IMAGENES_REGISTRO);
const NOMBRES_DENOMINACION = Object.keys(IMAGENES_DENOMINACION);

// ─── ANTHROPIC HELPER ─────────────────────────────────────────────────────────
const generarPrediccionMMSE = async (
  respuestas: { [key: number]: string },
  itemsRegistro: string[],
  itemsDenominacion: string[],
): Promise<{ sintesis: string; prediccion: string }> => {
  const preguntas = [
    { id: 1, titulo: 'Orientación Temporal',  esperado: 'Fecha actual correcta' },
    { id: 2, titulo: 'Orientación Espacial',  esperado: 'Lugar donde se encuentra' },
    { id: 3, titulo: 'Registro de Palabras',  esperado: `Repetir: ${itemsRegistro.join(', ')}` },
    { id: 4, titulo: 'Atención y Cálculo',    esperado: 'Serie: 100-7-7-7... (93, 86, 79, 72, 65)' },
    { id: 5, titulo: 'Memoria Diferida',      esperado: `Recordar: ${itemsRegistro.join(', ')}` },
    { id: 6, titulo: 'Denominación',          esperado: `Nombrar: ${itemsDenominacion.join(', ')}` },
    { id: 7, titulo: 'Repetición',            esperado: '"Ni sí, ni no, ni pero"' },
  ];

  const detalle = preguntas
    .map(p => `  [${p.titulo}]\n    Respuesta: "${respuestas[p.id] ?? 'Sin respuesta'}"\n    Esperado: ${p.esperado}`)
    .join('\n');

  const prompt = `Eres un neuropsicólogo clínico experto en el Mini-Mental State Examination (MMSE). Analiza las respuestas verbales transcritas de un paciente y genera:

1. SÍNTESIS CLÍNICA (máx. 150 palabras): Evaluación orientada al médico sobre las capacidades cognitivas observadas. Comenta orientación temporo-espacial, memoria inmediata y diferida, atención, lenguaje y cualquier señal de deterioro cognitivo. Usa terminología clínica.

2. PREDICCIÓN (máx. 60 palabras): Con base únicamente en el patrón de respuestas, predice si el paciente muestra cognición normal, deterioro leve, moderado o severo, y qué áreas específicas están más comprometidas.

Respuestas transcritas del paciente:
${detalle}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni backticks:
{"sintesis": "...", "prediccion": "..."}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const texto = data.content?.map((b: any) => b.text || '').join('') ?? '';
  try {
    const clean = texto.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { sintesis: texto, prediccion: 'No disponible' };
  }
};

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined)  fields[key] = { nullValue: null };
    else if (typeof val === 'boolean')       fields[key] = { booleanValue: val };
    else if (typeof val === 'number')        fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'string')        fields[key] = { stringValue: val };
    else if (Array.isArray(val))             fields[key] = { arrayValue: { values: val.map(v => typeof v === 'string' ? { stringValue: v } : { doubleValue: Number(v) }) } };
    else if (typeof val === 'object')        fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
  }
  return fields;
};

const guardarEnColeccion = async (
  coleccion: string,
  docId: string,
  data: Record<string, any>,
  fbBaseUrl: string,
  fbApiKey: string,
): Promise<void> => {
  const url  = `${fbBaseUrl}/${coleccion}/${docId}?key=${fbApiKey}`;
  const body = { fields: toFirestoreFields(data) };
  const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.text(); throw new Error(`Firestore ${coleccion} ${res.status}: ${e}`); }
  console.log(`[Firebase/${coleccion}] guardado: ${docId}`);
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function TestMMSE() {
    const router = useRouter();
    const [paso, setPaso] = useState(0);
    const [grabando, setGrabando] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [respuestas, setRespuestas] = useState<{ [key: number]: string }>({});
    
    // UI/Flow States
    const [isFinished, setIsFinished] = useState(false);
    
    // User Data States
    const [userEmail, setUserEmail] = useState<string>('anonimo@app.com');
    const [userName,  setUserName]  = useState<string>('Anónimo');

    // Variables para objetos aleatorios
    const [itemsRegistro, setItemsRegistro] = useState<string[]>([]);
    const [itemsDenominacion, setItemsDenominacion] = useState<string[]>([]);

    const grabacionRef = useRef<Audio.Recording | null>(null);

    // Auth & User Name
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user?.email) setUserEmail(user.email);
            try {
                const n = await AsyncStorage.getItem('@Sime_userName');
                if (n) setUserName(n);
            } catch {}
        });
        return unsub;
    }, []);

    // Audio Prep & Random Items
    useEffect(() => {
        const prepararAudio = async () => {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        };
        prepararAudio();

        setItemsRegistro([...NOMBRES_REGISTRO].sort(() => 0.5 - Math.random()).slice(0, 3));
        setItemsDenominacion([...NOMBRES_DENOMINACION].sort(() => 0.5 - Math.random()).slice(0, 2));
    }, []);
    
    const preguntas = [
        { id: 1, title: "Orientación Temporal", text: "¿En qué fecha estamos?", tipo: "voz" },
        { id: 2, title: "Orientación Espacial", text: "¿Dónde se encuentra usted ahora?", tipo: "voz" },
        { id: 3, title: "Registro", text: `Repita estas palabras: ${itemsRegistro.join(", ")}`, tipo: "voz" },
        { id: 4, title: "Atención y Cálculo", text: "Reste de 7 en 7 desde 100. ¿Cuál es el resultado?", tipo: "input" },
        { id: 5, title: "Memoria Diferida", text: "¿Recuerda las 3 palabras que le pedí repetir hace un momento?", tipo: "voz" },
        { id: 6, title: "Denominación", text: "¿Qué objetos son estos?", tipo: "voz" },
        { id: 7, title: "Repetición", text: "Repita la frase: 'Ni sí, ni no, ni pero'", tipo: "voz" },
    ];

    const currentQ = preguntas[paso];

    const iniciarGrabacion = async () => {
        try {
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            grabacionRef.current = recording;
            setGrabando(true);
        } catch (e) { console.error("Error al grabar", e); }
    };

    const detenerGrabacion = async () => {
        if (!grabacionRef.current) return;
        setGrabando(false);
        setProcesando(true);
        try {
            await grabacionRef.current.stopAndUnloadAsync();
            const uri = grabacionRef.current.getURI();
            if (uri) {
                const texto = await transcribirAudio(uri);
                guardarRespuesta(currentQ.id, texto);
            }
        } catch (e) { console.error(e); }
        finally { setProcesando(false); }
    };

    const transcribirAudio = async (uri: string) => {
        const fd = new FormData();
        fd.append('file', { uri, type: 'audio/m4a', name: 'audio.m4a' } as any);
        fd.append('model', 'whisper-large-v3-turbo');
        fd.append('language', 'es');
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${GROQ_KEY}` },
            body: fd,
        });
        const data = await res.json();
        return data.text || "";
    };

    const guardarRespuesta = (id: number, valor: string) => {
        setRespuestas(prev => ({ ...prev, [id]: valor }));
    };

    const siguiente = () => {
        // Validación de respuesta vacía
        const respuestaActual = respuestas[currentQ.id];
        if (!respuestaActual || respuestaActual.trim() === "") {
            Alert.alert(
                "Atención",
                "Por favor, responde la pregunta actual para poder avanzar."
            );
            return; 
        }

        if (paso < preguntas.length - 1) setPaso(paso + 1);
        else finalizar();
    };

    const finalizar = async () => {
        setGuardando(true);
        try {
            // 1. Generar síntesis y predicción con IA
            const { sintesis, prediccion } = await generarPrediccionMMSE(
                respuestas,
                itemsRegistro,
                itemsDenominacion,
            );

            // 2. Guardar en Firestore incluyendo IA
            const docId = `${userEmail}_mmse_${Date.now()}`.replace(/[^a-zA-Z0-9_@.-]/g, '_');
            await guardarEnColeccion('testmmse', docId, {
                email:             userEmail,
                userName,
                timestamp:         new Date().toISOString(),
                respuestas,
                itemsRegistro,
                itemsDenominacion,
                ia_sintesis:       sintesis,
                ia_prediccion:     prediccion,
            }, FB_BASE_URL, FB_API_KEY);

        } catch (e) {
            console.warn('[testmmse] Error:', e);
        } finally {
            setGuardando(false);
            // 3. Mostramos la pantalla de finalización en lugar de salir de golpe
            setIsFinished(true);
        }
    };

    return (
        <SafeAreaView 
            style={[
                s.container,
                { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            
            <Stack.Screen options={{ headerShown: false }} />

            {!isFinished && (
                <View style={s.topBar}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <ThemedText style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
            >
                {isFinished ? (
                    <View style={s.completionContainer}>
                        <ThemedText type="title" style={s.completionTitle}>
                            ¡Evaluación Completada!
                        </ThemedText>
                        
                        <View style={s.completionCard}>
                            <ThemedText style={s.completionText}>
                                Culminaste las pruebas. La experiencia se ajustará en base a tus resultados y los mismos se anexarán a tu expediente médico.
                            </ThemedText>
                        </View>

                        <TouchableOpacity 
                            style={s.acceptBtn} 
                            onPress={() => router.replace('/main')}
                        >
                            <ThemedText style={s.acceptBtnTxt}>Aceptar</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <ThemedView style={s.header}>
                            <ThemedText type="title" style={{ color: C.accent }}>Test Deterioro Cognitivo</ThemedText>
                            <ThemedText style={s.progreso}>Pregunta {paso + 1} de {preguntas.length}</ThemedText>
                        </ThemedView>

                        <View style={s.card}>
                            <ThemedText style={s.qTitle}>{currentQ.title}</ThemedText>
                            <ThemedText style={s.qText}>{currentQ.text}</ThemedText>

                            {currentQ.id === 3 && (
                                <View style={s.imageGrid}>
                                    {itemsRegistro.map((nombre, index) => (
                                        <View key={index} style={s.imageContainer}>
                                            <Image source={IMAGENES_REGISTRO[nombre]} style={s.testImage} />
                                            <ThemedText style={s.imageLabel}>{nombre}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {currentQ.id === 6 && (
                                <View style={s.imageGrid}>
                                    {itemsDenominacion.map((nombre, index) => (
                                        <View key={index} style={s.imageContainer}>
                                            <Image source={IMAGENES_DENOMINACION[nombre]} style={s.testImage} />
                                        </View>
                                    ))}
                                </View>
                            )}

                            {currentQ.tipo === "voz" ? (
                                <View style={s.vozContainer}>
                                    {procesando ? (
                                        <ActivityIndicator color={C.accent} size="large" />
                                    ) : (
                                        <>
                                            <View style={s.micWrapper}>
                                                {grabando && <View style={s.pulseRing} />}
                                                
                                                <TouchableOpacity 
                                                    style={[s.micBtn, grabando && s.micBtnActive]} 
                                                    onPressIn={iniciarGrabacion}
                                                    onPressOut={detenerGrabacion}
                                                    activeOpacity={0.7}
                                                >
                                                    <ThemedText style={s.micIco}>
                                                        {grabando ? "●" : "🎙️"}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            </View>

                                            <ThemedText style={s.vozHint}>
                                                {grabando ? "Escuchando..." : "Mantén para grabar respuesta"}
                                            </ThemedText>

                                            {respuestas[currentQ.id] && (
                                                <View style={s.resultBox}>
                                                    <ThemedText style={s.resultLabel}>Voz: {'"'}{respuestas[currentQ.id]}{'"'}</ThemedText>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            ) : (

                                <TextInput
                                    style={s.input}
                                    placeholder="Resultado numérico..."
                                    placeholderTextColor={C.textMuted}
                                    keyboardType="numeric"
                                    value={respuestas[currentQ.id] || ""}
                                    onChangeText={(t) => guardarRespuesta(currentQ.id, t)}
                                />
                            )}
                        </View>

                        <TouchableOpacity 
                            style={[s.nextBtn, guardando && { opacity: 0.6 }]} 
                            onPress={siguiente}
                            disabled={guardando}
                        >
                            <ThemedText style={s.nextBtnTxt}>
                                {guardando
                                    ? 'Analizando respuestas...'
                                    : paso === preguntas.length - 1 
                                        ? "Finalizar Registro" 
                                        : "Siguiente Pregunta"}
                            </ThemedText>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: C.bg, 
    },
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { 
        paddingVertical: 5, 
        paddingRight: 15 
    },
    header: {
        marginBottom: 40, 
        alignItems: 'center', 
        backgroundColor: 'transparent' 
    },
    progreso: {
        color: C.textMuted, 
        marginTop: 5 
    },
    card: {
        backgroundColor: C.surface, 
        padding: 25, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: C.border, 
        minHeight: 300, 
        justifyContent: 'center' 
    },
    qTitle: {
        color: C.accent, 
        fontSize: 14, 
        letterSpacing: 2, 
        marginBottom: 10, 
        textAlign: 'center', 
        fontWeight: 'bold' 
    },
    qText: {
        color: C.text, 
        fontSize: 22, 
        textAlign: 'center', 
        marginBottom: 30 
    },
    input: {
        backgroundColor: C.bg, 
        color: C.text, 
        borderRadius: 12, 
        padding: 15, 
        fontSize: 20, 
        textAlign: 'center', 
        borderWidth: 1, 
        borderColor: C.border 
    },
    vozContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    micWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 120,
        height: 120,
    },
    micBtn: {
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: C.primary,
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 2, 
        borderColor: C.accent,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    micBtnActive: {
        backgroundColor: '#E05A5A',
        borderColor: '#FFD700',
        transform: [{ scale: 1.1 }],
    },
    micIco: {
        fontSize: 32,
        color: 'white', 
    },
    vozHint: {
        color: C.textMuted,
        fontSize: 12,
        marginTop: 15,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: C.accent,
        opacity: 0.5,
    },
    resultBox: {
        marginTop: 20, 
        padding: 10, 
        borderLeftWidth: 3, 
        borderLeftColor: C.accent, 
        width: '100%' 
    },
    resultLabel: {
        color: C.textMuted, 
        fontStyle: 'italic', 
        fontSize: 14 
    },
    nextBtn: {
        marginTop: 30, 
        backgroundColor: C.accent, 
        padding: 20, 
        borderRadius: 15, 
        alignItems: 'center' 
    },
    nextBtnTxt: { 
        color: C.bg, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginVertical: 20,
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: C.surfaceAlt,
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: C.border,
    },
    testImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        resizeMode: 'contain',
    },
    imageLabel: {
        marginTop: 8,
        fontSize: 12,
        color: C.accent,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40, 
    },
    completionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    completionTitle: {
        color: C.primary,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    completionCard: {
        backgroundColor: C.surface,
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 40,
        width: '100%',
    },
    completionText: {
        color: C.text,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
    },
    acceptBtn: {
        backgroundColor: C.primary,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        width: '100%',
    },
    acceptBtnTxt: {
        color: C.surface,
        fontWeight: 'bold',
        fontSize: 18,
    }
});