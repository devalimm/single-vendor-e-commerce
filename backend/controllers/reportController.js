import Order from '../models/Order.js';

const TIMEZONE = 'Europe/Istanbul';

// Helper: get $dateToString format and fill logic based on granularity
const getGroupFormat = (granularity) => {
   switch (granularity) {
      case 'weekly':
         // ISO week: group by year-week
         return { format: '%G-W%V', fillType: 'week' };
      case 'monthly':
         return { format: '%Y-%m', fillType: 'month' };
      case 'daily':
      default:
         return { format: '%Y-%m-%d', fillType: 'day' };
   }
};

// Helper: fill missing periods with zeros
const fillMissingPeriods = (data, startDate, endDate, fillType) => {
   const filled = [];
   const dataMap = new Map(data.map(d => [d._id, d]));
   const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

   if (fillType === 'day') {
      const current = new Date(startDate);
      while (current <= endDate) {
         const year = current.getFullYear();
         const month = String(current.getMonth() + 1).padStart(2, '0');
         const day = String(current.getDate()).padStart(2, '0');
         const dateStr = `${year}-${month}-${day}`;
         const existing = dataMap.get(dateStr);
         filled.push({
            date: dateStr,
            label: `${day} ${monthNames[current.getMonth()]}`,
            revenue: existing ? existing.revenue : 0,
            orders: existing ? existing.orders : 0
         });
         current.setDate(current.getDate() + 1);
      }
   } else if (fillType === 'week') {
      // Walk through weeks from start to end
      const current = new Date(startDate);
      // Move to Monday of the starting week
      const dayOfWeek = current.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      current.setDate(current.getDate() + diffToMonday);

      while (current <= endDate) {
         const isoYear = getISOWeekYear(current);
         const isoWeek = getISOWeek(current);
         const weekStr = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
         const existing = dataMap.get(weekStr);

         const weekEnd = new Date(current);
         weekEnd.setDate(weekEnd.getDate() + 6);
         const label = `${String(current.getDate()).padStart(2, '0')} ${monthNames[current.getMonth()]} - ${String(weekEnd.getDate()).padStart(2, '0')} ${monthNames[weekEnd.getMonth()]}`;

         filled.push({
            date: weekStr,
            label,
            revenue: existing ? existing.revenue : 0,
            orders: existing ? existing.orders : 0
         });
         current.setDate(current.getDate() + 7);
      }
   } else if (fillType === 'month') {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (current <= endDate) {
         const year = current.getFullYear();
         const month = String(current.getMonth() + 1).padStart(2, '0');
         const monthStr = `${year}-${month}`;
         const existing = dataMap.get(monthStr);
         filled.push({
            date: monthStr,
            label: `${monthNames[current.getMonth()]} ${year}`,
            revenue: existing ? existing.revenue : 0,
            orders: existing ? existing.orders : 0
         });
         current.setMonth(current.getMonth() + 1);
      }
   }

   return filled;
};

