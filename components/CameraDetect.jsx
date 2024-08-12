import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';

function tensorToString(tensor) {
  return `\n  - ${tensor.dataType} ${tensor.name}[${tensor.shape}]`
}

function modelToString(model) {
  return (
    `TFLite Model (${model.delegate}):\n` +
    `- Inputs: ${model.inputs.map(tensorToString).join('')}\n` +
    `- Outputs: ${model.outputs.map(tensorToString).join('')}`
  )
}

export default function CameraDetect() {
  const faceMaskDetection = useTensorflowModel(require('../assets/models/face_mask/ssd_mobilenet_v2_fpnlite.tflite'), 'android-gpu');
  const model = faceMaskDetection.state === "loaded" ? faceMaskDetection.model : undefined;
  const { resize } = useResizePlugin();
  
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission }= useCameraPermission();
  requestPermission();
  
  useEffect(() => {
    if (model == null) return;
    console.log(`Model loaded! Shape: ${modelToString(model)}`)
  })
  
  const frameProcessor = useFrameProcessor((frame)=>{
    'worklet';
    
    if (model == null) return;
    
    const resized = resize(frame, {
      scale: {
        width: 320,
        height: 320,
      },
      pixelFormat: 'rgb',
      dataType: 'float32',
    })
    
    const pixels = [];
    for (let i = 0; i < resized.length; i += 3) {
      const pixel = [
        resized[i],
        resized[i + 1],
        resized[i + 2],
      ];
      pixels.push(pixel);
    }
    
    const outputs = model.runSync([resized]);
    const boxes = outputs[0];
    const classes = outputs[1];
    const scores = outputs[2];
    const num = outputs[3];
    const classification = ['got mask', 'no mask', 'wear incorrectly']
    
    for (let i=0; i < num[0]; i++){
      if (scores[i] > 0.8){
        console.log(`Face Detected! ${i} Score: ${scores[i]} Class: ${classification[classes[i]]}`);
      };
    };
    
    // if (scores[0] > 0.8){
    //   console.log(`Face Detected! Score: ${scores[0]} Class: ${classes[0]}`);
    // };
  }, [model]);
  
  return (
    <>
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
      </>
    );
}
  