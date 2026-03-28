const mongoose = require("mongoose");

/**
 * Review Schema: Handles community-generated movie ratings and feedback.
 * Includes moderation features like flagging and reporting for administrative oversight.
 */
const reviewSchema = new mongoose.Schema({
  // links the review to a specific film via the external TMDB database
  movieId: { 
    type: String, 
    required: true 
  }, 
  
  // establishes a one-to-many relationship: One User can have many Reviews
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // denormalized field: stores the name directly to avoid expensive population on list views
  userName: { 
    type: String, 
    required: true 
  },

  // rating constraint: ensures the score stays within the standard 1-10 cinematic scale
  rating: { 
    type: Number, 
    min: 1, 
    max: 10, 
    required: true 
  },

  content: { 
    type: String, 
    required: true 
  },

  // --- MODERATION LOGIC ---
  
  // binary status used by the admin dashboard to filter "safe" vs "problematic" content
  isFlagged: { 
    type: Boolean, 
    default: false 
  },

  // numeric tracker: can be used to auto-flag content once a certain threshold is hit
  reportCount: { 
    type: Number, 
    default: 0 
  }
}, { 
  // provides 'createdAt' for "Recent Reviews" sections and 'updatedAt' for edited content
  timestamps: true 
});

module.exports = mongoose.model("Review", reviewSchema);