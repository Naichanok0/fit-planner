import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Apple, 
  Clock, 
  Flame,
  ChefHat,
  CheckCircle,
  Plus,
  Minus,
  Coffee,
  UtensilsCrossed,
  Moon,
  RefreshCw
} from 'lucide-react';

interface NutritionPlannerProps {
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  bodyMeasurements?: {
    height: number;
    weight: number;
    bodyFatPercentage: number;
  };
}

interface Meal {
  id: string;
  name: string;
  time: string;
  icon: any;
  foods: string[];
  calories: number;
  completed: boolean;
}

interface FoodItem {
  name: string;
  calories: number;
  category: 'protein' | 'carbs' | 'vegetables' | 'fruits' | 'snacks';
}

// Simple, common Thai foods that are easy to find
const COMMON_FOODS: FoodItem[] = [
  // Protein
  { name: 'ไข่ต้ม 2 ฟอง', calories: 140, category: 'protein' },
  { name: 'ปลาทูนึ่ง 1 ตัว', calories: 150, category: 'protein' },
  { name: 'ไก่ต้ม 100g', calories: 165, category: 'protein' },
  { name: 'เต้าหู้ 1 แผ่น', calories: 80, category: 'protein' },
  { name: 'ถั่วลิสง 1 กำมือ', calories: 160, category: 'protein' },
  
  // Carbs
  { name: 'ข้าวกล้อง 1 ถ้วย', calories: 220, category: 'carbs' },
  { name: 'ข้าวขาว 1 ถ้วย', calories: 200, category: 'carbs' },
  { name: 'ขนมปังโฮลเวียต 2 แผ่น', calories: 160, category: 'carbs' },
  { name: 'มัน 1 หัว', calories: 130, category: 'carbs' },
  { name: 'กล้วยหอม 2 ลูก', calories: 120, category: 'carbs' },
  
  // Vegetables
  { name: 'ผักรวม 1 จาน', calories: 50, category: 'vegetables' },
  { name: 'แตงกวา 1 ลูก', calories: 15, category: 'vegetables' },
  { name: 'มะเขือเทศ 2 ลูก', calories: 35, category: 'vegetables' },
  { name: 'ผักบุ้งลวก 1 จาน', calories: 20, category: 'vegetables' },
  { name: 'แครอท 1 ลูก', calories: 25, category: 'vegetables' },
  
  // Fruits
  { name: 'แอปเปิ้ล 1 ลูก', calories: 80, category: 'fruits' },
  { name: 'ส้ม 1 ลูก', calories: 60, category: 'fruits' },
  { name: 'ฝรั่ง 1 ลูก', calories: 110, category: 'fruits' },
  { name: 'มะละกอ 1 ถ้วย', calories: 55, category: 'fruits' },
  
  // Snacks
  { name: 'นมข้นหวาน 1 กล่อง', calories: 150, category: 'snacks' },
  { name: 'โยเกิร์ต 1 ถ้วย', calories: 100, category: 'snacks' },
  { name: 'อัลมอนด์ 10 เม็ด', calories: 70, category: 'snacks' }
];

