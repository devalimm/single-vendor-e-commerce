import Discount from '../models/Discount.js';

/**
 * Aktif ve geçerli tarih aralığındaki tüm indirimleri getirir
 */
export const getActiveDiscounts = async () => {
    const now = new Date();
    return Discount.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};

/**
 * Tek bir ürün için uygulanabilir en iyi indirimi hesaplar
 */
const findBestDiscount = (product, discounts) => {
    let bestDiscount = null;
    let bestDiscountedPrice = product.basePrice;

    const productId = product._id.toString();
    const categoryId = product.category?._id?.toString() || product.category?.toString();

    for (const discount of discounts) {
        // Kapsam kontrolü
        let applies = false;

        if (discount.conditionScope === 'all_products') {
            applies = true;
        } else if (discount.conditionScope === 'specific_category' && categoryId) {
            applies = discount.targetCategories.some(
                catId => catId.toString() === categoryId
            );
        } else if (discount.conditionScope === 'specific_products') {
            applies = discount.targetProducts.some(
                prodId => prodId.toString() === productId
            );
        }

        if (!applies) continue;

        // İndirimli fiyat hesapla
        let discountedPrice;
        if (discount.type === 'percentage') {
            discountedPrice = product.basePrice * (1 - discount.value / 100);
        } else {
            // fixed_amount
            discountedPrice = Math.max(0, product.basePrice - discount.value);
        }

        // En iyi (en düşük) fiyatı seç
        if (discountedPrice < bestDiscountedPrice) {
            bestDiscountedPrice = discountedPrice;
            bestDiscount = discount;
        }
    }

    if (!bestDiscount) return null;

    const discountPercentage = bestDiscount.type === 'percentage'
        ? bestDiscount.value
        : Math.round(((product.basePrice - bestDiscountedPrice) / product.basePrice) * 100);

    return {
        discountId: bestDiscount._id,
        name: bestDiscount.name,
        type: bestDiscount.type,
        value: bestDiscount.value,
        discountedPrice: Math.round(bestDiscountedPrice * 100) / 100,
        discountPercentage
    };
};

/**
 * Ürün listesine indirim bilgisi ekler
 * product.toObject() ile plain JS objesine çevirir, discount alanı ekler
 */
export const applyDiscountsToProducts = async (products) => {
    const discounts = await getActiveDiscounts();
    if (discounts.length === 0) {
        return products.map(p => {
            const obj = p.toObject ? p.toObject() : { ...p };
            obj.discount = null;
            return obj;
        });
    }

    return products.map(product => {
        const obj = product.toObject ? product.toObject() : { ...product };
        obj.discount = findBestDiscount(obj, discounts);
        return obj;
    });
};

/**
 * Tek bir ürüne indirim bilgisi ekler
 */
export const applyDiscountToProduct = async (product) => {
    const discounts = await getActiveDiscounts();
    const obj = product.toObject ? product.toObject() : { ...product };
    obj.discount = discounts.length > 0 ? findBestDiscount(obj, discounts) : null;
    return obj;
};
