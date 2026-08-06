import { searchJamendo, getPopularTracks, getArtistTracks, searchArtist } from "../services/jamendoService.js";

export const search = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) return res.json([]);
    const results = await searchJamendo(q, Number(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error buscando en Jamendo" });
  }
};

export const popular = async (req, res) => {
  try {
    const { tags, limit = 20 } = req.query;
    const results = await getPopularTracks(Number(limit), tags);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo populares de Jamendo" });
  }
};

export const artistTracks = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]);
    const results = await getArtistTracks(name);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo tracks del artista" });
  }
};

export const artistInfo = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json(null);
    const result = await searchArtist(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo info del artista" });
  }
};

export default { search, popular, artistTracks, artistInfo };
