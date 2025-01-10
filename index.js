// Import dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const URL = require('url').URL;
const URLSearchParams = require('url').URLSearchParams;

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = '28797e7035babad606ddbc1642d2ec8b'; // Replace with your TMDB API key
const LANGUAGE = "uk-UA"; // Set to Ukrainian language.

// Check if API key is set
if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not set.');
}

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
async function fetchFromTMDB(endpoint) {
    try {
        const url = new URL(endpoint);
        url.searchParams.append('api_key', TMDB_API_KEY);
        url.searchParams.append('language', LANGUAGE);
        console.log('Requesting URL:', url.toString());
        const response = await axios.get(url.toString());
        return response.data;
    } catch (error) {
        console.error('TMDB API error:', error);
        throw new Error('TMDB request failed');
    }
}

// Catalog endpoint for movies
app.get('/catalog/movie/tmdb-movies.json', async (req, res) => {
    try {
        const movieIds = ['402431', '585083', '616747', '1019404', '1108566', '840705', '114', '9489', '350', '8835', '545611', '519182', '1014590'];
        const movies = await Promise.all(
            movieIds.map(async (id) => {
                const movieData = await fetchFromTMDB(`https://api.themoviedb.org/3/movie/${id}`);
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
        const movieData = await fetchFromTMDB(`https://api.themoviedb.org/3/movie/${id}`);
        const meta = {
            id: `tmdb-movie-${movieData.id}`,
            type: 'movie',
            name: movieData.title,
            poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
            background: movieData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}` : null,
            description: movieData.overview,
            releaseInfo: movieData.release_date?.split('-')[0],
            genres: movieData.genres.map(genre => genre.name),
        };

        res.json({ meta });
    } catch (error) {
        console.error('Error fetching meta data for movie:', error);
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
                     '402431': {
                        title: 'Wicked',
                        url: 'https://crimson.stream.voidboost.cc/f18d2a0f3747324bffb1be571730f97e:2025011118:ejRNbWM5Uk5idkhTZTA5U05tRTEzREx6WWdWM0dIengvbWdqNGRaU3NkMCsxVTBaVHhXTzJzNkQ0MjhwY3B2Z0ppbDcwY3FFeUI4allQejdqVDVoTWc9PQ==/1/1/9/2/6/1/3/4ljwr.mp4:hls:manifest.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                    '585083': {
                        title: 'Монстри на канікулах: Трансформанія',
                        url: 'https://s1.hdvbua.pro/media1/content/stream/films/hotel_transylvania_transformania_2022_webrip_1080p_83600/hls/1080/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": true
                        }
                    },
                    '616747': {
                        title: 'Маєток з привидами',
                        url: 'https://s1.hdvbua.pro/media1/content/stream/films/haunted_mansion_2023_webdl_1080p_91673/hls/1080/index.m3u8', // Replace with actual links
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
                      '1014590': {
                        title: 'Підвищення',
                        url: 'https://s1.hdvbua.pro/media/content/stream/films/upgraded.2024.webdl.1080p.uakino.mvo_101451/hls/1080/index.m3u8', // Replace with actual links
                        "behaviorHints": {
                            "notWebReady": false
                        }
                    },
                      '519182': {
                        title: 'Нікчемний Я 4',
                        url: 'https://s1.hdvbua.pro/media/content/stream/films/despicable.me.4.2024.bdremux.1080p.ledoyen.dub_102367/hls/480/index.m3u8', // Replace with actual links
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
                const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}`);
                return {
                    id: `tmdb-series-${seriesData.id}`,
                    type: 'series',
                    name: seriesData.name,
                    poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
                    background: seriesData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${seriesData.backdrop_path}` : null,
                    description: seriesData.overview,
                    releaseInfo: seriesData.first_air_date?.split('-')[0],
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
app.get('/meta/series/tmdb-series-:id.json', async (req, res) => {
    const { id } = req.params;

    try {
        const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
        const seasons = [];

        // Fetch episode details for each season
        for (const season of seriesData.seasons) {
            if (season.season_number === 0) continue; // Skip specials

            const seasonData = await fetchFromTMDB(
                `https://api.themoviedb.org/3/tv/${id}/season/${season.season_number}?api_key=${TMDB_API_KEY}`
            );

           const episodes = season.episodes.map((episode) => ({
    id: `tmdb-series-${id}-s${season.season_number}e${episode.episode_number}`, // Simplified ID
    title: episode.name || `Епізод ${episode.episode_number}`,
    season: season.season_number,
    episode: episode.episode_number,
    released: episode.air_date,
    overview: episode.overview || '',
    thumbnail: episode.still_path
        ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
        : null,
}));

            seasons.push({
                id: `tmdb-series-${id}-s${season.season_number}`,
                title: season.name || `Сезон ${season.season_number}`,
                episodes,
            });
        }

        const meta = {
            id: `tmdb-series-${id}`,
            type: 'series',
            name: seriesData.name,
            poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
            background: seriesData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${seriesData.backdrop_path}` : null,
            description: seriesData.overview,
            releaseInfo: seriesData.first_air_date?.split('-')[0],
            genres: seriesData.genres.map((genre) => genre.name),
            seasons,
        };

        res.json({ meta });
    } catch (error) {
        console.error('Error fetching metadata for series:', error.message);
        res.status(500).json({ error: 'Failed to fetch metadata for the series' });
    }
});


// Stream endpoint for series
app.get('/stream/series/:id.json', (req, res) => {
    const { id } = req.params;
    console.log('Requested Stream ID:', id);

    // Define streams with IDs matching the meta response
    const availableStreams = {
        'tmdb-series-60625-s1e2': {
            title: 'Rick and Morty S1E1',
            url: 'https://example.com/stream/rick-and-morty-s1e1.mkv', // Replace with actual stream URL
            behaviorHints: { notWebReady: false },
        },
        'tmdb-series-60625-s1e2': {
            title: 'Rick and Morty S1E2',
            url: 'https://example.com/stream/rick-and-morty-s1e2.mkv',
            behaviorHints: { notWebReady: false },
        },
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
        console.error(`No stream found for ID: ${id}`);
        res.json({ streams: [] }); // Return an empty stream list if no match
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

