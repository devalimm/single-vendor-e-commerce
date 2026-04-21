import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Variation from '../models/Variation.js';
import ShippingSettings from '../models/ShippingSettings.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

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

      if (!items || items.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Sipariş boş olamaz.'
         });
      }

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

      // Calculate totals and validate products
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
         const product = await Product.findById(item.product);

         if (!product) {
            return res.status(404).json({
               success: false,
               message: `Ürün bulunamadı: ${item.product}`
            });
         }

         if (!product.isActive) {
            return res.status(400).json({
               success: false,
               message: `Ürün aktif değil: ${product.name}`
            });
         }

         // Calculate item total
         let itemTotal = product.basePrice;
         let variationExtraTotal = 0;
         let optionsTotal = 0;

         // Add variation extra prices from variationSelections
         if (item.variationSelections && item.variationSelections.length > 0) {
            for (const sel of item.variationSelections) {
               const variation = await Variation.findOne({ name: sel.variationName, isActive: true });
               if (variation) {
                  const opt = variation.options.find(o => o.name === sel.optionName);
                  if (opt && opt.extraPrice) {
                     variationExtraTotal += opt.extraPrice;
                     itemTotal += opt.extraPrice;
                  }
               }
            }
         }

         // Legacy: support old size-based pricing
         if (!item.variationSelections && item.size) {
            const sizeOption = product.sizes.find(s => s.name === item.size);
            if (sizeOption && sizeOption.extraPrice) {
               variationExtraTotal += sizeOption.extraPrice;
               itemTotal += sizeOption.extraPrice;
            }
         }

         // Add options
         if (item.selectedOptions && item.selectedOptions.length > 0) {
            item.selectedOptions.forEach(selectedOpt => {
               const productOption = product.options.find(o => o.name === selectedOpt.name);
               if (productOption) {
                  optionsTotal += productOption.price;
                  itemTotal += productOption.price;
               }
            });
         }

         itemTotal *= item.quantity;
         subtotal += itemTotal;

         orderItems.push({
            product: product._id,
            productName: product.name,
            productImage: product.images[0] || '',
            quantity: item.quantity,
            variationSelections: item.variationSelections || [],
            size: item.variationSelections?.map(s => `${s.variationName}: ${s.optionName}`).join(', ') || item.size || 'Standart',
            selectedOptions: item.selectedOptions || [],
            basePrice: product.basePrice,
            variationExtraTotal,
            optionsTotal,
            itemTotal
         });
      }

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

       sendOrderConfirmation(order).catch(err => console.error('Sipariş emaili gönderilemedi:', err));

       res.status(201).json({
          success: true,
          data: order
       });
   } catch (error) {
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

      if (!items || items.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Sipariş boş olamaz.'
         });
      }

      if (!shippingAddress) {
         return res.status(400).json({
            success: false,
            message: 'Teslimat adresi gereklidir.'
         });
      }

      // Calculate totals and validate products
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
         const product = await Product.findById(item.product);

         if (!product) {
            return res.status(404).json({
               success: false,
               message: `Ürün bulunamadı: ${item.product}`
            });
         }

         if (!product.isActive) {
            return res.status(400).json({
               success: false,
               message: `Ürün aktif değil: ${product.name}`
            });
         }

         // Calculate item total
         let itemTotal = product.basePrice;
         let variationExtraTotal = 0;
         let optionsTotal = 0;

         // Add variation extra prices from variationSelections
         if (item.variationSelections && item.variationSelections.length > 0) {
            for (const sel of item.variationSelections) {
               const variation = await Variation.findOne({ name: sel.variationName, isActive: true });
               if (variation) {
                  const opt = variation.options.find(o => o.name === sel.optionName);
                  if (opt && opt.extraPrice) {
                     variationExtraTotal += opt.extraPrice;
                     itemTotal += opt.extraPrice;
                  }
               }
            }
         }

         // Legacy support
         if (!item.variationSelections && item.size) {
            const sizeOption = product.sizes.find(s => s.name === item.size);
            if (sizeOption && sizeOption.extraPrice) {
               variationExtraTotal += sizeOption.extraPrice;
               itemTotal += sizeOption.extraPrice;
            }
         }

         // Add options
         if (item.selectedOptions && item.selectedOptions.length > 0) {
            item.selectedOptions.forEach(selectedOpt => {
               const productOption = product.options.find(o => o.name === selectedOpt.name);
               if (productOption) {
                  optionsTotal += productOption.price;
                  itemTotal += productOption.price;
               }
            });
         }

         itemTotal *= item.quantity;
         subtotal += itemTotal;

         orderItems.push({
            product: product._id,
            productName: product.name,
            productImage: product.images[0] || '',
            quantity: item.quantity,
            variationSelections: item.variationSelections || [],
            size: item.variationSelections?.map(s => `${s.variationName}: ${s.optionName}`).join(', ') || item.size || 'Standart',
            selectedOptions: item.selectedOptions || [],
            basePrice: product.basePrice,
            variationExtraTotal,
            optionsTotal,
            itemTotal
         });
      }

      // Calculate shipping from admin settings
      const shippingCost = await calculateShippingCost(subtotal, orderItems.length);

      // Calculate tax (KDV - you can customize this)
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

const populatedOrder = await Order.findById(order._id)
          .populate('user', 'name email phone')
          .populate('items.product', 'name slug');

       sendOrderConfirmation(populatedOrder).catch(err => console.error('Sipariş emaili gönderilemedi:', err));

       res.status(201).json({
          success: true,
          data: populatedOrder
       });
   } catch (error) {
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

// @desc    Track orders by email or orderId (public)
// @route   GET /api/orders/track
// @access  Public
export const trackOrders = async (req, res) => {
   try {
      const { email, orderId } = req.query;

      if (!email && !orderId) {
         return res.status(400).json({
            success: false,
            message: 'E-posta veya sipariş numarası gereklidir.'
         });
      }

      let query = {};

if (orderId) {
           try {
              const orderIdTrimmed = orderId.trim().toUpperCase();

              // If it looks like a full ObjectId (24 hex chars), use findById directly
              if (/^[0-9A-F]{24}$/i.test(orderIdTrimmed)) {
                 const order = await Order.findById(orderIdTrimmed)
                    .populate('items.product', 'name images');
                 return res.json({ success: true, data: order ? [order] : [] });
              }

              // Otherwise, search by last 8 characters with a simple approach
              // Get all orders and filter in memory (small dataset expected)
              const allOrders = await Order.find()
                 .populate('items.product', 'name images')
                 .sort({ createdAt: -1 });

              const filtered = allOrders.filter(order => {
                 const orderIdStr = order._id.toString().toUpperCase();
                 return orderIdStr.endsWith(orderIdTrimmed);
              });

              return res.json({ success: true, data: filtered });
           } catch (e) {
              console.error('Track orders error:', e);
              return res.status(500).json({
                 success: false,
                 message: 'Sipariş sorgulanırken hata oluştu.'
              });
           }
        } else if (email) {
         // Search by email in shippingAddress
         query['shippingAddress.email'] = email.toLowerCase();
      }

      const orders = await Order.find(query)
         .populate('items.product', 'name images')
         .sort({ createdAt: -1 });

      res.json({
         success: true,
         data: orders
      });
   } catch (error) {
      console.error('Track orders error:', error);
      res.status(500).json({
         success: false,
         message: 'Siparişler sorgulanırken hata oluştu.'
      });
   }
};
