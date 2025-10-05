import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLanguage, SUPPORTED_LANGUAGES } from './language/LanguageProvider';
import { toast } from 'sonner';
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
  Database,
  Globe,
  Check,
  Camera,
  Upload,
  X
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'standard';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  joinDate: Date;
  lastLogin: Date;
  profilePicture?: string;
}

interface UserProfileProps {
  userData: UserData;
  onUpdateProfile: (data: Partial<UserData>) => void;
  onSecurityUpdate: () => void;
}

export function UserProfile({ userData, onUpdateProfile, onSecurityUpdate }: UserProfileProps) {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>(userData);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'data'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(userData.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const updatedData = { ...formData };
    if (profilePicture !== userData.profilePicture) {
      updatedData.profilePicture = profilePicture || undefined;
    }
    onUpdateProfile(updatedData);
    setIsEditing(false);
    toast.success('โปรไฟล์ได้รับการอัปเดตเรียบร้อยแล้ว');
  };

  const handleCancel = () => {
    setFormData(userData);
    setProfilePicture(userData.profilePicture || null);
    setIsEditing(false);
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        toast.success('อัปโหลดรูปโปรไฟล์สำเร็จ');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    toast.success('ลบรูปโปรไฟล์แล้ว');
  };

  const handleLanguageChange = (languageCode: string) => {
    const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (selectedLanguage) {
      setLanguage(languageCode);
      toast.success(t('notification.languageChanged', { language: selectedLanguage.nativeName }));
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('notification.error'));
      return;
    }
    
    // Here you would normally make an API call to update the password
    onSecurityUpdate();
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success(t('notification.passwordUpdated'));
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return t('profile.weightLoss');
      case 'muscle-gain': return t('profile.muscleGain');
      default: return t('profile.maintenance');
    }
  };

  const getFitnessLevelText = (level: string) => {
    switch (level) {
      case 'standard': return 'Standard';
      default: return level;
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'standard': return 'bg-blue-100 text-blue-800';
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
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('profile.title')}
          </CardTitle>
          
          {/* Responsive Tab Navigation */}
          <div className="w-full overflow-x-auto">
            <div className="flex gap-2 min-w-fit">
              {[
                { key: 'profile', label: t('profile.personalInfo') },
                { key: 'settings', label: t('profile.languageSettings') },
                { key: 'security', label: t('profile.securitySettings') },
                { key: 'data', label: t('common.data') }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key as any)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarImage src={profilePicture || undefined} alt={`${formData.firstName} ${formData.lastName}`} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 p-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-3 h-3" />
                    </Button>
                    {profilePicture && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-8 h-8 p-0"
                        onClick={handleRemoveProfilePicture}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-xl font-semibold">{formData.firstName} {formData.lastName}</h3>
              <p className="text-muted-foreground">{formData.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge className={getGoalColor(formData.goal)}>
                  เป้าหมาย: {getGoalText(formData.goal)}
                </Badge>
                <Badge className={getFitnessLevelColor(formData.fitnessLevel)}>
                  ระดับ: Standard
                </Badge>
              </div>
              
              {isEditing && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    เปลี่ยนรูปโปรไฟล์
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('profile.personalInfo')}</span>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save')}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">{t('profile.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('profile.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="age">{t('common.age')}</Label>
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
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">{t('common.gender')}</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value: 'male' | 'female') => setFormData({...formData, gender: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('common.male')}</SelectItem>
                      <SelectItem value="female">{t('common.female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fitness Profile */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">{t('profile.fitnessLevel')}</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal">{t('profile.goal')}</Label>
                  <Select 
                    value={formData.goal} 
                    onValueChange={(value: 'weight-loss' | 'muscle-gain' | 'maintenance') => setFormData({...formData, goal: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">{t('profile.weightLoss')}</SelectItem>
                      <SelectItem value="muscle-gain">{t('profile.muscleGain')}</SelectItem>
                      <SelectItem value="maintenance">{t('profile.maintenance')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fitnessLevel">{t('profile.fitnessLevel')}</Label>
                  <Select 
                    value={formData.fitnessLevel} 
                    onValueChange={(value: 'standard') => setFormData({...formData, fitnessLevel: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('profile.languageSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Language Display */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-medium">{t('profile.currentLanguage')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentLanguage.flag}</span>
                <div>
                  <div className="font-medium">{currentLanguage.nativeName}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentLanguage.name}
                    {currentLanguage.region && ` (${currentLanguage.region})`}
                  </div>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('profile.selectLanguage')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <div
                    key={language.code}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      currentLanguage.code === language.code 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleLanguageChange(language.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{language.flag}</span>
                        <div>
                          <div className="font-medium">{language.nativeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {language.name}
                            {language.region && (
                              <div className="text-xs">{language.region}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('profile.securitySettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">{t('profile.changePassword')}</h4>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {t('profile.updatePassword')}
                </Button>
              </div>
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
              Data & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">Download your workout data and progress</p>
                </div>
                <Button variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Privacy Mode</h4>
                  <p className="text-sm text-muted-foreground">Hide your workout data from others</p>
                </div>
                <Button variant="outline" size="sm">Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}