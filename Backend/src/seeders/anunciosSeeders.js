import mongoose from "mongoose";
import "dotenv/config";
import Anuncio from "../Modelos/anuncioModelos.js";
import connectDB from "../config/database.js";

const anuncios = [
  {
    titulo: "Nuevo álbum de Bad Bunny",
    descripcion: "Escucha 'Debí Tirar Más Fotos' ahora en Auralis. El conejo malo está de vuelta con su mejor producción.",
    imagen: "https://picsum.photos/seed/ad1/400/200",
    enlace: "https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X",
    tipo: "modal"
  },
  {
    titulo: "Festival Auralis 2026",
    descripcion: "Los mejores artistas en vivo. Boletos disponibles ahora con 20% de descuento para miembros.",
    imagen: "https://picsum.photos/seed/ad2/400/200",
    enlace: "",
    tipo: "modal"
  },
  {
    titulo: "Auriculares Sony WH-1000XM5",
    descripcion: "Cancelación de ruido líder. La mejor experiencia para escuchar tu música favorita.",
    imagen: "https://picsum.photos/seed/ad3/400/200",
    enlace: "https://www.sony.com",
    tipo: "modal"
  }
];

const anunciosSeeder = async () => {
  try {
    await connectDB();
    await Anuncio.deleteMany();
    await Anuncio.insertMany(anuncios);
    console.log(`[Seeder] ✅ ${anuncios.length} anuncios insertados.`);
  } catch (error) {
    console.error("[Seeder] Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

anunciosSeeder();
