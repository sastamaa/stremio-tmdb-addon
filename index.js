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

// Catalog endpoint for movies
app.get('/catalog/movie/tmdb-movies.json', async (req, res) => {
    try {
        // Fetch details for specific movies (e.g., "Star Wars: Episode IV - A New Hope")
        const movieIds = ['11']; // TMDB IDs for the movies you want to include
        const movies = await Promise.all(
            movieIds.map(async (id) => {
                const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`);
                const movieData = response.data;
                return {
                    id: `tmdb-movie-${movieData.id}`,
                    type: 'movie',
                    name: movieData.title,
                    poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                    description: movieData.overview,
                    releaseInfo: movieData.release_date,
                    genres: movieData.genres.map(genre => genre.name)
                };
            })
        );

        // Return only the specified movies in the catalog
        res.json({ metas: movies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// Catalog endpoint for series
app.get('/catalog/series/tmdb-series.json', async (req, res) => {
    try {
        // Fetch details for specific series (e.g., "The Day of the Jackal")
        const seriesIds = ['966']; // TMDB IDs for the series you want to include
        const series = await Promise.all(
            seriesIds.map(async (id) => {
                const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
                const seriesData = response.data;
                return {
                    id: `tmdb-series-${seriesData.id}`,
                    type: 'series',
                    name: seriesData.name,
                    poster: `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`,
                    description: seriesData.overview,
                    releaseInfo: seriesData.first_air_date,
                    genres: seriesData.genres.map(genre => genre.name)
                };
            })
        );

        // Return only the specified series in the catalog
        res.json({ metas: series });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

// Meta endpoint for movies
app.get('/meta/movie/tmdb-movie-:id.json', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch movie details from TMDB
        const movieId = id.split('-')[2]; // Extract TMDB ID from the Stremio ID
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        const movieData = response.data;

        // Construct the meta object for Stremio
        const meta = {
            id: `tmdb-movie-${movieData.id}`,
            type: 'movie',
            name: movieData.title,
            poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
            description: movieData.overview,
            releaseInfo: movieData.release_date,
            genres: movieData.genres.map(genre => genre.name)
        };

        res.json({ meta: meta });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meta data' });
    }
});

// Meta endpoint for series
app.get('/meta/series/tmdb-series-:id.json', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch series details from TMDB
        const seriesId = id.split('-')[2]; // Extract TMDB ID from the Stremio ID
        const response = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_API_KEY}`);
        const seriesData = response.data;

        // Fetch season details
        const seasons = await Promise.all(
            seriesData.seasons.map(async (season) => {
                const seasonResponse = await axios.get(
                    `https://api.themoviedb.org/3/tv/${seriesId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`
                );
                const seasonData = seasonResponse.data;

                return {
                    season: season.season_number,
                    title: season.name,
                    overview: season.overview,
                    poster: `https://image.tmdb.org/t/p/w500${season.poster_path}`,
                    episodes: seasonData.episodes.map(episode => ({
                        id: `tmdb-series-${seriesId}-s${season.season_number}e${episode.episode_number}`,
                        title: episode.name,
                        overview: episode.overview,
                        released: episode.air_date,
                        episode: episode.episode_number
                    }))
                };
            })
        );

        // Construct the meta object for Stremio
        const meta = {
            id: `tmdb-series-${seriesData.id}`,
            type: 'series',
            name: seriesData.name,
            poster: `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`,
            description: seriesData.overview,
            releaseInfo: seriesData.first_air_date,
            genres: seriesData.genres.map(genre => genre.name),
            seasons: seasons
        };

        res.json({ meta: meta });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meta data' });
    }
});

// Stream endpoint for movies
app.get('/stream/movie/974453-absolution.json', (req, res) => {
    const { id } = req.params;

    // Define streaming links for the movie
    const streams = [
        {
            title: 'Example Movie Stream',
            url: 'https://www.cdn.vidce.net/d/2696I8vGmWivvbz4qhGlAQ/1736720419/video/The_Day_Of_The_Jackal/1x01.mp4', // Replace with actual streaming link
            behaviorHints: {
                notWebReady: true, // Set to true if the stream is not directly playable in a browser
            }
        }
    ];

    res.json({ streams: streams });
});

// Stream endpoint for episodes
app.get('/stream/series/222766-the-day-of-the-jackal.json', (req, res) => {
    const { id } = req.params;

    // Extract season and episode number from the ID
    const [seriesId, seasonEpisode] = id.split('-s');
    const [season, episode] = seasonEpisode.split('e');

    // Define streaming links for each episode
    const streams = [];
    if (season === '1' && episode === '1') {
        streams.push({
            title: 'Episode 1',
            url: 'htttp://episode_1.mp4', // Replace with actual streaming link for Episode 1
            behaviorHints: {
                notWebReady: true, // Set to true if the stream is not directly playable in a browser
            }
        });
    } else if (season === '1' && episode === '2') {
        streams.push({
            title: 'Episode 2',
            url: 'htttp://episode_2.mp4', // Replace with actual streaming link for Episode 2
            behaviorHints: {
                notWebReady: true,
            }
        });
    }

    res.json({ streams: streams });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
