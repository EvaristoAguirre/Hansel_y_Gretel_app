
// EN PRODUCCION/CAFETERIA 
// REEMPLAZAR:
// 'API_URL_DESARROLLO' 
// POR 'API_URL'
// y NEXT_PUBLIC_API_URL_DESARROLLO por NEXT_PUBLIC_API_URL

const API_URL_DESARROLLO = process.env.NEXT_PUBLIC_API_URL_DESARROLLO;

if (!API_URL_DESARROLLO) {
  throw new Error("Falta la variable de entorno NEXT_PUBLIC_API_URL");
}

// CATEGORIES
export const URI_CATEGORY = `${API_URL_DESARROLLO}/category`;

// PRODUCTS
export const URI_PRODUCT = `${API_URL_DESARROLLO}/product`;
export const URI_PRODUCT_BY_CATEGORY = `${API_URL_DESARROLLO}/product/by-categories`;

// INGREDIENTS
export const URI_INGREDIENT = `${API_URL_DESARROLLO}/ingredient`;

// TOPPINGS-GROUP
export const URI_TOPPINGS_GROUP = `${API_URL_DESARROLLO}/toppings-group`;
export const URI_TOPPINGS = `${API_URL_DESARROLLO}/ingredient/toppings`;

// UNITS OF MEASURE
export const URI_UNIT_OF_MEASURE = `${API_URL_DESARROLLO}/unitofmeasure`;

// ROOMS
export const URI_ROOM = `${API_URL_DESARROLLO}/room`;

// TABLES
export const URI_TABLE = `${API_URL_DESARROLLO}/tables`;

// ORDERS
export const URI_ORDER_OPEN = `${API_URL_DESARROLLO}/order/open`;
export const URI_ORDER = `${API_URL_DESARROLLO}/order`;

// PRINTS TICKETS
export const URI_TICKET = `${API_URL_DESARROLLO}/printer/printTicket`;

// USERS
export const URI_USER = `${API_URL_DESARROLLO}/user`;

// STOCK
export const URI_STOCK = `${API_URL_DESARROLLO}/stock`;

// PDF
export const URI_PDF = `${API_URL_DESARROLLO}/export/stock`;

// DAILY CASH
export const URI_DAILY_CASH = `${API_URL_DESARROLLO}/daily-cash`;

// MÉTRICAS
export const URI_METRICS = `${API_URL_DESARROLLO}/daily-cash/metrics`;
