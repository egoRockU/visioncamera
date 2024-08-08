import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';

export default function App() {
  const faceMaskDetection = useTensorflowModel(require('./assets/models/face_mask/ssd_mobilenet_v2_fpnlite.tflite'));
  const model = faceMaskDetection.state === "loaded" ? faceMaskDetection.model : undefined;
  const { resize } = useResizePlugin();

  const device = useCameraDevice('front');
  const { hasPermission, requestPermission }= useCameraPermission();
  requestPermission();

  const frameProcessor = useFrameProcessor((frame)=>{
    'worklet';

    if (model == null) return;

    const resized = resize(frame, {
      scale: {
        width: 320,
        height: 320,
      },
      pixelFormat: 'rgb',
      dataType: 'uint8',
    })

    const outputs = model.runSync([resized]);
    const boxes = outputs[0]
    const classes = outputs[1]
    const scores = outputs[2]
    const num = outputs[3]

    for (let i=0; i < num[0]; i++){
      if (scores[i] > 0.8){
        console.log(`Face Detected! ${i} Score: ${scores[i]}`)
      }
    }
    console.log('---------')
  }, [model]);
  
  return (
    <View style={styles.container}>
      {device && hasPermission ? 
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
        />
      </>
      : <Text>Camera Not found.</Text>}
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
