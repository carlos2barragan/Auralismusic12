import axios from "axios";
import querystring from "querystring";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL_LOCAL || process.env.FRONTEND_URL_PROD;

// ─── Client Credentials token cache ───────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

// ─── Response caches ──────────────────────────────────────────────────────────
const searchCache = new Map();   // 5 min TTL
const enrichCache = new Map();   // 1 hour TTL
const SEARCH_TTL  = 5  * 60 * 1000;
const ENRICH_TTL  = 60 * 60 * 1000;

// ─── Circuit breaker for rate limits ──────────────────────────────────────────
let rateLimitUntil = 0;  // epoch ms when we can retry Spotify

function spotifyBlocked() { return Date.now() < rateLimitUntil; }

function handleRateLimit(err) {
  if (err?.response?.status === 429) {
    const retryAfter = parseInt(err.response.headers?.["retry-after"] || "60", 10);
    rateLimitUntil = Date.now() + retryAfter * 1000;
    console.warn(`⚠️  Spotify rate-limited for ${retryAfter}s (until ${new Date(rateLimitUntil).toISOString()})`);
  }
  throw err;
}

async function getClientToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const { data } = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    { headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// ─── OAuth ─────────────────────────────────────────────────────────────────────

export const redirectToSpotify = (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join(" ");

  const params = querystring.stringify({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: req.query.userId || "",
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};

export const handleCallback = async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) return res.redirect(`${FRONTEND_URL}/home?spotify_error=${error}`);

  try {
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const { data } = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
      { headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // Store tokens in session tied to this user
    req.session.spotify = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      userId,
    };

    res.redirect(`${FRONTEND_URL}/spotify-callback?success=true&userId=${userId}`);
  } catch (err) {
    console.error("❌ Error en Spotify callback:", err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/home?spotify_error=auth_failed`);
  }
};

async function getUserAccessToken(req) {
  const spotify = req.session?.spotify;
  if (!spotify) throw new Error("NO_SESSION");

  if (Date.now() < spotify.expiresAt) return spotify.accessToken;

  // Refresh token
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const { data } = await axios.post(
    "https://accounts.spotify.com/api/token",
    querystring.stringify({ grant_type: "refresh_token", refresh_token: spotify.refreshToken }),
    { headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" } }
  );

  req.session.spotify.accessToken = data.access_token;
  req.session.spotify.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return data.access_token;
}

export const checkSession = (req, res) => {
  const connected = !!req.session?.spotify?.accessToken;
  res.json({ connected });
};

export const disconnect = (req, res) => {
  delete req.session.spotify;
  res.json({ message: "Desconectado de Spotify" });
};

// ─── Public search (Client Credentials) ───────────────────────────────────────

export const search = async (req, res) => {
  try {
    const { q, type = "track,artist", limit = 20 } = req.query;
    if (!q) return res.status(400).json({ message: "Parámetro q requerido" });

    const key = `${q}|${type}|${limit}`;
    const hit = searchCache.get(key);
    if (hit && Date.now() < hit.expires) return res.json(hit.data);

    if (spotifyBlocked()) return res.json({ tracks: [], artists: [] });

    const token = await getClientToken();
    let data;
    try {
      ({ data } = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q, type, limit, market: "ES" },
      }));
    } catch (e) { handleRateLimit(e); }

    const result = {
      tracks:  data.tracks?.items.map(formatTrack)  || [],
      artists: data.artists?.items.map(formatArtist) || [],
    };
    searchCache.set(key, { data: result, expires: Date.now() + SEARCH_TTL });
    res.json(result);
  } catch (err) {
    if (err?.response?.status === 429) return res.json({ tracks: [], artists: [] });
    console.error("❌ Error en búsqueda Spotify:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al buscar en Spotify" });
  }
};

export const getTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getClientToken();
    const { data } = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(formatTrack(data));
  } catch (err) {
    console.error("❌ Error obteniendo track:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al obtener el track" });
  }
};

export const getArtistData = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getClientToken();

    const [artistRes, topTracksRes] = await Promise.all([
      axios.get(`https://api.spotify.com/v1/artists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=ES`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    res.json({
      artist: formatArtist(artistRes.data),
      topTracks: topTracksRes.data.tracks.map(formatTrack),
    });
  } catch (err) {
    console.error("❌ Error obteniendo artista:", err.response?.data || err.message);
    res.status(200).json({ artist: null, topTracks: [] });
  }
};

// ─── Batch enrichment (Client Credentials) ────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

