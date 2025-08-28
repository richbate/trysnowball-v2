import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

const DEFAULT_DATA_KEY = 'trysnowball-user-data';

export const useDebtMigration = () => {
  // ✅ Unconditional hook call
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const userDataKey = `trysnowball-user-data-${user.id}`;
      const existingUserData = localStorage.getItem(userDataKey);
      const guestData = localStorage.getItem(DEFAULT_DATA_KEY);

      if (!existingUserData && guestData) {
        const parsedGuestData = JSON.parse(guestData);

        const migratedData = {
          ...parsedGuestData,
          userId: user.id,
          profile: {
            ...parsedGuestData.profile,
            email: user.email ?? parsedGuestData.profile?.email ?? null,
            name:
              parsedGuestData.profile?.name ??
              (user.email ? user.email.split('@')[0] : 'Guest'),
          },
        };

        localStorage.setItem(userDataKey, JSON.stringify(migratedData));
        // Optionally clear guest data:
        // localStorage.removeItem(DEFAULT_DATA_KEY);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Migration] Migration skipped/failed:', error);
      }
    }
  }, [user?.id, user?.email]);
};

export default useDebtMigration;