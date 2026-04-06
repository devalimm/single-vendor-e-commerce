import Iyzipay from 'iyzipay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Variation from '../models/Variation.js';
import ShippingSettings from '../models/ShippingSettings.js';
import PendingOrder from '../models/PendingOrder.js';

// Lazy iyzipay initialization — only created when first needed
let _iyzipay = null;
function getIyzipay() {
    if (!_iyzipay) {
        if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
            throw new Error('IYZICO_API_KEY ve IYZICO_SECRET_KEY .env dosyasında tanımlanmalıdır.');
        }
        _iyzipay = new Iyzipay({
            apiKey: process.env.IYZICO_API_KEY,
            secretKey: process.env.IYZICO_SECRET_KEY,
            uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
        });
    }
    return _iyzipay;
}

// Helper: strip trailing slash from URL
function trimUrl(url) {
    return url ? url.replace(/\/+$/, '') : url;
}

// Helper: calculate shipping cost (same as orderController)
async function calculateShippingCost(subtotal, itemCount) {
    const settings = await ShippingSettings.getSettings();
    const fee = settings.standardShippingFee;

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
            return subtotal >= settings.freeShippingThreshold ? 0 : fee;
        case 'delivery':
            return fee;
        default:
            return fee;
    }
}

// @desc    Initialize iyzico checkout form
// @route   POST /api/payment/initialize
// @access  Public
export const initializeCheckoutForm = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
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

        // Calculate totals and validate products
        let subtotal = 0;
        const orderItems = [];
        const basketItems = [];

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

            // Legacy: support old size-based pricing for existing orders
            if (!item.variationSelections && item.size) {
                const sizeOption = product.sizes.find(s => s.name === item.size);
                if (sizeOption && sizeOption.extraPrice) {
                    variationExtraTotal += sizeOption.extraPrice;
                    itemTotal += sizeOption.extraPrice;
                }
            }

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

            // iyzico basket item
            basketItems.push({
                id: product._id.toString(),
                name: product.name.substring(0, 50),
                category1: 'Giyim',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: itemTotal.toFixed(2)
            });
        }

        // Calculate shipping
        const shippingCost = await calculateShippingCost(subtotal, orderItems.length);
        const tax = 0;
        const total = subtotal + shippingCost + tax;

        // Add shipping as a basket item if > 0
        if (shippingCost > 0) {
            basketItems.push({
                id: 'SHIPPING',
                name: 'Kargo Ücreti',
                category1: 'Kargo',
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: shippingCost.toFixed(2)
            });
        }

        // Generate unique conversation ID
        const conversationId = crypto.randomUUID().replace(/-/g, '').substring(0, 20);

        // Parse full name for buyer
        const nameParts = shippingAddress.fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Ad';
        const lastName = nameParts.slice(1).join(' ') || 'Soyad';

        // Determine callback URL
        const frontendUrl = trimUrl(process.env.FRONTEND_URL) || 'http://localhost:5173';
        const backendUrl = trimUrl(process.env.BACKEND_URL) || `http://localhost:${process.env.PORT || 5000}`;
        const callbackUrl = `${backendUrl}/api/payment/callback`;

        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: conversationId,
            price: total.toFixed(2),
            paidPrice: total.toFixed(2),
            currency: Iyzipay.CURRENCY.TRY,
            basketId: conversationId,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: callbackUrl,
            enabledInstallments: [1, 2, 3, 6, 9],
            buyer: {
                id: `GUEST_${conversationId}`,
                name: firstName,
                surname: lastName,
                gsmNumber: shippingAddress.phone,
                email: shippingAddress.email,
                identityNumber: shippingAddress.tcKimlik || '11111111111',
                registrationAddress: `${shippingAddress.address}, ${shippingAddress.neighborhood}, ${shippingAddress.district}/${shippingAddress.city}`,
                ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                city: shippingAddress.city,
                country: 'Turkey',
                zipCode: '34000'
            },
            shippingAddress: {
                contactName: shippingAddress.fullName,
                city: shippingAddress.city,
                country: 'Turkey',
                address: `${shippingAddress.address}, ${shippingAddress.neighborhood}, ${shippingAddress.district}/${shippingAddress.city}`,
                zipCode: '34000'
            },
            billingAddress: {
                contactName: shippingAddress.fullName,
                city: shippingAddress.city,
                country: 'Turkey',
                address: `${shippingAddress.address}, ${shippingAddress.neighborhood}, ${shippingAddress.district}/${shippingAddress.city}`,
                zipCode: '34000'
            },
            basketItems: basketItems
        };

        // Store pending order data in MongoDB (survives server restarts)
        await PendingOrder.create({
            conversationId,
            orderItems,
            shippingAddress,
            subtotal,
            shippingCost,
            tax,
            total,
            customerNote,
            userId: req.user?._id || null
        });

        // Initialize checkout form
        getIyzipay().checkoutFormInitialize.create(request, (err, result) => {
            if (err) {
                console.error('iyzico initialize error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Ödeme formu başlatılırken hata oluştu.',
                    error: err.message
                });
            }

            if (result.status !== 'success') {
                console.error('iyzico initialize failed:', result);
                return res.status(400).json({
                    success: false,
                    message: result.errorMessage || 'Ödeme formu başlatılamadı.',
                    errorCode: result.errorCode
                });
            }

            res.json({
                success: true,
                data: {
                    paymentPageUrl: result.paymentPageUrl,
                    checkoutFormContent: result.checkoutFormContent,
                    token: result.token,
                    tokenExpireTime: result.tokenExpireTime,
                    conversationId
                }
            });
        });
    } catch (error) {
        console.error('Initialize checkout form error:', error);
        res.status(500).json({
            success: false,
            message: 'Ödeme başlatılırken hata oluştu.',
            error: error.message
        });
    }
};

