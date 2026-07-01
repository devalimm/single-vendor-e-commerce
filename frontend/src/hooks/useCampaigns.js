import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Aktif kampanyaları backend'den çeken hook.
 * Kimlik doğrulama gerektirmez — public endpoint kullanır.
 */
export const useCampaigns = () => {
   const [campaigns, setCampaigns] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const fetchCampaigns = useCallback(async () => {
      try {
         setLoading(true);
         const res = await api.get('/campaigns/active');
         if (res.data?.success) {
            setCampaigns(res.data.data || []);
         }
      } catch (err) {
         setError(err);
         setCampaigns([]);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchCampaigns();
   }, [fetchCampaigns]);

   return { campaigns, loading, error, refetch: fetchCampaigns };
};
