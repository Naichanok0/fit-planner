import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Camera, 
  Upload, 
  User, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Target,
  TrendingUp
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

interface BodyTypeAnalyzerProps {
  onAnalysisComplete: (result: BodyAnalysisResult) => void;
  currentGoal: 'weight-loss' | 'muscle-gain' | 'maintenance';
}

export function BodyTypeAnalyzer({ onAnalysisComplete, currentGoal }: BodyTypeAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BodyAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
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

    // Mock analysis result based on goal (in real app, this would come from AI backend)
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

    const result = mockResults[currentGoal];
    setAnalysisResult(result);
    setIsAnalyzing(false);
    onAnalysisComplete(result);
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getBodyTypeColor = (type: string) => {
    switch (type) {
      case 'slim': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-green-600 bg-green-50';
      case 'muscular': return 'text-purple-600 bg-purple-50';
      case 'heavy': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            AI Body Type Analyzer
          </CardTitle>
          <CardDescription>
            อัปโหลดรูปภาพเพื่อให้ AI วิเคราะห์รูปร่างและสร้างโปรแกรมออกกำลังกายที่เหมาะสมกับคุณ
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Goal Display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="font-medium">เป้าหมายปัจจุบันของคุณ:</span>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {getGoalText(currentGoal)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {!analysisResult ? (
        <div className="space-y-4">
          {/* Image Upload */}
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
                      <div className="space-y-2">
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          เลือกรูปภาพ
                        </Button>
                        <p className="text-xs text-gray-400">
                          รูปภาพจะถูกใช้เพื่อการวิเคราะห์เท่านั้น และจะไม่ถูกเก็บไว้
                        </p>
                      </div>
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
                    ) : (
                      <Button 
                        onClick={analyzeBodyType}
                        className="flex items-center gap-2"
                        size="lg"
                      >
                        <TrendingUp className="w-4 h-4" />
                        เริ่มวิเคราะห์รูปร่าง
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
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
        </div>
      ) : (
        /* Analysis Results */
        <div className="space-y-4">
          {/* Main Result */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    ผลการวิเคราะห์เสร็จสิ้น
                  </CardTitle>
                  <CardDescription>
                    AI ได้วิเคราะห์รูปร่างของคุณเรียบร้อยแล้ว
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={resetAnalysis} size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  วิเคราะห์ใหม่
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold mb-1">
                    <Badge className={getBodyTypeColor(analysisResult.detectedType)}>
                      {getBodyTypeText(analysisResult.detectedType)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">ประเภทรูปร่าง</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {(analysisResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">ความแม่นยำ</div>
                </div>
              </div>

              {analysisResult.bodyFatPercentage && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ประมาณการไขมันในร่างกาย</span>
                    <span className="text-lg font-bold text-blue-600">
                      {analysisResult.bodyFatPercentage}%
                    </span>
                  </div>
                </div>
              )}

              {analysisResult.muscleDistribution && (
                <div className="space-y-3">
                  <h4 className="font-medium">การกระจายกล้ามเนื้อ</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ส่วนบน (หน้าอก, แขน, ไหล่)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResult.muscleDistribution.upper} className="w-20 h-2" />
                        <span className="text-sm font-medium">{analysisResult.muscleDistribution.upper}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ส่วนล่าง (ขา, สะโพก)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResult.muscleDistribution.lower} className="w-20 h-2" />
                        <span className="text-sm font-medium">{analysisResult.muscleDistribution.lower}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">แกนกลาง (หน้าท้อง, หลัง)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResult.muscleDistribution.core} className="w-20 h-2" />
                        <span className="text-sm font-medium">{analysisResult.muscleDistribution.core}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                คำแนะนำเฉพาะสำหรับคุณ
              </CardTitle>
              <CardDescription>
                ปรับแต่งตามรูปร่างและเป้าหมาย: {getGoalText(currentGoal)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">ขั้นตอนถัดไป:</span>
                </div>
                <span className="text-sm text-gray-600">
                  ไปที่แท็บ "Programs" เพื่อดูโปรแกรมที่ปรับแต่งให้คุณ
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}