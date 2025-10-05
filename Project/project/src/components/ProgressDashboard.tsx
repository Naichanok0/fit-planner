import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Flame, 
  Activity,
  Clock,
  Zap
} from 'lucide-react';

interface ProgressDashboardProps {
  totalReps: number;
  currentStreak: number;
  formFeedback: string[];
}

// Mock data for charts
const weeklyProgress = [
  { day: 'Mon', reps: 45, accuracy: 87 },
  { day: 'Tue', reps: 52, accuracy: 92 },
  { day: 'Wed', reps: 38, accuracy: 85 },
  { day: 'Thu', reps: 65, accuracy: 94 },
  { day: 'Fri', reps: 48, accuracy: 89 },
  { day: 'Sat', reps: 72, accuracy: 91 },
  { day: 'Sun', reps: 55, accuracy: 88 }
];

const exerciseDistribution = [
  { name: 'Push-ups', value: 35, color: '#8884d8' },
  { name: 'Squats', value: 28, color: '#82ca9d' },
  { name: 'Planks', value: 20, color: '#ffc658' },
  { name: 'Burpees', value: 10, color: '#ff7300' },
  { name: 'Lunges', value: 7, color: '#00C49F' }
];

const monthlyStats = [
  { month: 'Jan', workouts: 12, avgAccuracy: 85 },
  { month: 'Feb', workouts: 16, avgAccuracy: 88 },
  { month: 'Mar', workouts: 20, avgAccuracy: 92 },
  { month: 'Apr', workouts: 18, avgAccuracy: 89 },
  { month: 'May', workouts: 24, avgAccuracy: 94 },
  { month: 'Jun', workouts: 22, avgAccuracy: 91 }
];

export function ProgressDashboard({ totalReps, currentStreak, formFeedback }: ProgressDashboardProps) {

  const todayStats = {
    workoutTime: 25,
    caloriesBurned: 180,
    avgFormScore: 89,
    exercisesCompleted: 4
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 แดชบอร์ดความก้าวหน้า</h1>
        <p className="text-muted-foreground">
          ติดตามผลการออกกำลังกาย วิเคราะห์ประสิทธิภาพ และรับคำแนะนำเพื่อการพัฒนาที่ดียิ่งขึ้น
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📈 ตัวชี้วัดหลัก
          <span className="text-sm font-normal text-muted-foreground">
            - สถิติสำคัญของการออกกำลังกายในวันนี้
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{totalReps}</div>
            <div className="text-sm text-muted-foreground">Total Reps</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <Flame className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{todayStats.caloriesBurned}</div>
            <div className="text-sm text-muted-foreground">Calories</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{todayStats.workoutTime}</div>
            <div className="text-sm text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Charts Row */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📊 กราฟแสดงข้อมูล
          <span className="text-sm font-normal text-muted-foreground">
            - วิเคราะห์แนวโน้มและรูปแบบการออกกำลังกาย
          </span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ความก้าวหน้ารายสัปดาห์
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              📊 กราฟแสดงจำนวน Reps ที่ทำได้ในแต่ละวันของสัปดาห์ ช่วยติดตามความสม่ำเสมอในการออกกำลังกาย
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reps" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>คำแนะนำ:</strong> ควรออกกำลังกายอย่างสม่ำเสมอ 5-6 วันต่อสัปดาห์ เพื่อผลลัพธ์ที่ดีที่สุด
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              การกระจายประเภทการออกกำลังกาย
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              🥧 กราฟวงกลมแสดงสัดส่วนการออกกำลังกายแต่ละประเภท ช่วยวางแผนการออกกำลังกายให้สมดุล
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={exerciseDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {exerciseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">
                💡 <strong>คำแนะนำ:</strong> ควรหมุนเวียนการออกกำลังกายให้ครอบคลุมทุกกลุ่มกล้ามเนื้อ เพื่อการพัฒนาที่สมดุล
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            แนวโน้มความแม่นยำในการออกกำลังกาย
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            📈 กราฟเส้นแสดงการพัฒนาความแม่นยำในการออกกำลังกายแต่ละเดือน ช่วยติดตามการปรับปรุงท่าทางและเทคนิค
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[80, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="avgAccuracy" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700">
              💡 <strong>คำแนะนำ:</strong> ความแม่นยำ 90% ขึ้นไปถือว่าดีมาก แสดงถึงการควบคุมท่าทางที่ถูกต้อง
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Session Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อเสนอแนะแบบเรียลไทม์</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            ⚡ แสดงข้อเสนอแนะการปรับปรุงท่าทางระหว่างการออกกำลังกาย เพื่อความปลอดภัยและประสิทธิภาพสูงสุด
          </p>
        </CardHeader>
        <CardContent>
          {formFeedback.length > 0 ? (
            <div className="space-y-2">
              {formFeedback.map((feedback, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{feedback}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">
                เริ่มต้นการออกกำลังกายเพื่อดูข้อเสนะแนะแบบเรียลไทม์
              </p>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-700">
                  💡 <strong>เคล็ดลับ:</strong> ระบบ AI จะช่วยตรวจสอบท่าทางและให้คำแนะนำทันทีเพื่อป้องกันการบาดเจ็บ
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

    </div>
  );
}