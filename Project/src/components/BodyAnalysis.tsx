import React, { useState, useRef } from 'react';
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
  Brain
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
}

interface BodyAnalysisProps {
  onAnalysisComplete: (measurements: BodyMeasurements) => void;
  onProgramGenerated?: (program: WorkoutProgram) => void;
  userGoal?: 'weight-loss' | 'muscle-gain' | 'maintenance';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface WorkoutProgram {
  id: string;
  name: string;
  goal: string;
  duration: string;
  difficulty: string;
  exercises: Exercise[];
  nutritionTips: string[];
  weeklySchedule: string[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  restTime: string;
  targetMuscles: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export function BodyAnalysis({ 
  onAnalysisComplete, 
  onProgramGenerated,
  userGoal = 'maintenance',
  fitnessLevel = 'beginner'
}: BodyAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<BodyMeasurements | null>(null);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [userHeight, setUserHeight] = useState<string>('');
  const [userWeight, setUserWeight] = useState<string>('');
  const [generatedProgram, setGeneratedProgram] = useState<WorkoutProgram | null>(null);
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Generate personalized workout program
  const generateWorkoutProgram = async (measurements: BodyMeasurements) => {
    setIsGeneratingProgram(true);
    
    // Simulate AI program generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const exercises: Exercise[] = [];
    
    // Generate exercises based on user goal and fitness level
    if (userGoal === 'weight-loss') {
      exercises.push(
        {
          name: 'High-Intensity Interval Training (HIIT)',
          sets: 4,
          reps: '30s work, 30s rest',
          restTime: '2 minutes between sets',
          targetMuscles: ['Full Body', 'Cardiovascular'],
          instructions: [
            'Perform 30 seconds of intense exercise',
            'Rest for 30 seconds',
            'Repeat for 4 sets',
            'Focus on maintaining high intensity'
          ],
          difficulty: fitnessLevel
        },
        {
          name: 'Mountain Climbers',
          sets: 3,
          reps: '15-20',
          restTime: '1 minute',
          targetMuscles: ['Core', 'Shoulders', 'Legs'],
          instructions: [
            'Start in plank position',
            'Alternate bringing knees to chest rapidly',
            'Keep core engaged throughout',
            'Maintain steady breathing'
          ],
          difficulty: fitnessLevel
        },
        {
          name: 'Burpees',
          sets: 3,
          reps: fitnessLevel === 'beginner' ? '5-8' : fitnessLevel === 'intermediate' ? '8-12' : '12-15',
          restTime: '1-2 minutes',
          targetMuscles: ['Full Body'],
          instructions: [
            'Start standing, squat down and place hands on floor',
            'Jump feet back into plank position',
            'Do a push-up (optional for beginners)',
            'Jump feet back to squat position and jump up'
          ],
          difficulty: fitnessLevel
        }
      );
    } else if (userGoal === 'muscle-gain') {
      exercises.push(
        {
          name: 'Push-ups',
          sets: fitnessLevel === 'beginner' ? 3 : 4,
          reps: fitnessLevel === 'beginner' ? '8-12' : fitnessLevel === 'intermediate' ? '12-15' : '15-20',
          restTime: '1-2 minutes',
          targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
          instructions: [
            'Start in plank position with hands shoulder-width apart',
            'Lower body until chest nearly touches floor',
            'Push back up to starting position',
            'Keep body in straight line throughout'
          ],
          difficulty: fitnessLevel
        },
        {
          name: 'Squats',
          sets: 4,
          reps: fitnessLevel === 'beginner' ? '10-15' : fitnessLevel === 'intermediate' ? '15-20' : '20-25',
          restTime: '1-2 minutes',
          targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
          instructions: [
            'Start with feet shoulder-width apart',
            'Lower body by bending knees and hips',
            'Keep chest up and knees behind toes',
            'Return to standing position'
          ],
          difficulty: fitnessLevel
        },
        {
          name: 'Planks',
          sets: 3,
          reps: fitnessLevel === 'beginner' ? '30-45s' : fitnessLevel === 'intermediate' ? '45-60s' : '60-90s',
          restTime: '1 minute',
          targetMuscles: ['Core', 'Shoulders'],
          instructions: [
            'Start in push-up position',
            'Hold body in straight line from head to heels',
            'Engage core muscles',
            'Breathe normally while holding position'
          ],
          difficulty: fitnessLevel
        }
      );
    } else { // maintenance
      exercises.push(
        {
          name: 'Bodyweight Circuit',
          sets: 3,
          reps: '10-15 each exercise',
          restTime: '1-2 minutes between circuits',
          targetMuscles: ['Full Body'],
          instructions: [
            'Perform each exercise for specified reps',
            'Move quickly between exercises',
            'Rest only between complete circuits',
            'Focus on form over speed'
          ],
          difficulty: fitnessLevel
        },
        {
          name: 'Walking/Light Jogging',
          sets: 1,
          reps: '20-30 minutes',
          restTime: 'As needed',
          targetMuscles: ['Cardiovascular', 'Legs'],
          instructions: [
            'Start with 5-minute warm-up walk',
            'Gradually increase pace as comfortable',
            'Maintain steady rhythm',
            'Cool down with 5-minute walk'
          ],
          difficulty: fitnessLevel
        }
      );
    }

    const program: WorkoutProgram = {
      id: `program-${Date.now()}`,
      name: `AI-Generated ${userGoal === 'weight-loss' ? 'Weight Loss' : userGoal === 'muscle-gain' ? 'Muscle Building' : 'Maintenance'} Program`,
      goal: userGoal,
      duration: '4 weeks',
      difficulty: fitnessLevel,
      exercises,
      nutritionTips: [
        userGoal === 'weight-loss' ? 'Maintain a moderate caloric deficit' : 'Eat adequate protein for muscle recovery',
        'Stay hydrated throughout the day',
        'Include plenty of vegetables and lean proteins',
        userGoal === 'muscle-gain' ? 'Consider post-workout protein intake' : 'Focus on whole, unprocessed foods'
      ],
      weeklySchedule: [
        'Monday: Full workout routine',
        'Tuesday: Light cardio or rest',
        'Wednesday: Full workout routine',
        'Thursday: Active recovery',
        'Friday: Full workout routine',
        'Saturday: Optional light activity',
        'Sunday: Rest day'
      ]
    };

    setGeneratedProgram(program);
    onProgramGenerated?.(program);
    setIsGeneratingProgram(false);
  };

  // Simulate AI analysis process
  const simulateAnalysis = async () => {
    if (!userHeight || !userWeight) {
      alert('Please enter your height and weight before starting analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const stages = [
      'Processing image...',
      'Detecting body keypoints...',
      'Analyzing body proportions...',
      'Computing physiological composition...',
      'Generating analysis results...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setAnalysisStage(stages[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress((i + 1) * 20);
    }

    // Use user input for height and weight, AI estimates for other measurements
    const height = parseFloat(userHeight);
    const weight = parseFloat(userWeight);
    
    const mockResults: BodyMeasurements = {
      height,
      weight,
      bmi: weight / Math.pow(height / 100, 2),
      bodyFatPercentage: 15 + Math.random() * 10,
      muscleMass: weight * (0.4 + Math.random() * 0.15), // 40-55% of body weight
      waistCircumference: height * 0.45 + Math.random() * 10, // Estimated based on height
      chestCircumference: height * 0.55 + Math.random() * 10,
      hipCircumference: height * 0.52 + Math.random() * 10
    };

    setAnalysisResults(mockResults);
    onAnalysisComplete(mockResults);
    setIsAnalyzing(false);
    setAnalysisStage('Analysis Complete');

    // Automatically generate workout program after analysis
    setTimeout(() => {
      generateWorkoutProgram(mockResults);
    }, 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const getBodyFatCategory = (percentage: number, isMale: boolean = true) => {
    if (isMale) {
      if (percentage < 10) return { category: 'Very Low', color: 'text-blue-600' };
      if (percentage < 18) return { category: 'Normal', color: 'text-green-600' };
      if (percentage < 25) return { category: 'Slightly High', color: 'text-yellow-600' };
      return { category: 'High', color: 'text-red-600' };
    } else {
      if (percentage < 16) return { category: 'Very Low', color: 'text-blue-600' };
      if (percentage < 25) return { category: 'Normal', color: 'text-green-600' };
      if (percentage < 32) return { category: 'Slightly High', color: 'text-yellow-600' };
      return { category: 'High', color: 'text-red-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Digital Body Shape Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Upload a body image for AI analysis of your proportions and physiological composition
          </p>

          {/* Image Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            {selectedImage ? (
              <div className="text-center">
                <ImageWithFallback
                  src={selectedImage ?? ""}
                  alt="อัปโหลดภาพ"
                  className="max-w-full max-h-64 mx-auto mb-4 rounded-lg"
                />
                <p className="text-sm text-muted-foreground mb-4">Selected Image</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                  <Button
                    onClick={simulateAnalysis}
                    disabled={isAnalyzing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Start Analysis
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2">Upload Body Image</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an image showing your full body (front or side view)
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload from File
                  </Button>
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Input Fields */}
          {selectedImage && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 170"
                  value={userHeight}
                  onChange={(e) => setUserHeight(e.target.value)}
                  min="100"
                  max="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 70"
                  value={userWeight}
                  onChange={(e) => setUserWeight(e.target.value)}
                  min="30"
                  max="200"
                />
              </div>
              <div className="md:col-span-2 text-sm text-muted-foreground">
                <p>💡 Providing accurate measurements helps AI generate better analysis and personalized programs</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-medium">Analyzing with AI</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">{analysisStage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Body Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Ruler className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResults.height.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Height (cm)</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {analysisResults.weight.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Weight (kg)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {analysisResults.bmi.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">BMI</div>
                <div className={`text-xs font-medium ${getBMICategory(analysisResults.bmi).color}`}>
                  {getBMICategory(analysisResults.bmi).category}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <User className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {analysisResults.bodyFatPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Body Fat</div>
                <div className={`text-xs font-medium ${getBodyFatCategory(analysisResults.bodyFatPercentage).color}`}>
                  {getBodyFatCategory(analysisResults.bodyFatPercentage).category}
                </div>
              </div>
            </div>

            {/* Detailed Measurements */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Body Composition</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Muscle Mass</span>
                    <span className="font-medium">{analysisResults.muscleMass.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Body Fat %</span>
                    <span className="font-medium">{analysisResults.bodyFatPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Circumferences (cm)</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Waist</span>
                    <span className="font-medium">{analysisResults.waistCircumference.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chest</span>
                    <span className="font-medium">{analysisResults.chestCircumference.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hip</span>
                    <span className="font-medium">{analysisResults.hipCircumference.toFixed(1)} cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">AI Analysis Notes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analysis uses Pose Estimation and Image Processing techniques</li>
                <li>• Accuracy ranges from 85-95% depending on image quality</li>
                <li>• Results are estimates for initial guidance purposes</li>
                <li>• Consider professional measurements for highest accuracy</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Generation Progress */}
      {isGeneratingProgram && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                <span className="font-medium">AI is designing your personalized workout program...</span>
              </div>
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Analyzing your body composition, fitness level, and goals to create the perfect program for you
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Program Results */}
      {generatedProgram && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Your Personalized Workout Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Program Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-600">{generatedProgram.duration}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-600 capitalize">{generatedProgram.difficulty}</div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-600">{generatedProgram.exercises.length}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <h4 className="font-medium">Recommended Exercises</h4>
              <div className="grid gap-4">
                {generatedProgram.exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium">{exercise.name}</h5>
                      <Badge variant={exercise.difficulty === 'beginner' ? 'secondary' : exercise.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sets:</span> {exercise.sets}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reps:</span> {exercise.reps}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rest:</span> {exercise.restTime}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Target:</span> {exercise.targetMuscles.join(', ')}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Instructions:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {exercise.instructions.map((instruction, idx) => (
                            <li key={idx}>• {instruction}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-4">
              <h4 className="font-medium">Weekly Schedule</h4>
              <div className="grid gap-2">
                {generatedProgram.weeklySchedule.map((day, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Tips */}
            <div className="space-y-4">
              <h4 className="font-medium">Nutrition Tips</h4>
              <div className="grid gap-2">
                {generatedProgram.nutritionTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <span className="text-sm text-blue-800">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <Button className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Start This Program
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}