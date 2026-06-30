import Order from '../models/Order.js';
import ShippingSettings from '../models/ShippingSettings.js';
import { sendOrderConfirmation } from '../utils/emailService.js';
import { validateAndCalculateItems, deductStock } from '../utils/orderHelper.js';

// Helper: calculate shipping cost based on admin settings
async function calculateShippingCost(subtotal, itemCount) {
   const settings = await ShippingSettings.getSettings();
   const fee = settings.standardShippingFee;

   // Check free shipping threshold first
   if (settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold) {
      return 0;
   }

   switch (settings.calculationMethod) {
      case 'single':
         return fee;
      case 'sum_all':
         return fee * itemCount;
      case 'first_plus':
         return fee + (Math.max(0, itemCount - 1) * (settings.perItemExtraFee || 0));
      case 'threshold':
         // threshold mode — fee applies if below threshold, 0 if above
         return subtotal >= settings.freeShippingThreshold ? 0 : fee;
      case 'delivery':
         // For now use standard fee; delivery method selection can be added later
         return fee;
      default:
         return fee;
   }
}

// @desc    Create guest order (no login required)
// @route   POST /api/orders/guest
// @access  Public
export const createGuestOrder = async (req, res) => {
   try {
      const {
         items,
         shippingAddress,
         paymentMethod,
         customerNote
      } = req.body;

      if (!shippingAddress) {
         return res.status(400).json({
            success: false,
            message: 'Teslimat bilgileri gereklidir.'
         });
      }

      // Validate required shipping fields
      const requiredFields = ['fullName', 'email', 'phone', 'city', 'district', 'neighborhood', 'address'];
      for (const field of requiredFields) {
         if (!shippingAddress[field]) {
            return res.status(400).json({
               success: false,
               message: `${field} alanı gereklidir.`
            });
         }
      }

      // Validate TC Kimlik (11 digits)
      if (shippingAddress.tcKimlik && !/^\d{11}$/.test(shippingAddress.tcKimlik)) {
         return res.status(400).json({
            success: false,
            message: 'TC Kimlik numarası 11 haneli olmalıdır.'
         });
      }

      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
         return res.status(400).json({
            success: false,
            message: 'Geçerli bir e-posta adresi giriniz.'
         });
      }

      // Validate items, calculate prices (with discounts), check stock
      const { orderItems, subtotal } = await validateAndCalculateItems(items);

      // Calculate shipping from admin settings
      const shippingCost = await calculateShippingCost(subtotal, orderItems.length);
      const tax = 0;
      const total = subtotal + shippingCost + tax;

      const order = await Order.create({
         items: orderItems,
         shippingAddress,
         subtotal,
         shippingCost,
         tax,
         total,
         paymentMethod: paymentMethod || 'cash_on_delivery',
         customerNote
      });

      // Deduct stock after successful order creation
      await deductStock(orderItems);

      sendOrderConfirmation(order).catch(err => console.error('Sipariş emaili gönderilemedi:', err));

      res.status(201).json({
         success: true,
         data: order
      });
   } catch (error) {
      // Handle validation errors from orderHelper
      if (error.status) {
         return res.status(error.status).json({
            success: false,
            message: error.message
         });
      }
      console.error('Create guest order error:', error);
      res.status(500).json({
         success: false,
         message: 'Sipariş oluşturulurken hata oluştu.',
         error: error.message
      });
   }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
   try {
      const {
         items,
         shippingAddress,
         paymentMethod,
         customerNote
      } = req.body;

      if (!shippingAddress) {
         return res.status(400).json({
            success: false,
            message: 'Teslimat adresi gereklidir.'
         });
      }

      // Validate items, calculate prices (with discounts), check stock
      const { orderItems, subtotal } = await validateAndCalculateItems(items);

      // Calculate shipping from admin settings
      const shippingCost = await calculateShippingCost(subtotal, orderItems.length);
      const tax = 0;
      const total = subtotal + shippingCost + tax;

      const order = await Order.create({
         user: req.user._id,
         items: orderItems,
         shippingAddress,
         subtotal,
         shippingCost,
         tax,
         total,
         paymentMethod: paymentMethod || 'cash_on_delivery',
         customerNote
      });

      // Deduct stock after successful order creation
      await deductStock(orderItems);

      const populatedOrder = await Order.findById(order._id)
         .populate('user', 'name email phone')
         .populate('items.product', 'name slug');

      sendOrderConfirmation(populatedOrder).catch(err => console.error('Sipariş emaili gönderilemedi:', err));

      res.status(201).json({
         success: true,
         data: populatedOrder
      });
   } catch (error) {
      // Handle validation errors from orderHelper
      if (error.status) {
         return res.status(error.status).json({
            success: false,
            message: error.message
         });
      }
      console.error('Create order error:', error);
      res.status(500).json({
         success: false,
         message: 'Sipariş oluşturulurken hata oluştu.',
         error: error.message
      });
   }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (req, res) => {
   try {
      const orders = await Order.find({ user: req.user._id })
         .populate('items.product', 'name slug images')
         .sort({ createdAt: -1 });

      res.json({
         success: true,
         count: orders.length,
         data: orders
      });
   } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
         success: false,
         message: 'Siparişler alınırken hata oluştu.'
      });
   }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
   try {
      const order = await Order.findById(req.params.id)
         .populate('user', 'name email phone')
         .populate('items.product', 'name slug images');

      if (!order) {
         return res.status(404).json({
            success: false,
            message: 'Sipariş bulunamadı.'
         });
      }

      // Check if user owns this order or is admin
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
         return res.status(403).json({
            success: false,
            message: 'Bu siparişe erişim yetkiniz yok.'
         });
      }

      res.json({
         success: true,
         data: order
      });
   } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
         success: false,
         message: 'Sipariş alınırken hata oluştu.'
      });
   }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/all
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const query = {};

      // Filter by status
      if (req.query.status) {
         query.status = req.query.status;
      }

      // Filter by payment status
      if (req.query.paymentStatus) {
         query.paymentStatus = req.query.paymentStatus;
      }
      
      // Search logic for pagination support
      if (req.query.search) {
         const searchRegex = new RegExp(req.query.search, 'i');
         query.$or = [
            { 'shippingAddress.fullName': searchRegex },
            { 'shippingAddress.email': searchRegex },
            { 'shippingAddress.phone': searchRegex },
            { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: req.query.search, options: "i" } } }
         ];
      }

      const orders = await Order.find(query)
         .populate('user', 'name email phone')
         .populate('items.product', 'name slug')
         .sort({ createdAt: -1 })
         .limit(limit)
         .skip(skip);

      const total = await Order.countDocuments(query);

      res.json({
         success: true,
         count: orders.length,
         total,
         page,
         pages: Math.ceil(total / limit),
         data: orders
      });
   } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
         success: false,
         message: 'Siparişler alınırken hata oluştu.'
      });
   }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
   try {
      const order = await Order.findById(req.params.id);

      if (!order) {
         return res.status(404).json({
            success: false,
            message: 'Sipariş bulunamadı.'
         });
      }

      const { status, trackingNumber, courier, adminNote } = req.body;

      if (status) {
         order.status = status;

         // Update timestamps based on status
         if (status === 'confirmed' && !order.confirmedAt) {
            order.confirmedAt = new Date();
         } else if (status === 'shipped' && !order.shippedAt) {
            order.shippedAt = new Date();
         } else if (status === 'delivered' && !order.deliveredAt) {
            order.deliveredAt = new Date();
         } else if (status === 'cancelled' && !order.cancelledAt) {
            order.cancelledAt = new Date();
         }
      }

      if (trackingNumber) {
         order.trackingNumber = trackingNumber;
      }

      if (courier) {
         order.courier = courier;
      }

      if (adminNote !== undefined) {
         order.adminNote = adminNote;
      }

      const updatedOrder = await order.save();
      const populatedOrder = await Order.findById(updatedOrder._id)
         .populate('user', 'name email phone')
         .populate('items.product', 'name slug');

      res.json({
         success: true,
         data: populatedOrder
      });
   } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
         success: false,
         message: 'Sipariş durumu güncellenirken hata oluştu.'
      });
   }
};

