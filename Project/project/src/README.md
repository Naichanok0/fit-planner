# �️‍♀️ Fit Planner

Fit Planner เป็นแอปพลิเคชันวางแผนฟิตเนสส่วนบุคคลที่ใช้เทคโนโลジี AI เพื่อวิเคราะห์รูปร่างจากภาพดิจิทัลและสร้างโปรแกรมออกกำลังกายแบบเฉพาะบุคคล

## 🎯 **Features**

### 🔐 **Authentication System**
- ✅ User Registration (Multi-step form)
- ✅ Login/Logout 
- ✅ Password Reset
- ✅ Profile Management

### 🔬 **Body Analysis**
- ✅ Image Upload for Body Analysis
- ✅ AI Analysis Simulation (BMI, Body Fat, Muscle Mass)
- ✅ Automatic Workout Program Generation
- ✅ Analysis History

### 💪 **Workout Programs**
- ✅ Goal-based Programs (Weight Loss, Muscle Gain, Maintenance)
- ✅ Fitness Level Adaptation (Beginner, Intermediate, Advanced)
- ✅ Exercise Library with Instructions
- ✅ Progress Tracking

### 🍎 **Nutrition Planning**
- ✅ Calorie Calculation based on Goals
- ✅ Macro Distribution (Protein, Carbs, Fat)
- ✅ Meal Planning System

### 📊 **Progress Dashboard**
- ✅ Workout Session Tracking
- ✅ Statistics and Charts
- ✅ Achievement System
- ✅ Performance Analytics

## 🛠 **Tech Stack**

- **React 18** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS v4** for styling
- **ShadCN/UI** component library
- **Lucide React** for icons
- **Recharts** for charts and graphs
- **Motion** for animations

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- Visual Studio Code (recommended)

### **Installation**

1. **Clone/Open Project**
   ```bash
   # Open in VS Code
   code .
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - App will open at `http://localhost:3000`

## 📋 **Available Scripts**

```bash
# Development
npm run dev              # Start development server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Lint TypeScript code
npm run type-check      # Check TypeScript types
```

## 📁 **Project Structure**

```
ai-health-app/
├── components/           # React components
│   ├── auth/            # Authentication
│   ├── ui/              # ShadCN UI components
│   ├── BodyAnalysis.tsx
│   ├── PersonalProgram.tsx
│   ├── NutritionPlanner.tsx
│   └── ...
├── styles/
│   └── globals.css      # Tailwind + custom styles
├── public/              # Static assets
├── App.tsx             # Main component
├── main.tsx            # Entry point
└── index.html          # HTML template
```

## 🎨 **Design System**

### **Dark Theme Default**
- Uses modern dark color palette
- Optimized for health/fitness apps
- Accessible contrast ratios

### **Component Library**
- **ShadCN/UI** - Pre-built accessible components
- **Lucide React** - Beautiful icons
- **Recharts** - Interactive charts

## 🔧 **Development Setup for VS Code**

### **Recommended Extensions**
The project includes VS Code settings that will prompt you to install:

- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- TypeScript Language Features

### **Auto-Configuration**
- TypeScript strict mode enabled
- Prettier formatting on save
- ESLint with React/TypeScript rules
- Tailwind IntelliSense
- Path mapping with `@/` alias

## 🧪 **Demo Features**

### **Authentication**
- Mock authentication system
- Registration with fitness profile
- Profile management

### **Body Analysis**
- Image upload simulation
- AI analysis mock data
- Body measurements calculation

### **Workout Programs**
- Auto-generated based on user goals
- Customized for fitness levels
- Progress tracking

### **Nutrition Planning**
- Calorie calculation
- Macro breakdown
- Meal planning suggestions

## 💡 **Usage Examples**

### **Body Analysis Flow**
1. Upload body image
2. Enter height and weight
3. Get AI analysis results
4. Receive personalized workout program

### **Workout Session**
1. Select exercise from library
2. Use AI detection for form feedback
3. Track reps and performance
4. View progress analytics

## 🐛 **Troubleshooting**

### **Common Issues**

**TypeScript Errors (Red Underlines)**
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**Missing Tailwind Autocomplete**
```bash
# Install Tailwind CSS IntelliSense extension
# Reload VS Code window
```

**Build Errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

See [SETUP.md](./SETUP.md) for detailed troubleshooting guide.

## 🎯 **Future Enhancements**

### **Phase 1: Enhanced Features**
- Real AI integration for pose estimation
- Advanced body composition analysis
- Social features and challenges

### **Phase 2: Backend Integration**
- User data persistence
- Cloud storage for images
- Real-time synchronization

### **Phase 3: Mobile App**
- React Native version
- Camera integration
- Offline capabilities

## 📞 **Support**

### **Development**
- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- Review TypeScript errors in VS Code
- Use browser DevTools for debugging

### **Features**
- Demo authentication works out of the box
- All components are fully functional
- Mock data simulates real API responses

---

## 🎉 **Get Started**

```bash
# Quick start
npm install && npm run dev
```

Your Fit Planner app will be running at `http://localhost:3000`!

---

**Built with ❤️ using React + TypeScript + Tailwind CSS**