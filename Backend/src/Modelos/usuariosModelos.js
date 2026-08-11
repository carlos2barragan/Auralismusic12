import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
  avatar: { type: String, default: null },
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
  rol: { type: String, enum: ["administrador", "usuario", "cantante"], default: "usuario" },
  plan: { type: String, enum: ["free", "premium"], default: "free" },
  historial: [{
    cancion: { type: mongoose.Schema.Types.ObjectId, ref: "Canciones" },
    titulo: String,
    cantante: String,
    genero: String,
    fecha: { type: Date, default: Date.now }
  }],
  config: {
    perfilPublico: { type: Boolean, default: true },
    mostrarHistorial: { type: Boolean, default: true },
    notificaciones: { type: Boolean, default: true }
  },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String, default: null }
}, { timestamps: true });

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
