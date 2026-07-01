export const calculateItemBasePrice = (item) => {
   let price = item.basePrice || 0;

   item.variationSelections?.forEach(sel => {
      price += sel.extraPrice || 0;
   });

   item.selectedOptions?.forEach(option => {
      price += option.price || 0;
   });

   return price;
};

export const calculateItemPrice = (item) => {
   let price = calculateItemBasePrice(item);

   if (item.discount) {
      if (item.discount.type === 'percentage') {
         price = price * (1 - item.discount.value / 100);
      } else {
         price = Math.max(0, price - item.discount.value);
      }
   }

   return price;
};

export const calculateItemTotals = (item) => {
   const basePrice = calculateItemBasePrice(item);
   const finalPrice = calculateItemPrice(item);
   const itemTotal = finalPrice * item.quantity;
   const vatRate = item.vatRate || 20;
   const priceWithoutVat = itemTotal / (1 + vatRate / 100);
   const vatAmount = itemTotal - priceWithoutVat;
   const discount = (basePrice - finalPrice) * item.quantity;

   return {
      basePrice,
      finalPrice,
      itemTotal,
      vatRate,
      priceWithoutVat,
      vatAmount,
      discount,
      hasDiscount: item.discount && finalPrice < basePrice
   };
};

export const calculateCartTotals = (items) => {
   let subtotal = 0;
   let totalVat = 0;
   let totalDiscount = 0;

   items.forEach(item => {
      const { priceWithoutVat, vatAmount, discount } = calculateItemTotals(item);
      subtotal += priceWithoutVat;
      totalVat += vatAmount;
      totalDiscount += discount;
   });

   return {
      subtotal,
      totalVat,
      grandTotal: subtotal + totalVat,
      totalDiscount
   };
};

export const calculateShippingCost = (settings, grandTotal, totalItems) => {
   if (!settings) return 0;

   const fee = settings.standardShippingFee || 0;

   if (settings.freeShippingEnabled && grandTotal >= settings.freeShippingThreshold) {
      return 0;
   }

   switch (settings.calculationMethod) {
      case 'single':
         return fee;
      case 'sum_all':
         return fee * totalItems;
      case 'first_plus':
         return fee + (Math.max(0, totalItems - 1) * (settings.perItemExtraFee || 0));
      case 'threshold':
         return grandTotal >= settings.freeShippingThreshold ? 0 : fee;
      case 'delivery':
         return fee;
      default:
         return fee;
   }
};

export const formatPrice = (price) => {
   return `${price.toFixed(2)} ₺`;
};

/**
 * Bir kampanyanın sepetteki bir ürüne uygulanıp uygulanmayacağını kontrol eder.
 * Backend campaignHelper.js → campaignAppliesToProduct ile aynı mantık.
 */
export const campaignAppliesToItem = (campaign, item) => {
   if (campaign.conditionScope === 'all_products') return true;

   const productId = item.productId?.toString() || '';
   const categoryId = item.categoryId?.toString() || '';

   if (campaign.conditionScope === 'specific_category' && categoryId) {
      return (campaign.targetCategories || []).some(
         cat => (cat._id || cat).toString() === categoryId
      );
   }

   if (campaign.conditionScope === 'specific_products') {
      return (campaign.targetProducts || []).some(
         prod => (prod._id || prod).toString() === productId
      );
   }

   return false;
};

/**
 * X al Y öde indirimini hesaplar.
 * Backend campaignHelper.js → calculateBuyXGetYDiscount ile aynı formül.
 *
 * @param {number} qty - Sepetteki adet
 * @param {number} buyQty - Alınması gereken adet
 * @param {number} payQty - Ödenecek adet
 * @param {number} unitPrice - Birim fiyat (indirimli fiyat)
 * @returns {number} İndirim tutarı
 */
export const calculateBuyXGetYDiscount = (qty, buyQty, payQty, unitPrice) => {
   if (qty < buyQty) return 0;
   const freeSets = Math.floor(qty / buyQty);
   const freeItems = freeSets * (buyQty - payQty);
   return Math.round(freeItems * unitPrice * 100) / 100;
};

/**
 * Sepetteki tüm ürünler için kampanya indirimlerini hesaplar.
 * Backend campaignHelper.js → applyCampaignsToCart ile aynı mantık.
 *
 * @param {Array} cartItems - CartContext'ten gelen sepet öğeleri
 * @param {Array} campaigns - useCampaigns() sonucu
 * @returns {{ campaignDiscounts: Array, totalCampaignDiscount: number }}
 */
export const calculateCartCampaignDiscount = (cartItems, campaigns) => {
   if (!campaigns || campaigns.length === 0) {
      return { campaignDiscounts: [], totalCampaignDiscount: 0 };
   }

   const campaignDiscounts = [];
   let totalCampaignDiscount = 0;

   for (const item of cartItems) {
      const qty = item.quantity;
      // İndirimli birim fiyatı kullan (Discount uygulanmışsa)
      const unitPrice = calculateItemPrice(item);

      let bestDiscount = 0;
      let bestCampaign = null;

      for (const campaign of campaigns) {
         if (campaign.type !== 'buy_x_get_y') continue;
         if (!campaignAppliesToItem(campaign, item)) continue;

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
            productId: item.productId,
            productName: item.name,
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