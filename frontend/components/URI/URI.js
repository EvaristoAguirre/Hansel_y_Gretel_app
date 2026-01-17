// EN PRODUCCION/CAFETERIA
// REEMPLAZAR:
// 'API_URL_DEV'
// POR 'API_URL'
// y NEXT_PUBLIC_API_URL_DEV por NEXT_PUBLIC_API_URL

// const API_URL_DEV =
//   process.env.NEXT_PUBLIC_API_URL_DEV || process.env.NEXT_PUBLIC_API_URL;
// if (!API_URL_DEV) {
//   throw new Error('Falta la variable de entorno NEXT_PUBLIC_API_URL');
// }
let API_URL = '';
if(process.env.NODE_ENV === 'production') {
  API_URL = process.env.NEXT_PUBLIC_API_URL;
} else {
  API_URL = process.env.NEXT_PUBLIC_API_URL_DEV;
}

// CATEGORIES
export const URI_CATEGORY = `${API_URL}/category`;

// PRODUCTS
export const URI_PRODUCT = `${API_URL}/product`;
export const URI_PRODUCT_BY_CATEGORY = `${API_URL}/product/by-categories`;
export const URI_PRODUCT_PROMO_WITH_SLOTS = `${API_URL}/product/promo-with-slots`;

// PROMOTION SLOT
export const URI_PROMOTION_SLOT = `${API_URL}/promotion-slot`;

// INGREDIENTS
export const URI_INGREDIENT = `${API_URL}/ingredient`;

// TOPPINGS-GROUP
export const URI_TOPPINGS_GROUP = `${API_URL}/toppings-group`;
export const URI_TOPPINGS = `${API_URL}/ingredient/toppings`;

// UNITS OF MEASURE
export const URI_UNIT_OF_MEASURE = `${API_URL}/unitofmeasure`;

// ROOMS
export const URI_ROOM = `${API_URL}/room`;

// TABLES
export const URI_TABLE = `${API_URL}/tables`;

// ORDERS
export const URI_ORDER_OPEN = `${API_URL}/order/open`;
export const URI_ORDER = `${API_URL}/order`;

// PRINTS TICKETS
export const URI_TICKET = `${API_URL}/printer/printTicket`;

// USERS
export const URI_USER = `${API_URL}/user`;

// STOCK
export const URI_STOCK = `${API_URL}/stock`;

// PDF
export const URI_PDF = `${API_URL}/export/stock`;

// DAILY CASH
export const URI_DAILY_CASH = `${API_URL}/daily-cash`;

// MÉTRICAS
export const URI_METRICS = `${API_URL}/daily-cash/metrics`;
