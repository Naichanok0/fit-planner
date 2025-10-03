import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Upload, 
  Camera, 
  Scan, 
  User, 
  Ruler, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Brain,
  Zap,
  Eye,
  RotateCcw,
  Dumbbell
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BodyMeasurements {
  height: number;
  weight: number;
  bmi: number;
  bodyFatPercentage: number;
  muscleMass: number;
  waistCircumference: number;
  chestCircumference: number;
  hipCircumference: number;
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
  analysisResults: {
    shoulderWidth: number;
    waistToHipRatio: number;
    bodyFatDistribution: string;
    fitnessRecommendations: string[];
    muscleImbalances: string[];
    postureAnalysis: string[];
  };
}

interface BodyAnalysisProps {
  onAnalysisComplete: (measurements: BodyMeasurements) => void;
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  fitnessLevel: 'standard';
  onNavigateToProgram?: () => void;
}

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function BodyAnalysis({ onAnalysisComplete, userGoal, fitnessLevel, onNavigateToProgram }: BodyAnalysisProps) {
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'processing' | 'manual-input' | 'results'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [manualMeasurements, setManualMeasurements] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    waist: '',
    chest: '',
    hip: '',
    neck: ''
  });
  const [analysisResults, setAnalysisResults] = useState<BodyMeasurements | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const analysisSteps: AnalysisStep[] = [
    {
      id: 'image-capture',
      title: 'Image Capture',
      description: 'AI analyzes your body composition from photo',
      completed: analysisStep !== 'upload'
    },
    {
      id: 'body-scanning',
      title: 'Body Scanning',
      description: 'Advanced algorithms detect body landmarks',
      completed: analysisStep === 'results'
    },
    {
      id: 'measurement-calculation',
      title: 'Measurements',
      description: 'Calculate proportions and body composition',
      completed: analysisStep === 'results'
    },
    {
      id: 'personalization',
      title: 'Personalization',
      description: 'Generate personalized recommendations',
      completed: analysisStep === 'results'
    }
  ];

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        processImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for body analysis. Please allow camera access and try again.');
    }
  };

  const capturePhoto = () => {
    if (cameraRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = cameraRef.current.videoWidth;
        canvas.height = cameraRef.current.videoHeight;
        context.drawImage(cameraRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setUploadedImage(imageData);
        
        // Stop camera
        const stream = cameraRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
        
        processImage();
      }
    }
  };

  const processImage = () => {
    setAnalysisStep('processing');
    setIsAnalyzing(true);
    
    // Simulate AI analysis with realistic progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setAnalysisStep('manual-input');
          setIsAnalyzing(false);
        }, 1000);
      }
      setProcessingProgress(progress);
    }, 300);
  };

  const calculateBodyMetrics = () => {
    const height = parseFloat(manualMeasurements.height) / 100; // Convert to meters
    const weight = parseFloat(manualMeasurements.weight);
    const age = parseInt(manualMeasurements.age);
    const waist = parseFloat(manualMeasurements.waist) || 0;
    const chest = parseFloat(manualMeasurements.chest) || 0;
    const hip = parseFloat(manualMeasurements.hip) || 0;
    const neck = parseFloat(manualMeasurements.neck) || 0;

    // Calculate BMI
    const bmi = weight / (height * height);

    // Estimate body fat percentage (Navy method for basic estimation)
    let bodyFatPercentage = 0;
    if (manualMeasurements.gender === 'male') {
      bodyFatPercentage = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height * 100)) - 450;
    } else {
      bodyFatPercentage = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height * 100)) - 450;
    }

    // Ensure realistic bounds
    bodyFatPercentage = Math.max(5, Math.min(50, bodyFatPercentage));

    // Calculate muscle mass estimate
    const muscleMass = weight * (1 - bodyFatPercentage / 100);

    // Determine body type based on measurements and ratios
    const waistToHipRatio = waist / hip;
    const shoulderToWaistRatio = chest / waist;
    
    let bodyType: 'ectomorph' | 'mesomorph' | 'endomorph' = 'mesomorph';
    
    if (bmi < 18.5 || (bmi < 23 && bodyFatPercentage < 12)) {
      bodyType = 'ectomorph';
    } else if (bmi > 25 || bodyFatPercentage > 20) {
      bodyType = 'endomorph';
    }

    // Advanced analysis based on body composition and goals
    const analysisResults = generateAdvancedAnalysis(
      { bmi, bodyFatPercentage, bodyType, waistToHipRatio, shoulderToWaistRatio },
      userGoal,
      fitnessLevel
    );

    const measurements: BodyMeasurements = {
      height: height * 100,
      weight,
      bmi,
      bodyFatPercentage,
      muscleMass,
      waistCircumference: waist,
      chestCircumference: chest,
      hipCircumference: hip,
      bodyType,
      analysisResults
    };

    setAnalysisResults(measurements);
    setAnalysisStep('results');
    onAnalysisComplete(measurements);
  };

  const generateAdvancedAnalysis = (
    metrics: any, 
    goal: string, 
    level: string
  ) => {
    const recommendations: string[] = [];
    const muscleImbalances: string[] = [];
    const postureAnalysis: string[] = [];

    // Goal-based recommendations
    if (goal === 'weight-loss') {
      if (metrics.bodyFatPercentage > 20) {
        recommendations.push("Focus on high-intensity interval training (HIIT) for maximum fat burn");
        recommendations.push("Create a moderate caloric deficit through diet and exercise");
        recommendations.push("Include strength training to preserve muscle mass during weight loss");
      }
      if (metrics.bmi > 25) {
        recommendations.push("Start with low-impact exercises to protect joints");
        recommendations.push("Gradually increase exercise intensity as fitness improves");
      }
    } else if (goal === 'muscle-gain') {
      if (metrics.bodyType === 'ectomorph') {
        recommendations.push("Focus on compound movements with heavy weights");
        recommendations.push("Minimize cardio to avoid burning calories needed for muscle growth");
        recommendations.push("Prioritize progressive overload and longer rest periods");
      }
      if (metrics.bodyFatPercentage < 10) {
        recommendations.push("Increase caloric intake to support muscle growth");
        recommendations.push("Focus on protein intake of 1.6-2.2g per kg body weight");
      }
    }

    // Body type specific advice
    if (metrics.bodyType === 'endomorph') {
      recommendations.push("Include more cardio to boost metabolism");
      recommendations.push("Consider circuit training for efficiency");
      recommendations.push("Focus on full-body compound movements");
    } else if (metrics.bodyType === 'ectomorph') {
      recommendations.push("Limit cardio sessions to maintain muscle mass");
      recommendations.push("Focus on strength training 3-4 times per week");
      recommendations.push("Allow adequate recovery time between sessions");
    }

    // Posture analysis based on typical issues
    if (metrics.shoulderToWaistRatio < 1.3) {
      postureAnalysis.push("Consider exercises to strengthen upper back and rear deltoids");
      muscleImbalances.push("Potential weak upper back muscles");
    }
    
    if (metrics.waistToHipRatio > 0.9) {
      postureAnalysis.push("Focus on core strengthening exercises");
      postureAnalysis.push("Include hip mobility and glute activation exercises");
    }

    // Fitness level adaptations
    if (level === 'beginner') {
      recommendations.push("Start with bodyweight exercises to build base strength");
      recommendations.push("Focus on learning proper form before increasing intensity");
    } else if (level === 'advanced') {
      recommendations.push("Include plyometric and power-based exercises");
      recommendations.push("Consider periodized training programs");
    }

    return {
      shoulderWidth: metrics.shoulderToWaistRatio * 100,
      waistToHipRatio: metrics.waistToHipRatio,
      bodyFatDistribution: metrics.bodyType === 'endomorph' ? 'Central' : 
                           metrics.bodyType === 'ectomorph' ? 'Minimal' : 'Balanced',
      fitnessRecommendations: recommendations,
      muscleImbalances,
      postureAnalysis
    };
  };

  const resetAnalysis = () => {
    setAnalysisStep('upload');
    setUploadedImage(null);
    setProcessingProgress(0);
    setAnalysisResults(null);
    setManualMeasurements({
      height: '',
      weight: '',
      age: '',
      gender: 'male',
      waist: '',
      chest: '',
      hip: '',
      neck: ''
    });
    
    // Stop camera if active
    if (cameraActive && cameraRef.current?.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Body Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {analysisSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <span className="text-xs sm:text-sm">{index + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate">{step.title}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload/Camera Section */}
      {analysisStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Capture Your Photo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Take a front-facing photo in good lighting while wearing fitted clothing for best results.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Camera Section */}
              {cameraActive ? (
                <div className="space-y-4">
                  <video
                    ref={cameraRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg border"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto}>
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const stream = cameraRef.current?.srcObject as MediaStream;
                      stream?.getTracks().forEach(track => track.stop());
                      setCameraActive(false);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload Option */}
                  <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center">
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Upload Photo</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Select a photo from your device
                    </p>
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Camera Option */}
                  <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center">
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Use Camera</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Take a photo with your camera
                    </p>
                    <Button size="sm" onClick={startCamera}>
                      Start Camera
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Tips */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold mb-2 text-blue-900 text-sm sm:text-base">Photo Tips for Best Results:</h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <li>• Stand straight with arms at your sides</li>
                  <li>• Wear fitted clothing or minimal clothing</li>
                  <li>• Ensure good lighting and plain background</li>
                  <li>• Stand 6-8 feet away from camera</li>
                  <li>• Face the camera directly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {analysisStep === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5 animate-spin" />
              Analyzing Your Body Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="text-center">
                  <ImageWithFallback 
                    src={uploadedImage} 
                    alt="Analysis preview"
                    className="max-w-xs mx-auto rounded-lg border"
                  />
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>

              {/* Analysis Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Detecting body landmarks and proportions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span>Analyzing posture and muscle balance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span>Calculating body composition metrics</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Input Section */}
      {analysisStep === 'manual-input' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Complete Your Measurements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please provide additional measurements for accurate body composition analysis.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold">Basic Information</h4>
                
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={manualMeasurements.height}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={manualMeasurements.weight}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={manualMeasurements.age}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select 
                    id="gender"
                    className="w-full p-2 border rounded-md bg-background"
                    value={manualMeasurements.gender}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Body Measurements */}
              <div className="space-y-4">
                <h4 className="font-semibold">Body Measurements (cm)</h4>
                
                <div>
                  <Label htmlFor="waist">Waist Circumference</Label>
                  <Input
                    id="waist"
                    type="number"
                    placeholder="80"
                    value={manualMeasurements.waist}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, waist: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Measure at narrowest point</p>
                </div>

                <div>
                  <Label htmlFor="chest">Chest Circumference</Label>
                  <Input
                    id="chest"
                    type="number"
                    placeholder="95"
                    value={manualMeasurements.chest}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, chest: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Measure at fullest part</p>
                </div>

                <div>
                  <Label htmlFor="hip">Hip Circumference</Label>
                  <Input
                    id="hip"
                    type="number"
                    placeholder="90"
                    value={manualMeasurements.hip}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, hip: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Measure at widest point</p>
                </div>

                <div>
                  <Label htmlFor="neck">Neck Circumference</Label>
                  <Input
                    id="neck"
                    type="number"
                    placeholder="35"
                    value={manualMeasurements.neck}
                    onChange={(e) => setManualMeasurements(prev => ({ ...prev, neck: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Just below Adam's apple</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={calculateBodyMetrics}
                disabled={!manualMeasurements.height || !manualMeasurements.weight}
                className="flex-1"
              >
                Generate Analysis
              </Button>
              <Button variant="outline" onClick={resetAnalysis}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {analysisStep === 'results' && analysisResults && (
        <div className="space-y-6">
          {/* Main Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Your Body Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Ruler className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">{analysisResults.bmi.toFixed(1)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">BMI</div>
                  <Badge variant={
                    analysisResults.bmi < 18.5 ? 'secondary' :
                    analysisResults.bmi < 25 ? 'default' :
                    analysisResults.bmi < 30 ? 'destructive' : 'destructive'
                  } className="mt-1">
                    {analysisResults.bmi < 18.5 ? 'Underweight' :
                     analysisResults.bmi < 25 ? 'Normal' :
                     analysisResults.bmi < 30 ? 'Overweight' : 'Obese'}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">{analysisResults.bodyFatPercentage.toFixed(1)}%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Body Fat</div>
                  <Badge variant="outline" className="mt-1">
                    {analysisResults.analysisResults.bodyFatDistribution}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">{analysisResults.muscleMass.toFixed(1)}kg</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Muscle Mass</div>
                  <Badge variant="secondary" className="mt-1">Estimated</Badge>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">{analysisResults.bodyType}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Body Type</div>
                  <Badge variant="outline" className="mt-1">
                    {analysisResults.analysisResults.waistToHipRatio.toFixed(2)} W/H
                  </Badge>
                </div>
              </div>

              {/* Body Type Description */}
              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-semibold mb-2">
                  {analysisResults.bodyType.charAt(0).toUpperCase() + analysisResults.bodyType.slice(1)} Body Type
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysisResults.bodyType === 'ectomorph' && 
                    "Naturally lean with fast metabolism. Focus on strength training and adequate nutrition for muscle building."}
                  {analysisResults.bodyType === 'mesomorph' && 
                    "Naturally muscular and athletic. Responds well to both strength training and cardio."}
                  {analysisResults.bodyType === 'endomorph' && 
                    "Tends to gain weight easily. Benefits from higher intensity training and careful nutrition management."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fitness Recommendations */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Fitness Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.analysisResults.fitnessRecommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Posture Analysis */}
                {analysisResults.analysisResults.postureAnalysis.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Posture & Balance
                    </h4>
                    <div className="space-y-2">
                      {analysisResults.analysisResults.postureAnalysis.map((analysis, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{analysis}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Muscle Imbalances */}
                {analysisResults.analysisResults.muscleImbalances.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      {analysisResults.analysisResults.muscleImbalances.map((imbalance, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{imbalance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  className="flex-1" 
                  onClick={onNavigateToProgram}
                  disabled={!onNavigateToProgram}
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  View Personalized Program
                </Button>
                <Button variant="outline" onClick={resetAnalysis}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
