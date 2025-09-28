import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Timer, 
  Target,
  Zap,
  Activity
} from 'lucide-react';

interface WorkoutSessionProps {
  selectedExercise: string;
  totalReps: number;
  onSessionComplete: (sessionData: SessionData) => void;
}

interface SessionData {
  exercise: string;
  reps: number;
  duration: number;
  caloriesBurned: number;
  avgFormScore: number;
  timestamp: Date;
}

export function WorkoutSession({ selectedExercise, totalReps, onSessionComplete }: WorkoutSessionProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionReps, setSessionReps] = useState(0);
  const [targetReps, setTargetReps] = useState(20);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [sets, setSets] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);

  const exerciseCalories = {
    'push-ups': 8,
    'squats': 12,
    'planks': 5,
    'burpees': 20,
    'lunges': 10,
    'jumping-jacks': 15
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && !isPaused && !isResting) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else if (isResting) {
      interval = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setIsResting(false);
            setRestTime(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, isResting]);

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseSession = () => {
    setIsPaused(!isPaused);
  };

  const stopSession = () => {
    const calorieRate = exerciseCalories[selectedExercise as keyof typeof exerciseCalories] || 10;
    const caloriesBurned = Math.round((sessionTime / 60) * calorieRate);
    
    const sessionData: SessionData = {
      exercise: selectedExercise,
      reps: sessionReps,
      duration: sessionTime,
      caloriesBurned,
      avgFormScore: Math.random() * 20 + 80, // Mock form score 80-100%
      timestamp: new Date()
    };

    onSessionComplete(sessionData);
    resetSession();
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setSessionTime(0);
    setSessionReps(0);
    setRestTime(0);
    setIsResting(false);
    setCurrentSet(1);
  };

  const completeSet = () => {
    if (currentSet < sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTime(30); // 30 second rest
    } else {
      stopSession();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (sessionReps / targetReps) * 100;
  const calorieRate = exerciseCalories[selectedExercise as keyof typeof exerciseCalories] || 10;
  const estimatedCalories = Math.round((sessionTime / 60) * calorieRate);

  return (
    <div className="space-y-6">
      {/* Session Timer and Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Workout Session
            </span>
            <Badge variant={isActive ? (isPaused ? "secondary" : "default") : "outline"}>
              {isResting ? "Resting" : isActive ? (isPaused ? "Paused" : "Active") : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Timer */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-primary mb-2">
              {isResting ? formatTime(restTime) : formatTime(sessionTime)}
            </div>
            <p className="text-muted-foreground">
              {isResting ? "Rest Time" : "Session Time"}
            </p>
          </div>

          {/* Current Exercise Info */}
          <div className="text-center bg-muted/50 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">
              {selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)}
            </h3>
            <p className="text-muted-foreground">
              Set {currentSet} of {sets}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Rep Progress</span>
              <span>{sessionReps} / {targetReps}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{sessionReps}</div>
              <div className="text-sm text-muted-foreground">Reps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currentSet}</div>
              <div className="text-sm text-muted-foreground">Current Set</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{estimatedCalories}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessionTime > 0 ? Math.round((sessionReps / sessionTime) * 60) : 0}
              </div>
              <div className="text-sm text-muted-foreground">RPM</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startSession} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            ) : (
              <>
                <Button onClick={pauseSession} variant="outline" className="flex-1">
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={stopSession} variant="destructive" className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            <Button onClick={resetSession} variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Session Settings */}
          {!isActive && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Session Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Reps</label>
                  <input
                    type="number"
                    value={targetReps}
                    onChange={(e) => setTargetReps(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sets</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSessionReps(prev => prev + 1)}
              disabled={!isActive || isPaused || isResting}
            >
              <Target className="w-4 h-4 mr-2" />
              +1 Rep
            </Button>
            <Button 
              variant="outline" 
              onClick={completeSet}
              disabled={!isActive || sessionReps < targetReps}
            >
              <Activity className="w-4 h-4 mr-2" />
              Complete Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {formatTime(restTime)}
            </div>
            <p className="text-orange-700">Rest between sets</p>
            <Button 
              onClick={() => {setIsResting(false); setRestTime(0);}} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Skip Rest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}