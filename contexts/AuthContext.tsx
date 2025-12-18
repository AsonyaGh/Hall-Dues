import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserProfile, initializeData } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  login: (email: string, role?: UserRole) => Promise<boolean>; // Role param deprecated but kept for signature compatibility
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to seed data on first app load (if admin exists)
    initializeData().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Fetch extended profile from Firestore
        // Note: For this demo, we assume the Firestore document ID is the email or the document has the email field
        try {
          const profile = await getUserProfile(firebaseUser.email);
          if (profile) {
            setUser(profile);
          } else {
            // Fallback for purely auth users without profile
            console.error("User authenticated but no profile found in Firestore 'users' collection");
            setUser(null);
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, _role?: UserRole): Promise<boolean> => {
    // In the previous offline version, we just checked email.
    // Now we rely on the Login Component to handle the actual signInWithEmailAndPassword 
    // and this context updates automatically via onAuthStateChanged.
    // However, to keep the Login page logic simple for now, we can wrap the firebase call here
    // But since the Login page asks for password, we can't do it here without the password passed to this function.
    
    // To minimize refactoring the Login Page, we will assume the Login Page handles the Firebase Auth call directly,
    // OR we change the interface. Let's rely on the Login page to call Firebase Auth, 
    // and this context simply reflects the state.
    
    // Wait for the onAuthStateChanged to fire
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (auth.currentUser?.email === email) {
                clearInterval(check);
                resolve(true);
            }
        }, 500);
        // Timeout
        setTimeout(() => { clearInterval(check); resolve(false); }, 5000);
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};