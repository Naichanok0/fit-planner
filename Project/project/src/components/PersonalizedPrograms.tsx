import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  CheckCircle, 
  PlayCircle,
  User,
  TrendingUp,
  Utensils,
  Droplets,
  Trophy
} from 'lucide-react';

interface DatasetWorkout {
  id: string;
  name: string;
  duration: number;
  targetMuscles: string[];
  estimatedCalories: number;
  exercises: Exercise[];
  note?: string;
}

interface DatasetDay {
  day: string;
  workout: DatasetWorkout;
  meals: Meal[];
  water: number;
  note?: string;
}

interface DatasetProgram {
  image: string;
  goal: string;
  weeklySchedule: DatasetDay[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  description: string;
  completed?: boolean;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    water: number;
  };
  foods: string[];
  note?: string;
}

interface Workout {
  id: string;
  name: string;
  duration: number;
  targetMuscles: string[];
  estimatedCalories: number;
  exercises: Exercise[];
  note?: string;
}

interface DayProgram {
  day: string;
  workout: Workout;
  meals: Meal[];
  water: number;
  note?: string;
  completed?: boolean;
  completionRate?: number;
}

interface UserBodyType {
  image: string;
  detectedType: 'slim' | 'average' | 'muscular' | 'heavy';
  confidence: number;
}

interface PersonalizedProgramsProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  bodyType?: UserBodyType;
}

