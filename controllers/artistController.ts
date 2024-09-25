import Artist from '../models/artist';
import Release from '../models/release';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import formatValidationError from '../errors/validation';

// Get all artists
export const indexArtists = async (req: Request, res: Response) => {
  try {
    const artists = await Artist.find().populate('releases');
    res.status(200).json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get artist by ID
export const getArtistById = async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.artistId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const artist = await Artist.findById(req.params.artistId)
      .populate('releases')
      .populate('user', 'username');

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    console.log('Fetched artist:', artist);
    res.status(200).json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createArtist = async (req: Request, res: Response) => {
  try {
    const { name, genre, image, country, formedYear, biography, releases } = req.body;
    const userId = req.currentUser._id;

    // Create the artist
    const newArtist = new Artist({
      name,
      genre,
      image,
      country,
      formedYear,
      biography,
      user: userId
    });

    // If releases are provided, validate and add them
    if (releases) {
      const releaseIds = releases.split(',').map((id: string) => id.trim());
      const validReleases = await Release.find({ _id: { $in: releaseIds } });
      newArtist.releases = validReleases.map(release => release._id);
    }

    await newArtist.save();

    // Update the releases to point to this artist
    if (newArtist.releases && newArtist.releases.length > 0) {
      await Release.updateMany(
        { _id: { $in: newArtist.releases } },
        { $set: { artist: newArtist._id } }
      );
    }

    res.status(201).json(newArtist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateArtist = async (req: Request, res: Response) => {
  console.log("Update request from user", req.currentUser);

  if (!mongoose.Types.ObjectId.isValid(req.params.artistId)) {
    return res.status(400).json({ message: 'Invalid artist ID format' });
  }

  try {
    const artist = await Artist.findById(req.params.artistId).populate('user', 'username');
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const artistOwner = artist.user._id;
    console.log('The artist you\'re trying to update is owned by:', artistOwner);

    if (!req.currentUser || !req.currentUser._id.equals(artistOwner)) {
      return res.status(403).json({ message: 'You are not authorized to update this artist.' });
    }

    console.log('USER HAS EDITED:', artist, 'WITH:', req.body);

    // Only update allowed fields
    const allowedUpdates = ['name', 'genre', 'country', 'formedYear', 'biography', 'image'] as const;
    type AllowedUpdateKeys = typeof allowedUpdates[number];

    const updates = allowedUpdates.reduce<Partial<Pick<typeof artist, AllowedUpdateKeys>>>((obj, key) => {
      if (key in req.body) {
        obj[key] = req.body[key];
      }
      return obj;
    }, {});

    Object.assign(artist, updates);
    const updatedArtist = await artist.save();

    // Populate the user field in the response
    await updatedArtist.populate('user', 'username');

    res.status(200).json(updatedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const formattedErrors = formatValidationError(error);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: formattedErrors 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
    });
  }
};

// Delete an artist
export const deleteArtist = async (req: Request, res: Response) => {
  console.log('Delete request from user', req.currentUser);

  const { artistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const artistDoc = await Artist.findById(artistId);
    if (!artistDoc) {
      return res.status(404).json({ message: "The artist you're trying to delete is not found." });
    }

    const artistOwner = artistDoc.user;
    console.log('The artist you\'re trying to delete is owned by:', artistOwner);

    if (!req.currentUser || !artistOwner.equals(req.currentUser._id)) {
      return res.status(403).json({ message: 'You are not authorized to delete this artist.' });
    }

    await Release.updateMany(
      { artist: artistId },
      { $unset: { artist: "" } }
    );

    const deletedArtist = await Artist.findByIdAndDelete(artistId);
    if (!deletedArtist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    res.status(200).json({ message: 'Artist successfully deleted', artist: deletedArtist });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ message: 'An error occurred while deleting the artist' });
  }
};