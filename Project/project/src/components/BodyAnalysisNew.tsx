import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { 
  Camera, 
  Upload, 
  User, 
  CheckCircle, 
  RefreshCw,
  Target,
  TrendingUp,
  ArrowRight,
  Weight,
  Ruler,
  Calendar
} from 'lucide-react';

interface BodyAnalysisResult {
  detectedType: 'slim' | 'average' | 'muscular' | 'heavy';
  confidence: number;
  recommendations: string[];
  bodyFatPercentage?: number;
  muscleDistribution?: {
    upper: number;
    lower: number;
    core: number;
  };
}

interface UserData {
  height: string;
  weight: string;
  age: string;
  gender: 'male' | 'female' | '';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | '';
}

interface BodyAnalysisProps {
  onAnalysisComplete: (result: BodyAnalysisResult, userData: UserData) => void;
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  fitnessLevel: 'standard';
  onNavigateToProgram: () => void;
}

export function BodyAnalysis({ onAnalysisComplete, userGoal, onNavigateToProgram }: BodyAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BodyAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'form' | 'complete'>('upload');
  const [userData, setUserData] = useState<UserData>({
    height: '',
    weight: '',
    age: '',
    gender: '',
    goal: userGoal
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ไม่ควรเกิน 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setCurrentStep('analyze');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeBodyType = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis process
    const progressSteps = [
      { progress: 20, message: 'กำลังประมวลผลรูปภาพ...' },
      { progress: 40, message: 'กำลังวิเคราะห์รูปร่าง...' },
      { progress: 60, message: 'กำลังคำนวณสัดส่วนร่างกาย...' },
      { progress: 80, message: 'กำลังสร้างคำแนะนำ...' },
      { progress: 100, message: 'เสร็จสิ้น!' }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(step.progress);
    }

    // Mock analysis result based on goal
    const mockResults: Record<string, BodyAnalysisResult> = {
      'muscle-gain': {
        detectedType: 'average',
        confidence: 0.87,
        bodyFatPercentage: 15,
        muscleDistribution: { upper: 65, lower: 70, core: 60 },
        recommendations: [
          'เน้นการเพิ่มกล้ามเนื้อส่วนบน แขน และหน้าอก',
          'เพิ่มปริมาณโปรตีนเป็น 1.6-2.2g ต่อน้ำหนักตัว 1kg',
          'ออกกำลังกายด้วยน้ำหนัก 3-4 วันต่อสัปดาห์',
          'พักผ่อนให้เพียงพอ 7-9 ชั่วโมงต่อวัน เพื่อการฟื้นฟูกล้ามเนื้อ'
        ]
      },
      'weight-loss': {
        detectedType: 'heavy',
        confidence: 0.92,
        bodyFatPercentage: 25,
        muscleDistribution: { upper: 55, lower: 60, core: 50 },
        recommendations: [
          'เน้นคาร์ดิโอและ HIIT เพื่อเผาผลาญไขมัน',
          'ลดแคลอรี่ได้ 500-750 แคลอรี่ต่อวัน',
          'เพิ่มการดื่มน้ำเป็น 2.5-3 ลิตรต่อวัน',
          'รับประทานอาหารหลายมื้อเล็กๆ เพื่อเร่งเมแทบอลิซึม'
        ]
      },
      'maintenance': {
        detectedType: 'average',
        confidence: 0.85,
        bodyFatPercentage: 18,
        muscleDistribution: { upper: 60, lower: 65, core: 55 },
        recommendations: [
          'รักษาการออกกำลังกายสม่ำเสมอ 150 นาทีต่อสัปดาห์',
          'รับประทานอาหารครบ 5 หมู่ในสัดส่วนที่เหมาะสม',
          'เน้นความยืดหยุ่นและความแข็งแกร่งของแกนกลาง',
          'ตรวจสุขภาพเป็นประจำและปรับโปรแกรมตามความเหมาะสม'
        ]
      }
    };

    const result = mockResults[userGoal];
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setCurrentStep('form');
  };

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return userData.height && userData.weight && userData.age && 
           userData.gender && userData.goal;
  };

  const handleComplete = () => {
    if (analysisResult && isFormComplete()) {
      setCurrentStep('complete');
      onAnalysisComplete(analysisResult, userData);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setCurrentStep('upload');
    setUserData({
      height: '',
      weight: '',
      age: '',
      gender: '',
      goal: userGoal
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getBodyTypeColor = (type: string) => {
    switch (type) {
      case 'slim': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'average': return 'text-green-600 bg-green-50 border-green-200';
      case 'muscular': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'heavy': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBodyTypeText = (type: string) => {
    switch (type) {
      case 'slim': return 'ผอม';
      case 'average': return 'ปกติ';
      case 'muscular': return 'กล้ามใหญ่';
      case 'heavy': return 'อ้วน';
      default: return 'ไม่ระบุ';
    }
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'maintenance': return 'รักษาสุขภาพ';
      default: return 'รักษาสุขภาพ';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            AI Body Analysis & Personal Info
          </CardTitle>
          <CardDescription>
            ขั้นตอนที่ 1: วิเคราะห์รูปร่าง | ขั้นตอนที่ 2: กรอกข้อมูล | ขั้นตอนที่ 3: สร้างโปรแกรม
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' || currentStep === 'analyze' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 
                currentStep === 'analyze' ? 'bg-blue-100 text-blue-600' : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">อัปโหลดรูป</span>
            </div>
            
            <div className={`flex items-center gap-2 ${currentStep === 'form' ? 'text-blue-600' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">กรอกข้อมูล</span>
            </div>
            
            <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">เสร็จสิ้น</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Image Upload & Analysis */}
      {(currentStep === 'upload' || currentStep === 'analyze') && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {!imagePreview ? (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      อัปโหลดรูปภาพของคุณ
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 10MB
                    </p>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      เลือกรูปภาพ
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetAnalysis}
                      className="absolute top-2 right-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {isAnalyzing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">กำลังวิเคราะห์...</span>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {analysisProgress}% เสร็จสิ้น
                      </div>
                    </div>
                  ) : !analysisResult ? (
                    <Button 
                      onClick={analyzeBodyType}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <TrendingUp className="w-4 h-4" />
                      เริ่มวิเคราะห์รูปร่าง
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: User Data Form */}
      {currentStep === 'form' && analysisResult && (
        <div className="space-y-6">
          {/* Analysis Result Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                ผลการวิเคราะห์รูปร่าง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge className={getBodyTypeColor(analysisResult.detectedType)}>
                    {getBodyTypeText(analysisResult.detectedType)}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-2">ประเภทรูปร่าง</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(analysisResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">ความแม่นยำ</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Data Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                กรอกข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription>
                ข้อมูลนี้จะช่วยให้เราสร้างโปรแกรมที่เหมาะสมกับคุณมากที่สุด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    ส่วนสูง (ซม.)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={userData.height}
                    onChange={(e) => handleUserDataChange('height', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    น้ำหนัก (กก.)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={userData.weight}
                    onChange={(e) => handleUserDataChange('weight', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    อายุ (ปี)
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={userData.age}
                    onChange={(e) => handleUserDataChange('age', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>เพศ</Label>
                  <Select value={userData.gender} onValueChange={(value: string) => handleUserDataChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>เป้าหมาย</Label>
                <Select value={userData.goal} onValueChange={(value: string) => handleUserDataChange('goal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเป้าหมาย" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">ลดน้ำหนัก</SelectItem>
                    <SelectItem value="muscle-gain">เพิ่มกล้ามเนื้อ</SelectItem>
                    <SelectItem value="maintenance">รักษาสุขภาพ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleComplete}
                disabled={!isFormComplete()}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                <CheckCircle className="w-4 h-4" />
                สร้างโปรแกรมเฉพาะตัว
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Complete */}
      {currentStep === 'complete' && analysisResult && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎉 เสร็จสิ้น!
              </h2>
              <p className="text-gray-600 mb-4">
                ระบบได้สร้างโปรแกรมออกกำลังกาย 7 วันเฉพาะสำหรับคุณแล้ว
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {getGoalText(userData.goal)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {getBodyTypeText(analysisResult.detectedType)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={onNavigateToProgram}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                ไปดูโปรแกรมของฉัน
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetAnalysis}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                เริ่มใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 เคล็ดลับการถ่ายรูป</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ถ่ายรูปท่ายืนตรง มองหน้ากล้อง
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ใส่เสื้อผ้าที่พอดีตัว ไม่หลวมหรือรัดเกินไป
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                แสงสว่างเพียงพอ พื้นหลังเรียบ
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ถ่ายรูปเต็มตัวจากหัวจรดเท้า
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}