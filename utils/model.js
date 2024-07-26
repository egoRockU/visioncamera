import { loadTensorflowModel } from "react-native-fast-tflite";

export async function faceModel(inputData) {
    const model = await loadTensorflowModel(require('../assets/models/mobile_face_net.tflite'));
    const outputData = await model.run(inputData);
    console.log('Model Output: ', outputData);
    return outputData;
}