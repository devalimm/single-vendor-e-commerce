import rateLimit from 'express-rate-limit';

// General API rate limiter - 200 requests per 15 minutes
export const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 200, // Limit each IP to 200 requests per windowMs
   message: {
      success: false,
      message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
   },
   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth endpoints rate limiter - 10 requests per 15 minutes (stricter for login/register)
export const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 10, // Limit each IP to 10 requests per windowMs
   message: {
      success: false,
      message: 'Çok fazla giriş denemesi yaptınız. Lütfen 15 dakika sonra tekrar deneyin.'
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Strict rate limiter for sensitive operations - 20 requests per 15 minutes
export const strictLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 20, // Limit each IP to 20 requests per windowMs
   message: {
      success: false,
      message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
   },
   standardHeaders: true,
   legacyHeaders: false,
});
