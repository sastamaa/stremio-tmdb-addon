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
        const movieIds = ['335983', '402431'];
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
        const seriesIds = ['966', '60625'];
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
app.get('/meta/series/tmdb-series-:id.json', async (req, res) => {
    const { id } = req.params;
    try {
        const seriesId = id;
        if (!seriesId) return res.status(400).json({ error: 'Invalid series ID format' });

        const seriesData = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_API_KEY}`);
        const meta = {
            id: `tmdb-series-${seriesData.id}`,
            type: 'series',
            name: seriesData.name,
            poster: seriesData.poster_path ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}` : null,
            description: seriesData.overview,
            releaseInfo: seriesData.first_air_date,
            genres: seriesData.genres.map(genre => genre.name)
        };

        res.json({ meta });
    } catch (error) {
        console.error('Error fetching meta data for series:', error);
        res.status(500).json({ error: 'Failed to fetch meta data' });
    }
});

app.get('/stream/series/tmdb-series-:id.json', (req, res) => {
    const { id } = req.params;
    console.log('Fetching stream for series with ID:', id); // Debug log

    const match = id.match(/^(.+)-s(\d+)e(\d+)$/); // Extract series ID, season, and episode
    if (!match) {
        return res.status(400).json({ error: 'Invalid series ID format' });
    }

    const seriesId = match[1]; // e.g., "60625"
    const season = match[2];  // e.g., "5"
    const episode = match[3]; // e.g., "10"

    // Example streaming links for specific episodes (use actual streaming links for production)
    const streams = [];
    if (seriesId === '60625') {
        streams.push({
            title: `Rick and Morty - S${1}E${1}`,
            url: `https://ashdi.vip/video8/2/new/high.potential.s01e01.1080p.amzn.webdl.h.264.ukr.eng_151148/hls/1080/AqaXi3WGjuRfmhH2BA==/index.m3u8`,
            behaviorHints: {
                notWebReady: true,
            }
        });
    } else if (seriesId === '966') {
        streams.push({
            title: `The Day of the Jackal - S1E2`,
            url: `https://ashdi.vip/video8/2/new/high.potential.s01e01.1080p.amzn.webdl.h.264.ukr.eng_151148/hls/1080/AqaXi3WGjuRfmhH2BA==/index.m3u8`,
            behaviorHints: {
                notWebReady: true,
            }
        });
    }

    if (streams.length === 0) {
        return res.status(404).json({ error: 'No streams found' });
    }

    console.log('Returning streams:', streams); // Debug log
    res.json({ streams: streams });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
