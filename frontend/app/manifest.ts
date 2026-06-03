import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hansel & Gretel",
    short_name: "H&G Pedidos",
    description: "Gestión de mesas, pedidos y stock",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/user.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
