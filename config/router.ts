import express from 'express';
import { 
  indexReleases, 
  getReleaseById, 
  postRelease, 
  updateRelease, 
  deleteRelease,
} from '../controllers/releaseController';
import { 
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewsController';
import { 
  indexArtists, 
  getArtistById, 
  createArtist, 
  updateArtist, 
  deleteArtist 
} from '../controllers/artistController';
import { 
  signUp, 
  login, 
  getCurrentUser, 
  getUserProfile,
  getUserUploads,
  getUserFavourites,
  addToFavourites,
  removeFromFavourites,
  forgotPassword,
  resetPassword,
  confirmEmail,
} from '../controllers/userController';
import secureRoute from '../middleware/secureRoute';
import sanitizeRoute from '../middleware/sanitizeRoute';

const router = express.Router();

// User routes
router.post('/signup', signUp); 
router.get('/confirm-email/:token', confirmEmail);
router.post('/login', login); 
router.post('/forgot-password', forgotPassword)
router.put('/reset-password/:resetToken', resetPassword )
router.get('/user', secureRoute, getCurrentUser); 
router.get('/user/:userId/profile', secureRoute, getUserProfile);
router.get('/user/:userId/uploads', secureRoute, getUserUploads);
router.get('/user/:userId/favourites', secureRoute, getUserFavourites);
router.post('/user/:userId/favourites/:releaseId', secureRoute, addToFavourites);
router.delete('/user/:userId/favourites/:releaseId', secureRoute, removeFromFavourites);


// Release routes
router.route('/releases')
  .get(indexReleases)
  .post(sanitizeRoute, secureRoute, postRelease);

router.route('/releases/:releaseId')
  .get(getReleaseById)
  .put(sanitizeRoute, secureRoute, updateRelease)
  .delete(sanitizeRoute, secureRoute, deleteRelease);

// Artist routes
router.route('/artists')
  .get(indexArtists)
  .post(sanitizeRoute, secureRoute, createArtist);

router.route('/artists/:artistId')
  .get(getArtistById)
  .put(sanitizeRoute, secureRoute, updateArtist)
  .delete(sanitizeRoute, secureRoute, deleteArtist);

// Review routes (as part of releases)
router.route('/releases/:releaseId/reviews')
  .post(sanitizeRoute, secureRoute, createReview);

router.route('/releases/:releaseId/reviews/:reviewId')
  .put(sanitizeRoute, secureRoute, updateReview)
  .delete(sanitizeRoute, secureRoute, deleteReview);
 

export default router;