export function NutritionPlanner({ userGoal, bodyMeasurements }: NutritionPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: 'breakfast',
      name: 'มื้อเช้า',
      time: '07:00',
      icon: Coffee,
      foods: ['ไข่ต้ม 2 ฟอง', 'ขนมปังโฮลเวียต 2 แผ่น', 'กล้วยหอม 1 ลูก'],
      calories: 360,
      completed: false
    },
    {
      id: 'lunch',
      name: 'มื้อกลางวัน',
      time: '12:00',
      icon: UtensilsCrossed,
      foods: ['ข้าวกล้อง 1 ถ้วย', 'ปลาทูนึ่ง 1 ตัว', 'ผักรวม 1 จาน'],
      calories: 420,
      completed: false
    },
    {
      id: 'dinner',
      name: 'มื้อเย็น',
      time: '18:00',
      icon: Moon,
      foods: ['ข้าวขาว 1 ถ้วย', 'ไก่ต้ม 100g', 'ผักบุ้งลวก 1 จาน'],
      calories: 385,
      completed: false
    }
  ]);

  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  // Daily reset system - check if day has changed
  useEffect(() => {
    const checkDailyReset = () => {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem('lastNutritionReset');
      
      if (lastResetDate !== today) {
        // Reset all meals for new day
        setMeals(prev => prev.map(meal => ({ ...meal, completed: false })));
        setCurrentDate(today);
        localStorage.setItem('lastNutritionReset', today);
      }
    };

    checkDailyReset();
    // Check every hour after midnight
    const interval = setInterval(checkDailyReset, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate simple targets
  const calculateTargets = () => {
    let baseCalories = 1800;
    
    if (bodyMeasurements?.weight) {
      baseCalories = bodyMeasurements.weight * 25; // Simple calculation
    }
    
    switch (userGoal) {
      case 'weight-loss':
        baseCalories *= 0.85;
        break;
      case 'muscle-gain':
        baseCalories *= 1.1;
        break;
      default:
        break;
    }
    
    return Math.round(baseCalories);
  };

  const targetCalories = calculateTargets();
  const consumedCalories = meals.filter(m => m.completed).reduce((sum, m) => sum + m.calories, 0);
  const remainingCalories = targetCalories - consumedCalories;

  const toggleMealComplete = (mealId: string) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
    ));
  };

  const addFoodToMeal = (mealId: string, foodName: string, calories: number) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? { 
            ...meal, 
            foods: [...meal.foods, foodName],
            calories: meal.calories + calories
          } 
        : meal
    ));
  };

  const removeFoodFromMeal = (mealId: string, foodIndex: number) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? { 
            ...meal, 
            foods: meal.foods.filter((_, index) => index !== foodIndex),
            calories: meal.calories - 50 // Approximate
          } 
        : meal
    ));
  };

  const resetAllMeals = () => {
    setMeals(prev => prev.map(meal => ({ ...meal, completed: false })));
  };

  const getGoalText = () => {
    switch (userGoal) {
      case 'weight-loss':
        return 'ลดน้ำหนัก';
      case 'muscle-gain':
        return 'เพิ่มกล้ามเนื้อ';
      default:
        return 'รักษาระดับ';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5" />
            แผนการกิน - {getGoalText()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{consumedCalories}</div>
              <div className="text-sm text-muted-foreground">แคลอรี่ที่กิน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{targetCalories}</div>
              <div className="text-sm text-muted-foreground">เป้าหมายต่อวัน</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${remainingCalories >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {remainingCalories}
              </div>
              <div className="text-sm text-muted-foreground">เหลือ</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>ความคืบหน้าวันนี้</span>
              <span>{Math.round((consumedCalories / targetCalories) * 100)}%</span>
            </div>
            <Progress value={(consumedCalories / targetCalories) * 100} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              💡 เลือกอาหารที่หาง่ายในท้องถิ่น ไม่ต้องซับซ้อน
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetAllMeals}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              รีเซ็ตวันใหม่
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meal Planning */}
      <div className="grid gap-6">
        {meals.map((meal) => (
          <Card key={meal.id} className={meal.completed ? 'bg-green-50 dark:bg-green-900/10' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <meal.icon className="w-5 h-5" />
                  {meal.name}
                  <Badge variant="outline" className="ml-2">
                    {meal.time}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={meal.completed ? "default" : "secondary"}>
                    <Flame className="w-3 h-3 mr-1" />
                    {meal.calories} แคลอรี่
                  </Badge>
                  <Button
                    variant={meal.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMealComplete(meal.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {meal.completed ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">เมนูอาหาร:</h4>
                  <div className="space-y-2">
                    {meal.foods.map((food, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{food}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFoodFromMeal(meal.id, index)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มอาหาร
                  </Button>
                  
                  {selectedMeal === meal.id && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COMMON_FOODS.map((food, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => addFoodToMeal(meal.id, food.name, food.calories)}
                          className="text-xs p-2 h-auto"
                        >
                          <div className="text-center">
                            <div>{food.name}</div>
                            <div className="text-muted-foreground">{food.calories} cal</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simple Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            เทิปการกินที่เรียบง่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>กินข้าวกล้องแทนข้าวขาวเมื่อเป็นไปได้</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>เพิ่มผักในทุกมื้อ ลวกหรือสดก็ได้</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>ดื่มน้ำเปล่า 8-10 แก้วต่อวัน</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>กินผลไม้แทนขนมหวาน</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>ไข่ต้ม ปลาต้ม ไก่ต้ม เป็นโปรตีนที่ดีและหาง่าย</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}