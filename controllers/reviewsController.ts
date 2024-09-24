import { Request, Response } from "express";
import Release from "../models/release";

export async function createReview(req: Request, res: Response) {
    try {
        const release = await Release.findById(req.params.releaseId);

        if (!release) {
            return res.status(404).send({ message: "Release not found" });
        }

        const newReview = { ...req.body, user: req.currentUser._id };

        release.reviews.push(newReview);

        const updatedRelease = await release.save();

        // Populate the user field of the newly added review
        const populatedRelease = await Release.populate(updatedRelease, {
            path: 'reviews.user',
            select: '_id username'
        });

        // Get the newly added review (it's the last one in the array)
        const addedReview = populatedRelease.reviews[populatedRelease.reviews.length - 1];

        return res.status(201).json(addedReview);
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ message: "Internal server error", error });
    }
}

export async function updateReview(req: Request, res: Response) {
    try {
        const release = await Release.findById(req.params.releaseId);

        if (!release) {
            return res.status(404).send({ message: "Release not found" });
        }

        const review = release.reviews.id(req.params.reviewId);

        if (!review) {
            return res.status(404).send({ message: "Review not found" });
        }

        // Check if the current user is the author of the review
        if (!review.user.equals(req.currentUser._id)) {
            return res.status(401).send({ message: "Unauthorized: you cannot update another user's review" });
        }

        // Update the review with the new data
        review.set(req.body);

        // Save the updated release document, which contains the updated review
        const updatedRelease = await release.save();

        // Return the updated review
        return res.status(200).json(updatedRelease);

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

export async function deleteReview(req: Request, res: Response) {
    try {
        const release = await Release.findById(req.params.releaseId);

        if (!release) {
            return res.status(404).send({ message: "Release not found" });
        }

        const review = release.reviews.id(req.params.reviewId);

        if (!review) {
            return res.status(404).send({ message: "Review not found" });
        }

        if (!review.user.equals(req.currentUser._id)) {
            return res.status(401).send({ message: "Unauthorized: you cannot delete another user's review" });
        }
        
        release.reviews.pull(req.params.reviewId);
       
        const updatedRelease = await release.save();

        return res.status(200).json(updatedRelease);

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}