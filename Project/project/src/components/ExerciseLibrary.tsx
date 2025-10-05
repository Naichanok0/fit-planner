import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  Activity, 
  Target, 
  Search, 
  Filter,
  Dumbbell,
  Home,
  Play,
  Info,
  Star,
  BarChart3,
  RefreshCw,
  Flame
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  category: string;
  targetMuscles: string[];
  difficulty: 'standard';
  equipment: 'none' | 'basic' | 'gym';
  estimatedCalories: number;
  aiAccuracy: number;
  description: string;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  muscles: {
    primary: string[];
    secondary: string[];
  };
  variations: string[];
  bodyTypeRating: {
    ectomorph: number;
    mesomorph: number;
    endomorph: number;
  };
}

interface ExerciseLibraryProps {
  selectedExercise: string;
  onSelectExercise: (exercise: string) => void;
}

export function ExerciseLibrary({ selectedExercise, onSelectExercise }: ExerciseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [showEquipmentOnly, setShowEquipmentOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load exercises from dataset
  useEffect(() => {
    const loadExercises = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/backend/dataset/metadata.json');
        if (response.ok) {
          const dataset = await response.json();
          console.log('Dataset loaded for exercises:', dataset?.length, 'programs');
          
          // Extract all exercises from all programs
          const allExercises: Exercise[] = [];
          dataset.forEach((program: { weeklySchedule?: Array<{ workout?: { exercises?: Array<Record<string, unknown>> } }> }) => {
            program.weeklySchedule?.forEach((day: { workout?: { exercises?: Array<Record<string, unknown>> } }) => {
              day.workout?.exercises?.forEach((exercise: Record<string, unknown>) => {
                // Transform dataset exercise to our Exercise interface
                const transformedExercise: Exercise = {
                  id: (exercise.id as string) || (exercise.name as string)?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
                  name: (exercise.name as string) || 'Unknown Exercise',
                  category: (exercise.category as string) || 'General',
                  targetMuscles: (exercise.target_muscles as string[]) || (exercise.targetMuscles as string[]) || ['General'],
                  difficulty: 'standard' as const,
                  equipment: (exercise.equipment as 'none' | 'basic' | 'gym') || 'none',
                  estimatedCalories: (exercise.calories as number) || 10,
                  aiAccuracy: (exercise.accuracy as number) || 85,
                  description: (exercise.description as string) || `${(exercise.name as string) || 'การออกกำลังกาย'} - การออกกำลังกายที่มีประสิทธิภาพ`,
                  instructions: (exercise.instructions as string[]) || (exercise.steps as string[]) || ['ทำตามขั้นตอนการออกกำลังกาย'],
                  tips: (exercise.tips as string[]) || ['รักษาท่าทางที่ถูกต้อง', 'หายใจสม่ำเสมอ'],
                  commonMistakes: (exercise.common_mistakes as string[]) || ['การทำท่าไม่ถูกต้อง'],
                  muscles: {
                    primary: (exercise.primary_muscles as string[]) || (exercise.targetMuscles as string[])?.slice(0, 2) || ['General'],
                    secondary: (exercise.secondary_muscles as string[]) || (exercise.targetMuscles as string[])?.slice(2) || []
                  },
                  variations: (exercise.variations as string[]) || [],
                  bodyTypeRating: {
                    ectomorph: (exercise.body_ratings as { ectomorph?: number })?.ectomorph || 7,
                    mesomorph: (exercise.body_ratings as { mesomorph?: number })?.mesomorph || 8,
                    endomorph: (exercise.body_ratings as { endomorph?: number })?.endomorph || 7
                  }
                };
                
                // Check if exercise already exists (avoid duplicates)
                if (!allExercises.find(ex => ex.id === transformedExercise.id)) {
                  allExercises.push(transformedExercise);
                }
              });
            });
          });
          
          console.log('Exercises extracted from dataset:', allExercises.length);
          setExercises(allExercises);
        } else {
          console.error('Failed to fetch dataset, using empty array');
          setExercises([]);
        }
      } catch (error) {
        console.error('Error loading exercises from dataset:', error);
        setExercises([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Get unique categories and equipment types
  const categories = ['all', ...new Set(exercises.map(ex => ex.category))];

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    let filtered = exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
      const matchesEquipment = equipmentFilter === 'all' || exercise.equipment === equipmentFilter;
      const matchesEquipmentToggle = !showEquipmentOnly || exercise.equipment !== 'none';

      return matchesSearch && matchesCategory && matchesDifficulty && matchesEquipment && matchesEquipmentToggle;
    });

    // Sort exercises
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'calories':
          return b.estimatedCalories - a.estimatedCalories;
        case 'accuracy':
          return b.aiAccuracy - a.aiAccuracy;
        default:
          return 0;
      }
    });

    return filtered;
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty, equipmentFilter, showEquipmentOnly, sortBy]);

  const getEquipmentIcon = (equipment: string) => {
    switch (equipment) {
      case 'none': return <Home className="w-4 h-4" />;
      case 'basic': return <Dumbbell className="w-4 h-4" />;
      case 'gym': return <Activity className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Activity className="w-6 h-6" />
            ไลบรารีการออกกำลังกาย
          </CardTitle>
          <p className="text-blue-100">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                กำลังโหลดข้อมูลจาก Dataset...
              </span>
            ) : (
              `รวบรวมท่าออกกำลังกายจาก Dataset ทั้งหมด ${filteredExercises.length} ท่า พร้อมคำแนะนำโดยละเอียด`
            )}
          </p>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
              <p className="text-lg font-medium">กำลังโหลดการออกกำลังกายจาก Dataset</p>
              <p className="text-gray-500">กรุณารอสักครู่...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                ค้นหาและกรองข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาท่าออกกำลังกายหรือกล้ามเนื้อที่ต้องการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="category">หมวดหมู่</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'ทั้งหมด' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="equipment">อุปกรณ์</Label>
                    <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                      <SelectTrigger id="equipment">
                        <SelectValue placeholder="เลือกอุปกรณ์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="none">ไม่ใช้อุปกรณ์</SelectItem>
                        <SelectItem value="basic">อุปกรณ์พื้นฐาน</SelectItem>
                        <SelectItem value="gym">ยิม</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sort">เรียงตาม</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort">
                        <SelectValue placeholder="เรียงตาม" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">ชื่อ</SelectItem>
                        <SelectItem value="calories">แคลอรี่</SelectItem>
                        <SelectItem value="accuracy">ความแม่นยำ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="equipment-only"
                      checked={showEquipmentOnly}
                      onCheckedChange={setShowEquipmentOnly}
                    />
                    <Label htmlFor="equipment-only">ใช้อุปกรณ์เท่านั้น</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                selectedExercise === exercise.id ? 'ring-2 ring-blue-500 shadow-xl' : ''
              }`} onClick={() => onSelectExercise(exercise.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 text-gray-800">{exercise.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          ปานกลาง
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getEquipmentIcon(exercise.equipment)}
                          {exercise.equipment === 'none' ? 'ไม่ใช้อุปกรณ์' : 
                           exercise.equipment === 'basic' ? 'อุปกรณ์พื้นฐาน' : 
                           exercise.equipment === 'gym' ? 'ยิม' : exercise.equipment}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2">
                    <div className="flex flex-col items-center">
                      <Flame className="w-4 h-4 text-orange-500 mb-1" />
                      <span className="text-xs font-medium">{exercise.estimatedCalories}</span>
                      <span className="text-xs text-gray-500">แคลอรี่</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Target className="w-4 h-4 text-green-500 mb-1" />
                      <span className="text-xs font-medium">{exercise.aiAccuracy}%</span>
                      <span className="text-xs text-gray-500">ความแม่นยำ</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Activity className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xs font-medium">{exercise.category}</span>
                      <span className="text-xs text-gray-500">หมวดหมู่</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">              
                  {/* Target Muscles */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="w-4 h-4 text-red-500" />
                      กล้ามเนื้อหลัก:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscles.primary.map(muscle => (
                        <Badge key={muscle} variant="secondary" className="text-xs bg-red-50 text-red-700">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Instructions Preview */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Info className="w-4 h-4 text-green-500" />
                      ขั้นตอนการออกกำลังกาย:
                    </div>
                    <div className="space-y-1 max-h-20 overflow-hidden">
                      {exercise.instructions.slice(0, 3).map((instruction, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="line-clamp-1">{instruction}</span>
                        </div>
                      ))}
                      {exercise.instructions.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium">
                          และอีก {exercise.instructions.length - 3} ขั้นตอน...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Star className="w-4 h-4 text-green-500" />
                      ประโยชน์:
                    </div>
                    <div className="text-xs text-gray-600 bg-green-50 p-2 rounded">
                      {exercise.targetMuscles.length > 0 ? (
                        <>เสริมสร้างความแข็งแกร่ง {exercise.targetMuscles.join(', ')} และเผาผลาญแคลอรี่ได้ถึง {exercise.estimatedCalories} แคลอรี่</>
                      ) : (
                        <>ช่วยเสริมสร้างความแข็งแกร่งและเผาผลาญแคลอรี่</>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant={selectedExercise === exercise.id ? "default" : "outline"}
                    className="w-full"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onSelectExercise(exercise.id);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {selectedExercise === exercise.id ? 'เลือกแล้ว' : 'ดูรายละเอียด'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results message */}
          {filteredExercises.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบท่าออกกำลังกาย</h3>
                <p className="text-gray-500">ลองปรับเกณฑ์การค้นหาหรือเลือกหมวดหมู่อื่น</p>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                สถิติการออกกำลังกาย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{exercises.length}</div>
                  <div className="text-sm text-muted-foreground">ท่าทั้งหมด</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {exercises.filter(ex => ex.equipment === 'none').length}
                  </div>
                  <div className="text-sm text-muted-foreground">ไม่ต้องใช้อุปกรณ์</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {exercises.length > 0 ? Math.round(exercises.reduce((sum, ex) => sum + ex.aiAccuracy, 0) / exercises.length) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">ความแม่นยำ AI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {categories.length - 1}
                  </div>
                  <div className="text-sm text-muted-foreground">หมวดหมู่</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}