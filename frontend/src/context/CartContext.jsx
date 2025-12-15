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

      // Add length price adjustment
      if (item.selectedLength?.priceAdjustment) {
         price += item.selectedLength.priceAdjustment;
      }

      // Add options prices
      if (item.selectedOptions?.length > 0) {
         item.selectedOptions.forEach(option => {
            price += option.price || 0;
         });
      }

      return price * item.quantity;
   };

   const updateTotals = (items) => {
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      return { items, totalItems, totalPrice };
   };

   const addToCart = (product, selections) => {
      const { selectedSize, selectedLength, selectedOptions, quantity } = selections;

      // Create unique key for cart item
      const itemKey = `${product._id}-${selectedSize?.name || 'nosize'}-${selectedLength?.name || 'nolength'}`;

      setCart(prevCart => {
         const existingItemIndex = prevCart.items.findIndex(item =>
            item.productId === product._id &&
            item.selectedSize?.name === selectedSize?.name &&
            item.selectedLength?.name === selectedLength?.name
         );

         let newItems;
         if (existingItemIndex > -1) {
            // Update existing item quantity
            newItems = [...prevCart.items];
            newItems[existingItemIndex].quantity += quantity;
         } else {
            // Add new item
            const newItem = {
               productId: product._id,
               name: product.name,
               image: product.images?.[0] || null,
               basePrice: product.basePrice,
               selectedSize,
               selectedLength,
               selectedOptions: selectedOptions || [],
               quantity
            };
            newItems = [...prevCart.items, newItem];
         }

         return updateTotals(newItems);
      });
   };

   const removeFromCart = (productId, selectedSize, selectedLength) => {
      setCart(prevCart => {
         const newItems = prevCart.items.filter(item =>
            !(item.productId === productId &&
               item.selectedSize?.name === selectedSize?.name &&
               item.selectedLength?.name === selectedLength?.name)
         );
         return updateTotals(newItems);
      });
   };

   const updateQuantity = (productId, selectedSize, selectedLength, newQuantity) => {
      if (newQuantity < 1) return;

      setCart(prevCart => {
         const newItems = prevCart.items.map(item => {
            if (item.productId === productId &&
               item.selectedSize?.name === selectedSize?.name &&
               item.selectedLength?.name === selectedLength?.name) {
               return { ...item, quantity: newQuantity };
            }
            return item;
         });
         return updateTotals(newItems);
      });
   };

   const clearCart = () => {
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
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
