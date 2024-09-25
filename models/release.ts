import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  text: { type: String, required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  favouriteTrack: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: true });

const releaseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  artist: { type: String, required: true, trim: true },
  year: { 
    type: Number, 
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1 // Allow for upcoming releases
  },
  genre: { type: String, required: true, trim: true },
  trackList: { 
    type: [String], 
    required: true,
    validate: [
      (v: string[]) => Array.isArray(v) && v.length > 0,
      'Track list cannot be empty'
    ]
  },
  releaseType: { 
    type: String, 
    required: true, 
    enum: ['Single', 'Album', 'EP', 'Mixtape'] 
  },
  reviews: [reviewSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

releaseSchema.index({ artist: 1 });

const Release = mongoose.model('Release', releaseSchema);

export default Release;