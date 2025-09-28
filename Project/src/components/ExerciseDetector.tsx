import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Camera, Square, Play, Pause } from 'lucide-react';

interface ExerciseDetectorProps {
  selectedExercise: string;
  onRepCount: (count: number) => void;
  onFormFeedback: (feedback: string[]) => void;
}

export function ExerciseDetector({ selectedExercise, onRepCount, onFormFeedback }: ExerciseDetectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [formScore, setFormScore] = useState(85);
  const [currentPhase, setCurrentPhase] = useState('ready');
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const exerciseData = {
    'push-ups': { target: 'Chest, Triceps, Shoulders', difficulty: 'Beginner' },
    'squats': { target: 'Legs, Glutes', difficulty: 'Beginner' },
    'planks': { target: 'Core', difficulty: 'Intermediate' },
    'burpees': { target: 'Full Body', difficulty: 'Advanced' },
    'lunges': { target: 'Legs, Glutes', difficulty: 'Intermediate' }
  };

  useEffect(() => {
    if (isActive) {
      // Simulate AI detection updates
      intervalRef.current = setInterval(() => {
        setConfidence(Math.random() * 30 + 70); // 70-100% confidence
        
        // Simulate exercise phases
        const phases = ['down', 'bottom', 'up', 'top'];
        const randomPhase = phases[Math.floor(Math.random() * phases.length)];
        setCurrentPhase(randomPhase);
        
        // Simulate rep counting
        if (Math.random() > 0.85 && randomPhase === 'top') {
          const newCount = repCount + 1;
          setRepCount(newCount);
          onRepCount(newCount);
        }
        
        // Simulate form feedback
        const feedback = [];
        if (Math.random() > 0.7) {
          const feedbackOptions = [
            'Keep your back straight',
            'Great form!',
            'Slow down the movement',
            'Go deeper on the descent',
            'Maintain core engagement'
          ];
          feedback.push(feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]);
        }
        onFormFeedback(feedback);
        
        // Update form score
        setFormScore(Math.max(60, Math.min(100, formScore + (Math.random() - 0.5) * 10)));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, repCount, formScore, onRepCount, onFormFeedback]);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback for demo - just start the simulation
      setIsActive(true);
    }
  };

  const stopDetection = () => {
    setIsActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const resetSession = () => {
    setRepCount(0);
    setFormScore(85);
    setCurrentPhase('ready');
    onRepCount(0);
  };

  const currentExercise = exerciseData[selectedExercise as keyof typeof exerciseData];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Exercise Detection</span>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera Feed */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Camera Ready</p>
                <p className="text-sm opacity-75">Click start to begin detection</p>
              </div>
            </div>
          )}
          
          {/* AI Overlay */}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-sm">
                  Detecting: {selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)}
                </div>
                <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm">
                  Confidence: {confidence.toFixed(0)}%
                </div>
                <div className="bg-purple-500/90 text-white px-3 py-1 rounded-full text-sm">
                  Phase: {currentPhase}
                </div>
              </div>
              
              {/* Skeleton overlay simulation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-green-400 rounded-lg opacity-50"></div>
              </div>
            </div>
          )}
        </div>

        {/* Exercise Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{repCount}</div>
            <div className="text-sm text-muted-foreground">Reps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formScore}%</div>
            <div className="text-sm text-muted-foreground">Form Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{currentExercise?.target || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Target</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{currentExercise?.difficulty || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </div>
        </div>

        {/* Form Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Form Quality</span>
            <span>{formScore}%</span>
          </div>
          <Progress value={formScore} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startDetection} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Start Detection
            </Button>
          ) : (
            <Button onClick={stopDetection} variant="destructive" className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              Stop Detection
            </Button>
          )}
          <Button onClick={resetSession} variant="outline">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}