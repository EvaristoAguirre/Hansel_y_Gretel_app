export enum Tab {
  PRODUCTOS = 'Productos',
  INGREDIENTES = 'Ingredientes',
  CATEGORIA_PRODUCTOS = 'Categorías',
  UNIDADES_MEDIDA = 'Unidades de medida',
  CONTROL_DE_STOCK = 'Control de Stock',
}
export enum Categoria {
  PRODUCTOS = 'productos',
  INGREDIENTES = 'ingredientes',
}

export enum StockModalType {
  INGREDIENT = 'ingredient',
  PRODUCT = 'product',
}

export enum TypeProduct {
  SIMPLE = 'simple',
  PRODUCT = 'product',
  PROMO = 'promotion',
}

export enum FormTypeProduct {
  CREATE = 'create',
  EDIT = 'edit',
  CREATE_SLOT = 'create_slot',
}

export enum TabProductKey {
  SIMPLE_PRODUCT = 'SIMPLE PRODUCT',
  PRODUCT_WITH_INGREDIENT = 'PRODUCT WITH INGREDIENT',
  PROMO = 'PROMO',
  COMBO = 'COMBO'
}