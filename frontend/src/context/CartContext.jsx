import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
   const context = useContext(CartContext);
   if (!context) {
      throw new Error('useCart must be used within CartProvider');
   }
   return context;
};

export const CartProvider = ({ children }) => {
   const [cart, setCart] = useState({ items: [], totalItems: 0, totalPrice: 0 });

   // Load cart from localStorage on mount
   useEffect(() => {
      const savedCart = localStorage.getItem('asiyeozel_cart');
      if (savedCart) {
         try {
            setCart(JSON.parse(savedCart));
         } catch (error) {
            console.error('Error loading cart:', error);
         }
      }
   }, []);

   // Save cart to localStorage whenever it changes
   useEffect(() => {
      localStorage.setItem('asiyeozel_cart', JSON.stringify(cart));
   }, [cart]);

   const calculateItemPrice = (item) => {
      let price = item.basePrice;

      // Add variation extra prices
      if (item.variationSelections?.length > 0) {
         item.variationSelections.forEach(sel => {
            price += sel.extraPrice || 0;
         });
      }

      // Add options prices
      if (item.selectedOptions?.length > 0) {
         item.selectedOptions.forEach(option => {
            price += option.price || 0;
         });
      }

      // İndirim uygula
      if (item.discount) {
         if (item.discount.type === 'percentage') {
            price = price * (1 - item.discount.value / 100);
         } else {
            price = Math.max(0, price - item.discount.value);
         }
      }

      return price * item.quantity;
   };

   const updateTotals = (items) => {
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      return { items, totalItems, totalPrice };
   };

   // Build a unique key for a cart item based on product + variation selections
   const getItemKey = (productId, variationSelections) => {
      const varKey = (variationSelections || [])
         .map(s => `${s.variationName}:${s.optionName}`)
         .sort()
         .join('|');
      return `${productId}__${varKey}`;
   };

   const addToCart = (product, selections) => {
      const { variationSelections, selectedOptions, quantity } = selections;

      setCart(prevCart => {
         const newKey = getItemKey(product._id, variationSelections);

         const existingItemIndex = prevCart.items.findIndex(item =>
            getItemKey(item.productId, item.variationSelections) === newKey
         );

         let newItems;
         if (existingItemIndex > -1) {
            // Update existing item quantity
            newItems = [...prevCart.items];
            newItems[existingItemIndex].quantity += quantity;
            if (product.discount) {
               newItems[existingItemIndex].discount = product.discount;
            }
         } else {
            // Add new item
            const newItem = {
               productId: product._id,
               name: product.name,
               image: product.images?.[0] || null,
               basePrice: product.basePrice,
               vatRate: product.vatRate || 10,
               discount: product.discount || null,
               variationSelections: variationSelections || [],
               selectedOptions: selectedOptions || [],
               quantity
            };
            newItems = [...prevCart.items, newItem];
         }

         return updateTotals(newItems);
      });
   };

   const removeFromCart = (productId, variationSelections) => {
      setCart(prevCart => {
         const keyToRemove = getItemKey(productId, variationSelections);
         const newItems = prevCart.items.filter(item =>
            getItemKey(item.productId, item.variationSelections) !== keyToRemove
         );
         return updateTotals(newItems);
      });
   };

   const updateQuantity = (productId, variationSelections, newQuantity) => {
      if (newQuantity < 1) return;

      setCart(prevCart => {
         const keyToUpdate = getItemKey(productId, variationSelections);
         const newItems = prevCart.items.map(item => {
            if (getItemKey(item.productId, item.variationSelections) === keyToUpdate) {
               return { ...item, quantity: newQuantity };
            }
            return item;
         });
         return updateTotals(newItems);
      });
   };

const clearCart = () => {
       setCart({ items: [], totalItems: 0, totalPrice: 0 });
       localStorage.removeItem('asiyeozel_cart');
    };

   const value = {
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
   };

   return (
      <CartContext.Provider value={value}>
         {children}
      </CartContext.Provider>
   );
};
