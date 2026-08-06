import { searchJamendo, getPopularTracks } from "../services/jamendoService.js";

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

export default { search, popular };
