import mongoose from "mongoose";

const playingSchema = new mongoose.Schema({
  adult: { type: Boolean, required: true },
  backdrop_path: { type: String },
  belongs_to_collection: { type: mongoose.Schema.Types.Mixed, default: null },

  budget: { type: Number, required: true },

  genres: [{
    id: { type: Number },
    name: { type: String }
  }],

  homepage: { type: String },
  id: { type: Number, required: true }, // Original TMDb ID
  imdb_id: { type: String },

  origin_country: [{ type: String }],
  original_language: { type: String },
  original_title: { type: String },
  overview: { type: String },

  popularity: { type: Number },
  poster_path: { type: String },

  production_companies: [{
    id: { type: Number },
    logo_path: { type: String },
    name: { type: String },
    origin_country: { type: String }
  }],

  production_countries: [{
    iso_3166_1: { type: String },
    name: { type: String }
  }],

  release_date: { type: String }, // Consider using Date if stored as ISO
  revenue: { type: Number },
  runtime: { type: Number },

  spoken_languages: [{
    english_name: { type: String },
    iso_639_1: { type: String },
    name: { type: String }
  }],

  status: { type: String },
  tagline: { type: String },
  title: { type: String },
  video: { type: Boolean },
  vote_average: { type: Number },
  vote_count: { type: Number }
}, { timestamps: true });

const Playing = mongoose.model("Playing", playingSchema);

export default Playing;
