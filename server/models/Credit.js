import mongoose from 'mongoose'

const CastSchema = new mongoose.Schema({
    adult: Boolean,
    gender: Number,
    id: Number,
    known_for_department: String,
    name: String,
    original_name: String,
    popularity: Number,
    profile_path: String,
    cast_id: Number,
    character: String,
    credit_id: String,
    order: Number
}, { _id: false });

const CrewSchema = new mongoose.Schema({
    adult: Boolean,
    gender: Number,
    id: Number,
    known_for_department: String,
    name: String,
    original_name: String,
    popularity: Number,
    profile_path: String,
    credit_id: String,
    department: String,
    job: String
}, { _id: false });

const CreditSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // TMDB movie ID
    cast: [CastSchema],
    crew: [CrewSchema]
}, {
    timestamps: true
});

const Credit = mongoose.model('Credit', CreditSchema);
export default Credit;
