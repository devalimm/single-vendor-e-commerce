import Order from '../models/Order.js';
import Product from '../models/Product.js';

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
      const requiredFields = ['fullName', 'tcKimlik', 'email', 'phone', 'city', 'district', 'neighborhood', 'address'];
      for (const field of requiredFields) {
         if (!shippingAddress[field]) {
            return res.status(400).json({
               success: false,
               message: `${field} alanı gereklidir.`
            });
         }
      }

      // Validate TC Kimlik (11 digits)
      if (!/^\d{11}$/.test(shippingAddress.tcKimlik)) {
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
         let lengthAdjustment = 0;
         let optionsTotal = 0;

         // Add length adjustment
         if (item.length) {
            const lengthOption = product.lengths.find(l => l.name === item.length);
            if (lengthOption) {
               lengthAdjustment = lengthOption.priceAdjustment;
               itemTotal += lengthAdjustment;
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
            size: item.size,
            length: item.length,
            selectedOptions: item.selectedOptions || [],
            basePrice: product.basePrice,
            lengthAdjustment,
            optionsTotal,
            itemTotal
         });
      }

      // Calculate shipping (free over 500 TL)
      const shippingCost = subtotal > 500 ? 0 : 30;
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
         let lengthAdjustment = 0;
         let optionsTotal = 0;

         // Add length adjustment
         if (item.length) {
            const lengthOption = product.lengths.find(l => l.name === item.length);
            if (lengthOption) {
               lengthAdjustment = lengthOption.priceAdjustment;
               itemTotal += lengthAdjustment;
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
            size: item.size,
            length: item.length,
            selectedOptions: item.selectedOptions || [],
            basePrice: product.basePrice,
            lengthAdjustment,
            optionsTotal,
            itemTotal
         });
      }

      // Calculate shipping (you can customize this)
      const shippingCost = subtotal > 500 ? 0 : 30; // Free shipping over 500 TL

      // Calculate tax (KDV - you can customize this)
      const tax = 0; // Or calculate based on your tax rules

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

      const { status, trackingNumber, adminNote } = req.body;

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
         // Search by order ID
         query._id = orderId;
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
