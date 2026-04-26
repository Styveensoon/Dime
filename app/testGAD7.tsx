import React, { useState } from "react";
import { 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    View, 
    SafeAreaView, 
    Platform, 
    StatusBar,
    Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

const imgTest1 = require('@/assets/images/testGAD7/Exercise1.png');
const imgTest2 = require('@/assets/images/testGAD7/Exercise2.png');
const imgTest3 = require('@/assets/images/testGAD7/Exercise3.png');
const imgTest4 = require('@/assets/images/testGAD7/Exercise4.png');
const imgTest5 = require('@/assets/images/testGAD7/Exercise5.png');
const imgTest6 = require('@/assets/images/testGAD7/Exercise6.png');
const imgTest7 = require('@/assets/images/testGAD7/Exercise7.png');

// --- PALETA UNIFICADA ---
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

type Responses = { [key: number]: number };

export default function TestGAD7() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Responses>({});

    const options = ["Nunca", "Varios días", "Más de la mitad", "Casi todos los días"];

    const questions = [
        { id: 1, text: "Poco interés o placer en hacer las cosas", imageSource: imgTest1 },
        { id: 2, text: "Se ha sentido decaído(a), deprimido(a) o sin esperanzas", imageSource: imgTest2 },
        { id: 3, text: "Dificultad para dormir o permanecer dormido(a), o duerme demasiado", imageSource: imgTest3 },
        { id: 4, text: "Se siente cansado(a) o tiene poca energía", imageSource: imgTest4 },
        { id: 5, text: "Poco apetito o come en exceso", imageSource: imgTest5 },
        { id: 6, text: "Se siente mal consigo mismo(a) — o siente que es un fracaso", imageSource: imgTest6 },
        { id: 7, text: "Dificultad para concentrarse en las cosas", imageSource: imgTest7 }
    ];

    const handleSelect = (questionId: number, index: number) => {
        setAnswers({ ...answers, [questionId]: index });
    };

    const handleFinish = async () => {
        // 2. Validamos que el número de respuestas sea igual al número de preguntas
        if (Object.keys(answers).length < questions.length) {
            Alert.alert(
                "Atención", 
                "Por favor, responde a todas las preguntas antes de continuar."
            );
            return; // Detenemos la ejecución aquí si faltan respuestas
        }

        await AsyncStorage.setItem('gad7_completed', 'true');
        router.replace("/TestPHQ9"); 
    };

    return (
        <SafeAreaView 
            style={[
                styles.container,
                { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <ThemedView style={styles.header}>
                    <ThemedText type="title" style={{ fontFamily: Fonts.rounded, color: C.accent, textAlign: 'center' }}>
                        Test GAD-7
                    </ThemedText>
                    <ThemedText style={styles.progreso}>
                        Ansiedad Generalizada
                    </ThemedText>
                </ThemedView>

                <ThemedText style={styles.introText}>
                    Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?
                </ThemedText>

                {questions.map((q) => (
                    <View key={q.id} style={styles.card}>
                        {q.imageSource && (
                            <Image source={q.imageSource} style={styles.questionImage} resizeMode="cover" />
                        )}

                        <ThemedText style={styles.questionText}>{q.id}. {q.text}</ThemedText>
                        
                        <View style={styles.optionsContainer}>
                            {options.map((option, index) => {
                                const isSelected = answers[q.id] === index;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionButton, 
                                            isSelected && styles.optionSelected
                                        ]}
                                        onPress={() => handleSelect(q.id, index)}
                                        activeOpacity={0.7}
                                    >
                                        <ThemedText style={[
                                            styles.optionText, 
                                            isSelected && styles.textSelected
                                        ]}>
                                            {option}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.nextBtn} onPress={handleFinish}>
                    <ThemedText style={styles.nextBtnTxt}>Continuar al siguiente test</ThemedText>
                </TouchableOpacity>
                
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 60, 
    },
    header: {
        marginBottom: 25, 
        alignItems: 'center', 
        backgroundColor: 'transparent' 
    },
    progreso: {
        color: C.textMuted, 
        marginTop: 5,
        fontSize: 16,
    },
    introText: {
        fontSize: 16, 
        marginBottom: 30,
        color: C.text,
        textAlign: 'center',
        paddingHorizontal: 10
    },
    card: {
        backgroundColor: C.surface, 
        padding: 25, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: C.border, 
        marginBottom: 20,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    questionImage: { 
        width: '100%', 
        height: 180, 
        borderRadius: 16, 
        marginBottom: 20 
    },
    questionText: { 
        fontSize: 18, 
        fontWeight: "bold", 
        marginBottom: 20,
        color: C.primary,
        letterSpacing: 0.5
    },
    optionsContainer: { 
        gap: 10 
    },
    optionButton: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: C.border,
        backgroundColor: C.surfaceAlt,
    },
    optionSelected: { 
        backgroundColor: C.accent, 
        borderColor: C.accent 
    },
    optionText: {
        color: C.text,
        fontSize: 15,
        fontWeight: "500"
    },
    textSelected: { 
        color: C.surface, 
        fontWeight: "bold" 
    },
    nextBtn: {
        marginTop: 20, 
        backgroundColor: C.primary, 
        padding: 20, 
        borderRadius: 15, 
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextBtnTxt: { 
        color: C.surface, 
        fontWeight: 'bold', 
        fontSize: 16 
    }
});