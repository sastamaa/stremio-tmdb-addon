const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = '28797e7035babad606ddbc1642d2ec8b'; // Replace with your TMDB API key

// Middleware to parse JSON
app.use(express.json());

app.use(cors());

// Stremio manifest
app.get('/manifest.json', (req, res) => {
    const manifest = {
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
    };
    res.json(manifest);
});

// Catalog endpoint for movies
app.get('/catalog/movie/tmdb-movies.json', async (req, res) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`);
        const movies = response.data.results.map(movie => ({
            id: `tmdb-movie-${movie.id}`,
            type: 'movie',
            name: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            description: movie.overview,
            releaseInfo: movie.release_date
        }));
        res.json({ metas: movies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// Catalog endpoint for series
app.get('/catalog/series/tmdb-series.json', async (req, res) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}`);
        const series = response.data.results.map(show => ({
            id: `tmdb-series-${show.id}`,
            type: 'series',
            name: show.name,
            poster: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
            description: show.overview,
            releaseInfo: show.first_air_date
        }));
        res.json({ metas: series });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

// Meta endpoint for movies and series
app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const tmdbId = id.split('-')[2];

    try {
        if (type === 'movie') {
            // Handle movies
            const response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
            const data = response.data;

            const meta = {
                id: id,
                type: type,
                name: data.title,
                poster: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
                description: data.overview,
                releaseInfo: data.release_date,
                genres: data.genres.map(genre => genre.name)
            };

            res.json({ meta: meta });
        } else if (type === 'series') {
            // Handle series
            const seriesResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
            const seriesData = seriesResponse.data;

            // Fetch season details
            const seasons = await Promise.all(
                seriesData.seasons.map(async (season) => {
                    const seasonResponse = await axios.get(
                        `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`
                    );
                    const seasonData = seasonResponse.data;

                    return {
                        season: season.season_number,
                        title: season.name,
                        overview: season.overview,
                        poster: `https://image.tmdb.org/t/p/w500${season.poster_path}`,
                        episodes: seasonData.episodes.map(episode => ({
                            id: `tmdb-episode-${episode.id}`,
                            title: episode.name,
                            overview: episode.overview,
                            released: episode.air_date,
                            episode: episode.episode_number
                        }))
                    };
                })
            );

            const meta = {
                id: id,
                type: type,
                name: seriesData.name,
                poster: `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`,
                description: seriesData.overview,
                releaseInfo: seriesData.first_air_date,
                genres: seriesData.genres.map(genre => genre.name),
                seasons: seasons
            };

            res.json({ meta: meta });
        } else {
            res.status(400).json({ error: 'Invalid type' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meta data' });
    }
});

// Stream endpoint for movies and episodes
app.get('/stream/:type/:id.json', (req, res) => {
    const { type, id } = req.params;

    if (type === 'movie') {
        // Handle movie streaming links
        const streams = [
            {
                title: 'Example Movie Stream',
                url: 'https://example.com/movies/movie-123.mp4', // Replace with actual stream URL
                behaviorHints: {
                    notWebReady: true,
                }
            }
        ];
        res.json({ streams: streams });
    } else if (type === 'series') {
        // Handle episode streaming links
        const episodeId = id.split('-')[2]; // Extract TMDB episode ID
        const streams = [
            {
                title: 'Example Episode Stream',
                url: `https://example.com/episodes/episode-${episodeId}.mp4`, // Replace with actual stream URL
                behaviorHints: {
                    notWebReady: true,
                }
            }
        ];
        res.json({ streams: streams });
    } else {
        res.status(400).json({ error: 'Invalid type' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
