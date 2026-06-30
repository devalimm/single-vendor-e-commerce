import Product from '../models/Product.js';
import Variation from '../models/Variation.js';
import { getActiveDiscounts } from './discountHelper.js';

const MAX_QTY = 50;

/**
 * Tek bir ürün için uygulanabilir en iyi indirimi hesaplar ve fiyata uygular.
 * discountHelper.js'deki findBestDiscount mantığının aynısı.
 */
function applyBestDiscount(product, discounts, unitPrice) {
   if (!discounts || discounts.length === 0) return { discountedPrice: unitPrice, discountInfo: null };

   const productId = product._id.toString();
   const categoryId = product.category?._id?.toString() || product.category?.toString();

   let bestDiscountedPrice = unitPrice;
   let bestDiscount = null;

   for (const discount of discounts) {
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

      let discountedPrice;
      if (discount.type === 'percentage') {
         discountedPrice = unitPrice * (1 - discount.value / 100);
      } else {
         // fixed_amount
         discountedPrice = Math.max(0, unitPrice - discount.value);
      }

      if (discountedPrice < bestDiscountedPrice) {
         bestDiscountedPrice = discountedPrice;
         bestDiscount = discount;
      }
   }

   if (!bestDiscount) return { discountedPrice: unitPrice, discountInfo: null };

   const discountPercentage = bestDiscount.type === 'percentage'
      ? bestDiscount.value
      : Math.round(((unitPrice - bestDiscountedPrice) / unitPrice) * 100);

   return {
      discountedPrice: Math.round(bestDiscountedPrice * 100) / 100,
      discountInfo: {
         discountId: bestDiscount._id,
         name: bestDiscount.name,
         type: bestDiscount.type,
         value: bestDiscount.value,
         discountPercentage
      }
   };
}

/**
 * Varyasyon seçimlerinden oluşan stok anahtarını (size key) bul.
 * Product.sizes içinde " | " separator ile saklanıyor.
 * Örn: variationSelections = [{variationName: "Beden", optionName: "M"}, {variationName: "Renk", optionName: "Kırmızı"}]
 * → sizeKey = "M | Kırmızı" veya "M" (tek varyasyon)
 */
function getSizeKeyFromSelections(variationSelections) {
   if (!variationSelections || variationSelections.length === 0) return null;
   return variationSelections.map(s => s.optionName).join(' | ');
}

/**
 * Sipariş öğelerini doğrula, fiyatları hesapla, stok kontrolü yap.
 * orderController ve paymentController tarafından ortaklaşa kullanılır.
 *
 * @param {Array} items - Frontend'den gelen [{product, quantity, variationSelections, selectedOptions}]
 * @returns {{ orderItems, basketItems, subtotal }} veya hata fırlatır
 */
