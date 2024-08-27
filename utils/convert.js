import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { convertToRGB } from 'react-native-image-to-rgb';

import * as ImageManipulator from 'expo-image-manipulator';

export async function resize(uri) {
  try {
    // Step 1: Get the original dimensions of the image
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const { width, height } = manipResult;
    
    // Step 2: Calculate the cropping area to make it square
    const cropSize = Math.min(width, height);
    const cropOriginX = width > height ? (width - height) / 2 : 0;
    const cropOriginY = height > width ? (height - width) / 2 : 0;
    
    // Step 3: Crop the image to a square based on the calculated size
    const croppedResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: cropOriginX,
            originY: cropOriginY,
            width: cropSize,
            height: cropSize,
          },
        },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Step 4: Resize the cropped image to 320x320
    const resizedResult = await ImageManipulator.manipulateAsync(
      croppedResult.uri,
      [{ resize: { width: 320, height: 320 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return resizedResult.uri;
  } catch (err) {
    console.error('Error cropping and resizing image: ', err);
  }
}

export async function imageToTensor (uri) {
  await tf.ready();
  try {
    const resizedImg = await resize(uri)
    const rgb = await convertToRGB(resizedImg);
    
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
  };
};