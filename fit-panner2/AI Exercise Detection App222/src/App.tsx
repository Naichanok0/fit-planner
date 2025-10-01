import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';

import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgressDashboard } from './components/ProgressDashboard';
import { BodyAnalysis } from './components/BodyAnalysis';
import { NutritionPlanner } from './components/NutritionPlanner';
import { PersonalProgram } from './components/PersonalProgram';
import { UserProfile } from './components/UserProfile';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LanguageProvider } from './components/language/LanguageProvider';
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
import { Toaster } from './components/ui/sonner';

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

interface UserData {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'standard';
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
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('th-TH', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
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
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
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
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Exercise Library</span>
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
              fitnessLevel={user?.fitnessLevel || 'standard'}
            />
          </TabsContent>

          {/* Personal Program Tab */}
          <TabsContent value="personal-program">
            <PersonalProgram 
              userGoal={user?.goal || 'maintenance'}
              bodyMeasurements={bodyMeasurements || undefined}
              fitnessLevel={user?.fitnessLevel || 'standard'}
              selectedExercise={selectedExercise}
              onSelectExercise={setSelectedExercise}
              onSessionComplete={handleSessionComplete}
              totalReps={totalReps}
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <NutritionPlanner 
              userGoal={user?.goal || 'maintenance'}
              bodyMeasurements={bodyMeasurements || undefined}
            />
          </TabsContent>



          {/* Exercise Library Tab */}
          <TabsContent value="library">
            <ExerciseLibrary 
              selectedExercise={selectedExercise}
              onSelectExercise={setSelectedExercise}
            />
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
            <UserProfile 
              userData={user!}
              onUpdateProfile={handleUpdateProfile}
              onSecurityUpdate={handleSecurityUpdate}
            />
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
      <LanguageProvider>
        <AppContent />
        <Toaster />
      </LanguageProvider>
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