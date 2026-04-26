import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const ImageTest = require('@/assets/images/Ubuntu.jpg');
const IMSS_GREEN = '#1F4529';
const IMSS_GOLD = '#B38E5D';

export default function TestMMSE() {
    const router = useRouter();
    const [responses, setResponses] = useState<{ [key: number]: string }>({});
    
    const mmseQuestions = [
        { id: 1, title: "Orientación Temporal", text: "¿En qué fecha estamos?" },
        { id: 2, title: "Orientación Espacial", text: "¿Dónde se encuentra usted ahora?" },
        { id: 3, title: "Registro", text: "Repita estas palabras: Balón, Bandera, Árbol." },
        { id: 4, title: "Atención y Cálculo", text: "Reste de 7 en 7 desde 100." },
    ];

    const handleFinish = async () => {
        await AsyncStorage.setItem('mmse_completed', 'true');
        // Navega directamente a testGAD7 sin alerta
        router.replace('/testGAD7');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ color: IMSS_GREEN }}>Mini-Examen (MMSE)</ThemedText>
            </ThemedView>

            {mmseQuestions.map((q) => (
                <ThemedView key={q.id} style={styles.questionCard}>
                    <Image source={ImageTest} style={styles.questionImage} resizeMode="cover" />
                    <ThemedText style={styles.questionTitle}>{q.title}</ThemedText>
                    <ThemedText style={styles.questionText}>{q.text}</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Escriba la respuesta aquí..."
                        value={responses[q.id] || ""}
                        onChangeText={(text) => setResponses({ ...responses, [q.id]: text })}
                        multiline
                    />
                </ThemedView>
            ))}

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <ThemedText style={styles.finishButtonText}>Finalizar Registro</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titleContainer: { marginBottom: 24, marginTop: 20 },
    questionCard: { marginBottom: 24, padding: 15, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)' },
    questionImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
    questionTitle: { fontSize: 20, fontWeight: "bold", color: IMSS_GOLD },
    questionText: { fontSize: 16, marginBottom: 15 },
    input: { backgroundColor: "#fff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#ddd" },
    finishButton: { backgroundColor: IMSS_GREEN, padding: 18, borderRadius: 12, alignItems: "center" },
    finishButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});