import mongoose from "mongoose";

const anuncioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  imagen: { type: String, default: '' },
  enlace: { type: String, default: '' },
  tipo: { type: String, enum: ['banner', 'modal', 'sidebar'], default: 'modal' },
  activo: { type: Boolean, default: true },
  frecuencia: { type: Number, default: 1 },
}, { timestamps: true });

const Anuncio = mongoose.model("Anuncio", anuncioSchema);
export default Anuncio;
