// import { create } from "zustand";
// import { ICategory } from "../Interfaces/ICategories";
// import { ProductResponse, ProductState } from "../Interfaces/IProducts";

// const parseCategories = (categories: ICategory[]): string[] =>
//   categories.map((category) => (
//     category.id
//   ));

// export const useProductStore = create<ProductState>((set) => ({
//   products: [],
//   //TODO: Métodos originales. Usar si se reciben solo los IDs de las categorías.
//   // setProducts: (products) => set({ products }),
//   // addProduct: (product) =>
//   //   set((state) => ({ products: [...state.products, product] })),
//   // updateProduct: (updatedProduct) =>
//   //   set((state) => ({
//   //     products: state.products.map((product) =>
//   //       product.id === updatedProduct.id ? updatedProduct : product
//   //     ),
//   //   })),
//   setProducts: (products) => {
//     // Se parsean las categorías para setear solo el ID
//     const parsedProduct = products.map((product: any) => ({
//       ...product,
//       categories: parseCategories(product.categories)
//     }));

//     return set({ products: parsedProduct });
//   },
//   addProduct: (product) => {
//     const parsedProduct = {
//       ...product,
//       categories: parseCategories(product.categories),
//       productIngredients: product.productIngredients
//     };

//     return set((state) => ({ products: [...state.products, parsedProduct] }));
//   },
//   removeProduct: (id) =>
//     set((state) => ({
//       products: state.products.filter((product) => product.id !== id),
//     })),
//   updateProduct: (updatedProduct) => {
//     const parsedProduct = {
//       ...updatedProduct,
//       categories: parseCategories(updatedProduct.categories)
//     };

//     return set((state) => ({
//       products: state.products.map((product) =>
//         product.id === parsedProduct.id ? parsedProduct : product
//       ),
//     }));
//   },
//   connectWebSocket: () => {
//     const socket = new WebSocket("ws://localhost:3000");

//     socket.onmessage = (event) => {
//       const { action, data } = JSON.parse(event.data);

//       set((state) => {
//         switch (action) {
//           case "product.created":
//             return { products: [...state.products, data] };
//           case "product.deleted":
//             return {
//               products: state.products.filter((prod) => prod.id !== data.id),
//             };
//           case "product.updated":
//             return {
//               products: state.products.map((prod) =>
//                 prod.id === data.id ? data : prod
//               ),
//             };
//           default:
//             return state;
//         }
//       });
//     };

//     socket.onopen = () => {
//       console.log("WebSocket conectado");
//     };

//     socket.onerror = (error) => {
//       console.error("Error en WebSocket:", error);
//     };

//     socket.onclose = () => {
//       console.log("WebSocket cerrado");
//     };
//   },
// }));


import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { ProductResponse, ProductState } from "../Interfaces/IProducts";
import { io } from "socket.io-client";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => category.id);

export const useProductStore = create<ProductState>((set) => {
  const socket = io("http://192.168.100.133:3000"); // Usa la IP de tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Products");
  });

  socket.on("productCreated", (data) => {
    console.log("🟢 Producto creado:", data);
    set((state) => ({ products: [...state.products, data] }));
  });

  socket.on("productUpdated", (data) => {
    console.log("🟡 Producto actualizado:", data);
    set((state) => ({
      products: state.products.map((product) =>
        product.id === data.id ? data : product
      ),
    }));
  });

  socket.on("productDeleted", (data) => {
    console.log("🔴 Producto eliminado:", data);
    set((state) => ({
      products: state.products.filter((product) => product.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket");
  });

  return {
    products: [],
    setProducts: (products) => {
      const parsedProducts = products.map((product: any) => ({
        ...product,
        categories: parseCategories(product.categories),
      }));
      return set({ products: parsedProducts });
    },
    addProduct: (product) => {
      const parsedProduct = {
        ...product,
        categories: parseCategories(product.categories),
      };
      return set((state) => ({ products: [...state.products, parsedProduct] }));
    },
    removeProduct: (id) =>
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
      })),
    updateProduct: (updatedProduct) => {
      const parsedProduct = {
        ...updatedProduct,
        categories: parseCategories(updatedProduct.categories),
      };
      return set((state) => ({
        products: state.products.map((product) =>
          product.id === parsedProduct.id ? parsedProduct : product
        ),
      }));
    },
    connectWebSocket: () => {}, // Conexión establecida al cargar el store
  };
});
