import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect, Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets, useRunOnJS } from 'react-native-worklets-core';
import { runOnUI } from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTensorflowModel } from 'react-native-fast-tflite';


export default function App() {
  const { hasPermission, requestPermission }= useCameraPermission();
  const [detectedFaces, setDetectedFaces] = useState([]);
  const faceDetection = useTensorflowModel(require('./assets/models/mobile_face_net.tflite'));
  const model = faceDetection.state === "loaded" ? faceDetection.model : undefined;
  const faceDetectionOptions = {
    landmarkMode: 'all',
  };
  const { detectFaces } = useFaceDetector(faceDetectionOptions);
  const device = useCameraDevice('front');

  requestPermission();

  const setFaces = useRunOnJS((faces)=>{
    setDetectedFaces(faces);
  }, []);

  const frameProcessor = useFrameProcessor((frame)=>{
    'worklet';
    const faces = detectFaces(frame);
    if (faces.length !== 0){
      //console.log(JSON.stringify(faces));
      setFaces(faces);
    }

    if (model == null) return;
    console.log("here")
    const outputs = model.runSync([frame]);
    console.log("Model outputs:", outputs);
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
        <View style={styles.overlay}>
          {/* <Svg style={StyleSheet.absoluteFill}>
            {detectedFaces.map((face, key)=>(
              <Fragment key={key}>
                {Object.values(face.landmarks).map((landmark, i)=>(
                  <>
                    <Circle
                      key={i}
                      cx={landmark.x}
                      cy={landmark.y}
                      r="5"
                      stroke="red"
                      strokeWidth="2"
                      fill="red"
                    />
                  </>
                ))}

              </Fragment>
            ))}
          </Svg> */}
        </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});
