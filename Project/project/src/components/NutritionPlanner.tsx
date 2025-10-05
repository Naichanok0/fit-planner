import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Apple, 
  Clock, 
  Flame,
  ChefHat,
  CheckCircle,
  Coffee,
  UtensilsCrossed,
  Moon,
  RefreshCw,
  Calendar,
  Target,
  Droplets,
  Utensils,
  Trophy
} from 'lucide-react';

interface NutritionPlannerProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  bodyMeasurements?: {
    height: number;
    weight: number;
    bodyFatPercentage: number;
  };
}

interface DatasetMeal {
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

interface DatasetDay {
  day: string;
  workout: {
    id: string;
    name: string;
    duration: number;
  };
  meals: DatasetMeal[];
  water: number;
  note?: string;
}

interface DatasetProgram {
  image: string;
  goal: string;
  weeklySchedule: DatasetDay[];
}

interface WeeklyNutrition {
  day: string;
  meals: DatasetMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterGoal: number;
  completed: boolean;
  completionRate: number;
}

export function NutritionPlanner({ userGoal = 'maintenance' }: NutritionPlannerProps) {
  console.log('🍎 NutritionPlanner component rendering with userGoal:', userGoal);
  const [weeklyNutrition, setWeeklyNutrition] = useState<WeeklyNutrition[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load nutrition data from dataset
  useEffect(() => {
    const loadNutritionData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/backend/dataset/metadata.json');
        if (response.ok) {
          const dataset = await response.json();
          
          console.log('Dataset loaded:', dataset?.length, 'programs');
          console.log('Looking for userGoal:', userGoal);
          
          // Find the program that matches the user's goal
          const matchingProgram = dataset.find((program: DatasetProgram) => 
            program.image === 'men/1.png' && program.goal === userGoal
          );

          console.log('Found matching program:', !!matchingProgram);

          if (matchingProgram && matchingProgram.weeklySchedule) {
            console.log('Weekly schedule found:', matchingProgram.weeklySchedule.length, 'days');
            const formattedNutrition = matchingProgram.weeklySchedule.map((dayData: DatasetDay) => {
              const totalCalories = dayData.meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0);
              const totalProtein = dayData.meals.reduce((sum, meal) => sum + meal.nutrition.protein, 0);
              const totalCarbs = dayData.meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0);
              const totalFat = dayData.meals.reduce((sum, meal) => sum + meal.nutrition.fat, 0);
              const totalFiber = dayData.meals.reduce((sum, meal) => sum + meal.nutrition.fiber, 0);

              return {
                day: dayData.day,
                meals: dayData.meals,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                totalFiber,
                waterGoal: dayData.water,
                completed: false,
                completionRate: 0
              };
            });
            setWeeklyNutrition(formattedNutrition);
          } else {
            console.log('No matching program found, using default data');
            // Fallback to default data if no matching program found
            setWeeklyNutrition(getDefaultNutritionPlan());
          }
        } else {
          console.error('Failed to fetch dataset');
          setWeeklyNutrition(getDefaultNutritionPlan());
        }
      } catch (error) {
        console.error('Error loading nutrition data:', error);
        setWeeklyNutrition(getDefaultNutritionPlan());
      } finally {
        setIsLoading(false);
      }
    };

