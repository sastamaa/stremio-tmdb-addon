// Import dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = '28797e7035babad606ddbc1642d2ec8b'; // Replace with your TMDB API key
const LANGUAGE = "uk-UA"; // Set to Ukrainian language.

app.use(cors());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use((err, req, res, next) => {
    console.error(`Error processing ${req.originalUrl}:`, err);
    res.status(500).json({ error: "Internal Server Error" });
});


// Manifest endpoint
app.get('/manifest.json', (req, res) => {
    res.json({
        id: 'com.example.stremio.tmdb',
        version: '1.0.0',
        name: 'TMDB Stremio Addon',
        description: 'Stremio addon for movies and series from TMDB',
        resources: ['catalog', 'meta', 'stream'],
        types: ['movie', 'series'],
        catalogs: [
            {
                type: 'movie',
                id: 'tmdb-movies',
                name: 'TMDB Movies',
                extra: [{ name: 'search', isRequired: false }]
            },
            {
                type: 'series',
                id: 'tmdb-series',
                name: 'TMDB Series',
                extra: [{ name: 'search', isRequired: false }]
            }
        ]
    });
});

// Utility function to handle TMDB API requests
async function fetchFromTMDB(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('TMDB API error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw new Error('TMDB request failed');
    }
}

async function fetchFromTMDB(url) {
    try {
        const fullUrl = `${url}?api_key=${TMDB_API_KEY}&language=${LANGUAGE}`;
        const response = await axios.get(fullUrl);
        return response.data;
    } catch (error) {
        console.error("TMDB API error:", error);
        throw new Error("TMDB request failed");
    }
}

