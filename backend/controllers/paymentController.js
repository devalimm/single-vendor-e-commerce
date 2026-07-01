import Iyzipay from 'iyzipay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import ShippingSettings from '../models/ShippingSettings.js';
import PendingOrder from '../models/PendingOrder.js';
import { sendOrderConfirmation } from '../utils/emailService.js';
import { validateAndCalculateItems, deductStock } from '../utils/orderHelper.js';

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

function roundMoney(value) {
    return Math.round(value * 100) / 100;
}

function applyCampaignDiscountToBasketItems(basketItems, campaignDiscount) {
    const discount = roundMoney(Number(campaignDiscount) || 0);
    if (discount <= 0 || basketItems.length === 0) {
        return basketItems;
    }

    const rawTotal = roundMoney(
        basketItems.reduce((sum, item) => sum + Number(item.price || 0), 0)
    );
    const targetTotal = roundMoney(rawTotal - discount);

    if (rawTotal <= 0 || targetTotal <= 0) {
        return basketItems;
    }

    let runningTotal = 0;

    return basketItems.map((item, index) => {
        const rawPrice = Number(item.price || 0);
        let adjustedPrice;

        if (index === basketItems.length - 1) {
            adjustedPrice = roundMoney(targetTotal - runningTotal);
        } else {
            adjustedPrice = roundMoney(rawPrice - (discount * (rawPrice / rawTotal)));
            runningTotal = roundMoney(runningTotal + adjustedPrice);
        }

        return {
            ...item,
            price: adjustedPrice.toFixed(2)
        };
    });
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

        // Validate items, calculate prices (with discounts), check stock
        const { orderItems, basketItems: rawBasketItems, subtotal, campaignDiscounts, totalCampaignDiscount } = await validateAndCalculateItems(items);

        // Kampanya indirimi subtotal'dan düşülür
        const subtotalAfterCampaign = Math.max(0, subtotal - totalCampaignDiscount);

        // Iyzico expects basketItems total to match price/paidPrice.
        const basketItems = applyCampaignDiscountToBasketItems(rawBasketItems, totalCampaignDiscount)
            .map(bi => ({
                ...bi,
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL
            }));

        // Calculate shipping
        const shippingCost = await calculateShippingCost(subtotalAfterCampaign, orderItems.length);
        const tax = 0;
        const total = subtotalAfterCampaign + shippingCost + tax;

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
            subtotal: subtotalAfterCampaign,
            shippingCost,
            tax,
            total,
            customerNote,
            userId: req.user?._id || null,
            campaignDiscounts: campaignDiscounts || []
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
        // Handle validation errors from orderHelper
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
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
                // Payment successful — atomically claim the pending order to prevent duplicates
                // findOneAndDelete ensures only ONE concurrent callback can claim this order
                const pendingOrder = await PendingOrder.findOneAndDelete({ conversationId });

                if (!pendingOrder) {
                    // Either already processed (idempotent) or never existed
                    // Check if an order was already created for this payment
                    const existingOrder = await Order.findOne({ iyzicoConversationId: conversationId });
                    if (existingOrder) {
                        console.log('Duplicate callback detected, order already exists:', existingOrder._id);
                        return res.redirect(`${frontendUrl}/payment-callback?status=success&orderId=${existingOrder._id}`);
                    }
                    console.error('Pending order not found for conversationId:', conversationId);
                    return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Sipariş bilgisi bulunamadı. Lütfen bizimle iletişime geçin.')}`);
                }

                // Strict validation: Verify paidPrice matches total, currency is TRY, and paymentId is unique
                if (Math.abs(Number(result.paidPrice) - pendingOrder.total) >= 0.01 || result.currency !== 'TRY') {
                    console.error(`Payment validation failed for conversationId: ${conversationId}. Paid: ${result.paidPrice}, Expected: ${pendingOrder.total}, Currency: ${result.currency}`);
                    return res.redirect(`${frontendUrl}/payment-callback?status=error&message=${encodeURIComponent('Ödeme tutarı veya para birimi doğrulanamadı. Lütfen bizimle iletişime geçin.')}`);
                }

                const existingPaymentOrder = await Order.findOne({ iyzicoPaymentId: result.paymentId });
                if (existingPaymentOrder) {
                    console.log('Duplicate payment detected via existing iyzicoPaymentId:', existingPaymentOrder._id);
                    return res.redirect(`${frontendUrl}/payment-callback?status=success&orderId=${existingPaymentOrder._id}`);
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
                        iyzicoToken: token,
                        campaignDiscounts: pendingOrder.campaignDiscounts || []
                    });

                    console.log('Order created successfully:', order._id);

                    // Deduct stock after successful order creation
                    await deductStock(order.items);

                    sendOrderConfirmation(order).catch(err => console.error('Sipariş emaili gönderilemedi:', err));

                    return res.redirect(`${frontendUrl}/payment-callback?status=success&orderId=${order._id}`);
                } catch (orderError) {
                    // If Order.create fails due to unique index on iyzicoPaymentId, it's a duplicate
                    if (orderError.code === 11000 && orderError.keyPattern?.iyzicoPaymentId) {
                        const existingOrder = await Order.findOne({ iyzicoPaymentId: result.paymentId });
                        if (existingOrder) {
                            console.log('Duplicate payment detected via unique index:', existingOrder._id);
                            return res.redirect(`${frontendUrl}/payment-callback?status=success&orderId=${existingOrder._id}`);
                        }
                    }
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
