import mongoose from "mongoose";
import "dotenv/config";
import Canciones from "../Modelos/cancionesModelos.js";
import Cantante from "../Modelos/cantanteModelos.js";
import connectDB from "../config/database.js";
import { getPopularTracks } from "../services/jamendoService.js";

const jamendoSeeder = async () => {
  try {
    await connectDB();

    console.log("[Seeder Jamendo] Obteniendo tracks populares...");
    const tracks = await getPopularTracks(30);

    if (!tracks.length) {
      console.log("[Seeder Jamendo] ⚠️  No se obtuvieron tracks. Verificá JAMENDO_CLIENT_ID en .env");
      console.log("[Seeder Jamendo] Registrate gratis en https://developer.jamendo.com");
      await mongoose.connection.close();
      return;
    }

    // Delete only Jamendo-sourced songs (keeping manually uploaded ones)
    await Canciones.deleteMany({ jamendoId: { $exists: true } });
    console.log("[Seeder Jamendo] Canciones antiguas de Jamendo eliminadas.");

    for (const track of tracks) {
      let cantante = await Cantante.findOne({ cantante: new RegExp(`^${track.artista.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      if (!cantante) {
        cantante = new Cantante({ cantante: track.artista });
        await cantante.save();
        console.log(`  [Seeder] Artista creado: ${track.artista}`);
      }

      const nueva = await Canciones.create({
        cantante: cantante._id,
        titulo: track.titulo,
        album: track.album,
        genero: track.genero || "General",
        imagen: track.imagen,
        fileUrl: track.fileUrl,
        plays: track.plays,
        jamendoId: track.jamendoId,
      });

      await Cantante.findByIdAndUpdate(cantante._id, {
        $push: { canciones: nueva._id }
      });
    }

    console.log(`[Seeder Jamendo] ✅ ${tracks.length} canciones insertadas.`);
  } catch (error) {
    console.error("[Seeder Jamendo] Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("[Seeder Jamendo] Conexión cerrada.");
  }
};

jamendoSeeder();
