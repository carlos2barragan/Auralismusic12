import mongoose from "mongoose";

const seguidorSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
}, { timestamps: true });

seguidorSchema.index({ follower: 1, following: 1 }, { unique: true });

const Seguidor = mongoose.model("Seguidor", seguidorSchema);
export default Seguidor;
