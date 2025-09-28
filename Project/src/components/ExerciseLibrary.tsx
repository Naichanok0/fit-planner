import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Target, Timer, Zap } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscles: string[];
  description: string;
  estimatedCalories: number;
  aiAccuracy: number;
}

interface ExerciseLibraryProps {
  selectedExercise: string;
  onSelectExercise: (exerciseId: string) => void;
}

const exercises: Exercise[] = [
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'Upper Body',
    difficulty: 'Beginner',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    description: 'Classic bodyweight exercise targeting chest and arm muscles',
    estimatedCalories: 8,
    aiAccuracy: 95
  },
  {
    id: 'squats',
    name: 'Squats',
    category: 'Lower Body',
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    description: 'Fundamental lower body movement for leg strength',
    estimatedCalories: 12,
    aiAccuracy: 92
  },
  {
    id: 'planks',
    name: 'Planks',
    category: 'Core',
    difficulty: 'Intermediate',
    targetMuscles: ['Core', 'Shoulders', 'Back'],
    description: 'Isometric exercise for core stability and strength',
    estimatedCalories: 5,
    aiAccuracy: 88
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'Full Body',
    difficulty: 'Advanced',
    targetMuscles: ['Full Body', 'Cardiovascular'],
    description: 'High-intensity full-body exercise combining strength and cardio',
    estimatedCalories: 20,
    aiAccuracy: 85
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'Lower Body',
    difficulty: 'Intermediate',
    targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
    description: 'Unilateral leg exercise for balance and strength',
    estimatedCalories: 10,
    aiAccuracy: 90
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'Cardio',
    difficulty: 'Beginner',
    targetMuscles: ['Full Body', 'Cardiovascular'],
    description: 'Classic cardio exercise for warming up and conditioning',
    estimatedCalories: 15,
    aiAccuracy: 93
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'Advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 90) return 'text-green-600';
  if (accuracy >= 80) return 'text-yellow-600';
  return 'text-red-600';
};

export function ExerciseLibrary({ selectedExercise, onSelectExercise }: ExerciseLibraryProps) {
  const categories = [...new Set(exercises.map(ex => ex.category))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Exercise Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Select an exercise to start AI-powered detection and form analysis
          </p>
          
          <div className="grid gap-4">
            {exercises.map((exercise) => (
              <Card 
                key={exercise.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedExercise === exercise.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectExercise(exercise.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">{exercise.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                      {selectedExercise === exercise.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{exercise.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>{exercise.targetMuscles.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span>{exercise.estimatedCalories} cal/min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className={getAccuracyColor(exercise.aiAccuracy)}>
                        {exercise.aiAccuracy}% AI accuracy
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span>Real-time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Library Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{exercises.length}</div>
              <div className="text-sm text-muted-foreground">Total Exercises</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(exercises.reduce((acc, ex) => acc + ex.aiAccuracy, 0) / exercises.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(exercises.reduce((acc, ex) => acc + ex.estimatedCalories, 0) / exercises.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Cal/Min</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}