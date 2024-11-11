import React from "react";

const Mesa = () => {
  return (
    <div
      style={{
        border: "1px solid #c9c9c9",
      }}
    >
      <div
        className="nombre"
        style={{
          height: "4rem",
          backgroundColor: "#856D5E",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
          }}
        >
          Mesa 1
        </h3>
      </div>
      <div
        className="datos"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          margin: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "60%",
            margin: "1rem 0",
          }}
        >
          <h3>Personas</h3>
          <input
            type="text"
            style={{
              backgroundColor: "#ededed",
              border: "1px solid #c9c9c9",
              borderRadius: "5px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "60%",
            margin: "1rem 0",
          }}
        >
          <h3>Cliente</h3>
          <input
            type="text"
            style={{
              backgroundColor: "#ededed",
              border: "1px solid #c9c9c9",
              borderRadius: "5px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "60%",
            margin: "1rem 0",
          }}
        >
          <h3>Mozo/a</h3>
          <input
            type="text"
            style={{
              backgroundColor: "#ededed",
              border: "1px solid #c9c9c9",
              borderRadius: "5px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "60%",
            margin: "0.6rem 0",
          }}
        >
          <h3>Comentario</h3>
          <textarea
            name=""
            id=""
            style={{
              backgroundColor: "#ededed",
              border: "1px solid #c9c9c9",
              borderRadius: "5px",
            }}
          ></textarea>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "60%",
          }}
        >
          <div
            className="boton"
            style={{
              backgroundColor: "#856D5E",
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              margin: "0.6rem 0",
            }}
          >
            <h3>Abrir mesa</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mesa;
