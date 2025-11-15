//* -------------------------------------------------------------------------- */
//*                                    Hooks                                   */
//* -------------------------------------------------------------------------- */
import React, { 
  useState, 
  useEffect 
} from 'react';

//* -------------------------------------------------------------------------- */
//*                                Hooks: Custom                               */
//* -------------------------------------------------------------------------- */
import { useFacialRecognition } from '@/hooks/useFacialRecognition';

//* -------------------------------------------------------------------------- */
//*                                   Shadcn                                   */
//* -------------------------------------------------------------------------- */
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

//* -------------------------------------------------------------------------- */
//*                                Icons: Lucide                               */
//* -------------------------------------------------------------------------- */
import { 
  Shield,
  Camera, 
  Scan, 
  AlertTriangle
} from 'lucide-react';

//* -------------------------------------------------------------------------- */
//*                                 Components                                 */
//* -------------------------------------------------------------------------- */
import { ImageUpload } from '@/components/ImageUpload';
import { ComparisonResult, ComparisonStatus } from '@/components/ComparisonResult';
import { StatusIndicator } from '@/components/StatusIndicator';


//* -------------------------------------------------------------------------- */
//*                                    Index                                   */
//* -------------------------------------------------------------------------- */
const Index = () => {

  /* -------------------------------------------------------------------------- */
  /*                                 Data: Image                                */
  /* -------------------------------------------------------------------------- */
  const [idImage, setIdImage] = useState<{ file: File; url: string } | null>(null);
  const [profileImage, setProfileImage] = useState<{ file: File; url: string } | null>(null);
  
  /* -------------------------------------------------------------------------- */
  /*                                   Results                                  */
  /* -------------------------------------------------------------------------- */
  const [comparisonResult, setComparisonResult] = useState<{
    status: ComparisonStatus;
    confidence: number;
    idFace?: string;
    profileFace?: string;
    error?: string;
  }>({ status: 'idle', confidence: 0 });

  /* -------------------------------------------------------------------------- */
  /*                        Hooks: Use Facial Recognition                       */
  /* -------------------------------------------------------------------------- */
  const {
    compareFaces,
    loadModel,
    isModelLoading,
    processingStep,
    processingStatus,
    setProcessingStatus,
    validateIdQuality
  } = useFacialRecognition();

  /* -------------------------------------------------------------------------- */
  /*                          useEffect: Load the Model                         */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    // Pre-load the model on component mount
    loadModel().catch(console.error);
  }, [loadModel]);

  /* -------------------------------------------------------------------------- */
  /*                           Handle ID Image Upload                           */
  /* -------------------------------------------------------------------------- */
  const handleIdImageUpload = async (file: File, url: string) => {
    
    // * Check if has File
    if (!file.name) {
      setIdImage(null);
      if (comparisonResult.status !== 'idle') {
        setComparisonResult({ status: 'idle', confidence: 0 });
        setProcessingStatus('idle');
      }
      return;
    }

    // * Validate ID quality before setting
    const qualityResult = await validateIdQuality(url);

    if (!qualityResult.isValid) {
      toast.error(qualityResult.error || 'Poor image quality detected');
      return;
    }

    // * Set the File and URL
    setIdImage({ file, url });

    // * Back Status to idle
    if (comparisonResult.status !== 'idle') {
      setComparisonResult({ status: 'idle', confidence: 0 });
      setProcessingStatus('idle');
    }

  };

  /* -------------------------------------------------------------------------- */
  /*                         Handle Profile Image Upload                        */
  /* -------------------------------------------------------------------------- */
  const handleProfileImageUpload = (file: File, url: string) => {
    
    // * Set Profile
    setProfileImage(file.name ? { file, url } : null);

    if (comparisonResult.status !== 'idle') {
      setComparisonResult({ status: 'idle', confidence: 0 });
      setProcessingStatus('idle');
    }

  };

  /* -------------------------------------------------------------------------- */
  /*                          Handle Start Verification                         */
  /* -------------------------------------------------------------------------- */
  const handleStartVerification = async () => {

    // * Check if has Both Image
    if (!idImage || !profileImage) {
      toast.error('Please upload both images before starting verification');
      return;
    }

    try {

      const result = await compareFaces(idImage.url, profileImage.url);

      setComparisonResult({
        status: result.status,
        confidence: result.confidence,
        idFace: result.idFace,
        profileFace: result.profileFace,
        error: result.error
      });

    } catch (error) {
      console.error('Verification error:', error);
      setComparisonResult({
        status: 'error',
        confidence: 0,
        error: 'Failed to complete verification'
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                Handle Reset                                */
  /* -------------------------------------------------------------------------- */
  const handleReset = () => {
    setIdImage(null);
    setProfileImage(null);
    setComparisonResult({ status: 'idle', confidence: 0 });
    setProcessingStatus('idle');
  };

  const canStartVerification = idImage && profileImage && !isModelLoading && processingStatus !== 'processing';

  /* -------------------------------------------------------------------------- */
  /*                                    View                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-accent">
      
      {/* -------------------------------------------------------------------------- */}
      {/*                                   Header                                   */}
      {/* -------------------------------------------------------------------------- */}
      <div className="bg-gradient-primary shadow-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-primary-foreground">
                ID Verification System
              </h1>
            </div>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
              Secure facial recognition technology to verify identity documents. 
              Upload your government-issued ID and profile picture for instant verification.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* -------------------------------------------------------------------------- */}
          {/*                              Instructions Card                             */}
          {/* -------------------------------------------------------------------------- */}
          <Card className="p-6 bg-gradient-secondary border-0 shadow-secondary">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-secondary-foreground" />
                <h2 className="text-xl font-semibold text-secondary-foreground">
                  How It Works
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-secondary-foreground/80">
                <div className="space-y-2">
                  <div className="font-medium">1. Upload ID</div>
                  <div>Upload a clear photo of your government-issued ID</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">2. Upload Profile</div>
                  <div>Upload a current profile picture for comparison</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">3. Verify</div>
                  <div>Our AI analyzes and compares the facial features</div>
                </div>
              </div>
            </div>
          </Card>

          {/* -------------------------------------------------------------------------- */}
          {/*                               Upload Section                               */}
          {/* -------------------------------------------------------------------------- */}
          <div className="grid md:grid-cols-2 gap-8">
            
            <ImageUpload
              onImageUpload={handleIdImageUpload}
              image={idImage?.url}
              title="Government Issued ID"
              description="Upload a clear photo of your driver's license, passport, or other government ID"
              icon="shield"
              isProcessing={processingStatus === 'processing' && processingStep <= 2}
            />
            
            <ImageUpload
              onImageUpload={handleProfileImageUpload}
              image={profileImage?.url}
              title="Profile Picture"
              description="Upload a current photo of yourself for facial recognition comparison"
              icon="camera"
              isProcessing={processingStatus === 'processing' && processingStep <= 2}
            />

          </div>

          {/* -------------------------------------------------------------------------- */}
          {/*                               Control Buttons                              */}
          {/* -------------------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleStartVerification}
              disabled={!canStartVerification}
              className="bg-gradient-primary hover:shadow-primary transition-all duration-300 text-lg px-8 py-3"
              size="lg"
            >
              <Scan className="h-5 w-5 mr-2" />
              Start Verification
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-border hover:bg-muted text-lg px-8 py-3"
              size="lg"
            >
              Reset
            </Button>
          </div>

          {/* -------------------------------------------------------------------------- */}
          {/*                             Status and Results                             */}
          {/* -------------------------------------------------------------------------- */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Processing Status */}
            {(processingStatus === 'processing' || processingStatus !== 'idle') && (
              <StatusIndicator
                step={processingStep}
                totalSteps={4}
                currentStepName={
                  processingStep === 1 ? 'Loading Images' :
                  processingStep === 2 ? 'Extracting Faces' :
                  processingStep === 3 ? 'Analyzing Features' :
                  'Comparing Results'
                }
                isComplete={processingStatus === 'match' || processingStatus === 'no-match'}
                hasError={processingStatus === 'error'}
              />
            )}

            {/* Comparison Results */}
            <ComparisonResult
              status={comparisonResult.status}
              confidence={comparisonResult.confidence}
              idImage={comparisonResult.idFace}
              profileImage={comparisonResult.profileFace}
              errorMessage={comparisonResult.error}
            />
          </div>

          {/* -------------------------------------------------------------------------- */}
          {/*                                Model Status                                */}
          {/* -------------------------------------------------------------------------- */}
          {isModelLoading && (
            <Card className="p-4 bg-warning/10 border-warning/20">
              <div className="flex items-center justify-center gap-2 text-warning">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning"></div>
                <span className="text-sm font-medium">Loading facial recognition model...</span>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------------------- */}
          {/*                               Security Notice                              */}
          {/* -------------------------------------------------------------------------- */}
          <Card className="p-6 bg-muted/50 border-dashed">
            <div className="text-center space-y-2">
              <Shield className="h-6 w-6 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-foreground">Privacy & Security</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Your images are processed locally in your browser and are never uploaded to our servers. 
                All facial recognition happens client-side for maximum privacy and security.
              </p>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Index;