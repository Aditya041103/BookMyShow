import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";
import Playing from "../models/Playing.js";
import Credit from "../models/Credit.js";

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
    try {
        const data = await Playing.find({}).sort({ createdAt: -1 }).limit(20);
        console.log(data);
        const movies = data;
        res.json({ success: true, movies: movies })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

// API to add a new show to the database
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body

        let movie = await Movie.findById(movieId)

        if (!movie) {
            // Fetch movie details and credits from TMDB API
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                Playing.findOne({ id: movieId }),  // your "movies" collection
                Credit.findOne({ id: movieId })   // your "credits" collection
            ]);

            const movieApiData = movieDetailsResponse;
            const movieCreditsData = movieCreditsResponse;

            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }

            // Add movie to the database
            movie = await Movie.create(movieDetails);
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time) => {
                const dateTimeString = `${showDate}T${time}`;
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {}
                })
            })
        });

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        //  Trigger Inngest event
        await inngest.send({
            name: "app/show.added",
            data: { movieTitle: movie.title }
        })

        res.json({ success: true, message: 'Show Added successfully.' })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

// API to get all shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });

        // filter unique shows
        const uniqueShows = new Set(shows.map(show => show.movie))

        res.json({ success: true, shows: Array.from(uniqueShows) })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        // get all upcoming shows for the movie
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if (!dateTime[date]) {
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({ success: true, movie, dateTime })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a show by TMDB ID for recommendations
export const getShowByTmdbId = async (req, res) => {
    try {
        const { tmdbId } = req.params;

        // Find the movie in Playing collection by TMDB ID
        const playingMovie = await Playing.findOne({ id: parseInt(tmdbId) });
        if (!playingMovie) {
            return res.json({ success: false, message: "Movie not found in playing collection" });
        }

        // Check if there's a corresponding show for this movie
        const movie = await Movie.findById(playingMovie.id);
        if (movie) {
            // If there's a show, return the full movie object
            return res.json({ success: true, show: { movie } });
        } else {
            // If no show exists, create a minimal movie object from Playing data
            const movieData = {
                _id: playingMovie.id,
                title: playingMovie.title,
                overview: playingMovie.overview,
                poster_path: playingMovie.poster_path,
                backdrop_path: playingMovie.backdrop_path,
                genres: playingMovie.genres,
                release_date: playingMovie.release_date,
                vote_average: playingMovie.vote_average,
                runtime: playingMovie.runtime,
                id: playingMovie.id
            };
            return res.json({ success: true, show: { movie: movieData } });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}