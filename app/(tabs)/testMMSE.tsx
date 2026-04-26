import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

const ImageTest = require('@/assets/images/Ubuntu.jpg');

export default function TestMMSE() {
    const router = useRouter();
    const [responses, setResponses] = useState<{ [key: number]: string }>({});
    
    const mmseQuestions = [
        { id: 1, title: "Orientación Temporal", text: "¿En qué fecha estamos? (Día de la semana, día, mes, año y estación)." },
        { id: 2, title: "Orientación Espacial", text: "¿Dónde se encuentra usted ahora? (País, ciudad, lugar, piso)." },
        { id: 3, title: "Registro", text: "Repita estas palabras: Balón, Bandera, Árbol." },
        { id: 4, title: "Atención y Cálculo", text: "Reste de 7 en 7 desde 100 (5 veces: 93, 86, 79, 72, 65)." },
        { id: 5, title: "Evocación", text: "¿Recuerda las tres palabras de hace un momento?" },
        { id: 6, title: "Nominación", text: "¿Cómo se llaman estos objetos? (Reloj y Bolígrafo)." },
        { id: 7, title: "Repetición", text: "Repita la frase: 'Ni sí, ni no, ni pero'." },
        { id: 8, title: "Órdenes", text: "Tome el papel con la mano derecha, dóblelo y póngalo en el suelo." },
        { id: 9, title: "Lectura", text: "Haga lo que dice la imagen: CIERRE LOS OJOS." },
        { id: 10, title: "Escritura y Dibujo", text: "Escriba una frase con sentido y copie el dibujo de los pentágonos." },
    ];

    const handleTextChange = (id: number, text: string) => {
        setResponses({ ...responses, [id]: text });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
                    Mini-Examen (MMSE)
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    Evaluación del estado cognitivo. Por favor, responda a las siguientes instrucciones.
                </ThemedText>
            </ThemedView>

            {mmseQuestions.map((q) => (
                <ThemedView key={q.id} style={styles.questionCard}>
                    <Image source={ImageTest} style={styles.questionImage} resizeMode="cover" />
                    
                    <ThemedText style={styles.questionTitle}>{q.id}. {q.title}</ThemedText>
                    <ThemedText style={styles.questionText}>{q.text}</ThemedText>
                
                    <TextInput
                        style={styles.input}
                        placeholder="Escriba la respuesta aquí..."
                        placeholderTextColor="#999"
                        value={responses[q.id] || ""}
                        onChangeText={(text) => handleTextChange(q.id, text)}
                        multiline
                    />
                </ThemedView>
            ))}

            <TouchableOpacity 
                style={styles.finishButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <ThemedText style={styles.finishButtonText}>Finalizar</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
        marginBottom: 24,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        marginTop: 8,
    },
    questionCard: {
        marginBottom: 24,
        padding: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.03)', // Un fondo ligero para diferenciar secciones
    },
    questionImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 12,
    },
    questionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    questionText: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 15,
        opacity: 0.8,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        textAlignVertical: "top",
        minHeight: 50,
    },
    finishButton: {
        backgroundColor: "#28a745",
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    finishButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});