//* -------------------------------------------------------------------------- */
//*                                    Hooks                                   */
//* -------------------------------------------------------------------------- *//
import React, { 
  useCallback, 
  useState 
} from 'react';

//* -------------------------------------------------------------------------- */
//*                                Icons: Lucide                               */
//* -------------------------------------------------------------------------- */
import { 
  Upload,
  X, 
  Camera, 
  Shield 
} from 'lucide-react';

//* -------------------------------------------------------------------------- */
//*                                   Shadcn                                   */
//* -------------------------------------------------------------------------- */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

//* -------------------------------------------------------------------------- */
//*                           TS: Image Upload Props                           */
//* -------------------------------------------------------------------------- */
interface ImageUploadProps {
  onImageUpload: (file: File, imageUrl: string) => void;
  image?: string;
  title: string;
  description: string;
  icon: 'camera' | 'shield';
  isProcessing?: boolean;
}

//* -------------------------------------------------------------------------- */
//*                                 ImageUpload                                */
//* -------------------------------------------------------------------------- */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  image,
  title,
  description,
  icon,
  isProcessing = false
}) => {

  /* -------------------------------------------------------------------------- */
  /*                                  Triggers                                  */
  /* -------------------------------------------------------------------------- */
  const [isDragOver, setIsDragOver] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                                 Handle Drop                                */
  /* -------------------------------------------------------------------------- */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      onImageUpload(imageFile, imageUrl);
    }
  }, [onImageUpload]);

  /* -------------------------------------------------------------------------- */
  /*                             Handle File Change                             */
  /* -------------------------------------------------------------------------- */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
  }, [onImageUpload]);

  /* -------------------------------------------------------------------------- */
  /*                              handle Drag Over                              */
  /* -------------------------------------------------------------------------- */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              Handle Drag Leave                             */
  /* -------------------------------------------------------------------------- */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                 Clear Image                                */
  /* -------------------------------------------------------------------------- */
  const clearImage = useCallback(() => {
    onImageUpload(new File([], ''), '');
  }, [onImageUpload]);

  const IconComponent = icon === 'camera' ? Camera : Shield;

  /* -------------------------------------------------------------------------- */
  /*                                    View                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <Card className="relative overflow-hidden bg-gradient-accent border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 animate-fade-in">
      
      {/* -------------------------------------------------------------------------- */}
      {/*                                 Upload Card                                */}
      {/* -------------------------------------------------------------------------- */}
      <div
        className={`p-8 text-center transition-all duration-300 ${
          isDragOver ? 'bg-primary/5 border-primary' : ''
        } ${isProcessing ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {image ? (
          <div className="relative group">
            <img 
              src={image} 
              alt={title}
              className="w-full h-64 object-cover rounded-lg shadow-subtle"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary animate-pulse-glow">
              <IconComponent className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag & drop your image here, or
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gradient-primary text-primary-foreground border-none hover:shadow-primary transition-all duration-300"
                  asChild
                >
                  <label className="cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* -------------------------------------------------------------------------- */}
      {/*                                 Processing                                 */}
      {/* -------------------------------------------------------------------------- */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm font-medium text-foreground">Processing...</p>
          </div>
        </div>
      )}

    </Card>
  );
};