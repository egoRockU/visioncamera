import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import CameraDetect from './components/CameraDetect';
import CameraSnap from './components/CameraSnap';

export default function App() {
  return (
    <View style={styles.container}>
      {/* <CameraDetect /> */}
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