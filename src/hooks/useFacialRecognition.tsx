//* -------------------------------------------------------------------------- */
//*                                    Hooks                                   */
//* -------------------------------------------------------------------------- */
import { 
  useState,
  useCallback, 
} from 'react';

//* -------------------------------------------------------------------------- */
//*                                   Shadcn                                   */
//* -------------------------------------------------------------------------- */
import { toast } from 'sonner';

//* -------------------------------------------------------------------------- */
//*                               AI: Tensorflow                               */
//* -------------------------------------------------------------------------- */
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

//* -------------------------------------------------------------------------- */
//*                                    Type                                    */
//* -------------------------------------------------------------------------- */
export type ProcessingStep = 1 | 2 | 3 | 4;
export type RecognitionStatus = 'idle' | 'processing' | 'match' | 'no-match' | 'error';

//* -------------------------------------------------------------------------- */
//*                             TS: Face Detection                             */
//* -------------------------------------------------------------------------- */
// interface FaceDetection {
//   box: [number, number, number, number];
//   landmarks: number[][];
//   probability: number;
// }

//* -------------------------------------------------------------------------- */
//*                        TS: Facial Recognition Result                       */
//* -------------------------------------------------------------------------- */
interface FacialRecognitionResult {
  status: RecognitionStatus;
  confidence: number;
  idFace?: string;
  profileFace?: string;
  error?: string;
}

//* -------------------------------------------------------------------------- */
//*                            Analyze Image Quality                           */
//* -------------------------------------------------------------------------- */
const analyzeImageQuality = (imageElement: HTMLImageElement): {
  isGoodQuality: boolean;
  reason?: string;
} => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { isGoodQuality: false, reason: 'Unable to analyze image' };

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check resolution
    const totalPixels = canvas.width * canvas.height;
    if (totalPixels < 300000) { // Less than ~550x545 pixels
      return { isGoodQuality: false, reason: 'Image resolution too low. Please upload a higher quality image.' };
    }

    // Check sharpness using edge detection
    let edgePixels = 0;
    for (let i = 0; i < data.length - 4; i += 4) {
      const current = data[i] + data[i + 1] + data[i + 2];
      const next = data[i + 4] + data[i + 5] + data[i + 6];
      if (Math.abs(current - next) > 50) {
        edgePixels++;
      }
    }
    
    const sharpnessRatio = edgePixels / (totalPixels / 100);
    if (sharpnessRatio < 2) {
      return { isGoodQuality: false, reason: 'Image appears blurry. Please upload a clearer image.' };
    }

    // Check brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    
    if (avgBrightness < 30) {
      return { isGoodQuality: false, reason: 'Image too dark. Please upload a brighter image.' };
    }
    if (avgBrightness > 240) {
      return { isGoodQuality: false, reason: 'Image overexposed. Please upload an image with better lighting.' };
    }

    return { isGoodQuality: true };
  } catch (error) {
    console.error('Error analyzing image quality:', error);
    return { isGoodQuality: false, reason: 'Unable to analyze image quality' };
  }
};

