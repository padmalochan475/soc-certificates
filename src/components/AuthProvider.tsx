import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User, doc, getDoc, db, setDoc } from '../firebase';
import { UserProfile } from '../types';
import { Loader } from './Loader';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfile(data);
          } else {
            // Check if it's the default admin
            if (currentUser.email === "padmalochan.mmaharana@gmail.com") {
              const adminProfile: UserProfile = {
                uid: currentUser.uid,
                role: 'ADMIN',
                name: currentUser.displayName || 'Admin',
                email: currentUser.email,
                isApproved: true,
              };
              setProfile(adminProfile);
              // Auto-create profile for default admin if it doesn't exist
              await setDoc(doc(db, 'users', currentUser.uid), adminProfile);
            } else {
              setProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-zinc-950"><Loader message="Initializing system..." /></div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
