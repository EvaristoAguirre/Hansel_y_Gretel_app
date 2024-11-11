import React from "react";
import Mesa from "../Mesa/Mesa";

const Cafe = () => {
  const salas = ["Principal", "Entrada", "Patio"];
  const mesas = ["MESA 1", "MESA 2", "MESA 3", "MESA 4", "MESA 5", "MESA 6"];

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
        {salas.map((sala) => (
          <h3
            style={{
              fontSize: "1.25rem",
              color: "#ffffff",
              fontWeight: "400",
              margin: "0 50px",
            }}
          >
            {sala}
          </h3>
        ))}
      </div>

      <div
        className="layout-mesas"
        style={{
          display: "flex",
        }}
      >
        <div className="mesas">
          {mesas.map((mesa) => (
            <div
              style={{
                width: "14rem",
                height: "4rem",
                backgroundColor: "#ededed",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                }}
              >
                {mesa}
              </h3>
            </div>
          ))}
        </div>
        <div
          className="datos-mesa"
          style={{
            width: "35%",
          }}
        >
          <Mesa></Mesa>
        </div>
      </div>
    </div>
  );
};

export default Cafe;
