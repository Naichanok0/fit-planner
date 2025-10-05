import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Clock, Target, Zap, CheckCircle, PlayCircle, RotateCcw } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'balance';
  duration: number; // minutes
  sets?: number;
  reps?: string;
  restTime?: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  targetMuscles: string[];
  instructions: string[];
  caloriesBurn: number;
  completed?: boolean;
}

interface DailyProgram {
  id: string;
  date: Date;
  dayOfWeek: string;
  dayNumber: number; // 1-7
  theme: string;
  totalDuration: number; // minutes
  totalCalories: number;
  exercises: Exercise[];
  isCompleted: boolean;
  completionRate: number; // 0-100
  completedAt?: Date;
}

interface DailyProgramsProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  fitnessLevel: 'standard';
}

export function DailyPrograms({ userGoal, fitnessLevel }: DailyProgramsProps) {
  const [currentPrograms, setCurrentPrograms] = useState<DailyProgram[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [timeUntilNextProgram, setTimeUntilNextProgram] = useState<string>('');

  // Generate daily programs based on user goal
  const generateDailyPrograms = (): DailyProgram[] => {
    const today = new Date();
    const programs: DailyProgram[] = [];
    
    const dayThemes = {
      1: 'FullBody Kickstart',
      2: 'Cardio Power',
      3: 'Upper Body Focus',
      4: 'Active Recovery',
      5: 'Lower Body Strength',
      6: 'HIIT Challenge',
      7: 'Flexibility & Balance'
    };

    const exerciseDatabase: Record<string, Exercise[]> = {
      'weight-loss': [
        {
          id: 'jumping-jacks',
          name: 'Jumping Jacks',
          type: 'cardio',
          duration: 3,
          reps: '30 seconds x 6 rounds',
          restTime: 30,
          difficulty: 'easy',
          targetMuscles: ['Full Body'],
          instructions: [
            'Stand with feet together, arms at sides',
            'Jump while spreading legs shoulder-width apart',
            'Simultaneously raise arms overhead',
            'Jump back to starting position'
          ],
          caloriesBurn: 45
        },
        {
          id: 'mountain-climbers',
          name: 'Mountain Climbers',
          type: 'cardio',
          duration: 2,
          reps: '20 seconds x 6 rounds',
          restTime: 40,
          difficulty: 'medium',
          targetMuscles: ['Core', 'Shoulders', 'Legs'],
          instructions: [
            'Start in plank position',
            'Alternate bringing knees to chest rapidly',
            'Keep core engaged throughout',
            'Maintain steady rhythm'
          ],
          caloriesBurn: 35
        },
        {
          id: 'burpees',
          name: 'Burpees',
          type: 'cardio',
          duration: 4,
          reps: '8-12 reps x 4 rounds',
          restTime: 60,
          difficulty: 'hard',
          targetMuscles: ['Full Body'],
          instructions: [
            'Start standing, then squat down',
            'Place hands on floor, jump feet back to plank',
            'Do a push-up, then jump feet forward',
            'Jump up with arms overhead'
          ],
          caloriesBurn: 80
        }
      ],
      'muscle-gain': [
        {
          id: 'push-ups',
          name: 'Push-ups',
          type: 'strength',
          duration: 4,
          sets: 4,
          reps: '8-12 reps',
          restTime: 90,
          difficulty: 'medium',
          targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
          instructions: [
            'Start in plank position, hands shoulder-width apart',
            'Lower body until chest nearly touches floor',
            'Push back up to starting position',
            'Keep body in straight line throughout'
          ],
          caloriesBurn: 30
        },
        {
          id: 'squats',
          name: 'Bodyweight Squats',
          type: 'strength',
          duration: 3,
          sets: 4,
          reps: '12-15 reps',
          restTime: 75,
          difficulty: 'easy',
          targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower body as if sitting in chair',
            'Keep chest up and knees tracking over toes',
            'Return to standing position'
          ],
          caloriesBurn: 25
        },
        {
          id: 'planks',
          name: 'Plank Hold',
          type: 'strength',
          duration: 3,
          reps: '30-60 seconds x 4 rounds',
          restTime: 60,
          difficulty: 'medium',
          targetMuscles: ['Core', 'Shoulders'],
          instructions: [
            'Start in push-up position',
            'Hold body in straight line',
            'Engage core muscles',
            'Breathe normally while holding'
          ],
          caloriesBurn: 20
        }
      ],
      'maintenance': [
        {
          id: 'walking',
          name: 'Brisk Walking',
          type: 'cardio',
          duration: 15,
          reps: '15 minutes continuous',
          difficulty: 'easy',
          targetMuscles: ['Legs', 'Cardiovascular'],
          instructions: [
            'Maintain a brisk, comfortable pace',
            'Swing arms naturally',
            'Keep posture upright',
            'Breathe rhythmically'
          ],
          caloriesBurn: 60
        },
        {
          id: 'stretching',
          name: 'Full Body Stretching',
          type: 'flexibility',
          duration: 10,
          reps: '30 seconds per stretch',
          difficulty: 'easy',
          targetMuscles: ['Full Body'],
          instructions: [
            'Hold each stretch for 30 seconds',
            'Breathe deeply during stretches',
            'Never bounce while stretching',
            'Stop if you feel pain'
          ],
          caloriesBurn: 15
        }
      ]
    };

    for (let i = 1; i <= 7; i++) {
      const programDate = new Date(today);
      programDate.setDate(today.getDate() + (i - 1));
      
      const dayExercises = exerciseDatabase[userGoal] || exerciseDatabase['maintenance'];
      const selectedExercises = dayExercises.slice(0, Math.min(3, dayExercises.length));
      
      const totalDuration = selectedExercises.reduce((sum, ex) => sum + ex.duration, 0);
      const totalCalories = selectedExercises.reduce((sum, ex) => sum + ex.caloriesBurn, 0);

      programs.push({
        id: `day-${i}`,
        date: programDate,
        dayOfWeek: programDate.toLocaleDateString('th-TH', { weekday: 'long' }),
        dayNumber: i,
        theme: dayThemes[i as keyof typeof dayThemes],
        totalDuration,
        totalCalories,
        exercises: selectedExercises,
        isCompleted: false,
        completionRate: 0
      });
    }

    return programs;
  };

  // Calculate time until next program (midnight)
  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Initialize programs and timer
  useEffect(() => {
    setCurrentPrograms(generateDailyPrograms());
    
    const updateTimer = () => {
      setTimeUntilNextProgram(calculateTimeUntilMidnight());
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [userGoal]);

  // Check for midnight and regenerate programs
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setCurrentPrograms(generateDailyPrograms());
      }
    };
    
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [userGoal]);

  const handleCompleteExercise = (programId: string, exerciseId: string) => {
    setCurrentPrograms(prev => prev.map(program => {
      if (program.id === programId) {
        const updatedExercises = program.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, completed: true } : ex
        );
        const completedCount = updatedExercises.filter(ex => ex.completed).length;
        const completionRate = (completedCount / updatedExercises.length) * 100;
        const isCompleted = completionRate === 100;
        
        return {
          ...program,
          exercises: updatedExercises,
          completionRate,
          isCompleted,
          completedAt: isCompleted ? new Date() : program.completedAt
        };
      }
      return program;
    }));
  };

  const getCurrentDayNumber = () => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today; // Convert Sunday (0) to 7
  };

  const selectedProgram = currentPrograms.find(p => p.dayNumber === selectedDay);

  return (
    <div className="space-y-6">
      {/* Header with countdown */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">โปรแกรมออกกำลังกายรายวัน</h1>
            <p className="text-blue-100">โปรแกรมใหม่ทุกวันสำหรับเป้าหมาย: {userGoal === 'weight-loss' ? 'ลดน้ำหนัก' : userGoal === 'muscle-gain' ? 'เพิ่มกล้ามเนื้อ' : 'รักษาสุขภาพ'}</p>
          </div>
          <div className="text-center">
            <div className="text-sm text-blue-100 mb-1">โปรแกรมใหม่ใน</div>
            <div className="text-2xl font-bold">{timeUntilNextProgram}</div>
            <div className="text-xs text-blue-200">ชั่วโมง:นาที</div>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {currentPrograms.map((program) => (
          <Card 
            key={program.id} 
            className={`cursor-pointer transition-all ${
              selectedDay === program.dayNumber 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : program.isCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : getCurrentDayNumber() === program.dayNumber 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : ''
            }`}
            onClick={() => setSelectedDay(program.dayNumber)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">
                {program.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </div>
              <div className="font-medium text-sm mb-2">{program.dayOfWeek}</div>
              <div className="text-xs text-gray-600 mb-2">{program.theme}</div>
              {program.isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
              ) : getCurrentDayNumber() === program.dayNumber ? (
                <PlayCircle className="w-4 h-4 text-yellow-500 mx-auto" />
              ) : (
                <div className="w-4 h-4 border border-gray-300 rounded-full mx-auto" />
              )}
              <div className="text-xs text-gray-500 mt-1">
                {program.completionRate.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Day Details */}
      {selectedProgram && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    วัน {selectedProgram.dayNumber}: {selectedProgram.theme}
                  </CardTitle>
                  <CardDescription>
                    {selectedProgram.dayOfWeek} - {selectedProgram.date.toLocaleDateString('th-TH')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selectedProgram.isCompleted ? 'default' : 'secondary'} className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedProgram.totalDuration} นาที
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {selectedProgram.totalCalories} แคลอรี่
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${selectedProgram.completionRate}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ความคืบหน้า: {selectedProgram.completionRate.toFixed(0)}%
              </div>
            </CardHeader>
          </Card>

          {/* Exercises */}
          <div className="space-y-4">
            {selectedProgram.exercises.map((exercise, index) => {
              const isCompleted = exercise.completed;
              const isActive = activeExercise === exercise.id;
              
              return (
                <Card key={exercise.id} className={`${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                          )}
                          {exercise.name}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex gap-4 mt-1">
                            <span>🎯 {exercise.targetMuscles.join(', ')}</span>
                            <span>⏱️ {exercise.duration} นาที</span>
                            <span>🔥 {exercise.caloriesBurn} แคลอรี่</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={exercise.difficulty === 'easy' ? 'default' : exercise.difficulty === 'medium' ? 'secondary' : 'destructive'}
                        >
                          {exercise.difficulty === 'easy' ? 'ง่าย' : exercise.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                        </Badge>
                        <Badge variant="outline">
                          {exercise.type === 'cardio' ? 'คาร์ดิโอ' : exercise.type === 'strength' ? 'ความแข็งแกร่ง' : 'ยืดหยุ่น'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">รายละเอียดการออกกำลังกาย:</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>จำนวน:</strong> {exercise.reps}
                          {exercise.sets && ` | ${exercise.sets} เซต`}
                          {exercise.restTime && ` | พัก ${exercise.restTime} วินาที`}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">วิธีการออกกำลังกาย:</h4>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {exercise.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-blue-500 font-medium">{idx + 1}.</span>
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {!isCompleted && (
                          <Button 
                            onClick={() => setActiveExercise(isActive ? null : exercise.id)}
                            variant={isActive ? "secondary" : "outline"}
                            size="sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            {isActive ? 'หยุดชั่วคราว' : 'เริ่มออกกำลังกาย'}
                          </Button>
                        )}
                        
                        <Button 
                          onClick={() => handleCompleteExercise(selectedProgram.id, exercise.id)}
                          disabled={isCompleted}
                          variant={isCompleted ? "secondary" : "default"}
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {isCompleted ? 'เสร็จแล้ว' : 'ทำเสร็จ'}
                        </Button>
                        
                        {isCompleted && (
                          <Button 
                            onClick={() => {
                              setCurrentPrograms(prev => prev.map(program => {
                                if (program.id === selectedProgram.id) {
                                  const updatedExercises = program.exercises.map(ex => 
                                    ex.id === exercise.id ? { ...ex, completed: false } : ex
                                  );
                                  const completedCount = updatedExercises.filter(ex => ex.completed).length;
                                  const completionRate = (completedCount / updatedExercises.length) * 100;
                                  
                                  return {
                                    ...program,
                                    exercises: updatedExercises,
                                    completionRate,
                                    isCompleted: false,
                                    completedAt: undefined
                                  };
                                }
                                return program;
                              }));
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            ทำใหม่
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}