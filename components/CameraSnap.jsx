import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as MediaLibrary from 'expo-media-library'
import { imageToTensor } from '../utils/convert';

  
export default function CameraSnap() {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [permissionResponse, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);
  const model = useTensorflowModel(require('../assets/models/face_mask/ssd_mobilenet_v2_fpnlite.tflite'));

  useEffect(()=>{
    requestMediaPermission();
  }, [])

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const snap = async() => {
    const startTime = performance.now();

    const photo = await cameraRef.current.takePictureAsync();
    const inputTensor = await imageToTensor(photo.uri);
    const outputs = model.model.runSync([inputTensor]);
    
    const boxes = outputs[0];
    const classes = outputs[1];
    const scores = outputs[2];
    const num = outputs[3];

    const classification = ['got mask', 'no mask', 'wear incorrectly']

    if (scores[0] > 0.7){
      console.log(`Face Detected! Class: ${classification[classes[0]]}`);
    } else {
      console.log(`No face detected, Score: ${scores[0]}`)
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`Run Time: ${duration.toFixed(2)} seconds`);
    console.log(`---------------------------------------------`)
  }
  
  return (
    <>
      <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>{facing}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={snap}>
            <Text style={styles.text}>Take Photo </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});