export const enrichSongs = async (req, res) => {
  try {
    const { songs } = req.body;
    if (!Array.isArray(songs) || !songs.length) return res.json([]);

    const output = [];

    if (spotifyBlocked()) {
      return res.json(songs.map(s => ({ id: s.id, imagen: null, externalUrl: null, popularity: null, preview: null })));
    }

    const token = await getClientToken();

    for (const song of songs) {
      const q = `${song.titulo} ${song.artista}`.trim();
      const cacheKey = `enrich:${q}`;
      const hit = enrichCache.get(cacheKey);
      if (hit && Date.now() < hit.expires) {
        output.push({ id: song.id, ...hit.data });
        continue;
      }

      if (spotifyBlocked()) {
        output.push({ id: song.id, imagen: null, externalUrl: null, popularity: null, preview: null });
        continue;
      }

      try {
        const { data } = await axios.get("https://api.spotify.com/v1/search", {
          headers: { Authorization: `Bearer ${token}` },
          params: { q, type: "track", limit: 1, market: "ES" },
        });
        const track = data.tracks?.items?.[0];
        const enriched = {
          imagen:      track?.album?.images?.[0]?.url || null,
          externalUrl: track?.external_urls?.spotify  || null,
          popularity:  track?.popularity ?? null,
          preview:     track?.preview_url || null,
        };
        enrichCache.set(cacheKey, { data: enriched, expires: Date.now() + ENRICH_TTL });
        output.push({ id: song.id, ...enriched });
        await sleep(120);
      } catch (e) {
        if (e?.response?.status === 429) handleRateLimit(e);
        output.push({ id: song.id, imagen: null, externalUrl: null, popularity: null, preview: null });
      }
    }

    res.json(output);
  } catch (err) {
    console.error("❌ Error en enrichSongs:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al enriquecer canciones" });
  }
};

export const enrichArtists = async (req, res) => {
  try {
    const { artists } = req.body;
    if (!Array.isArray(artists) || !artists.length) return res.json([]);

    if (spotifyBlocked()) {
      return res.json(artists.map(a => ({ id: a.id, imagen: null, externalUrl: null, generos: [], seguidores: 0 })));
    }

    const token = await getClientToken();
    const output = [];

    for (const artist of artists) {
      const cacheKey = `artist:${artist.nombre}`;
      const hit = enrichCache.get(cacheKey);
      if (hit && Date.now() < hit.expires) {
        output.push({ id: artist.id, ...hit.data });
        continue;
      }

      if (spotifyBlocked()) {
        output.push({ id: artist.id, imagen: null, externalUrl: null, generos: [], seguidores: 0 });
        continue;
      }

      try {
        const { data } = await axios.get("https://api.spotify.com/v1/search", {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: artist.nombre, type: "artist", limit: 1, market: "ES" },
        });
        const match = data.artists?.items?.[0];
        const enriched = {
          imagen:      match?.images?.[0]?.url || null,
          externalUrl: match?.external_urls?.spotify || null,
          generos:     match?.genres || [],
          seguidores:  match?.followers?.total || 0,
        };
        enrichCache.set(cacheKey, { data: enriched, expires: Date.now() + ENRICH_TTL });
        output.push({ id: artist.id, ...enriched });
        await sleep(120);
      } catch (e) {
        if (e?.response?.status === 429) handleRateLimit(e);
        output.push({ id: artist.id, imagen: null, externalUrl: null, generos: [], seguidores: 0 });
      }
    }

    res.json(output);
  } catch (err) {
    console.error("❌ Error en enrichArtists:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al enriquecer artistas" });
  }
};

// ─── User-scoped (needs OAuth session) ────────────────────────────────────────

export const getUserPlaylists = async (req, res) => {
  try {
    const token = await getUserAccessToken(req);
    const { data } = await axios.get("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const playlists = data.items.map(p => ({
      id: p.id,
      nombre: p.name,
      descripcion: p.description,
      imagen: p.images?.[0]?.url || null,
      total: p.tracks?.total || 0,
      owner: p.owner?.display_name,
    }));

    res.json(playlists);
  } catch (err) {
    if (err.message === "NO_SESSION") return res.status(401).json({ message: "No conectado a Spotify" });
    console.error("❌ Error obteniendo playlists:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al obtener playlists de Spotify" });
  }
};

export const getPlaylistTracks = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getUserAccessToken(req);

    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&market=ES`;

    while (url) {
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      tracks.push(...data.items.filter(i => i.track).map(i => formatTrack(i.track)));
      url = data.next;
    }

    res.json(tracks);
  } catch (err) {
    if (err.message === "NO_SESSION") return res.status(401).json({ message: "No conectado a Spotify" });
    console.error("❌ Error obteniendo tracks:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al obtener tracks de Spotify" });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTrack(t) {
  return {
    spotifyId: t.id,
    titulo: t.name,
    artista: t.artists?.[0]?.name || "Desconocido",
    artistaId: t.artists?.[0]?.id || null,
    album: t.album?.name || "",
    imagen: t.album?.images?.[0]?.url || null,
    duracionMs: t.duration_ms,
    preview: t.preview_url,
    popularity: t.popularity,
    explicit: t.explicit,
    uri: t.uri,
    externalUrl: t.external_urls?.spotify,
  };
}

function formatArtist(a) {
  return {
    spotifyId: a.id,
    nombre: a.name,
    imagen: a.images?.[0]?.url || null,
    generos: a.genres || [],
    seguidores: a.followers?.total || 0,
    popularity: a.popularity,
    uri: a.uri,
    externalUrl: a.external_urls?.spotify,
  };
}

export default {
  redirectToSpotify,
  handleCallback,
  checkSession,
  disconnect,
  search,
  getTrack,
  getArtistData,
  enrichSongs,
  enrichArtists,
  getUserPlaylists,
  getPlaylistTracks,
};
