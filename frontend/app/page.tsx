import Cafe from "@/components/Cafe/Cafe";
import CategoriasIngredientes from "@/components/Categorías/CategoríasIngredientes/CategoriasIngredientes";
import CategoriasProductos from "@/components/Categorías/CategoríasProductos/CategoriasProductos";
import Producto from "@/components/Producto/Producto";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      {/* <Cafe></Cafe> */}
      {/* <Producto></Producto> */}
      <CategoriasProductos></CategoriasProductos>
      {/* <CategoriasIngredientes></CategoriasIngredientes> */}
    </div>
  );
}
