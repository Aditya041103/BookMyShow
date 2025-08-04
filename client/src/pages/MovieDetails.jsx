import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
  } = useAppContext();

  const getShow = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [id, axios]);

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRecommendations = useCallback(
    async (tmdbId) => {
      setLoadingRecommendations(true);

      try {
        // Try to get AI recommendations first
        const response = await fetch(
          `${import.meta.env.VITE_MODEL_BASE_URL}/recommend-by-id`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tmdb_id: tmdbId.toString() }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("API response data: ", data);

          if (data.success && data.recommendations?.length > 0) {
            // Get show details for each recommendation
            const recommendedShows = [];

            for (const rec of data.recommendations) {
              try {
                const showResponse = await axios.get(
                  `/api/show/by-tmdb/${rec.tmdb_id}`
                );
                if (showResponse.data.success) {
                  recommendedShows.push(showResponse.data.show);
                }
              } catch (error) {
                console.log(`Failed to fetch show ${rec.tmdb_id}:`, error);
              }
            }

            if (recommendedShows.length > 0) {
              setRecommendations(recommendedShows);
              setLoadingRecommendations(false);
              return;
            }
          }
        }
      } catch (error) {
        console.log("Recommendation service unavailable:", error);
      }

      // Fallback to random shows
      setRecommendations(shows.filter((show) => show._id !== id).slice(0, 4));
      setLoadingRecommendations(false);
    },
    [axios, shows, id]
  );

  useEffect(() => {
    getShow();
  }, [getShow]);

  // Fetch recommendations when show data is loaded
  useEffect(() => {
    fetchRecommendations(id);
  }, [show]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={image_base_url + show.movie.poster_path}
          alt=""
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>

          <p>
            {timeFormat(show.movie.runtime)} •{" "}
            {show.movie.genres.map((genre) => genre.name).join(", ")} •{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies.find((movie) => movie._id === id)
                    ? "fill-primary text-primary"
                    : ""
                } `}
              />
            </button>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <img
                src={image_base_url + cast.profile_path}
                alt=""
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      <DateSelect dateTime={show.dateTime} id={id} />

      <p className="text-lg font-medium mt-20 mb-8">
        You May Also Like
        {recommendations.length > 0 && !loadingRecommendations && (
          <span className="text-sm text-gray-400 ml-2">
            (Based on movie recommendations)
          </span>
        )}
      </p>
      {loadingRecommendations ? (
        <div className="flex justify-center py-8">
          <Loading />
          <span className="ml-3 text-gray-400">Finding similar movies...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {recommendations.map((movie, index) => (
            <MovieCard
              key={movie._id || movie.movie?._id || index}
              movie={movie.movie || movie}
            />
          ))}
        </div>
      ) : null}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
