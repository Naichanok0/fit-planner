import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  User, 
  Settings, 
  Target, 
  Activity,
  Calendar,
  Lock,
  Mail,
  Phone,
  Save,
  Edit,
  Shield,
  Database
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  joinDate: Date;
  lastLogin: Date;
}

interface UserProfileProps {
  userData: UserData;
  onUpdateProfile: (data: Partial<UserData>) => void;
  onSecurityUpdate: () => void;
}

export function UserProfile({ userData, onUpdateProfile, onSecurityUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>(userData);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'data'>('profile');

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'ลดน้ำหนัก';
      case 'muscle-gain': return 'เพิ่มกล้ามเนื้อ';
      default: return 'รักษาสมดุล';
    }
  };

  const getFitnessLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'เริ่มต้น';
      case 'intermediate': return 'ปานกลาง';
      case 'advanced': return 'สูง';
      default: return 'ปานกลาง';
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return 'bg-red-100 text-red-800';
      case 'muscle-gain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5" />
              โปรไฟล์ผู้ใช้
            </span>
            <div className="flex gap-2">
              {['profile', 'settings', 'security', 'data'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab as any)}
                >
                  {tab === 'profile' && 'ข้อมูลส่วนตัว'}
                  {tab === 'settings' && 'การตั้งค่า'}
                  {tab === 'security' && 'ความปลอดภัย'}
                  {tab === 'data' && 'ข้อมูล'}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{formData.firstName} {formData.lastName}</h3>
              <p className="text-muted-foreground">{formData.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className={getGoalColor(formData.goal)}>
                  เป้าหมาย: {getGoalText(formData.goal)}
                </Badge>
                <Badge className={getFitnessLevelColor(formData.fitnessLevel)}>
                  ระดับ: {getFitnessLevelText(formData.fitnessLevel)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ข้อมูลส่วนตัว</span>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    ยกเลิก
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">ชื่อ</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">นามสกุล</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="age">อายุ</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">เพศ</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value: 'male' | 'female') => setFormData({...formData, gender: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fitness Profile */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">โปรไฟล์การออกกำลังกาย</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal">เป้าหมาย</Label>
                  <Select 
                    value={formData.goal} 
                    onValueChange={(value: 'weight-loss' | 'muscle-gain' | 'maintenance') => setFormData({...formData, goal: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">ลดน้ำหนัก</SelectItem>
                      <SelectItem value="muscle-gain">เพิ่มกล้ามเนื้อ</SelectItem>
                      <SelectItem value="maintenance">รักษาสมดุล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fitnessLevel">ระดับการออกกำลังกาย</Label>
                  <Select 
                    value={formData.fitnessLevel} 
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setFormData({...formData, fitnessLevel: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">เริ่มต้น</SelectItem>
                      <SelectItem value="intermediate">ปานกลาง</SelectItem>
                      <SelectItem value="advanced">สูง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              การตั้งค่าแอปพลิเคชัน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">การแจ้งเตือนการออกกำลังกาย</h4>
                  <p className="text-sm text-muted-foreground">แจ้งเตือนเมื่อถึงเวลาออกกำลังกาย</p>
                </div>
                <Button variant="outline" size="sm">เปิดใช้งาน</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">การแจ้งเตือนโภชนาการ</h4>
                  <p className="text-sm text-muted-foreground">แจ้งเตือนการรับประทานอาหารและดื่มน้ำ</p>
                </div>
                <Button variant="outline" size="sm">เปิดใช้งาน</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">การซิงค์ข้อมูลอัตโนมัติ</h4>
                  <p className="text-sm text-muted-foreground">ซิงค์ข้อมูลกับ Cloud อัตโนมัติ</p>
                </div>
                <Button variant="outline" size="sm">เปิดใช้งาน</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">โหมดส่วนตัว</h4>
                  <p className="text-sm text-muted-foreground">ซ่อนข้อมูลการออกกำลังกายจากผู้อื่น</p>
                </div>
                <Button variant="outline" size="sm">ปิดใช้งาน</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ความปลอดภัยและความเป็นส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">เปลี่ยนรหัสผ่าน</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  ปรับปรุงความปลอดภัยด้วยการเปลี่ยนรหัสผ่านเป็นประจำ
                </p>
                <Button variant="outline" size="sm">
                  <Lock className="w-4 h-4 mr-2" />
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">การยืนยันตัวตนแบบ 2 ขั้นตอน</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  เพิ่มความปลอดภัยด้วยการยืนยันผ่าน SMS หรือแอป
                </p>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  ตั้งค่า 2FA
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">อุปกรณ์ที่เข้าสู่ระบบ</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  ดูและจัดการอุปกรณ์ที่เข้าใช้งานบัญชีของคุณ
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>iPhone 14 Pro - iOS 17.1</span>
                    <span className="text-green-600">กำลังใช้งาน</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>MacBook Pro - Chrome</span>
                    <span className="text-muted-foreground">3 วันที่แล้ว</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  จัดการอุปกรณ์
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <Button variant="default" size="sm" onClick={onSecurityUpdate}>
                <Shield className="w-4 h-4 mr-2" />
                อัปเดตความปลอดภัย
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              การจัดการข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">ส่งออกข้อมูล</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  ดาวน์โหลดข้อมูลการออกกำลังกายและโภชนาการของคุณ
                </p>
                <Button variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  ส่งออกข้อมูล
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">นำเข้าข้อมูล</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  นำเข้าข้อมูลจากแอปพลิเคชันอื่นหรือไฟล์ CSV
                </p>
                <Button variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  นำเข้าข้อมูล
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h4 className="font-medium mb-2 text-red-900">ลบบัญชี</h4>
                <p className="text-sm text-red-700 mb-4">
                  ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร (ไม่สามารถยกเลิกได้)
                </p>
                <Button variant="destructive" size="sm">
                  ลบบัญชี
                </Button>
              </div>
            </div>
            
            {/* Account Stats */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">สถิติบัญชี</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-600">
                    {Math.floor((new Date().getTime() - userData.joinDate.getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-muted-foreground">วันที่ใช้งาน</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">247</div>
                  <div className="text-sm text-muted-foreground">ครั้งทั้งหมด</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-600">15</div>
                  <div className="text-sm text-muted-foreground">การวิเคราะห์ร่างกาย</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Mail className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-orange-600">
                    {userData.lastLogin.toLocaleDateString('th-TH')}
                  </div>
                  <div className="text-sm text-muted-foreground">เข้าใช้ล่าสุด</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}