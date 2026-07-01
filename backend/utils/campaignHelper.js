import Campaign from '../models/Campaign.js';

/**
 * Aktif ve tarih aralığı geçerli kampanyaları getirir.
 */
export const getActiveCampaigns = async () => {
    const now = new Date();
    return Campaign.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};

/**
 * Bir kampanyanın belirli bir ürüne uygulanıp uygulanamayacağını kontrol eder.
 *
 * @param {Object} campaign - Campaign belgesi (plain object)
 * @param {Object} product - Product belgesi (plain object, category populate edilmiş olabilir)
 * @returns {boolean}
 */
export const campaignAppliesToProduct = (campaign, product) => {
    if (campaign.conditionScope === 'all_products') return true;

    const productId = product._id?.toString() || product.toString();
    const categoryId = product.category?._id?.toString() || product.category?.toString();

    if (campaign.conditionScope === 'specific_category' && categoryId) {
        return campaign.targetCategories.some(
            catId => catId.toString() === categoryId
        );
    }

    if (campaign.conditionScope === 'specific_products') {
        return campaign.targetProducts.some(
            prodId => prodId.toString() === productId
        );
    }

    return false;
};

/**
 * "X al Y öde" formülünü hesaplar.
 *
 * Formül: floor(qty / buyQty) × (buyQty - payQty) × unitPrice
 * Örnek: 3 al 2 öde, qty=3, unitPrice=100 → floor(3/3) × (3-2) × 100 = 100 TL indirim
 * Örnek: 3 al 2 öde, qty=6, unitPrice=100 → floor(6/3) × (3-2) × 100 = 200 TL indirim
 * Örnek: 3 al 2 öde, qty=4, unitPrice=100 → floor(4/3) × (3-2) × 100 = 100 TL indirim
 *
 * @param {number} qty - Sepetteki adet
 * @param {number} buyQty - Alınması gereken adet (örn. 3)
 * @param {number} payQty - Ödenecek adet (örn. 2)
 * @param {number} unitPrice - Birim fiyat (indirimli fiyat varsa indirimli fiyat)
 * @returns {number} İndirim tutarı
 */
export const calculateBuyXGetYDiscount = (qty, buyQty, payQty, unitPrice) => {
    if (qty < buyQty) return 0;
    const freeSets = Math.floor(qty / buyQty);
    const freeItems = freeSets * (buyQty - payQty);
    return Math.round(freeItems * unitPrice * 100) / 100;
};

/**
 * Sepetteki tüm öğeler için aktif kampanyaları hesaplar.
 *
 * Her ürün için en avantajlı kampanya seçilir (birden fazla kampanya varsa).
 * Farklı ürünler birbirini saymaz — her ürün kendi adedi üzerinden değerlendirilir.
 *
 * @param {Array} cartItems - [{product, productId, quantity, basePrice, discount, variationSelections, ...}]
 *   Hem orderHelper (product objesi) hem de CartContext (productId + basePrice) formatını destekler.
 * @param {Array} campaigns - getActiveCampaigns() sonucu (veya test için mock)
 * @returns {{ campaignDiscounts: Array, totalCampaignDiscount: number }}
 *   campaignDiscounts: [{ campaignId, campaignName, productId, productName, discountAmount }]
 */
export const applyCampaignsToCart = (cartItems, campaigns) => {
    if (!campaigns || campaigns.length === 0) {
        return { campaignDiscounts: [], totalCampaignDiscount: 0 };
    }

    const campaignDiscounts = [];
    let totalCampaignDiscount = 0;

    for (const item of cartItems) {
        // Ürün bilgisi: orderHelper formatı (item.product = Product belgesi)
        // veya CartContext formatı (item.productId, item.basePrice)
        const product = item.product || { _id: item.productId, category: item.category };
        const qty = item.quantity;

        // Birim fiyat: indirim uygulanmışsa indirimli fiyat üzerinden hesapla
        // (Discount zaten birim fiyata uygulandığından kampanya üstüne eklenmez)
        const unitPrice = item.finalUnitPrice ?? item.unitPrice ?? (item.basePrice || 0);

        // Bu ürüne uygulanabilecek en iyi kampanyayı bul
        let bestDiscount = 0;
        let bestCampaign = null;

        for (const campaign of campaigns) {
            if (campaign.type !== 'buy_x_get_y') continue;
            if (!campaignAppliesToProduct(campaign, product)) continue;

            const discount = calculateBuyXGetYDiscount(qty, campaign.buyQty, campaign.payQty, unitPrice);
            if (discount > bestDiscount) {
                bestDiscount = discount;
                bestCampaign = campaign;
            }
        }

        if (bestCampaign && bestDiscount > 0) {
            campaignDiscounts.push({
                campaignId: bestCampaign._id,
                campaignName: bestCampaign.name,
                productId: product._id?.toString() || product.toString(),
                productName: item.productName || item.name || '',
                discountAmount: bestDiscount,
                buyQty: bestCampaign.buyQty,
                payQty: bestCampaign.payQty
            });
            totalCampaignDiscount += bestDiscount;
        }
    }

    return {
        campaignDiscounts,
        totalCampaignDiscount: Math.round(totalCampaignDiscount * 100) / 100
    };
};
