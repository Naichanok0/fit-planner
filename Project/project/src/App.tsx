import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';

import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgressDashboard } from './components/ProgressDashboard';
import { BodyAnalysis } from './components/BodyAnalysis';
import { NutritionPlanner } from './components/NutritionPlanner';
import { DailyPrograms } from './components/DailyPrograms';
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
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
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
  profilePicture?: string;
}

function MainApp() {
  const { user, logout, updateProfile } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('push-ups');
  const [totalReps, setTotalReps] = useState(247);
  const [currentStreak, setCurrentStreak] = useState(5);
  const [formFeedback, setFormFeedback] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(null);
  const [activeTab, setActiveTab] = useState('body-analysis');

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

  const handleNavigateToProgram = () => {
    setActiveTab('personal-program');
  };

  const handleUpdateProfile = (data: Partial<UserData>) => {
    updateProfile(data);
  };

  const handleSecurityUpdate = () => {
    console.log('Security settings updated');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">AI Health App</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  AI-powered body analysis and personalized programs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden lg:block">
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('th-TH', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="font-semibold text-sm">{totalReps} reps • {currentStreak} day streak</div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={user?.profilePicture} alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback className="text-xs sm:text-sm bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-medium hidden md:inline">
                  {user?.firstName}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-6 gap-1 p-1 bg-muted rounded-lg">
            <TabsTrigger value="body-analysis" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Analysis</span>
              <span className="sm:hidden text-[10px]">Scan</span>
            </TabsTrigger>
            <TabsTrigger value="personal-program" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Programs</span>
              <span className="sm:hidden text-[10px]">Workout</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <Apple className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Nutrition</span>
              <span className="sm:hidden text-[10px]">Food</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Library</span>
              <span className="sm:hidden text-[10px]">Moves</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden text-[10px]">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden text-[10px]">Me</span>
            </TabsTrigger>
          </TabsList>

          {/* Body Analysis Tab */}
          <TabsContent value="body-analysis">
            <BodyAnalysis 
              onAnalysisComplete={handleAnalysisComplete}
              userGoal={user?.goal || 'maintenance'}
              fitnessLevel={user?.fitnessLevel || 'standard'}
              onNavigateToProgram={handleNavigateToProgram}
            />
          </TabsContent>

          {/* Personal Program Tab */}
          <TabsContent value="personal-program">
            <DailyPrograms 
              userGoal={user?.goal || 'maintenance'}
              fitnessLevel={'standard'}
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
  // Use light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
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