export async function validateAndCalculateItems(items) {
   if (!items || items.length === 0) {
      throw { status: 400, message: 'Sipariş boş olamaz.' };
   }

   // Aktif indirimleri bir kez çek
   const activeDiscounts = await getActiveDiscounts();

   const orderItems = [];
   const basketItems = [];
   let subtotal = 0;

   for (const item of items) {
      // --- Quantity validation ---
      const qty = item.quantity;
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
         throw {
            status: 400,
            message: `Geçersiz adet: ${qty}. Adet 1-${MAX_QTY} arası tam sayı olmalıdır.`
         };
      }

      // --- Product existence & active check ---
      const product = await Product.findById(item.product);
      if (!product) {
         throw { status: 404, message: `Ürün bulunamadı: ${item.product}` };
      }
      if (!product.isActive) {
         throw { status: 400, message: `Ürün aktif değil: ${product.name}` };
      }

      // --- Base price + variation extras ---
      let unitPrice = product.basePrice;
      let variationExtraTotal = 0;
      let optionsTotal = 0;

      if (item.variationSelections && item.variationSelections.length > 0) {
         for (const sel of item.variationSelections) {
            const variation = await Variation.findOne({ name: sel.variationName, isActive: true });
            if (variation) {
               const opt = variation.options.find(o => o.name === sel.optionName);
               if (opt && opt.extraPrice) {
                  variationExtraTotal += opt.extraPrice;
                  unitPrice += opt.extraPrice;
               }
            }
         }
      }

      // Legacy: support old size-based pricing
      if (!item.variationSelections && item.size) {
         const sizeOption = product.sizes.find(s => s.name === item.size);
         if (sizeOption && sizeOption.extraPrice) {
            variationExtraTotal += sizeOption.extraPrice;
            unitPrice += sizeOption.extraPrice;
         }
      }

      // --- Options ---
      if (item.selectedOptions && item.selectedOptions.length > 0) {
         item.selectedOptions.forEach(selectedOpt => {
            const productOption = product.options.find(o => o.name === selectedOpt.name);
            if (productOption) {
               optionsTotal += productOption.price;
               unitPrice += productOption.price;
            }
         });
      }

      // --- Discount application ---
      const { discountedPrice, discountInfo } = applyBestDiscount(product, activeDiscounts, unitPrice);
      const finalUnitPrice = discountedPrice;

      // --- Stock check ---
      if (product.sizes && product.sizes.length > 0) {
         const sizeKey = getSizeKeyFromSelections(item.variationSelections)
            || item.size
            || null;

         if (sizeKey) {
            const sizeEntry = product.sizes.find(s => s.name === sizeKey);
            if (!sizeEntry) {
               throw {
                  status: 400,
                  message: `"${product.name}" için seçilen varyasyon ("${sizeKey}") bulunamadı.`
               };
            }
            if (sizeEntry.stock < qty) {
               throw {
                  status: 400,
                  message: `"${product.name}" (${sizeKey}) için yeterli stok yok. Mevcut: ${sizeEntry.stock}, İstenen: ${qty}`
               };
            }
         }
      } else if (product.totalStock >= 0 && product.totalStock < qty) {
         // No sizes, but totalStock is tracked (not -1)
         throw {
            status: 400,
            message: `"${product.name}" için yeterli stok yok. Mevcut: ${product.totalStock}, İstenen: ${qty}`
         };
      }

      // --- Calculate totals ---
      const itemTotal = Math.round(finalUnitPrice * qty * 100) / 100;
      subtotal += itemTotal;

      const sizeLabel = item.variationSelections?.map(s => `${s.variationName}: ${s.optionName}`).join(', ')
         || item.size
         || 'Standart';

      orderItems.push({
         product: product._id,
         productName: product.name,
         productImage: product.images[0] || '',
         quantity: qty,
         variationSelections: item.variationSelections || [],
         size: sizeLabel,
         selectedOptions: item.selectedOptions || [],
         basePrice: product.basePrice,
         variationExtraTotal,
         optionsTotal,
         discountApplied: discountInfo,
         itemTotal
      });

      // iyzico basket item (always needed, ignored for non-iyzico orders)
      basketItems.push({
         id: product._id.toString(),
         name: product.name.substring(0, 50),
         category1: 'Giyim',
         itemType: 'PHYSICAL',
         price: itemTotal.toFixed(2)
      });
   }

   return { orderItems, basketItems, subtotal };
}

/**
 * Atomic stok düşümü — sipariş başarıyla oluşturulduktan sonra çağrılır.
 * Her item için ilgili sizes[].stock'u düşürür.
 *
 * @param {Array} orderItems - validateAndCalculateItems'den dönen orderItems
 */
export async function deductStock(orderItems) {
   for (const item of orderItems) {
      // Determine the size key to decrement
      const sizeKey = item.variationSelections?.length > 0
         ? item.variationSelections.map(s => s.optionName).join(' | ')
         : (item.size !== 'Standart' ? item.size : null);

      if (sizeKey) {
         // Atomic decrement on the matching sizes entry
         await Product.findOneAndUpdate(
            { _id: item.product, 'sizes.name': sizeKey },
            { $inc: { 'sizes.$.stock': -item.quantity } }
         );
      }
      // If no sizeKey (no variations, no sizes), stock is unlimited (-1), nothing to decrement
   }
}
