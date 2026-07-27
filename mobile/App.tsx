import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AuthScreen } from './src/screens/AuthScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
