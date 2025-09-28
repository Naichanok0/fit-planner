import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { ExerciseDetector } from './components/ExerciseDetector';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgressDashboard } from './components/ProgressDashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { BodyAnalysis } from './components/BodyAnalysis';
import { NutritionPlanner } from './components/NutritionPlanner';
import { PersonalProgram } from './components/PersonalProgram';
import { UserProfile } from './components/UserProfile';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { 
  Camera, 
  Activity, 
  BarChart3, 
  Timer, 
  Brain, 
  Zap,
  Target,
  TrendingUp,
  Scan,
  Apple,
  User,
  Dumbbell,
  LogOut
} from 'lucide-react';

interface SessionData {
  exercise: string;
  reps: number;
  duration: number;
  caloriesBurned: number;
  avgFormScore: number;
  timestamp: Date;
}

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

interface UserData {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  joinDate: Date;
  lastLogin: Date;
}

function MainApp() {
  const { user, logout } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('push-ups');
  const [totalReps, setTotalReps] = useState(247);
  const [currentStreak, setCurrentStreak] = useState(5);
  const [formFeedback, setFormFeedback] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(null);

  const handleRepCount = (count: number) => {
    setTotalReps(prev => Math.max(prev, prev - (prev % 100) + count));
  };

  const handleFormFeedback = (feedback: string[]) => {
    setFormFeedback(feedback);
  };

  const handleSessionComplete = (sessionData: SessionData) => {
    setSessions(prev => [...prev, sessionData]);
    setTotalReps(prev => prev + sessionData.reps);
    
    // Update streak logic would go here
    if (sessionData.reps > 0) {
      setCurrentStreak(prev => prev + 1);
    }
  };

  const handleAnalysisComplete = (measurements: BodyMeasurements) => {
    setBodyMeasurements(measurements);
  };

  const handleUpdateProfile = (data: Partial<UserData>) => {
    // This will be handled by the auth context in the authenticated app
  };

  const handleSecurityUpdate = () => {
    console.log('Security settings updated');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Health App</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered body analysis and personalized programs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="text-sm text-muted-foreground">Today's Progress</div>
                <div className="font-semibold">{totalReps} reps • {currentStreak} day streak</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Welcome, {user?.firstName}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="body-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="body-analysis" className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Body Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="personal-program" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Programs</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              <span className="hidden sm:inline">Nutrition</span>
            </TabsTrigger>
            <TabsTrigger value="detector" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">AI Detection</span>
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Session</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Body Analysis Tab */}
          <TabsContent value="body-analysis">
            <BodyAnalysis 
              onAnalysisComplete={handleAnalysisComplete}
              userGoal={user?.goal || 'maintenance'}
              fitnessLevel={user?.fitnessLevel || 'beginner'}
            />
          </TabsContent>

          {/* Personal Program Tab */}
          <TabsContent value="personal-program">
            <PersonalProgram 
              userGoal={user?.goal || 'maintenance'}
              bodyMeasurements={bodyMeasurements || undefined}
              fitnessLevel={user?.fitnessLevel || 'beginner'}
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <NutritionPlanner 
              userGoal={user?.goal || 'maintenance'}
              bodyMeasurements={bodyMeasurements || undefined}
            />
          </TabsContent>

          {/* AI Detection Tab */}
          <TabsContent value="detector" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExerciseDetector 
                  selectedExercise={selectedExercise}
                  onRepCount={handleRepCount}
                  onFormFeedback={handleFormFeedback}
                />
              </div>
              <div className="space-y-4">
                {/* Current Exercise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Exercise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">
                        {selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        AI detection ready
                      </p>
                      <Badge variant="outline">Selected</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Feedback */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Live Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formFeedback.length > 0 ? (
                      <div className="space-y-2">
                        {formFeedback.map((feedback, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{feedback}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start detection to see AI feedback</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary">{totalReps}</div>
                        <div className="text-xs text-muted-foreground">Total Reps</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">{currentStreak}</div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Exercise Library Tab */}
          <TabsContent value="library">
            <ExerciseLibrary 
              selectedExercise={selectedExercise}
              onSelectExercise={setSelectedExercise}
            />
          </TabsContent>

          {/* Workout Session Tab */}
          <TabsContent value="session">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WorkoutSession 
                  selectedExercise={selectedExercise}
                  totalReps={totalReps}
                  onSessionComplete={handleSessionComplete}
                />
              </div>
              <div className="space-y-4">
                {/* Session Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Session History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions.length > 0 ? (
                      <div className="space-y-3">
                        {sessions.slice(-3).reverse().map((session, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">
                                {session.exercise.charAt(0).toUpperCase() + session.exercise.slice(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {session.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Reps:</span> {session.reps}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time:</span> {Math.floor(session.duration / 60)}m
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cal:</span> {session.caloriesBurned}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No sessions completed yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Workout Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>Start with proper warm-up exercises</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span>Focus on form over speed for better results</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                        <span>Use AI feedback to improve your technique</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <ProgressDashboard 
              totalReps={totalReps}
              currentStreak={currentStreak}
              formFeedback={formFeedback}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {user ? (
              <UserProfile 
                userData={{
                  ...user,
                  phone: user.phone || '' // เพิ่ม property phone ให้ตรง type
                }}
                onUpdateProfile={handleUpdateProfile}
                onSecurityUpdate={handleSecurityUpdate}
              />
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No user data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AuthFlow() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  switch (authMode) {
    case 'register':
      return <RegisterForm onToggleMode={setAuthMode} />;
    case 'forgot-password':
      return <ForgotPasswordForm onToggleMode={setAuthMode} />;
    default:
      return <LoginForm onToggleMode={setAuthMode} />;
  }
}

export default function App() {
  // Force dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  return <MainApp />;
}