// @desc    Handle iyzico callback (POST from iyzico server)
// @route   POST /api/payment/callback
// @access  Public (called by iyzico)
export const handleCallback = async (req, res) => {
    try {
        const { token } = req.body;
        const frontendUrl = trimUrl(process.env.FRONTEND_URL) || 'http://localhost:5173';

        if (!token) {
            return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Token bulunamadı')}`);
        }

        // Retrieve payment result from iyzico
        getIyzipay().checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            token: token
        }, async (err, result) => {
            if (err) {
                console.error('iyzico retrieve error:', err);
                return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Ödeme doğrulanamadı')}`);
            }

            console.log('iyzico callback result:', JSON.stringify(result, null, 2));

            // iyzico may return conversationId or basketId — we set both to the same value
            const conversationId = result.conversationId || result.basketId;

            if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                // Payment successful - find pending order from MongoDB
                const pendingOrder = await PendingOrder.findOne({ conversationId });

                if (!pendingOrder) {
                    console.error('Pending order not found for conversationId:', conversationId);
                    return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Sipariş bilgisi bulunamadı. Lütfen bizimle iletişime geçin.')}`);
                }

                try {
                    const order = await Order.create({
                        user: pendingOrder.userId,
                        items: pendingOrder.orderItems,
                        shippingAddress: pendingOrder.shippingAddress,
                        subtotal: pendingOrder.subtotal,
                        shippingCost: pendingOrder.shippingCost,
                        tax: pendingOrder.tax,
                        total: pendingOrder.total,
                        paymentMethod: 'iyzico',
                        paymentStatus: 'paid',
                        status: 'confirmed',
                        confirmedAt: new Date(),
                        customerNote: pendingOrder.customerNote,
                        iyzicoPaymentId: result.paymentId,
                        iyzicoConversationId: conversationId,
                        iyzicoToken: token
                    });

                    // Clean up pending order
                    await PendingOrder.deleteOne({ conversationId });

                    console.log('Order created successfully:', order._id);

                    return res.redirect(`${frontendUrl}/payment-callback?status=success&orderId=${order._id}`);
                } catch (orderError) {
                    console.error('Order creation error after payment:', orderError);
                    return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Sipariş kaydedilemedi, lütfen bizimle iletişime geçin')}`);
                }
            } else {
                // Payment failed
                if (conversationId) {
                    await PendingOrder.deleteOne({ conversationId });
                }
                const errorMsg = result.errorMessage || 'Ödeme başarısız oldu';
                return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent(errorMsg)}`);
            }
        });
    } catch (error) {
        console.error('Payment callback error:', error);
        const frontendUrl = trimUrl(process.env.FRONTEND_URL) || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Bir hata oluştu')}`);
    }
};
