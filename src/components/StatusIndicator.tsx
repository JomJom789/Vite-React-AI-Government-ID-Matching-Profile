//* -------------------------------------------------------------------------- */
//*                                    Hooks                                   */
//* -------------------------------------------------------------------------- */
import React from 'react';

//* -------------------------------------------------------------------------- */
//*                                Icons: Lucide                               */
//* -------------------------------------------------------------------------- */
import { 
  CheckCircle,
  Clock, 
  AlertCircle 
} from 'lucide-react';

//* -------------------------------------------------------------------------- */
//*                                   Shadcn                                   */
//* -------------------------------------------------------------------------- */
import { Card } from '@/components/ui/card';

//* -------------------------------------------------------------------------- */
//*                         TS: Status Indicator Props                         */
//* -------------------------------------------------------------------------- */
interface StatusIndicatorProps {
  step: number;
  totalSteps: number;
  currentStepName: string;
  isComplete: boolean;
  hasError: boolean;
}

//* -------------------------------------------------------------------------- */
//*                               StatusIndicator                              */
//* -------------------------------------------------------------------------- */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  step,
  totalSteps,
  currentStepName,
  isComplete,
  hasError
}) => {

  /* -------------------------------------------------------------------------- */
  /*                                 Step Status                                */
  /* -------------------------------------------------------------------------- */
  const steps = [
    'Upload Images',
    'Extract Faces',
    'Analyze Features',
    'Compare Results'
  ];

  /* -------------------------------------------------------------------------- */
  /*                                    View                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <Card className="p-4 bg-gradient-accent">
      <div className="space-y-4">

        {/* -------------------------------------------------------------------------- */}
        {/*                                Status Result                               */}
        {/* -------------------------------------------------------------------------- */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Processing Status</h3>
          <div className="flex items-center gap-2">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : isComplete ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <Clock className="h-4 w-4 text-warning" />
            )}
            <span className="text-sm text-muted-foreground">
              {hasError ? 'Error' : isComplete ? 'Complete' : currentStepName}
            </span>
          </div>
        </div>
          
        {/* -------------------------------------------------------------------------- */}
        {/*                                 Step Status                                */}
        {/* -------------------------------------------------------------------------- */}
        <div className="space-y-2">
          {steps.map((stepName, index) => {
            const isCurrentStep = index + 1 === step;
            const isPastStep = index + 1 < step;
            const isActive = isPastStep || isCurrentStep;

            return (
              <div key={stepName} className="flex items-center gap-3">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
                  ${isPastStep 
                    ? 'bg-success text-success-foreground' 
                    : isCurrentStep 
                      ? 'bg-primary text-primary-foreground animate-pulse-glow' 
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isPastStep ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm transition-colors duration-300 ${
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>

        {/* -------------------------------------------------------------------------- */}
        {/*                                  Progress                                  */}
        {/* -------------------------------------------------------------------------- */}
        <div className="bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

      </div>
    </Card>
  );
};