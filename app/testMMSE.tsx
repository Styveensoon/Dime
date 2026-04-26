import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    StyleSheet, View, TouchableOpacity, TextInput, 
    ActivityIndicator, Animated, ScrollView, Image 
} from "react-native";
import { Audio } from 'expo-av';
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GROQ_KEY, FB_API_KEY, FB_BASE_URL } from '../constants';

const IMAGENES_REGISTRO = {
    "Balón": require ('@/assets/images/testMMSE/Sec1/Balon.jpg'),
    "Bandera": require ('@/assets/images/testMMSE/Sec1/Bandera.jpg'),
    "Árbol": require ('@/assets/images/testMMSE/Sec1/Arbol.jpg'),
    "Silla": require ('@/assets/images/testMMSE/Sec1/Silla.jpg'),
    "Llave": require ('@/assets/images/testMMSE/Sec1/Llave.jpg'),
    "Reloj": require ('@/assets/images/testMMSE/Sec1/Reloj.jpg'),
    "Libro": require ('@/assets/images/testMMSE/Sec1/Libro.jpg'),
    "Lápiz": require ('@/assets/images/testMMSE/Sec1/Lapiz.jpg'),
}

const IMAGENES_DENOMINACION = {
    "Lápiz": require ('@/assets/images/testMMSE/Sec2/Lapiz.jpg'),
    "Reloj": require ('@/assets/images/testMMSE/Sec2/Reloj.jpg'),
    "Celular": require ('@/assets/images/testMMSE/Sec2/Celular.jpg'),
    "Lentes": require ('@/assets/images/testMMSE/Sec2/Lentes.jpg'),
    "Moneda": require ('@/assets/images/testMMSE/Sec2/Moneda.jpg'),
    "Taza": require ('@/assets/images/testMMSE/Sec2/Taza.jpg'),
}

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

const NOMBRES_REGISTRO = Object.keys(IMAGENES_REGISTRO)
const NOMBRES_DENOMINACION = Object.keys(IMAGENES_DENOMINACION);


// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined)  fields[key] = { nullValue: null }
    else if (typeof val === 'boolean')       fields[key] = { booleanValue: val }
    else if (typeof val === 'number')        fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val }
    else if (typeof val === 'string')        fields[key] = { stringValue: val }
    else if (Array.isArray(val))             fields[key] = { arrayValue: { values: val.map(v => typeof v === 'string' ? { stringValue: v } : { doubleValue: Number(v) }) } }
    else if (typeof val === 'object')        fields[key] = { mapValue: { fields: toFirestoreFields(val) } }
  }
  return fields
}

const guardarEnColeccion = async (
  coleccion: string,
  docId: string,
  data: Record<string, any>,
  fbBaseUrl: string,
  fbApiKey: string,
): Promise<void> => {
  const url  = `${fbBaseUrl}/${coleccion}/${docId}?key=${fbApiKey}`
  const body = { fields: toFirestoreFields(data) }
  const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.text(); throw new Error(`Firestore ${coleccion} ${res.status}: ${e}`) }
  console.log(`[Firebase/${coleccion}] guardado: ${docId}`)
}

export default function TestMMSE() {
    const router = useRouter();
    const [paso, setPaso] = useState(0);
    const [grabando, setGrabando] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [respuestas, setRespuestas]   = useState<{ [key: number]: string }>({});
    const [userEmail, setUserEmail]     = useState<string>('anonimo@app.com');
    const [userName,  setUserName]      = useState<string>('Anónimo');

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

    // Variables para objetos aleatorios
    const [itemsRegistro, setItemsRegistro] = useState<string[]>([]);
    const [itemsDenominacion, setItemsDenominacion] = useState<string[]>([]);

    const grabacionRef = useRef<Audio.Recording | null>(null);

    useEffect(() => {
        const registroAleatorio = [...NOMBRES_REGISTRO]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
            
        const denomAleatorio = [...NOMBRES_DENOMINACION]
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);

        setItemsRegistro(registroAleatorio);
        setItemsDenominacion(denomAleatorio);
    }, []);

    const prepararAudio = async () => {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    };

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

    // --- Lógica de Grabación (Basada en chat.tsx) ---
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
        if (paso < preguntas.length - 1) setPaso(paso + 1);
        else finalizar();
    };

    const finalizar = async () => {
        const docId = `${userEmail}_mmse_${Date.now()}`.replace(/[^a-zA-Z0-9_@.-]/g, '_');
        try {
            await guardarEnColeccion('testmmse', docId, {
                email:           userEmail,
                userName:        userName,
                timestamp:       new Date().toISOString(),
                respuestas,
                itemsRegistro,
                itemsDenominacion,
            }, FB_BASE_URL, FB_API_KEY);
        } catch (e) { console.warn('[testmmse] Error al guardar:', e); }
        router.replace('/main');
    };

    return (
        <ThemedView style={s.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
            >
                <ThemedView style={s.header}>
                    <ThemedText type="title" style={{ color: C.accent }}>MMSE Cognitivo</ThemedText>
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
                                            <ThemedText style={s.resultLabel}>Voz: "{respuestas[currentQ.id]}"</ThemedText>
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

                <TouchableOpacity style={s.nextBtn} onPress={siguiente}>
                    <ThemedText style={s.nextBtnTxt}>
                        {paso === preguntas.length - 1 ? "Finalizar Registro" : "Siguiente Pregunta"}
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: C.bg, 
        padding: 20, 
        justifyContent: 'center' 
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
});