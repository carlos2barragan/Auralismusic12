import PlayList from "../Modelos/playlistModelos.js";
import Canciones from "../Modelos/cancionesModelos.js";
import Usuario from "../Modelos/usuariosModelos.js";
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

export const crear = async (req, res) => {
  try {
    let { creadoPor, canciones, nombre } = req.body;

    const cancionesArray = Array.isArray(canciones) ? canciones : [canciones];

    const objectIds = [];
    const nombresCanciones = [];
    
    cancionesArray.forEach((cancion) => {
      if (mongoose.Types.ObjectId.isValid(cancion)) {
        objectIds.push(cancion);
      } else {
        nombresCanciones.push(cancion); 
      }
    });


    const cancionesEncontradas = await Canciones.find({
      $or: [{ _id: { $in: objectIds } }, { titulo: { $in: nombresCanciones } }],
    });

    const usuarioEncontrado = await Usuario.findById(creadoPor);

    if (!usuarioEncontrado) {
      return res.status(400).json({ message: `No se encontró el usuario: ${creadoPor}` });
    }

    if (cancionesEncontradas.length === 0) {
      return res.status(400).json({ message: "No se encontraron canciones válidas para agregar a la playlist." });
    }

    const nuevaPlaylist = new PlayList({
      canciones: cancionesEncontradas.map((c) => c._id),
      creadoPor: usuarioEncontrado._id,
      nombre,
    });


    await nuevaPlaylist.save();

    await Usuario.findByIdAndUpdate(
      usuarioEncontrado._id,
      { $push: { playlists: nuevaPlaylist._id } },
      { new: true } 
    );



    res.status(201).json({
      message: "Playlist guardada con éxito",
      playlist: nuevaPlaylist,
    });
  } catch (error) {
    console.error("❌ Error al guardar la playlist:", error.message);
    res.status(500).json({
      message: "Error al guardar la playlist",
      error: error.message,
    });
  }
};



  export async function agregarCancion(req, res) {
    const { id } = req.params;
    const { canciones } = req.body; 

    if (!canciones || !Array.isArray(canciones)) {
        return res.status(400).json({ mensaje: "Formato de canciones inválido" });
    }

    try {
      const playlist = await PlayList.findById(id);
        if (!playlist) {
            return res.status(404).json({ mensaje: "Playlist no encontrada" });
        }

        playlist.canciones.push(...canciones);
        await playlist.save();

        res.json({ mensaje: "✅ Canción(es) agregada(s) a la playlist", playlist });
    } catch (error) {
        console.error("❌ Error al agregar canción:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

export const listar = async (req, res) => {
  try {
    const { userId } = req.query; // Obtener el ID del usuario desde la consulta

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const playlists = await PlayList.find({ creadoPor: userId }); // Filtrar por usuario

    res.status(200).json(playlists);
  } catch (error) {
    console.error("Error al obtener las playlists", error.message);
    res.status(500).json({ message: "Error al obtener las playlists", error: error.message });
  }
};

export const ObtenerPorId = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID no válido" });
  }

  try {
    const playlist = await PlayList.findById(id).populate("canciones");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist no encontrada" });
    }

    res.status(200).json(playlist);
  } catch (error) {
    console.error("Error al obtener la playlist:", error.message);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


export const Actualizar = async (req, res) => {
  const { id } = req.params;
  const { cancionesIds } = req.body;

  try {
    const playlistExistente = await PlayList.findById(id);

    if (!playlistExistente) {
      return res.status(404).json({ message: "Playlist no encontrada" });
    }

    const cancionesSet = new Set(playlistExistente.canciones.map(c => c.toString()));
    const cancionesNuevas = cancionesIds.filter(cancionId => !cancionesSet.has(cancionId.toString()));

    if (cancionesNuevas.length === 0) {
      return res.status(400).json({ message: "Todas las canciones ya están en la playlist" });
    }

    playlistExistente.canciones.push(...cancionesNuevas);
    await playlistExistente.save();

    res.status(200).json(playlistExistente);
  } catch (error) {
    console.error("Error al actualizar la playlist:", error.message);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


export const Eliminar = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: " ID no valido" });
  }
  try {
    const playlistEliminada = await PlayList.findByIdAndDelete(id);

    if (!playlistEliminada) {
      return res.status(404).json({ message: "Playlist no encontrada" });
    }
    res.status(200).json({ message: "Playlist eliminada con exito" });
  } catch (error) {
    console.error("Error al eliminar la playlist", error.message);
    res
      .status(500)
      .json({ message: "Error al eliminar la playlist", error: error.message });
  }
};

export default { crear, agregarCancion,listar, ObtenerPorId, Actualizar, Eliminar };