//* -------------------------------------------------------------------------- */
//*                           Use Facial Recognition                           */
//* -------------------------------------------------------------------------- */
export const useFacialRecognition = () => {

  /* -------------------------------------------------------------------------- */
  /*                                    Data                                    */
  /* -------------------------------------------------------------------------- */
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(1);
  const [processingStatus, setProcessingStatus] = useState<RecognitionStatus>('idle');

  /* -------------------------------------------------------------------------- */
  /*                                 Load Model                                 */
  /* -------------------------------------------------------------------------- */
  const loadModel = useCallback(async () => {
    if (model || isModelLoading) return model;

    try {
      setIsModelLoading(true);
      toast('Loading facial recognition model...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Load BlazeFace model
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
      
      toast.success('Facial recognition model loaded successfully!');
      return loadedModel;
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Failed to load facial recognition model');
      throw error;
    } finally {
      setIsModelLoading(false);
    }
  }, [model, isModelLoading]);

  /* -------------------------------------------------------------------------- */
  /*                           Extract Face From Image                          */
  /* -------------------------------------------------------------------------- */
  const extractFaceFromImage = useCallback(async (
    imageElement: HTMLImageElement,
    fileName: string
  ): Promise<string | null> => {
    try {
      const currentModel = model || await loadModel();
      if (!currentModel) throw new Error('Model not loaded');

      // Detect faces in the image
      const predictions = await currentModel.estimateFaces(imageElement);
      
      if (predictions.length === 0) {
        toast.error(`No face detected in ${fileName}`);
        return null;
      }

      if (predictions.length > 1) {
        toast.warning(`Multiple faces detected in ${fileName}, using the largest face`);
      }

      // Get the largest face (highest confidence or largest box)
      const face = predictions.reduce((largest, current) => {
        const currentArea = (current.bottomRight[0] - current.topLeft[0]) * 
                           (current.bottomRight[1] - current.topLeft[1]);
        const largestArea = (largest.bottomRight[0] - largest.topLeft[0]) * 
                           (largest.bottomRight[1] - largest.topLeft[1]);
        return currentArea > largestArea ? current : largest;
      });

      // Extract face region
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const x = face.topLeft[0];
      const y = face.topLeft[1];
      const x2 = face.bottomRight[0];
      const y2 = face.bottomRight[1];
      const width = x2 - x;
      const height = y2 - y;

      // Add some padding around the face
      const padding = 0.2;
      const paddedX = Math.max(0, x - width * padding);
      const paddedY = Math.max(0, y - height * padding);
      const paddedWidth = Math.min(imageElement.width - paddedX, width * (1 + 2 * padding));
      const paddedHeight = Math.min(imageElement.height - paddedY, height * (1 + 2 * padding));

      canvas.width = paddedWidth;
      canvas.height = paddedHeight;

      ctx.drawImage(
        imageElement,
        paddedX, paddedY, paddedWidth, paddedHeight,
        0, 0, paddedWidth, paddedHeight
      );

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error extracting face:', error);
      throw error;
    }
  }, [model, loadModel]);

  /* -------------------------------------------------------------------------- */
  /*                          Calculate Face Similarity                         */
  /* -------------------------------------------------------------------------- */
  const calculateFaceSimilarity = useCallback((
    face1Canvas: HTMLCanvasElement,
    face2Canvas: HTMLCanvasElement
  ): number => {
    try {
      const ctx1 = face1Canvas.getContext('2d');
      const ctx2 = face2Canvas.getContext('2d');
      
      if (!ctx1 || !ctx2) return 0;

      // Resize both faces to the same size for comparison
      const size = 100;
      const tempCanvas1 = document.createElement('canvas');
      const tempCanvas2 = document.createElement('canvas');
      const tempCtx1 = tempCanvas1.getContext('2d');
      const tempCtx2 = tempCanvas2.getContext('2d');

      if (!tempCtx1 || !tempCtx2) return 0;

      tempCanvas1.width = tempCanvas2.width = size;
      tempCanvas1.height = tempCanvas2.height = size;

      tempCtx1.drawImage(face1Canvas, 0, 0, size, size);
      tempCtx2.drawImage(face2Canvas, 0, 0, size, size);

      const imageData1 = tempCtx1.getImageData(0, 0, size, size);
      const imageData2 = tempCtx2.getImageData(0, 0, size, size);

      // Simple pixel-based similarity calculation
      let similarity = 0;
      const totalPixels = size * size * 4; // RGBA

      for (let i = 0; i < imageData1.data.length; i += 4) {
        const r1 = imageData1.data[i];
        const g1 = imageData1.data[i + 1];
        const b1 = imageData1.data[i + 2];
        
        const r2 = imageData2.data[i];
        const g2 = imageData2.data[i + 1];
        const b2 = imageData2.data[i + 2];

        // Calculate color difference
        const diff = Math.sqrt(
          Math.pow(r1 - r2, 2) + 
          Math.pow(g1 - g2, 2) + 
          Math.pow(b1 - b2, 2)
        ) / Math.sqrt(3 * 255 * 255);

        similarity += (1 - diff);
      }

      return similarity / (totalPixels / 4);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                Compare Faces                               */
  /* -------------------------------------------------------------------------- */
  const compareFaces = useCallback(async (
    idImageUrl: string,
    profileImageUrl: string
  ): Promise<FacialRecognitionResult> => {
    try {
      setProcessingStatus('processing');
      setProcessingStep(1);

      // Load the model if not already loaded
      const currentModel = model || await loadModel();
      if (!currentModel) {
        throw new Error('Failed to load facial recognition model');
      }

      // Step 1: Load images
      setProcessingStep(1);
      const [idImage, profileImage] = await Promise.all([
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.crossOrigin = 'anonymous';
          img.src = idImageUrl;
        }),
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.crossOrigin = 'anonymous';
          img.src = profileImageUrl;
        })
      ]);

      // Step 2: Extract faces
      setProcessingStep(2);
      const [idFace, profileFace] = await Promise.all([
        extractFaceFromImage(idImage, 'ID'),
        extractFaceFromImage(profileImage, 'Profile')
      ]);

      if (!idFace || !profileFace) {
        throw new Error('Could not extract faces from one or both images');
      }

      // Step 3: Analyze features
      setProcessingStep(3);
      
      // Create canvas elements for face comparison
      const face1Canvas = document.createElement('canvas');
      const face2Canvas = document.createElement('canvas');
      const face1Ctx = face1Canvas.getContext('2d');
      const face2Ctx = face2Canvas.getContext('2d');

      if (!face1Ctx || !face2Ctx) {
        throw new Error('Could not create canvas contexts');
      }

      // Load extracted faces into canvas
      await Promise.all([
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            face1Canvas.width = img.width;
            face1Canvas.height = img.height;
            face1Ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.src = idFace;
        }),
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            face2Canvas.width = img.width;
            face2Canvas.height = img.height;
            face2Ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.src = profileFace;
        })
      ]);

      // Step 4: Compare results
      setProcessingStep(4);
      const similarity = calculateFaceSimilarity(face1Canvas, face2Canvas);
      
      // Determine match status (threshold can be adjusted)
      const threshold = 0.7; // 70% similarity threshold
      const isMatch = similarity >= threshold;

      setProcessingStatus(isMatch ? 'match' : 'no-match');

      const result: FacialRecognitionResult = {
        status: isMatch ? 'match' : 'no-match',
        confidence: similarity,
        idFace,
        profileFace
      };

      if (isMatch) {
        toast.success('Faces match! Identity verified.');
      } else {
        toast.error('Faces do not match. Identity could not be verified.');
      }

      return result;
    } catch (error) {
      console.error('Facial recognition error:', error);
      setProcessingStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Facial recognition failed: ${errorMessage}`);
      
      return {
        status: 'error',
        confidence: 0,
        error: errorMessage
      };
    }
  }, [model, loadModel, extractFaceFromImage, calculateFaceSimilarity]);

  /* -------------------------------------------------------------------------- */
  /*                             Validate ID Quality                            */
  /* -------------------------------------------------------------------------- */
  const validateIdQuality = useCallback(async (imageUrl: string): Promise<{
    isValid: boolean;
    error?: string;
  }> => {
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
      });

      const qualityResult = analyzeImageQuality(image);
      if (!qualityResult.isGoodQuality) {
        return { isValid: false, error: qualityResult.reason };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating ID quality:', error);
      return { isValid: false, error: 'Failed to validate image quality' };
    }
  }, [analyzeImageQuality]);

  /* -------------------------------------------------------------------------- */
  /*                                   Returns                                  */
  /* -------------------------------------------------------------------------- */
  return {
    compareFaces,
    loadModel,
    isModelLoading,
    processingStep,
    processingStatus,
    setProcessingStatus,
    validateIdQuality
  };

};