import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  joinDate: Date;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    if (email === 'demo@example.com' && password === 'password') {
      const mockUser: User = {
        id: 'user-001',
        email: email,
        firstName: 'John',
        lastName: 'Doe',
        age: 28,
        gender: 'male',
        fitnessLevel: 'intermediate',
        goal: 'muscle-gain',
        joinDate: new Date('2024-01-15'),
        lastLogin: new Date()
      };
      setUser(mockUser);
      return true;
    }
    
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful registration
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      age: userData.age,
      gender: userData.gender,
      fitnessLevel: userData.fitnessLevel,
      goal: userData.goal,
      joinDate: new Date(),
      lastLogin: new Date()
    };
    
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful password reset request
    return true;
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful password reset
    return true;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}