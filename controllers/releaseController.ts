import Release from '../models/release';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import formatValidationError from '../errors/validation';

//! Get all releases
export const indexReleases = async (req: Request, res: Response) => {
  try {
    const releases = await Release.find().populate('user', '_id username').populate('artist');
    console.log('Obtained these from db:', releases);
    res.status(200).json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//! Get release by ID
export const getReleaseById = async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.releaseId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const release = await Release.findById(req.params.releaseId)
      .populate('artist')
      .populate('user', '_id username')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: '_id username'
        }
      });

    if (!release) {
      return res.status(404).json({ message: 'Release not found' });
    }

    console.log('Fetched release:', release);
    res.status(200).json(release);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

import Artist from '../models/artist';

export const postRelease = async (req: Request, res: Response) => {
  console.log('Post request from user', req.currentUser);

  try {
    req.body.user = req.currentUser._id;
    const newRelease = req.body;

    console.log('USER HAS SENT US:', newRelease);

    // Handle trackList
    if (typeof newRelease.trackList === 'string') {
      newRelease.trackList = newRelease.trackList.split(';').map((track: string) => track.trim());
    } else if (!Array.isArray(newRelease.trackList)) {
      return res.status(400).json({ message: 'trackList must be an array of strings or a semicolon-separated string' });
    }

    const validationErrors = formatValidationError(newRelease);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const savedRelease = await Release.create(newRelease);
    console.log('JUST ADDED:', savedRelease);

    // Update the artist's releases array
    if (savedRelease.artist) {
      await Artist.findByIdAndUpdate(
        savedRelease.artist,
        { $push: { releases: savedRelease._id } },
        { new: true, useFindAndModify: false }
      );
    }

    res.status(201).json(savedRelease);
  } catch (error) {
    console.error('Error posting a release:', error);
    res.status(500).json({ message: 'Internal server error, did you enter the required info?' });
  }
};

export const updateRelease = async (req: Request, res: Response) => {
  console.log('Update request from user', req.currentUser);
  const { releaseId } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(releaseId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const existingRelease = await Release.findById(releaseId);
    if (!existingRelease) {
      return res.status(404).json({ message: 'Release not found' });
    }

    if (!req.currentUser || !req.currentUser._id.equals(existingRelease.user)) {
      return res.status(403).json({ message: 'Not authorized to update this release' });
    }

    const allowedUpdates: {
      title?: string;
      artist?: string;
      year?: number;
      genre?: string;
      releaseType?: 'Single' | 'Album' | 'EP' | 'Mixtape';
      image?: string;
      trackList?: string[] | string;
    } = {
      title: updateData.title,
      artist: updateData.artist,
      year: updateData.year,
      genre: updateData.genre,
      releaseType: updateData.releaseType,
      image: updateData.image,
      trackList: updateData.trackList
    };

    // Handle trackList update
    if (allowedUpdates.trackList !== undefined) {
      if (typeof allowedUpdates.trackList === 'string') {
        allowedUpdates.trackList = allowedUpdates.trackList.split(';').map((track: string) => track.trim());
      } else if (Array.isArray(allowedUpdates.trackList)) {
        allowedUpdates.trackList = allowedUpdates.trackList.map((track: string) => track.trim());
      } else {
        return res.status(400).json({ message: 'trackList must be an array of strings or a semicolon-separated string' });
      }
    }

    const validationErrors = formatValidationError(allowedUpdates);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const updatedRelease = await Release.findByIdAndUpdate(releaseId, allowedUpdates, { new: true, runValidators: true });

    res.status(200).json(updatedRelease);
  } catch (error) {
    console.error('Error updating release:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//! Delete release

export const deleteRelease = async (req: Request, res: Response) => {
  console.log('Delete request from user', req.currentUser);

  const { releaseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(releaseId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const releaseDoc = await Release.findById(releaseId);
    if (!releaseDoc) {
      return res.status(404).json({ message: "The release you're trying to delete is not found." });
    }

    const releaseOwner = releaseDoc.user;
    console.log('The release you\'re trying to delete is owned by:', releaseOwner);

    if (!req.currentUser || !req.currentUser._id.equals(releaseOwner)) {
      return res.status(403).json({ message: 'You are not authorized to delete this release.' });
    }

    // Remove the release from the artist's releases array
    if (releaseDoc.artist) {
      await Artist.findByIdAndUpdate(
        releaseDoc.artist,
        { $pull: { releases: releaseId } },
        { new: true, useFindAndModify: false }
      );
    }

    const deletedRelease = await Release.findByIdAndDelete(releaseId);
    if (!deletedRelease) {
      return res.status(404).json({ message: 'Release not found' });
    }

    res.status(200).json({ message: 'Release successfully deleted', release: deletedRelease });
  } catch (error) {
    console.error('Error deleting release:', error);
    res.status(500).json({ message: 'An error occurred while deleting the release' });
  }
};