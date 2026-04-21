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