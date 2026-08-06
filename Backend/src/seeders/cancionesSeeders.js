import mongoose from "mongoose";
import "dotenv/config";
import Canciones from "../Modelos/cancionesModelos.js";
import Cantante from "../Modelos/cantanteModelos.js";
import connectDB from "../config/database.js";

const AUDIO_BASE = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";
const IMG_BASE   = "https://picsum.photos/seed/";

const canciones = [
  // Bad Bunny
  { cantante: "Bad Bunny", titulo: "Un Verano Sin Ti", album: "Un Verano Sin Ti", genero: "Reggaetón", imagen: `${IMG_BASE}bb1/300/300`, fileUrl: `${AUDIO_BASE}1.mp3`, plays: 1840000 },
  { cantante: "Bad Bunny", titulo: "Tití Me Preguntó", album: "Un Verano Sin Ti", genero: "Reggaetón", imagen: `${IMG_BASE}bb2/300/300`, fileUrl: `${AUDIO_BASE}2.mp3`, plays: 1520000 },

  // The Weeknd
  { cantante: "The Weeknd", titulo: "Blinding Lights", album: "After Hours", genero: "Synth-pop", imagen: `${IMG_BASE}tw1/300/300`, fileUrl: `${AUDIO_BASE}3.mp3`, plays: 4200000 },
  { cantante: "The Weeknd", titulo: "Save Your Tears", album: "After Hours", genero: "R&B", imagen: `${IMG_BASE}tw2/300/300`, fileUrl: `${AUDIO_BASE}4.mp3`, plays: 2600000 },

  // Shakira
  { cantante: "Shakira", titulo: "Hips Don't Lie", album: "Oral Fixation Vol. 2", genero: "Pop Latino", imagen: `${IMG_BASE}sh1/300/300`, fileUrl: `${AUDIO_BASE}5.mp3`, plays: 1100000 },
  { cantante: "Shakira", titulo: "Waka Waka", album: "Sale el Sol", genero: "Pop Latino", imagen: `${IMG_BASE}sh2/300/300`, fileUrl: `${AUDIO_BASE}6.mp3`, plays: 3800000 },

  // Eminem
  { cantante: "Eminem", titulo: "Lose Yourself", album: "8 Mile", genero: "Hip-Hop", imagen: `${IMG_BASE}em1/300/300`, fileUrl: `${AUDIO_BASE}7.mp3`, plays: 2900000 },
  { cantante: "Eminem", titulo: "Not Afraid", album: "Recovery", genero: "Hip-Hop", imagen: `${IMG_BASE}em2/300/300`, fileUrl: `${AUDIO_BASE}8.mp3`, plays: 1800000 },

  // Coldplay
  { cantante: "Coldplay", titulo: "Yellow", album: "Parachutes", genero: "Rock Alternativo", imagen: `${IMG_BASE}cp1/300/300`, fileUrl: `${AUDIO_BASE}9.mp3`, plays: 2200000 },
  { cantante: "Coldplay", titulo: "The Scientist", album: "A Rush of Blood to the Head", genero: "Rock Alternativo", imagen: `${IMG_BASE}cp2/300/300`, fileUrl: `${AUDIO_BASE}10.mp3`, plays: 1700000 },

  // Billie Eilish
  { cantante: "Billie Eilish", titulo: "Bad Guy", album: "When We All Fall Asleep", genero: "Pop Alternativo", imagen: `${IMG_BASE}be1/300/300`, fileUrl: `${AUDIO_BASE}11.mp3`, plays: 3100000 },
  { cantante: "Billie Eilish", titulo: "Happier Than Ever", album: "Happier Than Ever", genero: "Pop", imagen: `${IMG_BASE}be2/300/300`, fileUrl: `${AUDIO_BASE}12.mp3`, plays: 1400000 },

  // Karol G
  { cantante: "Karol G", titulo: "Bichota", album: "KG0516", genero: "Reggaetón", imagen: `${IMG_BASE}kg1/300/300`, fileUrl: `${AUDIO_BASE}13.mp3`, plays: 2100000 },
  { cantante: "Karol G", titulo: "Provenza", album: "Mañana Será Bonito", genero: "Reggaetón", imagen: `${IMG_BASE}kg2/300/300`, fileUrl: `${AUDIO_BASE}14.mp3`, plays: 1600000 },

  // Rauw Alejandro
  { cantante: "Rauw Alejandro", titulo: "Todo De Ti", album: "Vice Versa", genero: "R&B Urbano", imagen: `${IMG_BASE}ra1/300/300`, fileUrl: `${AUDIO_BASE}15.mp3`, plays: 980000 },
  { cantante: "Rauw Alejandro", titulo: "Lokera", album: "Vice Versa", genero: "Reggaetón", imagen: `${IMG_BASE}ra2/300/300`, fileUrl: `${AUDIO_BASE}16.mp3`, plays: 850000 },

  // J Balvin
  { cantante: "J Balvin", titulo: "Mi Gente", album: "Vibras", genero: "Reggaetón", imagen: `${IMG_BASE}jb1/300/300`, fileUrl: `${AUDIO_BASE}1.mp3`, plays: 3400000 },
  { cantante: "J Balvin", titulo: "Reggaetón", album: "Energía", genero: "Reggaetón", imagen: `${IMG_BASE}jb2/300/300`, fileUrl: `${AUDIO_BASE}2.mp3`, plays: 720000 },

  // Dua Lipa
  { cantante: "Dua Lipa", titulo: "Levitating", album: "Future Nostalgia", genero: "Pop / Disco", imagen: `${IMG_BASE}dl1/300/300`, fileUrl: `${AUDIO_BASE}3.mp3`, plays: 2700000 },
  { cantante: "Dua Lipa", titulo: "Don't Start Now", album: "Future Nostalgia", genero: "Pop / Disco", imagen: `${IMG_BASE}dl2/300/300`, fileUrl: `${AUDIO_BASE}4.mp3`, plays: 2400000 },
];

const buscarOCrearCantante = async (nombre) => {
  let cantante = await Cantante.findOne({ cantante: new RegExp(`^${nombre.trim()}$`, "i") });
  if (!cantante) {
    cantante = new Cantante({ cantante: nombre.trim() });
    await cantante.save();
    console.log(`  [Seeder] Cantante creado: ${nombre}`);
  }
  return cantante;
};

const cancionesSeeder = async () => {
  try {
    await connectDB();

    await Canciones.deleteMany();
    console.log("[Seeder] Canciones eliminadas.");

    // Limpiar el array de canciones de todos los cantantes
    await Cantante.updateMany({}, { $set: { canciones: [] } });

    for (const datos of canciones) {
      const cantante = await buscarOCrearCantante(datos.cantante);

      const nueva = await Canciones.create({
        cantante: cantante._id,
        titulo: datos.titulo,
        album: datos.album,
        genero: datos.genero,
        imagen: datos.imagen,
        fileUrl: datos.fileUrl,
        plays: datos.plays,
      });

      await Cantante.findByIdAndUpdate(cantante._id, {
        $push: { canciones: nueva._id }
      });

      console.log(`  [Seeder] Canción: "${datos.titulo}" — ${datos.cantante}`);
    }

    console.log(`\n[Seeder] ✅ ${canciones.length} canciones insertadas correctamente.`);
  } catch (error) {
    console.error("[Seeder] Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("[Seeder] Conexión cerrada.");
  }
};

cancionesSeeder();
