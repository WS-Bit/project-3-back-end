import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genre: { type: String, required: true },
  image: { type: String, required: true },
  country: { type: String, required: true },
  formedYear: { type: Number, required: true },
  biography: { type: String, required: true },
  releases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Release' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;