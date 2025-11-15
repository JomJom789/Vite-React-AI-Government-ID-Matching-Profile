//* -------------------------------------------------------------------------- */
//*                                    Hooks                                   */
//* -------------------------------------------------------------------------- */
import React from 'react';

//* -------------------------------------------------------------------------- */
//*                                Icons: Lucide                               */
//* -------------------------------------------------------------------------- */
import { 
  CheckCircle,
  XCircle, 
  AlertCircle, 
  Loader 
} from 'lucide-react';

//* -------------------------------------------------------------------------- */
//*                                   Shadcn                                   */
//* -------------------------------------------------------------------------- */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

//* -------------------------------------------------------------------------- */
//*                                    Types                                   */
//* -------------------------------------------------------------------------- */
export type ComparisonStatus = 'idle' | 'processing' | 'match' | 'no-match' | 'error';

//* -------------------------------------------------------------------------- */
//*                         TS: Comparison Result Props                        */
//* -------------------------------------------------------------------------- */
interface ComparisonResultProps {
  status: ComparisonStatus;
  confidence?: number;
  idImage?: string;
  profileImage?: string;
  errorMessage?: string;
}

//* -------------------------------------------------------------------------- */
//*                              ComparisonResult                              */
//* -------------------------------------------------------------------------- */
export const ComparisonResult: React.FC<ComparisonResultProps> = ({
  status,
  confidence = 0,
  idImage,
  profileImage,
  errorMessage
}) => {

  /* -------------------------------------------------------------------------- */
  /*                              Get Status Config                             */
  /* -------------------------------------------------------------------------- */
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: Loader,
          title: 'Analyzing Images...',
          subtitle: 'Please wait while we process the facial recognition',
          color: 'warning',
          bgColor: 'bg-warning/10',
          iconColor: 'text-warning'
        };
      case 'match':
        return {
          icon: CheckCircle,
          title: 'Identity Verified ✓',
          subtitle: `Match confidence: ${(confidence * 100).toFixed(1)}%`,
          color: 'success',
          bgColor: 'bg-success/10',
          iconColor: 'text-success'
        };
      case 'no-match':
        return {
          icon: XCircle,
          title: 'Identity Not Verified',
          subtitle: 'The faces do not appear to match',
          color: 'destructive',
          bgColor: 'bg-destructive/10',
          iconColor: 'text-destructive'
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: 'Processing Error',
          subtitle: errorMessage || 'Unable to process the images',
          color: 'destructive',
          bgColor: 'bg-destructive/10',
          iconColor: 'text-destructive'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  
  if (!config || status === 'idle') {
    return null;
  }

  const IconComponent = config.icon;

  /* -------------------------------------------------------------------------- */
  /*                                    View                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <Card className={`p-6 ${config.bgColor} border-2 animate-scale-in`}>
      
      {/* -------------------------------------------------------------------------- */}
      {/*                               Result Idicator                              */}
      {/* -------------------------------------------------------------------------- */}
      <div className="text-center space-y-4">
        <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center ${status === 'processing' ? 'animate-spin' : 'animate-pulse-glow'}`}>
          <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">{config.title}</h3>
          <p className="text-muted-foreground">{config.subtitle}</p>
        </div>

        {status === 'match' && (
          <Badge variant="secondary" className="bg-success text-success-foreground">
            Verified Identity
          </Badge>
        )}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/*                             Side By Side Images                            */}
      {/* -------------------------------------------------------------------------- */}
      {(idImage && profileImage && (status === 'match' || status === 'no-match')) && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3 text-center">Side-by-Side Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <img 
                src={idImage} 
                alt="ID Photo" 
                className="w-full h-32 object-cover rounded-lg shadow-subtle"
              />
              <p className="text-xs text-muted-foreground text-center">ID Photo</p>
            </div>
            <div className="space-y-2">
              <img 
                src={profileImage} 
                alt="Profile Photo" 
                className="w-full h-32 object-cover rounded-lg shadow-subtle"
              />
              <p className="text-xs text-muted-foreground text-center">Profile Photo</p>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
};