// @desc    Bulk update order status
// @route   PUT /api/orders/bulk-status
// @access  Private/Admin
export const bulkUpdateOrderStatus = async (req, res) => {
   try {
      const { orderIds, status } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Sipariş IDleri gereklidir.'
         });
      }

      if (!status) {
         return res.status(400).json({
            success: false,
            message: 'Yeni durum gereklidir.'
         });
      }

      const timestampField = {
         confirmed: 'confirmedAt',
         shipped: 'shippedAt',
         delivered: 'deliveredAt',
         cancelled: 'cancelledAt'
      };

      const updateData = { status };
      if (timestampField[status]) {
         updateData[timestampField[status]] = new Date();
      }

      const result = await Order.updateMany(
         { _id: { $in: orderIds } },
         { $set: updateData }
      );

      res.json({
         success: true,
         message: `${result.modifiedCount} sipariş güncellendi.`,
         modifiedCount: result.modifiedCount
      });
   } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
         success: false,
         message: 'Toplu güncelleme sırasında hata oluştu.'
      });
   }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res) => {
   try {
      const order = await Order.findById(req.params.id);

      if (!order) {
         return res.status(404).json({
            success: false,
            message: 'Sipariş bulunamadı.'
         });
      }

      const { paymentStatus } = req.body;

      if (!paymentStatus) {
         return res.status(400).json({
            success: false,
            message: 'Ödeme durumu gereklidir.'
         });
      }

      order.paymentStatus = paymentStatus;
      const updatedOrder = await order.save();

      res.json({
         success: true,
         data: updatedOrder
      });
   } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
         success: false,
         message: 'Ödeme durumu güncellenirken hata oluştu.'
      });
   }
};

