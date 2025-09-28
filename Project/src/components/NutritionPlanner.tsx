import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Apple, 
  Target, 
  Clock, 
  Flame,
  Droplets,
  Zap,
  ChefHat,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

interface MealPlan {
  id: string;
  name: string;
  time: string;
  calories: number;
  nutrition: NutritionData;
  foods: string[];
  image?: string;
}

interface NutritionPlannerProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  bodyMeasurements?: {
    height: number;
    weight: number;
    bodyFatPercentage: number;
  };
}

export function NutritionPlanner({ userGoal, bodyMeasurements }: NutritionPlannerProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [dailyIntake, setDailyIntake] = useState<NutritionData>({
    calories: 1250,
    protein: 95,
    carbs: 140,
    fat: 45,
    fiber: 18,
    water: 6.5
  });

  // Calculate nutritional targets based on user data
  const calculateTargets = () => {
    if (!bodyMeasurements) {
      return {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 25,
        water: 8
      };
    }

    const { height, weight, bodyFatPercentage } = bodyMeasurements;
    
    // Calculate BMR using Mifflin-St Jeor equation (simplified for male)
    const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5; // Assuming age 25
    
    let targetCalories = bmr * 1.5; // Moderate activity level
    
    // Adjust based on goal
    switch (userGoal) {
      case 'weight-loss':
        targetCalories *= 0.85; // 15% deficit
        break;
      case 'muscle-gain':
        targetCalories *= 1.15; // 15% surplus
        break;
      default:
        break;
    }

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(weight * 2.2), // 2.2g per kg body weight
      carbs: Math.round(targetCalories * 0.45 / 4), // 45% of calories
      fat: Math.round(targetCalories * 0.25 / 9), // 25% of calories
      fiber: 25,
      water: Math.round(weight * 0.035 * 10) / 10 // 35ml per kg
    };
  };

  const targets = calculateTargets();
  
  const weekDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  
  const sampleMealPlans: MealPlan[] = [
    {
      id: 'breakfast',
      name: 'อาหารเช้า',
      time: '07:00',
      calories: 400,
      nutrition: { calories: 400, protein: 25, carbs: 45, fat: 12, fiber: 6, water: 1.5 },
      foods: ['ข้าวโอ๊ต 1 ถ้วย', 'นมไขมันต่ำ 200ml', 'กล้วยหอม 1 ผล', 'อัลมอนด์ 10 เม็ด']
    },
    {
      id: 'morning-snack',
      name: 'ของว่างเช้า',
      time: '10:00',
      calories: 150,
      nutrition: { calories: 150, protein: 8, carbs: 20, fat: 5, fiber: 3, water: 0.5 },
      foods: ['แอปเปิ้ล 1 ผล', 'โยเกิร์ตกรีก 100g']
    },
    {
      id: 'lunch',
      name: 'อาหารเที่ยง',
      time: '12:30',
      calories: 500,
      nutrition: { calories: 500, protein: 35, carbs: 50, fat: 18, fiber: 8, water: 2 },
      foods: ['ข้าวกล้อง 3/4 ถ้วย', 'ปลาแซลมอนย่าง 120g', 'ผักรวม 1 ถ้วย', 'น้ำมันมะกอก 1 ช้อนชา']
    },
    {
      id: 'afternoon-snack',
      name: 'ของว่างบ่าย',
      time: '15:30',
      calories: 100,
      nutrition: { calories: 100, protein: 5, carbs: 15, fat: 3, fiber: 2, water: 1 },
      foods: ['มะม่วง 1/2 ผล', 'น้ำเปล่า 250ml']
    },
    {
      id: 'dinner',
      name: 'อาหารเย็น',
      time: '18:30',
      calories: 450,
      nutrition: { calories: 450, protein: 30, carbs: 35, fat: 20, fiber: 5, water: 1.5 },
      foods: ['ข้าวขาว 1/2 ถ้วย', 'ไก่ย่าง 100g', 'ผักต้มนึ่ง 1 ถ้วย', 'อะโวคาโด 1/4 ผล']
    }
  ];

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'bg-red-100 text-red-800';
      case 'muscle-gain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      default: return 'รักษาสมดุล';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Goal and Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              แผนโภชนาการเฉพาะบุคคล
            </span>
            <Badge className={getGoalColor(userGoal)}>
              {getGoalText(userGoal)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            แผนโภชนาการที่ปรับแต่งตามเป้าหมายและข้อมูลร่างกายของคุณ
          </p>

          {/* Daily Targets vs Intake */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground mb-1">แคลอรี่</div>
              <div className="text-lg font-bold text-orange-600">
                {dailyIntake.calories} / {targets.calories}
              </div>
              <Progress 
                value={calculateProgress(dailyIntake.calories, targets.calories)} 
                className="h-2 mt-2"
              />
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground mb-1">โปรตีน (g)</div>
              <div className="text-lg font-bold text-blue-600">
                {dailyIntake.protein} / {targets.protein}
              </div>
              <Progress 
                value={calculateProgress(dailyIntake.protein, targets.protein)} 
                className="h-2 mt-2"
              />
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Droplets className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground mb-1">น้ำ (ลิตร)</div>
              <div className="text-lg font-bold text-green-600">
                {dailyIntake.water} / {targets.water}
              </div>
              <Progress 
                value={calculateProgress(dailyIntake.water, targets.water)} 
                className="h-2 mt-2"
              />
            </div>
          </div>

          {/* Macronutrient Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>คาร์โบไหเดรต</span>
                <span>{dailyIntake.carbs}g / {targets.carbs}g</span>
              </div>
              <Progress value={calculateProgress(dailyIntake.carbs, targets.carbs)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ไขมัน</span>
                <span>{dailyIntake.fat}g / {targets.fat}g</span>
              </div>
              <Progress value={calculateProgress(dailyIntake.fat, targets.fat)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ใยอาหาร</span>
                <span>{dailyIntake.fiber}g / {targets.fiber}g</span>
              </div>
              <Progress value={calculateProgress(dailyIntake.fiber, targets.fiber)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Meal Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            แผนอาหารรายสัปดาห์
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weekDays.map((day, index) => (
              <Button
                key={index}
                variant={selectedDay === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(index)}
                className="whitespace-nowrap"
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Meal Plan for Selected Day */}
          <div className="space-y-4">
            {sampleMealPlans.map((meal) => (
              <Card key={meal.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{meal.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{meal.time}</span>
                        <Flame className="w-4 h-4" />
                        <span>{meal.calories} แคลอรี่</span>
                      </div>
                    </div>
                    <Badge variant="outline">{meal.calories} kcal</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">รายการอาหาร:</h5>
                      <ul className="text-sm space-y-1">
                        {meal.foods.map((food, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Apple className="w-3 h-3 text-green-600" />
                            <span>{food}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">โภชนาการ:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>โปรตีน: {meal.nutrition.protein}g</div>
                        <div>คาร์บ: {meal.nutrition.carbs}g</div>
                        <div>ไขมัน: {meal.nutrition.fat}g</div>
                        <div>ใยอาหาร: {meal.nutrition.fiber}g</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Tips */}
      <Card>
        <CardHeader>
          <CardTitle>คำแนะนำโภชนาการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">เคล็ดลับสำหรับ{getGoalText(userGoal)}</h4>
                <p className="text-sm text-green-800 mt-1">
                  {userGoal === 'weight-loss' && 'รับประทานโปรตีนในทุกมื้อ ดื่มน้ำเปล่าให้เพียงพอ และหลีกเลี่ยงน้ำตาลเพิ่ม'}
                  {userGoal === 'muscle-gain' && 'เพิ่มการรับประทานโปรตีน รับประทานคาร์โบไหเดรตหลังออกกำลังกาย'}
                  {userGoal === 'maintenance' && 'รักษาสมดุลของโภชนาการหลัก ๆ และรับประทานผักผลไม้หลากหลาย'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">การจับเวลาการรับประทาน</h4>
                <p className="text-sm text-blue-800 mt-1">
                  รับประทานอาหารเช้าภายใน 1 ชั่วโมงหลังตื่น และหลีกเลี่ยงการรับประทานหนักก่อนนอน 3 ชั่วโมง
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">ข้อควรระวัง</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  แผนนี้เป็นคำแนะนำทั่วไป ควรปรึกษานักโภชนาการก่อนการปรับเปลี่ยนแบบแผนการกินอย่างรุนแรง
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}