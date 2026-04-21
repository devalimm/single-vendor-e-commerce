import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useShippingSettings = () => {
   const [settings, setSettings] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const fetchSettings = useCallback(async () => {
      try {
         setLoading(true);
         const res = await api.get('/shipping-settings');
         if (res.data?.success) {
            setSettings(res.data.data);
         }
      } catch (err) {
         setError(err);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchSettings();
   }, [fetchSettings]);

   return { settings, loading, error, refetch: fetchSettings };
};