// Fetch videos (trailers) for movies or series
async function fetchTrailers(type, id) {
    try {
        const response = await fetchFromTMDB(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${TMDB_API_KEY}`);
        const videos = response.results.filter((video) => video.type === "Trailer" && video.site === "YouTube");
        // Use the first YouTube trailer if available
        return videos.length > 0
            ? `https://www.youtube.com/watch?v=${videos[0].key}`
            : null;
    } catch (error) {
        console.error(`Failed to fetch trailers for ${type} ID ${id}:`, error);
        return null;
    }
}


// Catalog endpoint for movies
app.get('/catalog/movie/tmdb-movies.json', async (req, res) => {
    try {
        const movieIds = ['335983', '402431', '1019404', '1108566', '840705', '114', '9489', '350', '8835'];
        const movies = await Promise.all(
            movieIds.map(async (id) => {
                const movieData = await fetchFromTMDB(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`);
                return {
                    id: `tmdb-movie-${movieData.id}`,
                    type: 'movie',
                    name: movieData.title,
                    poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                    background: movieData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}` : null,
                    description: movieData.overview,
                    releaseInfo: new Date(movieData.release_date).getFullYear().toString(),
                    genres: movieData.genres.map(genre => genre.name)
                };
            })
        );

        res.json({ metas: movies });
    } catch (error) {
        console.error('Error fetching catalog for movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// Meta endpoint for movies
app.get('/meta/movie/tmdb-movie-:id.json', async (req, res) => {
    const { id } = req.params;

    try {
        const movieData = await fetchFromTMDB(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`);
        const trailer = await fetchTrailers('movie', id);

        const meta = {
            id: `tmdb-movie-${movieData.id}`,
            type: 'movie',
            name: movieData.title,
            poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
            background: movieData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}` : null,
            description: movieData.overview,
            releaseInfo: movieData.release_date?.split('-')[0], // Extract the year
            genres: movieData.genres.map((genre) => genre.name),
            trailer: trailer, // Include trailer URL if available
        };

        res.json({ meta });
    } catch (error) {
        console.error('Error fetching meta data:', error);
        res.status(500).json({ error: 'Failed to fetch movie meta data' });
    }
});

 // Stream endpoint for movies
            app.get('/stream/movie/tmdb-movie-:id.json', (req, res) => {
                const {
                    id
                } = req.params;

                // Example data for demo purposes
                const availableStreams = {
                    '335983': {
                        title: 'Venom',
                        url: 'https://www.sw.vidce.net/d/bVWmOLjKiF4dIZ13GHbf7g/1736801777/video/2015/tt1262426.mp4', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": true
                        }
                    },
                    '402431': {
                        title: 'Wicked',
                        url: 'https://www.sw.vidce.net/d/UZyt7ohW8G4SH9rAT36QXg/1737113698/video/2015/tt1262426.mp4', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '1019404': {
                        title: 'Оса',
                        url: 'https://ashdi.vip/video17/1/new/the.wasp.2024.ua.mvo.megogo.voice_155425/hls/1080/DaqXjXWRkeBYhA37BA==/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '1108566': {
                        title: 'Вбивча спека',
                        url: 'https://ashdi.vip/video17/2/new/killer.heat.2024.1080p.amzn.webdl.aac2.0.h.264utopia_145019/hls/480/DaqXjXWRkeBYhA37BA==/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '840705': {
                        title: 'Кліпни двічі',
                        url: 'https://ashdi.vip/video11/2/new/blink.twice.2024.ua_142368/hls/1080/AqaXi3WGjuRekxH2AQ==/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '9489': {
                        title: 'Вам лист',
                        url: 'https://s1.hdvbua.pro/media/content/stream/films/youve_got_mail_1998_bdrip_1080p_39534/hls/1080/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '350': {
                        title: 'Диявол носить «Прада',
                        url: 'https://s1.hdvbua.pro/media/content/stream/films/the_devil_wears_prada_2006_webdlrip720p_open_matte_16954/hls/720/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '114': {
                        title: 'Красуня',
                        url: 'https://s1.hdvbua.pro/media1/content/stream/new/pretty_woman_1990_bdrip_1080p_h.265_55570/hls/1080/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '8835': {
                        title: 'Білявка в законі',
                        url: 'https://ashdi.vip/video17/2/films/legally_blonde_2001_bdrip_1080p_4xukr_eng_hurtom_99178/hls/480/DaqXjXWRkeBYhA37BA==/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                };

                const tmdbId = id; // Extract TMDB ID
                console.log('Fetching stream for TMDB ID:', tmdbId);

                if (availableStreams[tmdbId]) {
                    const stream = availableStreams[tmdbId];
                    res.json({
                        streams: [{
                            title: stream.title,
                            url: stream.url,
                            behaviorHints: {
                                notWebReady: false,
                            },
                        }, ]
                    });
                } else {
                    res.json({
                        streams: []
                    });
                }
            });

// Catalog endpoint for series
app.get('/catalog/series/tmdb-series.json', async (req, res) => {
    try {
        const seriesIds = ['60625'];
        const series = await Promise.all(
            seriesIds.map(async (id) => {
                const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
                return {
                    id: `tmdb-series-${seriesData.id}`,
                    type: 'series',
                    name: seriesData.name,
                    poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
                    background: seriesData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${seriesData.backdrop_path}` : null,
                    description: seriesData.overview,
                    releaseInfo: new Date(seriesData.first_air_date).getFullYear().toString(),
                    genres: seriesData.genres.map(genre => genre.name)
                };
            })
        );

        res.json({ metas: series });
    } catch (error) {
        console.error('Error fetching catalog for series:', error);
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

// Meta endpoint for series
app.get("/meta/series/tmdb-series-:id.json", async (req, res) => {
    const { id } = req.params;

    try {
        const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}`);
        const trailer = await fetchTrailers("tv", id);

        const seasons = await Promise.all(
            seriesData.seasons.map(async (season) => {
                if (season.season_number === 0) return null;

                const seasonData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}/season/${season.season_number}`);
                return {
                    id: `tmdb-series-${id}-s${season.season_number}`,
                    title: season.name || `Сезон ${season.season_number}`,
                    episodes: seasonData.episodes.map((episode) => ({
                        id: `tmdb-series-${id}-s${season.season_number}e${episode.episode_number}`,
                        title: episode.name || `Episod ${episode.episode_number}`,
                        season: season.season_number,
                        episode: episode.episode_number,
                        released: episode.air_date,
                        overview: episode.overview || "",
                        thumbnail: episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : null,
                    })),
                };
            })
        );

        const filteredSeasons = seasons.filter((season) => season !== null);

        const meta = {
            id: `tmdb-series-${id}`,
            type: "series",
            name: seriesData.name,
            poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
            background: seriesData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${seriesData.backdrop_path}` : null,
            description: seriesData.overview,
            releaseInfo: seriesData.first_air_date?.split("-")[0],
            genres: seriesData.genres.map((genre) => genre.name),
            seasons: filteredSeasons,
            trailer: trailer,
        };

        res.json({ meta });
    } catch (error) {
        console.error(`Error fetching metadata for series ID ${id}:`, error.message);
        res.status(500).json({ error: "Failed to fetch series metadata" });
    }
});

// Stream endpoint for series episodes
app.get('/stream/series/tmdb-series-:id.json', (req, res) => {
    const { id } = req.params;

    const availableStreams = {
        'tmdb-series-60625-s1e2': {
            title: 'Rick and Morty S1E2',
            url: 'https://s1.hdvbua.pro/media/content/stream/serials/rick.and.morty.s01e02_1728/hls/720/index.m3u8',
            behaviorHints: { notWebReady: false },
        },
        // Add other streams as needed
    };

    if (availableStreams[id]) {
        const stream = availableStreams[id];
        res.json({
            streams: [
                {
                    title: stream.title,
                    url: stream.url,
                    behaviorHints: stream.behaviorHints,
                },
            ],
        });
    } else {
        res.json({ streams: [] });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
