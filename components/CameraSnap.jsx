import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import ImageResizer from 'react-native-image-resizer';
import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { convertToRGB } from 'react-native-image-to-rgb';

  
export default function CameraSnap() {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const model = useTensorflowModel(require('../assets/models/face_mask/ssd_mobilenet_v2_fpnlite.tflite'));

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

  const imageToTensor = async(uri) => {
    await tf.ready();

    try {

      const resizedImg = await ImageResizer.createResizedImage(uri, 320, 320, 'JPEG', 100, 0, undefined, true, { mode: "stretch" });
      const rgb = await convertToRGB(resizedImg.uri);
      
      let red = [];
      let blue = [];
      let green = [];
      for (let i = 0; i < rgb.length; i+=3) {
        red.push(rgb[i] / 255);
        blue.push(rgb[i + 1] / 255);
        green.push(rgb[i + 2] / 255);
      }
      const normalized = [...red, ...green, ...blue];
      const arrayBuffer = new Float32Array(normalized);

      return arrayBuffer;

    } catch(err) {
      console.error('Error loading and converting image to tensor:', err);
    }
  }

  const snap = async() => {
    const photo = await cameraRef.current.takePictureAsync();
    const inputTensor = await imageToTensor(photo.uri);
    const outputs = model.model.runSync([inputTensor])
    
    const boxes = outputs[0];
    const classes = outputs[1];
    const scores = outputs[2];
    const num = outputs[3];

    const classification = ['got mask', 'no mask', 'wear incorrectly']

    if (scores[0] > 0.8){
      console.log(`Face Detected! Score: ${scores[0]} Class: ${classification[classes[0]]}`);
    } else {
      console.log(`No face detected, ${scores[0]}`)
    }

    // let count = 0;
    // for (let i=0; i < num[0]; i++){
    //   if (scores[i] > 0.8){
    //     count++;
    //     console.log(`Face Detected! ${i} Score: ${scores[i]} Class: ${classification[classes[i]]}`);
    //   }
    // };
    // if (count === 0) {
    //   console.log('No face detected')
    // };
    // console.log('------------------');
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