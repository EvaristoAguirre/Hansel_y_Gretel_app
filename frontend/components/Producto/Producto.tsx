import React from "react";

const Producto = () => {

    const categorias = ["Bebidas", "Cafetería", "Pastelería"];
  return (
    <div>
      <div
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 50px",
          }}
        >Productos</h3>
      </div>

      <div
        className="layout-mesas"
        style={{
          display: "flex",
          height: "100%",
        }}
      >
        <div className="mesas">
          {categorias.map((categoria) => (
            <div
              style={{
                width: "14rem",
                height: "4rem",
                backgroundColor: "#2B2B2B",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#ededed",
                }}
              >
                {categoria}
              </h3>
            </div>
          ))}
        </div>
        
      </div>


    </div>
  );
};

export default Producto;
