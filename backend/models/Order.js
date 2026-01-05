import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional for guest checkout
   },

   items: [{
      product: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Product',
         required: true
      },
      productName: String, // Store name in case product is deleted
      productImage: String, // Store main image
      quantity: {
         type: Number,
         required: true,
         min: 1
      },
      size: {
         type: String,
         required: true
      },
      length: {
         type: String
      },
      selectedOptions: [{
         name: String,
         price: Number
      }],
      basePrice: {
         type: Number,
         required: true
      },
      lengthAdjustment: {
         type: Number,
         default: 0
      },
      optionsTotal: {
         type: Number,
         default: 0
      },
      itemTotal: {
         type: Number,
         required: true
      }
   }],

   // Customer & Shipping information (Turkey)
   shippingAddress: {
      fullName: {
         type: String,
         required: true
      },
      tcKimlik: {
         type: String,
         required: true
      },
      email: {
         type: String,
         required: true
      },
      phone: {
         type: String,
         required: true
      },
      city: {
         type: String,
         required: true
      },
      district: {
         type: String,
         required: true
      },
      neighborhood: {
         type: String,
         required: true
      },
      address: {
         type: String,
         required: true
      }
   },

   // Order totals
   subtotal: {
      type: Number,
      required: true
   },
   shippingCost: {
      type: Number,
      default: 0
   },
   tax: {
      type: Number,
      default: 0
   },
   total: {
      type: Number,
      required: true
   },

   // Payment information
   paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash_on_delivery'],
      default: 'cash_on_delivery'
   },
   paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
   },

   // Order status
   status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
   },

   // Tracking
   trackingNumber: String,

   // Notes
   customerNote: String,
   adminNote: String,

   // Timestamps for status changes
   confirmedAt: Date,
   shippedAt: Date,
   deliveredAt: Date,
   cancelledAt: Date
}, {
   timestamps: true
});

// Update product sales count when order is confirmed
orderSchema.post('save', async function (doc) {
   if (doc.status === 'confirmed' && !doc.confirmedAt) {
      const Product = mongoose.model('Product');

      for (const item of doc.items) {
         await Product.findByIdAndUpdate(item.product, {
            $inc: { salesCount: item.quantity }
         });
      }

      doc.confirmedAt = new Date();
      await doc.save();
   }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
