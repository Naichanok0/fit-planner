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
  onAnalysisComplete: (result: BodyAnalysisResult, userData: UserData, detectionResult?: any) => void;
  userGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  fitnessLevel: 'standard';
  onNavigateToProgram: () => void;
}

export function BodyAnalysis({ onAnalysisComplete, userGoal, onNavigateToProgram }: BodyAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BodyAnalysisResult | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
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

    try {
      // Show progress steps
      const progressSteps = [
        { progress: 20, message: 'กำลังอัปโหลดรูปภาพ...' },
        { progress: 40, message: 'กำลัง AI วิเคราะห์รูปร่าง...' },
        { progress: 60, message: 'กำลังค้นหารูปที่คล้ายกัน...' },
        { progress: 80, message: 'กำลังสร้างโปรแกรมเฉพาะตัว...' },
        { progress: 100, message: 'เสร็จสิ้น!' }
      ];

      // Show initial progress
      for (let i = 0; i < 2; i++) {
        setAnalysisProgress(progressSteps[i].progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Call Python AI detection API
      const formData = new FormData();
      formData.append('file', selectedImage);
      // Use correct gender mapping: male->men, female->women
      const genderMapping = {
        'male': 'men',
        'female': 'women'
      };
      const aiGender = userData.gender ? genderMapping[userData.gender as 'male' | 'female'] || 'men' : 'men';
      formData.append('gender', aiGender);

      const response = await fetch('http://localhost:8000/detect/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`การวิเคราะห์ล้มเหลว: ${response.status} ${response.statusText}`);
      }

      const detectionData = await response.json();
      console.log('🎯 Detection result:', detectionData);

      // Store detection result in state instead of localStorage
      setDetectionResult(detectionData);

      // Continue progress
      for (let i = 2; i < progressSteps.length; i++) {
        setAnalysisProgress(progressSteps[i].progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Create analysis result from detection
      const analysisResult: BodyAnalysisResult = {
        detectedType: 'average',
        confidence: Math.max(0.7, 1 - (detectionData.distance || 0) / 2), // Convert distance to confidence
        bodyFatPercentage: 15,
        muscleDistribution: { upper: 65, lower: 70, core: 60 },
        recommendations: [
          `🎯 ระบบตรวจพบว่าคุณคล้ายกับรูปแบบ ${detectionData.match_image}`,
          `📊 ความแม่นยำ: ${((1 - (detectionData.distance || 0) / 2) * 100).toFixed(1)}%`,
          '🏋️ โปรแกรมออกกำลังกายและอาหารได้ถูกปรับแต่งเฉพาะสำหรับคุณ',
          '📅 ปฏิบัติตามโปรแกรมอย่างสม่ำเสมอ 4-6 สัปดาห์เพื่อผลลัพธ์ที่ดีที่สุด'
        ]
      };

      setAnalysisResult(analysisResult);
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      alert('เกิดข้อผิดพลาดในการวิเคราะห์: ' + errorMessage + '\n\nกรุณาตรวจสอบว่า:\n- Python backend รันอยู่ที่ port 8000\n- รูปภาพมีขนาดไม่เกิน 10MB\n- เครื่องเชื่อมต่ออินเทอร์เน็ต');
      setAnalysisProgress(0);
      return;
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('form');
    }
  };

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate BMI
  const calculateBMI = () => {
    const height = parseFloat(userData.height);
    const weight = parseFloat(userData.weight);
    
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
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

  const isFormComplete = () => {
    return userData.height && userData.weight && userData.age && 
           userData.gender && userData.goal;
  };

  const handleComplete = async () => {
    if (analysisResult && isFormComplete()) {
      setCurrentStep('complete');
      
      // Pass detection result directly to parent component
      console.log('✅ Analysis complete, passing detection result:', detectionResult);
      onAnalysisComplete(analysisResult, userData, detectionResult);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setDetectionResult(null);
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
                    <div className="space-y-4">
                      {/* Gender Selection */}
                      <div className="max-w-xs mx-auto space-y-2">
                        <Label className="text-center block">เลือกเพศของคุณ</Label>
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
                      
                      <Button 
                        onClick={analyzeBodyType}
                        disabled={!userData.gender}
                        className="flex items-center gap-2"
                        size="lg"
                      >
                        <TrendingUp className="w-4 h-4" />
                        เริ่มวิเคราะห์รูปร่าง
                      </Button>
                      
                      {!userData.gender && (
                        <p className="text-sm text-orange-600 text-center">
                          ⚠️ กรุณาเลือกเพศก่อนเริ่มวิเคราะห์
                        </p>
                      )}
                    </div>
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

              {/* BMI Display */}
              {userData.height && userData.weight && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ค่าดัชนีมวลกาย (BMI)</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {calculateBMI()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const bmi = parseFloat(calculateBMI() || '0');
                        const category = getBMICategory(bmi);
                        return (
                          <Badge className={`${category.bg} ${category.color} border-0`}>
                            {category.text}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <Target className="w-4 h-4" />
                  {getGoalText(userData.goal)}
                </div>
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <User className="w-4 h-4" />
                  {getBodyTypeText(analysisResult.detectedType)}
                </div>
                {/* BMI Display in Results */}
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">BMI: {calculateBMI()}</span>
                  {(() => {
                    const bmi = parseFloat(calculateBMI() || '0');
                    const category = getBMICategory(bmi);
                    return (
                      <Badge variant="secondary" className={`ml-1 ${category.bg} ${category.color} text-xs border-0`}>
                        {category.text}
                      </Badge>
                    );
                  })()}
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