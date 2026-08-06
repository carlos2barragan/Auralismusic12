import Anuncio from "../Modelos/anuncioModelos.js";

export const obtenerAnuncios = async (req, res) => {
  try {
    const anuncios = await Anuncio.find({ activo: true }).sort({ createdAt: -1 });
    res.status(200).json(anuncios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener anuncios" });
  }
};

export default { obtenerAnuncios };
