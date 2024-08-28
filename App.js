import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import CameraSnap from './components/CameraSnap';

export default function App() {
  return (
    <View style={styles.container}>
      <CameraSnap />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});