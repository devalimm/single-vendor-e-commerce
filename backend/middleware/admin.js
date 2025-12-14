export const adminOnly = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
      next();
   } else {
      res.status(403).json({
         success: false,
         message: 'Bu işlem için admin yetkisi gereklidir.'
      });
   }
};
