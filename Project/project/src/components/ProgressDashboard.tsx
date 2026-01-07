import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
  Flame, 
  Activity,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { useCompleteDashboard } from '../hooks/useEnhancedDashboard';

interface ProgressDashboardProps {
  totalReps: number;
  currentStreak: number;
  formFeedback: string[];
  userBMI?: number;
  userHeight?: number;
  userWeight?: number;
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

export function ProgressDashboard({ totalReps, currentStreak, formFeedback, userBMI, userHeight, userWeight }: ProgressDashboardProps) {
  const { user } = useAuth();
  const {
    dashboard,
    progress,
    streak,
    weeklyStats,
    todayWorkouts,
    loading,
    error,
    updateProgress,
    refetchAll
  } = useCompleteDashboard(user?.id ? parseInt(user.id.toString()) : null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchAll();
    if (user?.id) {
      await updateProgress();
    }
    setIsRefreshing(false);
  };

  // Use real data from database if available, otherwise fallback to props
  const actualTotalReps = progress?.total_sessions || totalReps;
  const actualCurrentStreak = streak || currentStreak;
  const actualBMI = dashboard?.bmi || userBMI;
  const actualHeight = dashboard?.height_cm || userHeight;
  const actualWeight = dashboard?.weight_kg || userWeight;

  const todayStats = todayWorkouts?.stats || {
    total_sessions: 0,
    completed_sessions: 0,
    total_minutes: 25,
    calories_burned: 180,
    workoutTime: 25,
    caloriesBurned: 180,
    avgFormScore: 89,
    exercisesCompleted: 4
  };

  // Calculate BMI if height and weight are provided
  const calculateBMI = () => {
    if (userBMI) return userBMI.toFixed(1);
    if (userHeight && userWeight && userHeight > 0) {
      const heightInMeters = userHeight / 100;
      return (userWeight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'น้ำหนักน้อย', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (bmi < 25) return { text: 'น้ำหนักปกติ', color: 'text-green-600', bg: 'bg-green-100' };
    if (bmi < 30) return { text: 'น้ำหนักเกิน', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'อ้วน', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading && !dashboard && !error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* แสดง Error Banner หากมีข้อผิดพลาด */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm text-yellow-800">ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้</p>
              <p className="text-xs text-yellow-700">กำลังแสดงข้อมูลสำรองสำหรับการทดสอบ</p>
              <button 
                onClick={handleRefresh}
                className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 แดชบอร์ดความก้าวหน้า</h1>
        <p className="text-muted-foreground">
          ติดตามผลการออกกำลังกาย วิเคราะห์ประสิทธิภาพ และรับคำแนะนำเพื่อการพัฒนาที่ดียิ่งขึ้น
        </p>
        {dashboard ? (
          <div className="mt-2 text-sm text-gray-600">
            สวัสดี {dashboard.full_name} | เป้าหมาย: {dashboard.goal} | ระดับ: {dashboard.fitness_level}
          </div>
        ) : user && (
          <div className="mt-2 text-sm text-gray-600">
            สวัสดี {user.firstName} {user.lastName} | กำลังโหลดข้อมูลโปรไฟล์...
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📈 ตัวชี้วัดหลัก
          <span className="text-sm font-normal text-muted-foreground">
            - สถิติสำคัญของการออกกำลังกายในวันนี้
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{actualTotalReps}</div>
            <div className="text-sm text-muted-foreground">เซสชัน Workout</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <Flame className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{actualCurrentStreak}</div>
            <div className="text-sm text-muted-foreground">วันต่อเนื่อง</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{todayStats.calories_burned || todayStats.caloriesBurned}</div>
            <div className="text-sm text-muted-foreground">แคลอรี่ที่เผาผลาญ</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-primary">{todayStats.total_minutes || todayStats.workoutTime}</div>
            <div className="text-sm text-muted-foreground">นาที</div>
          </CardContent>
        </Card>

        {/* BMI Card */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {actualBMI?.toFixed(1) || calculateBMI() || '--'}
            </div>
            <div className="text-sm text-muted-foreground">BMI</div>
            {(actualBMI || calculateBMI()) && (
              <div className="mt-1">
                {(() => {
                  const bmi = actualBMI || parseFloat(calculateBMI() || '0');
                  const category = getBMICategory(bmi);
                  return (
                    <Badge className={`${category.bg} ${category.color} text-xs border-0`}>
                      {dashboard?.bmi_category || category.text}
                    </Badge>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Charts Row */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            📊 กราฟแสดงข้อมูล
            <span className="text-sm font-normal text-muted-foreground">
              - วิเคราะห์แนวโน้มและรูปแบบการออกกำลังกาย
            </span>
          </h2>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
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