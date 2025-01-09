// Import dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = '28797e7035babad606ddbc1642d2ec8b'; // Replace with your TMDB API key

app.use(cors());

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
                    description: movieData.overview,
                    releaseInfo: movieData.release_date,
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
        const movieId = id;
        if (!movieId) return res.status(400).json({ error: 'Invalid movie ID format' });

        const movieData = await fetchFromTMDB(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        const meta = {
            id: `tmdb-movie-${movieData.id}`,
            type: 'movie',
            name: movieData.title,
            poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
            description: movieData.overview,
            releaseInfo: movieData.release_date,
            genres: movieData.genres.map(genre => genre.name)
        };

        res.json({ meta });
    } catch (error) {
        console.error('Error fetching meta data:', error);
        res.status(500).json({ error: 'Failed to fetch meta data' });
    }
});

// Stream endpoint for movies
app.get('/stream/movie/tmdb-movie-:id.json', (req, res) => {
    const { id } = req.params;

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
            url: 'https://ashdi.vip/video17/2/new/the.shadow.strays.2024.ua.dub.tak.treba.prodakshn_146773/hls/1080/DaqXjXWRkeBYhA37BA==/index.m3u8', // Replace with actual links
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
        },'1108566': {
            title: 'Вбивча спека',
            url: 'https://ashdi.vip/video17/2/new/killer.heat.2024.1080p.amzn.webdl.aac2.0.h.264utopia_145019/hls/480/DaqXjXWRkeBYhA37BA==/index.m3u8', // Replace with actual links
            "behaviorHints": {
        "notWebReady": false
    }
        },'840705': {
            title: 'Кліпни двічі',
            url: 'https://ashdi.vip/video11/2/new/blink.twice.2024.ua_142368/hls/1080/AqaXi3WGjuRekxH2AQ==/index.m3u8', // Replace with actual links
            "behaviorHints": {
        "notWebReady": false
    }
        },'9489': {
            title: 'Вам лист',
            url: 'https://s1.hdvbua.pro/media/content/stream/films/youve_got_mail_1998_bdrip_1080p_39534/hls/1080/index.m3u8', // Replace with actual links
            "behaviorHints": {
        "notWebReady": false
    }
        },'350': {
            title: 'Диявол носить «Прада',
            url: 'https://s1.hdvbua.pro/media/content/stream/films/the_devil_wears_prada_2006_webdlrip720p_open_matte_16954/hls/720/index.m3u8', // Replace with actual links
            "behaviorHints": {
        "notWebReady": false
    }
        },'114': {
            title: 'Красуня',
            url: 'https://s1.hdvbua.pro/media1/content/stream/new/pretty_woman_1990_bdrip_1080p_h.265_55570/hls/1080/index.m3u8', // Replace with actual links
            "behaviorHints": {
        "notWebReady": false
    }
        },'8835': {
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
        res.json({ streams: [
            {
                title: stream.title,
                url: stream.url,
                behaviorHints: {
                    notWebReady: false,
                },
            },
        ] });
    } else {
        res.json({ streams: [] });
    }
});


// Catalog endpoint for series
app.get('/catalog/series/tmdb-series.json', async (req, res) => {
    try {
        const seriesIds = ['222766', '60625'];
        const series = await Promise.all(
            seriesIds.map(async (id) => {
                const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
                return {
                    id: `tmdb-series-${seriesData.id}`,
                    type: 'series',
                    name: seriesData.name,
                    poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
                    description: seriesData.overview,
                    releaseInfo: seriesData.first_air_date,
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
app.get('/meta/series/:id.json', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching metadata for series with ID: ${id}`); // Debugging log

    try {
        // Fetch series details from TMDb
        const seriesResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
        const seriesData = seriesResponse.data;

        // Fetch season details
        const seasons = await Promise.all(
            seriesData.seasons.map(async (season) => {
                const seasonResponse = await axios.get(
                    `https://api.themoviedb.org/3/tv/${id}/season/${season.season_number}?api_key=${TMDB_API_KEY}`
                );
                const seasonData = seasonResponse.data;

                return {
                    id: `tmdb-series-${id}-s${season.season_number}`,
                    title: season.name,
                    episodes: seasonData.episodes.map((episode) => ({
                        id: `tmdb-series-${id}-s${season.season_number}e${episode.episode_number}`,
                        title: episode.name,
                        season: season.season_number,
                        episode: episode.episode_number,
                        released: episode.air_date,
                        overview: episode.overview
                    }))
                };
            })
        );

        // Construct metadata object
        const meta = {
            id: `tmdb-series-${seriesData.id}`,
            type: 'series',
            name: seriesData.name,
            poster: `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`,
            description: seriesData.overview,
            releaseInfo: seriesData.first_air_date,
            genres: seriesData.genres.map((genre) => genre.name),
            seasons
        };

        console.log('Returning metadata for series:', meta); // Debugging log
        res.json({ meta });
    } catch (error) {
        console.error(`Error fetching metadata for series with ID ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

app.get('/stream/series/:id.json', (req, res) => {
    const { id } = req.params;

    console.log(`Request received from Stremio for series stream ID: ${id}`);


    // Match TMDb format (e.g., 60625-s1e2)
    const tmdbMatch = id.match(/^(\d+)-s(\d+)e(\d+)$/);
    if (tmdbMatch) {
        const seriesId = tmdbMatch[1];
        const season = tmdbMatch[2];
        const episode = tmdbMatch[3];

        console.log(`Parsed TMDb ID: ${seriesId}, season: ${season}, episode: ${episode}`);

        const streams = [];

        // Example: Rick and Morty
        if (seriesId === '60625' && season === '1' && episode === '2') {
            streams.push({
                title: 'Rick and Morty - S1E2',
                url: '"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"',
                behaviorHints: { notWebReady: false },
            });
        }

        if (streams.length === 0) {
            console.log('No streams found for TMDb format:', { seriesId, season, episode });
            return res.json({ streams }); // Send empty streams response
        }

        console.log('Returning streams:', streams);
        return res.json({ streams });
    }

    // Match IMDb-like format (e.g., tt3006802:1:2)
    const imdbMatch = id.match(/^tt\d+:(\d+):(\d+)$/);
    if (imdbMatch) {
        const season = imdbMatch[1];
        const episode = imdbMatch[2];

        console.log(`Parsed IMDb format, season: ${season}, episode: ${episode}`);

        const streams = [];

        // Example: Rick and Morty (IMDb)
        if (id.startsWith('tt3006802') && season === '1' && episode === '2') {
            streams.push({
                title: 'Rick and Morty - S1E2',
                url: '"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"',
                behaviorHints: { notWebReady: false },
            });
        }

        if (streams.length === 0) {
            console.log('No streams found for IMDb format:', { season, episode });
            return res.json({ streams }); // Send empty streams response
        }

        console.log('Returning streams:', streams);
        return res.json({ streams });
    }

    console.error('Invalid series ID format:', id);
    res.status(400).json({ error: 'Invalid series ID format' });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