    loadNutritionData();
  }, [userGoal]);

  const getDefaultNutritionPlan = (): WeeklyNutrition[] => {
    console.log('Creating default nutrition plan...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const result = days.map(day => ({
      day,
      meals: [
        {
          id: 'breakfast',
          name: 'อาหารเช้า',
          time: '07:00',
          nutrition: { calories: 400, protein: 25, carbs: 50, fat: 12, fiber: 5, water: 0.3 },
          foods: ['ข้าวโอ๊ต 1 ถ้วย', 'นมไขมันต่ำ 250ml', 'กล้วย 1 ผล'],
        },
        {
          id: 'lunch',
          name: 'อาหารเที่ยง',
          time: '12:30',
          nutrition: { calories: 600, protein: 40, carbs: 65, fat: 18, fiber: 8, water: 0.5 },
          foods: ['ข้าวกล้อง 1 ถ้วย', 'อกไก่ย่าง 150g', 'ผักรวม 1 ถ้วย'],
        },
        {
          id: 'dinner',
          name: 'อาหารเย็น',
          time: '18:30',
          nutrition: { calories: 550, protein: 35, carbs: 45, fat: 20, fiber: 6, water: 0.5 },
          foods: ['ปลาแซลมอนย่าง 150g', 'มันเทศ 120g', 'สลัดผัก'],
        }
      ],
      totalCalories: 1550,
      totalProtein: 100,
      totalCarbs: 160,
      totalFat: 50,
      totalFiber: 19,
      waterGoal: 2.5,
      completed: false,
      completionRate: 0
    }));
    console.log('Default nutrition plan created:', result.length, 'days');
    return result;
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      case 'maintenance': return 'รักษาน้ำหนัก';
      default: return goal;
    }
  };

  const getMealIcon = (mealId: string) => {
    switch (mealId) {
      case 'breakfast': return Coffee;
      case 'snack_morning': return Apple;
      case 'lunch': return UtensilsCrossed;
      case 'snack_afternoon': return Apple;
      case 'dinner': return Moon;
      default: return ChefHat;
    }
  };

  const selectedDayData = weeklyNutrition.find(day => day.day === selectedDay);
  const weekProgress = weeklyNutrition.reduce((sum, day) => sum + day.completionRate, 0) / 7;

  console.log('Component state:', {
    isLoading,
    weeklyNutritionLength: weeklyNutrition.length,
    selectedDay,
    selectedDayData: !!selectedDayData,
    userGoal
  });

  console.log('Rendering component with isLoading:', isLoading);

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">กำลังโหลดแผนโภชนาการ...</span>
        </div>
      </div>
    );
  }

  // Show weekly nutrition even if no specific day is selected
  if (weeklyNutrition.length === 0) {
    console.log('No nutrition data, showing fallback');
    return (
      <div className="space-y-6 p-6">
        <div className="text-center text-gray-500">
          ไม่พบข้อมูลโภชนาการ กำลังใช้ข้อมูลเริ่มต้น...
        </div>
      </div>
    );
  }

  console.log('Rendering main nutrition component');

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            แผนโภชนาการ 7 วัน
          </CardTitle>
          <CardDescription>
            จากข้อมูล Dataset เป้าหมาย: {getGoalText(userGoal)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyNutrition.map((day, index) => (
              <Button
                key={day.day}
                variant={selectedDay === day.day ? "default" : "outline"}
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => setSelectedDay(day.day)}
              >
                <div className="text-xs font-medium">
                  {day.day.substring(0, 3)}
                </div>
                <div className="text-xs text-gray-500">
                  วันที่ {index + 1}
                </div>
                {day.completed && (
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1" />
                )}
              </Button>
            ))}
          </div>
          
          {/* Weekly Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ความคืบหน้าสัปดาห์</span>
              <span className="text-sm text-gray-500">{Math.round(weekProgress)}%</span>
            </div>
            <Progress value={weekProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDayData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDay} - แผนโภชนาการ
            </CardTitle>
            <CardDescription>
              แคลอรี่รวม: {selectedDayData.totalCalories} kcal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Daily Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">แคลอรี่</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {selectedDayData.totalCalories}
                </div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">โปรตีน</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {Math.round(selectedDayData.totalProtein)}
                </div>
                <div className="text-xs text-gray-500">g</div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">คาร์บ</span>
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(selectedDayData.totalCarbs)}
                </div>
                <div className="text-xs text-gray-500">g</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">น้ำ</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {selectedDayData.waterGoal}
                </div>
                <div className="text-xs text-gray-500">ลิตร</div>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-4">
              {selectedDayData.meals.map((meal) => {
                const Icon = getMealIcon(meal.id);
                return (
                  <Card key={meal.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <CardTitle className="text-lg">{meal.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{meal.time}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Nutrition Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{meal.nutrition.calories}</div>
                          <div className="text-gray-500">แคลอรี่</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{Math.round(meal.nutrition.protein)}g</div>
                          <div className="text-gray-500">โปรตีน</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{Math.round(meal.nutrition.carbs)}g</div>
                          <div className="text-gray-500">คาร์บ</div>
                        </div>
                      </div>

                      {/* Foods */}
                      <div>
                        <h4 className="font-medium mb-2">อาหารแนะนำ:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {meal.foods.map((food, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <ChefHat className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{food}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {meal.note && (
                        <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                          💡 {meal.note}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message if no day selected */}
      {!selectedDayData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>เลือกวันที่ต้องการดูแผนโภชนาการ</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}