// ISO week helpers
function getISOWeek(date) {
   const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
   const dayNum = d.getUTCDay() || 7;
   d.setUTCDate(d.getUTCDate() + 4 - dayNum);
   const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
   return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getISOWeekYear(date) {
   const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
   const dayNum = d.getUTCDay() || 7;
   d.setUTCDate(d.getUTCDate() + 4 - dayNum);
   return d.getUTCFullYear();
}

// @desc    Get report summary (revenue, order count, daily/weekly/monthly breakdown)
// @route   GET /api/reports/summary
// @access  Private/Admin
export const getReportSummary = async (req, res) => {
   try {
      const { startDate, endDate, granularity = 'daily' } = req.query;

      if (!startDate || !endDate) {
         return res.status(400).json({
            success: false,
            message: 'startDate ve endDate parametreleri gereklidir.'
         });
      }

      // Parse dates as local Turkey time (the frontend sends YYYY-MM-DD in Turkey time)
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);

      // Create UTC dates adjusted for Turkey timezone (UTC+3)
      // startDate 00:00 Turkey = previous day 21:00 UTC
      const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0));
      start.setHours(start.getHours() - 3); // Convert Turkey midnight to UTC

      const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999));
      end.setHours(end.getHours() - 3); // Convert Turkey 23:59 to UTC

      // Match filter for period calculations (successful orders only)
      const periodMatchFilter = {
         createdAt: { $gte: start, $lte: end },
         status: { $ne: 'cancelled' }
      };

      // 1) Overall totals
      const [totals] = await Order.aggregate([
         { $match: { createdAt: { $gte: start, $lte: end } } },
         {
            $group: {
               _id: null,
               totalRevenue: { 
                  $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } 
               },
               totalOrders: { 
                  $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } 
               },
               cancelledOrders: { 
                  $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } 
               },
               returnedOrders: { 
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] } 
               },
               grossOrders: { $sum: 1 },
            }
         }
      ]);

      const avgOrderValue = totals && totals.totalOrders > 0 
         ? totals.totalRevenue / totals.totalOrders 
         : 0;
      
      const returnRate = totals && totals.grossOrders > 0 
         ? (totals.returnedOrders / totals.grossOrders) * 100 
         : 0;

      // 2) Period breakdown — use Turkey timezone for grouping
      const { format, fillType } = getGroupFormat(granularity);

      const periodData = await Order.aggregate([
         { $match: periodMatchFilter },
         {
            $group: {
               _id: {
                  $dateToString: {
                     format,
                     date: '$createdAt',
                     timezone: TIMEZONE
                  }
               },
               revenue: { $sum: '$total' },
               orders: { $sum: 1 }
            }
         },
         { $sort: { _id: 1 } }
      ]);

      // Fill missing periods
      // Use local JS dates for the fill logic (representing Turkey dates)
      const localStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const localEnd = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      const filledData = fillMissingPeriods(periodData, localStart, localEnd, fillType);

      res.json({
         success: true,
         data: {
            totalRevenue: totals?.totalRevenue || 0,
            totalOrders: totals?.totalOrders || 0,
            cancelledOrders: totals?.cancelledOrders || 0,
            returnedOrders: totals?.returnedOrders || 0,
            returnRate: returnRate || 0,
            avgOrderValue: avgOrderValue || 0,
            periodData: filledData,
            granularity
         }
      });
   } catch (error) {
      console.error('Report summary error:', error);
      res.status(500).json({
         success: false,
         message: 'Rapor verileri alınırken hata oluştu.'
      });
   }
};

// @desc    Get category-based sales distribution
// @route   GET /api/reports/categories
// @access  Private/Admin
export const getCategoryReport = async (req, res) => {
   try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
         return res.status(400).json({
            success: false,
            message: 'startDate ve endDate parametreleri gereklidir.'
         });
      }

      // Parse dates with Turkey timezone offset
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);

      const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0));
      start.setHours(start.getHours() - 3);

      const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999));
      end.setHours(end.getHours() - 3);

      const categoryData = await Order.aggregate([
         {
            $match: {
               createdAt: { $gte: start, $lte: end },
               status: { $ne: 'cancelled' }
            }
         },
         { $unwind: '$items' },
         {
            $lookup: {
               from: 'products',
               localField: 'items.product',
               foreignField: '_id',
               as: 'productInfo'
            }
         },
         { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
         {
            $lookup: {
               from: 'categories',
               localField: 'productInfo.category',
               foreignField: '_id',
               as: 'categoryInfo'
            }
         },
         { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
         {
            $group: {
               _id: '$categoryInfo._id',
               categoryName: { $first: '$categoryInfo.name' },
               totalRevenue: { $sum: '$items.itemTotal' },
               totalQuantity: { $sum: '$items.quantity' },
               orderCount: { $sum: 1 }
            }
         },
         { $sort: { totalRevenue: -1 } }
      ]);

      const formattedData = categoryData.map(item => ({
         categoryId: item._id,
         categoryName: item.categoryName || 'Kategori Silinmiş',
         totalRevenue: item.totalRevenue,
         totalQuantity: item.totalQuantity,
         orderCount: item.orderCount
      }));

      res.json({
         success: true,
         data: formattedData
      });
   } catch (error) {
      console.error('Category report error:', error);
      res.status(500).json({
         success: false,
         message: 'Kategori raporu alınırken hata oluştu.'
      });
   }
};
