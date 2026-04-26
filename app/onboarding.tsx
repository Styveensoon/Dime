import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingController() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    // Revisamos qué tests ha completado
    const gad7 = await AsyncStorage.getItem('gad7_completed');
    const phq9 = await AsyncStorage.getItem('phq9_completed');
    const mmse = await AsyncStorage.getItem('mmse_completed');

    if (!gad7) {
      router.replace('/testGAD7');
    } else if (!phq9) {
      router.replace('/TestPHQ9');
    } else if (!mmse) {
      router.replace('/testMMSE');
    } else {
      // Si ya hizo todos, lo mandamos al Main
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F4529' }}>
      <ActivityIndicator size="large" color="#B38E5D" />
    </View>
  );
}