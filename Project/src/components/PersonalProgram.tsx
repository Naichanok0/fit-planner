import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Target, 
  Clock, 
  TrendingUp, 
  Calendar,
  PlayCircle,
  CheckCircle,
  Star,
  Zap,
  Activity,
  User,
  BarChart3
} from 'lucide-react';

interface BodyMeasurements {
  height: number;
  weight: number;
  bmi: number;
  bodyFatPercentage: number;
  muscleMass: number;
}

interface PersonalProgramProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  bodyMeasurements?: BodyMeasurements;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface WorkoutPlan {
  id: string;
  name: string;
  duration: number;
  difficulty: string;
  exercises: Exercise[];
  targetMuscles: string[];
  estimatedCalories: number;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  description: string;
}

export function PersonalProgram({ userGoal, bodyMeasurements, fitnessLevel }: PersonalProgramProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);

  // Generate personalized program based on user data
  const generatePersonalizedProgram = () => {
    const basePrograms = {
      'weight-loss': {
        focus: 'การเผาผลาญแคลอรี่และการออกกำลังกายแบบ HIIT',
        workoutsPerWeek: 5,
        duration: 45,
        intensity: 'สูง'
      },
      'muscle-gain': {
        focus: 'การสร้างกล้ามเนื้อและการยกน้ำหนัก',
        workoutsPerWeek: 4,
        duration: 60,
        intensity: 'ปานกลาง-สูง'
      },
      'maintenance': {
        focus: 'การรักษาสมรรถภาพและความแข็งแรง',
        workoutsPerWeek: 3,
        duration: 45,
        intensity: 'ปานกลาง'
      }
    };

    return basePrograms[userGoal];
  };

  const program = generatePersonalizedProgram();

  const workoutPlans: WorkoutPlan[] = [
    {
      id: 'day1',
      name: 'วันที่ 1: Upper Body Strength',
      duration: 45,
      difficulty: fitnessLevel,
      targetMuscles: ['หน้าอก', 'ไหล่', 'แขน'],
      estimatedCalories: userGoal === 'weight-loss' ? 350 : 280,
      exercises: [
        {
          name: 'Push-ups',
          sets: fitnessLevel === 'beginner' ? 3 : 4,
          reps: fitnessLevel === 'beginner' ? '8-12' : '12-15',
          rest: 60,
          description: 'การวิดพื้นมาตรฐาน เน้นท่าทางที่ถูกต้อง'
        },
        {
          name: 'Pike Push-ups',
          sets: 3,
          reps: '6-10',
          rest: 60,
          description: 'วิดพื้นท่าสามเหลี่ยม เน้นกล้ามเนื้อไหล่'
        },
        {
          name: 'Tricep Dips',
          sets: 3,
          reps: '8-12',
          rest: 60,
          description: 'ใช้เก้าอี้หรือขอบเตียง เน้นกล้ามเนื้อไตรเซ็ปส์'
        },
        {
          name: 'Plank',
          sets: 3,
          reps: '30-60 วินาที',
          rest: 45,
          description: 'ท่าแป้นกบ เสริมสร้างกล้ามเนื้อหลัก'
        }
      ]
    },
    {
      id: 'day2',
      name: 'วันที่ 2: Lower Body Power',
      duration: 40,
      difficulty: fitnessLevel,
      targetMuscles: ['ขา', 'สะโพก', 'ก้น'],
      estimatedCalories: userGoal === 'weight-loss' ? 320 : 260,
      exercises: [
        {
          name: 'Squats',
          sets: fitnessLevel === 'beginner' ? 3 : 4,
          reps: '12-20',
          rest: 60,
          description: 'การนั่งยอง เน้นเทคนิคที่ถูกต้อง'
        },
        {
          name: 'Lunges',
          sets: 3,
          reps: '10-15 แต่ละข้าง',
          rest: 60,
          description: 'การก้าวขาไปข้างหน้า เน้นความสมดุล'
        },
        {
          name: 'Glute Bridges',
          sets: 3,
          reps: '15-20',
          rest: 45,
          description: 'ยกสะโพก เน้นกล้ามเนื้อก้น'
        },
        {
          name: 'Calf Raises',
          sets: 3,
          reps: '15-25',
          rest: 30,
          description: 'ยกส้นเท้า เสริมสร้างกล้ามเนื้อน่อง'
        }
      ]
    },
    {
      id: 'day3',
      name: 'วันที่ 3: HIIT Cardio',
      duration: 30,
      difficulty: fitnessLevel,
      targetMuscles: ['ทั้งร่างกาย', 'หัวใจ'],
      estimatedCalories: userGoal === 'weight-loss' ? 400 : 320,
      exercises: [
        {
          name: 'Burpees',
          sets: 4,
          reps: '5-10',
          rest: 90,
          description: 'ท่าเบอร์ปี้ เป็นการออกกำลังกายแบบเต็มตัว'
        },
        {
          name: 'Mountain Climbers',
          sets: 4,
          reps: '20-30 วินาที',
          rest: 60,
          description: 'วิ่งขึ้นเขา เน้นความเร็วและความทนทาน'
        },
        {
          name: 'Jumping Jacks',
          sets: 4,
          reps: '30-45 วินาที',
          rest: 45,
          description: 'กระโดดแยกขา เสริมสร้างความทนทานหัวใจ'
        },
        {
          name: 'High Knees',
          sets: 4,
          reps: '20-30 วินาที',
          rest: 45,
          description: 'ยกเข่าสูง เน้นความเร็วในการเคลื่อนไหว'
        }
      ]
    }
  ];

  const toggleWorkoutComplete = (workoutId: string) => {
    setCompletedWorkouts(prev => 
      prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const calculateWeekProgress = () => {
    const totalWorkouts = workoutPlans.length;
    const completed = workoutPlans.filter(w => completedWorkouts.includes(w.id)).length;
    return (completed / totalWorkouts) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'เริ่มต้น';
      case 'intermediate': return 'ปานกลาง';
      case 'advanced': return 'สูง';
      default: return 'ปานกลาง';
    }
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      default: return 'รักษาสมดุล';
    }
  };

  return (
    <div className="space-y-6">
      {/* Program Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            โปรแกรมออกกำลังกายเฉพาะบุคคล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Stats */}
          {bodyMeasurements && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{bodyMeasurements.bmi.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">BMI</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{bodyMeasurements.bodyFatPercentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">ไขมัน</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{bodyMeasurements.muscleMass.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">กล้ามเนื้อ (กก.)</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{getDifficultyText(fitnessLevel)}</div>
                <div className="text-sm text-muted-foreground">ระดับ</div>
              </div>
            </div>
          )}

          {/* Program Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">เป้าหมาย: {getGoalText(userGoal)}</h3>
              <Badge className={getDifficultyColor(fitnessLevel)}>
                ระดับ {getDifficultyText(fitnessLevel)}
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">รายละเอียดโปรแกรม</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>เน้น: {program.focus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>ความถี่: {program.workoutsPerWeek} ครั้ง/สัปดาห์</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>ระยะเวลา: {program.duration} นาที/ครั้ง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span>ความหนัก: {program.intensity}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">ความคืบหน้าสัปดาห์นี้</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>เสร็จสิ้น</span>
                    <span>{completedWorkouts.length} / {workoutPlans.length} วัน</span>
                  </div>
                  <Progress value={calculateWeekProgress()} className="h-3" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4" />
                    <span>{calculateWeekProgress().toFixed(0)}% ของเป้าหมายสัปดาห์</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ตารางออกกำลังกายประจำสัปดาห์
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(week => (
                <Button
                  key={week}
                  variant={selectedWeek === week ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(week)}
                >
                  สัปดาห์ {week}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workoutPlans.map((workout) => (
              <Card key={workout.id} className={`border-l-4 ${
                completedWorkouts.includes(workout.id) 
                  ? 'border-l-green-500 bg-green-50' 
                  : 'border-l-blue-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{workout.name}</h4>
                        {completedWorkouts.includes(workout.id) && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{workout.duration} นาที</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>{workout.estimatedCalories} แคลอรี่</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{workout.targetMuscles.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={completedWorkouts.includes(workout.id) ? "secondary" : "default"}
                        onClick={() => toggleWorkoutComplete(workout.id)}
                      >
                        {completedWorkouts.includes(workout.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            เสร็จแล้ว
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            เริ่มออกกำลังกาย
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">รายการท่าออกกำลังกาย:</h5>
                    <div className="grid gap-3">
                      {workout.exercises.map((exercise, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h6 className="font-medium">{exercise.name}</h6>
                            <p className="text-sm text-muted-foreground mb-2">{exercise.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {exercise.sets} เซ็ต
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {exercise.reps} ครั้ง
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                พัก {exercise.rest} วินาที
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            คำแนะนำสำหรับโปรแกรมของคุณ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">เคล็ดลับความสำเร็จ</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>ออกกำลังกายอย่างสม่ำเสมอ อย่างน้อย {program.workoutsPerWeek} ครั้งต่อสัปดาห์</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>เน้นท่าทางที่ถูกต้องมากกว่าความเร็ว</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>พักให้เพียงพอระหว่างเซ็ตและระหว่างวัน</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>ดื่มน้ำเปล่าให้เพียงพอระหว่างออกกำลังกาย</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">การปรับโปรแกรม</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p><strong>สัปดาห์ 1-2:</strong> เน้นการปรับตัวและเรียนรู้ท่าทาง</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p><strong>สัปดาห์ 3-4:</strong> เพิ่มความหนักและจำนวนครั้ง</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p><strong>สัปดาห์ 5+:</strong> ประเมินผลและปรับเป้าหมายใหม่</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}