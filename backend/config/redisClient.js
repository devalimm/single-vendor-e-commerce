import { createClient } from 'redis';

const redisClient = createClient({
   url: process.env.REDIS_URL || 'redis://localhost:6379',
   socket: {
      reconnectStrategy: (retries) => {
         // İlk 5 denemede hızlı, sonra 5 saniyede bir dene
         if (retries > 5) return 5000;
         return Math.min(retries * 200, 2000);
      }
   }
});

redisClient.on('error', (err) => {
   // Redis hatası uygulamayı durdurmasın, sadece logla
   console.warn('[Redis] Bağlantı hatası:', err.message);
});

redisClient.on('connect', () => {
   console.log('[Redis] Bağlantı kuruldu.');
});

redisClient.on('reconnecting', () => {
   console.log('[Redis] Yeniden bağlanılıyor...');
});

/**
 * Sunucu başlarken bir kez çağrılır.
 * Redis bağlanamazsa uygulama yine de çalışmaya devam eder.
 */
export const connectRedis = async () => {
   try {
      await redisClient.connect();
   } catch (err) {
      console.warn('[Redis] İlk bağlantı başarısız, önbelleksiz çalışılacak:', err.message);
   }
};

/**
 * products:* pattern'ına uyan tüm cache key'lerini siler.
 * Admin CRUD işlemlerinden sonra çağrılır.
 */
export const invalidateProductCache = async () => {
   try {
      let cursor = 0;
      do {
         const result = await redisClient.scan(cursor, {
            MATCH: 'products:*',
            COUNT: 100
         });
         cursor = result.cursor;
         if (result.keys.length > 0) {
            await redisClient.del(result.keys);
         }
      } while (cursor !== 0);
      console.log('[Redis] Ürün önbelleği temizlendi.');
   } catch (err) {
      // Temizleme başarısız olsa da iş akışını durdurma
      console.warn('[Redis] Cache invalidation hatası:', err.message);
   }
};

export default redisClient;
