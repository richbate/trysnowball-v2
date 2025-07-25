// src/contexts/UserContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../Supabase'; // Use capital 'S' if your file is Supabase.js

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      // Development bypass - fake user when running locally
      if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
        const devUser = {
          id: 'dev-user-123',
          email: 'dev@trysnowball.local',
          created_at: '2024-01-01T00:00:00.000Z'
        };
        setUser(devUser);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);