export function PersonalizedPrograms({ userGoal, bodyType }: PersonalizedProgramsProps) {
  const [weeklyProgram, setWeeklyProgram] = useState<DayProgram[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load program data from dataset
  useEffect(() => {
    const loadProgramData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/backend/dataset/metadata.json');
        if (response.ok) {
          const dataset = await response.json();
          
          // Find the program that matches the user's goal
          const matchingProgram = dataset.find((program: DatasetProgram) => 
            program.image === 'men/1.png' && program.goal === userGoal
          );

          if (matchingProgram && matchingProgram.weeklySchedule) {
            const formattedProgram = matchingProgram.weeklySchedule.map((dayData: DatasetDay) => ({
              day: dayData.day,
              workout: {
                id: dayData.workout.id,
                name: dayData.workout.name,
                duration: dayData.workout.duration,
                targetMuscles: dayData.workout.targetMuscles || [],
                estimatedCalories: dayData.workout.estimatedCalories || 0,
                exercises: dayData.workout.exercises || [],
                note: dayData.workout.note
              },
              meals: dayData.meals || [],
              water: dayData.water || 2.0,
              note: dayData.note,
              completed: false,
              completionRate: 0
            }));
            setWeeklyProgram(formattedProgram);
          } else {
            // Fallback to default data if no matching program found
            setWeeklyProgram(getDefaultProgram());
          }
        } else {
          console.error('Failed to fetch dataset');
          setWeeklyProgram(getDefaultProgram());
        }
      } catch (error) {
        console.error('Error loading program data:', error);
        setWeeklyProgram(getDefaultProgram());
      } finally {
        setIsLoading(false);
      }
    };

    loadProgramData();
  }, [userGoal]);

  // Fallback program if dataset fails to load
  const getDefaultProgram = (): DayProgram[] => {
    return [
      {
        day: 'Monday',
        workout: {
          id: 'default-1',
          name: 'วันที่ 1: Basic Workout',
          duration: 30,
          targetMuscles: ['ทั้งตัว'],
          estimatedCalories: 200,
          exercises: [
            { name: 'Push-ups', sets: 3, reps: '10-15', rest: 60, description: 'วิดพื้นมาตรฐาน' },
            { name: 'Squats', sets: 3, reps: '10-15', rest: 60, description: 'สควอทมาตรฐาน' }
          ]
        },
        meals: [],
        water: 2.0,
        completed: false,
        completionRate: 0
      }
    ];
  };

  const handleCompleteExercise = (dayName: string, exerciseName: string) => {
    setWeeklyProgram(prev => prev.map(day => {
      if (day.day === dayName) {
        const updatedExercises = day.workout.exercises.map(ex =>
          ex.name === exerciseName ? { ...ex, completed: true } : ex
        );
        const completedCount = updatedExercises.filter(ex => ex.completed).length;
        const completionRate = (completedCount / updatedExercises.length) * 100;
        
        return {
          ...day,
          workout: { ...day.workout, exercises: updatedExercises },
          completionRate,
          completed: completionRate === 100
        };
      }
      return day;
    }));
  };

  const handleResetDay = (dayName: string) => {
    setWeeklyProgram(prev => prev.map(day => {
      if (day.day === dayName) {
        const resetExercises = day.workout.exercises.map(ex => ({
          ...ex,
          completed: false
        }));
        return {
          ...day,
          workout: { ...day.workout, exercises: resetExercises },
          completionRate: 0,
          completed: false
        };
      }
      return day;
    }));
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'maintenance': return 'รักษาสุขภาพ';
      default: return 'รักษาสุขภาพ';
    }
  };

  const getBodyTypeText = (type: string) => {
    switch (type) {
      case 'slim': return 'ผอม';
      case 'average': return 'ปกติ';
      case 'muscular': return 'กล้ามใหญ่';
      case 'heavy': return 'อ้วน';
      default: return 'ปกติ';
    }
  };

  const selectedDayData = weeklyProgram.find(day => day.day === selectedDay);
  const weekProgress = weeklyProgram.length > 0 ? 
    weeklyProgram.reduce((acc, day) => acc + (day.completionRate || 0), 0) / weeklyProgram.length : 0;
  const completedDays = weeklyProgram.filter(day => day.completed).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">กำลังโหลดโปรแกรมจาก Dataset...</span>
            </div>
            <p className="text-gray-500">กรุณารอสักครู่</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Analysis */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Target className="w-8 h-8" />
              โปรแกรมออกแบบเฉพาะตัว
            </h1>
            <p className="text-emerald-100 mb-3">
              ปรับแต่งตามรูปร่างและเป้าหมายของคุณด้วย AI จาก Dataset จริง
            </p>
            <div className="flex gap-4 items-center">
              <Badge variant="secondary" className="bg-white/20 text-white flex items-center gap-1">
                <User className="w-3 h-3" />
                รูปร่าง: {bodyType ? getBodyTypeText(bodyType.detectedType) : 'ยังไม่ระบุ'}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                เป้าหมาย: {getGoalText(userGoal)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100 mb-1">ความคืบหน้าสัปดาห์ที่ 1</div>
            <div className="text-3xl font-bold">{weekProgress.toFixed(0)}%</div>
            <div className="text-xs text-emerald-200">{completedDays}/7 วัน</div>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            โปรแกรม 7 วัน
          </CardTitle>
          <CardDescription>
            เลือกวันที่ต้องการดูรายละเอียด (ข้อมูลจาก Dataset จริง)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgram.map((day, index) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`p-4 rounded-lg text-center transition-all hover:scale-105 ${
                  selectedDay === day.day
                    ? 'bg-blue-600 text-white shadow-lg'
                    : day.completed
                    ? 'bg-green-100 text-green-800 border-2 border-green-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'][index]}
                </div>
                <div className="font-medium text-sm mb-2">
                  {day.day === 'Monday' ? 'จันทร์' :
                   day.day === 'Tuesday' ? 'อังคาร' :
                   day.day === 'Wednesday' ? 'พุธ' :
                   day.day === 'Thursday' ? 'พฤหัส' :
                   day.day === 'Friday' ? 'ศุกร์' :
                   day.day === 'Saturday' ? 'เสาร์' : 'อาทิตย์'}
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  {day.workout.name.split(':')[1]?.trim() || day.workout.name}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{day.workout.duration}นาที</span>
                </div>
                {day.completed && (
                  <div className="mt-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                  </div>
                )}
                {day.completionRate && day.completionRate > 0 && !day.completed && (
                  <div className="mt-2">
                    <Progress value={day.completionRate} className="h-2" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="workout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workout" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Workout
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* Workout Tab */}
        <TabsContent value="workout">
          {selectedDayData && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {selectedDayData.workout.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedDayData.workout.duration} นาที
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {selectedDayData.workout.estimatedCalories} แคลอรี่
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {selectedDayData.workout.targetMuscles.join(', ')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetDay(selectedDay)}
                    className="text-red-600 hover:text-red-700"
                  >
                    รีเซ็ต
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDayData.workout.exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      exercise.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{exercise.name}</h4>
                        <p className="text-gray-600 text-sm">{exercise.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={exercise.completed ? "default" : "outline"}
                        onClick={() => handleCompleteExercise(selectedDay, exercise.name)}
                        className={exercise.completed ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {exercise.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-medium text-blue-800">{exercise.sets}</div>
                        <div className="text-blue-600">เซ็ต</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-800">{exercise.reps}</div>
                        <div className="text-green-600">ครั้ง</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-medium text-purple-800">{exercise.rest}</div>
                        <div className="text-purple-600">วินาที</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {selectedDayData.workout.note && (
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-blue-800 text-sm">
                      <strong>หมายเหตุ:</strong> {selectedDayData.workout.note}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition">
          {selectedDayData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  แผนโภชนาการ - {selectedDay}
                </CardTitle>
                <CardDescription>
                  จากข้อมูล Dataset เป้าหมาย: {getGoalText(userGoal)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDayData.meals.length > 0 ? (
                  selectedDayData.meals.map((meal, _index) => (
                    <div key={meal.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{meal.name}</h4>
                          <p className="text-gray-600 text-sm">เวลา: {meal.time}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            {meal.nutrition.calories} แคลอรี่
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
                        <div className="text-center p-2 bg-red-100 rounded">
                          <div className="font-medium text-red-800">{meal.nutrition.protein}g</div>
                          <div className="text-red-600">โปรตีน</div>
                        </div>
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <div className="font-medium text-blue-800">{meal.nutrition.carbs}g</div>
                          <div className="text-blue-600">คาร์บ</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-100 rounded">
                          <div className="font-medium text-yellow-800">{meal.nutrition.fat}g</div>
                          <div className="text-yellow-600">ไขมัน</div>
                        </div>
                        <div className="text-center p-2 bg-green-100 rounded">
                          <div className="font-medium text-green-800">{meal.nutrition.fiber}g</div>
                          <div className="text-green-600">ไฟเบอร์</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h5 className="font-medium mb-2">อาหารที่แนะนำ:</h5>
                        <div className="flex flex-wrap gap-2">
                          {meal.foods.map((food, foodIndex) => (
                            <Badge key={foodIndex} variant="outline" className="text-xs">
                              {food}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {meal.note && (
                        <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>หมายเหตุ:</strong> {meal.note}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลโภชนาการสำหรับวันนี้</p>
                    <p className="text-sm">กรุณารับประทานอาหารตามหลัก 5 หมู่</p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">เป้าหมายน้ำ</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {selectedDayData.water} ลิตร/วัน
                  </div>
                  <p className="text-blue-600 text-sm">ดื่มน้ำให้ครบตามเป้าหมาย</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ความคืบหน้าของคุณ
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>ความคืบหน้าสัปดาห์</span>
                  <span>{weekProgress.toFixed(1)}%</span>
                </div>
                <Progress value={weekProgress} className="h-3" />
                <div className="text-xs text-gray-500 mt-1">
                  เสร็จสิ้น {completedDays} จาก 7 วัน
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {weeklyProgram.filter(day => day.completed).length}
                  </div>
                  <div className="text-sm text-green-600">วันที่เสร็จสมบูรณ์</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {weeklyProgram.reduce((sum, day) => sum + day.workout.duration, 0)}
                  </div>
                  <div className="text-sm text-blue-600">นาทีทั้งหมด</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {weeklyProgram.reduce((sum, day) => sum + day.workout.estimatedCalories, 0)}
                  </div>
                  <div className="text-sm text-purple-600">แคลอรี่เผาผลาญรวม</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}