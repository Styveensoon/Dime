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

const imgTest1 = require('@/assets/images/testPHQ9/Exercise1.png');
const imgTest2 = require('@/assets/images/testPHQ9/Exercise2.png');
const imgTest3 = require('@/assets/images/testPHQ9/Exercise3.png');
const imgTest4 = require('@/assets/images/testPHQ9/Exercise4.png');
const imgTest5 = require('@/assets/images/testPHQ9/Exercise5.png');
const imgTest6 = require('@/assets/images/testPHQ9/Exercise6.png');
const imgTest7 = require('@/assets/images/testPHQ9/Exercise7.png');
const imgTest8 = require('@/assets/images/testPHQ9/Exercise8.png');

// --- PALETA UNIFICADA (Idéntica a testMMSE) ---
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

export default function TestPHQ9() {
    const router = useRouter();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});

    const options = ["Nunca", "Varios días", "Más de la mitad", "Casi todos los días"];

    const questions = [
        { id: 1, text: "Sentirse nervioso(a), ansioso(a) o con los nervios de punta", imageSource: imgTest1 },
        { id: 2, text: "No poder dejar de preocuparse o controlar la preocupación", imageSource: imgTest2 },
        { id: 3, text: "Preocuparse demasiado por diferentes cosas", imageSource: imgTest3 },
        { id: 4, text: "Dificultad para relajarse", imageSource: imgTest4 },
        { id: 5, text: "Estar tan inquieto(a) que es difícil permanecer sentado(a)", imageSource: imgTest5 },
        { id: 6, text: "Molestarse o irritarse fácilmente", imageSource: imgTest6 },
        { id: 7, text: "Sentir miedo como si algo terrible pudiera suceder", imageSource: imgTest7 },
        { id: 8, text: "Sentirse agobiado(a) o abrumado(a)", imageSource: imgTest8 }
    ];

    const handleFinish = async () => {
        // 2. Validamos que no haya respuestas vacías
        if (Object.keys(answers).length < questions.length) {
            Alert.alert(
                "Atención", 
                "Por favor, responde a todas las preguntas antes de continuar."
            );
            return;
        }

        await AsyncStorage.setItem('phq9_completed', 'true');
        router.replace("/testMMSE");
    };

    return (
        <SafeAreaView 
            style={[
                styles.container,
                { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            
            {/* Oculta la barra nativa de navegación de Expo Router */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Barra superior con el botón Volver */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <ThemedView style={styles.header}>
                    <ThemedText type="title" style={{ color: C.accent, textAlign: 'center' }}>
                        Test PHQ-9
                    </ThemedText>
                    <ThemedText style={styles.progreso}>
                        Salud del Paciente
                    </ThemedText>
                </ThemedView>

                <ThemedText style={styles.introText}>
                    Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado cada uno de los siguientes problemas?
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
                                        onPress={() => setAnswers({ ...answers, [q.id]: index })}
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
                    <ThemedText style={styles.nextBtnTxt}>Siguiente: Evaluación Cognitiva</ThemedText>
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
        elevation: 2, // Sombra ligera en Android
        shadowColor: '#000', // Sombra en iOS
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