// @desc    Track order by orderId + email verification (public)
// @route   GET /api/orders/track
// @access  Public
export const trackOrders = async (req, res) => {
   try {
      const { email, orderId } = req.query;

      // Require BOTH orderId and email to prevent IDOR / PII leakage
      if (!orderId || !email) {
         return res.status(400).json({
            success: false,
            message: 'Sipariş numarası ve e-posta adresi birlikte gereklidir.'
         });
      }

      const emailNormalized = email.trim().toLowerCase();
      const orderIdTrimmed = orderId.trim();

      if (!orderIdTrimmed || !emailNormalized) {
         return res.status(400).json({
            success: false,
            message: 'Geçerli sipariş numarası ve e-posta adresi giriniz.'
         });
      }

      let order = null;

      // Full ObjectId (24 hex chars) — direct lookup with email verification
      if (/^[0-9a-f]{24}$/i.test(orderIdTrimmed)) {
         order = await Order.findOne({
            _id: orderIdTrimmed,
            'shippingAddress.email': emailNormalized
         }).populate('items.product', 'name images');
      } else if (/^[0-9a-f]{6,16}$/i.test(orderIdTrimmed)) {
         // Short order number (last N chars of ObjectId) — use $regex on _id
         // Only allow 6-16 hex characters to prevent overly broad matches
         order = await Order.findOne({
            'shippingAddress.email': emailNormalized,
            $expr: {
               $regexMatch: {
                  input: { $toString: '$_id' },
                  regex: `${orderIdTrimmed}$`,
                  options: 'i'
               }
            }
         }).populate('items.product', 'name images');
      } else {
         return res.status(400).json({
            success: false,
            message: 'Geçersiz sipariş numarası formatı.'
         });
      }

      if (!order) {
         return res.json({ success: true, data: [] });
      }

      // Return PII-minimal response — no full address, phone, email, tcKimlik
      const maskedOrder = {
         _id: order._id,
         status: order.status,
         paymentStatus: order.paymentStatus,
         items: order.items.map(item => ({
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            size: item.size,
            selectedOptions: item.selectedOptions,
            basePrice: item.basePrice,
            variationExtraTotal: item.variationExtraTotal,
            optionsTotal: item.optionsTotal,
            itemTotal: item.itemTotal,
            product: item.product
         })),
         subtotal: order.subtotal,
         shippingCost: order.shippingCost,
         tax: order.tax,
         total: order.total,
         trackingNumber: order.trackingNumber || null,
         courier: order.courier || null,
         createdAt: order.createdAt,
         confirmedAt: order.confirmedAt,
         shippedAt: order.shippedAt,
         deliveredAt: order.deliveredAt,
         // Masked PII — only city/district visible, name masked
         shippingAddress: {
            fullName: maskName(order.shippingAddress.fullName),
            city: order.shippingAddress.city,
            district: order.shippingAddress.district
         }
      };

      res.json({
         success: true,
         data: [maskedOrder]
      });
   } catch (error) {
      console.error('Track orders error:', error);
      res.status(500).json({
         success: false,
         message: 'Siparişler sorgulanırken hata oluştu.'
      });
   }
};

// Helper: mask a full name for PII-minimal display ("Ali Yılmaz" → "A** Y*****")
function maskName(name) {
   if (!name) return '';
   return name.split(' ').map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(part.length - 1);
   }).join(' ');
}
