import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StarRating from '../common/StarRating';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: Date;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  userHasMarkedHelpful?: boolean;
}

interface RatingSummary {
  average: number;
  totalCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductReviewsProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  rating,
  reviewCount,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: rating,
    totalCount: reviewCount,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest' | 'mostHelpful'>('newest');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasUserPurchased, setHasUserPurchased] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  // Pagination settings
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await api.get(`/products/${productId}/reviews`);
        
        // For now, simulate API call with timeout
        setTimeout(() => {
          // Generate mock reviews
          const mockReviews: Review[] = [
            {
              id: '1',
              userId: 'user1',
              userName: 'John D.',
              userAvatar: 'https://via.placeholder.com/40',
              rating: 5,
              title: 'Absolutely love these headphones!',
              comment: 'These are the best headphones I\'ve ever owned. The sound quality is incredible, and the noise cancellation works perfectly. Battery life is amazing too - I can go days without charging.',
              date: new Date(2023, 11, 15),
              helpfulCount: 18,
              isVerifiedPurchase: true,
            },
            {
              id: '2',
              userId: 'user2',
              userName: 'Sarah T.',
              userAvatar: 'https://via.placeholder.com/40',
              rating: 4,
              title: 'Great product, minor comfort issues',
              comment: 'The sound quality is fantastic and I love the features. My only complaint is that they get a bit uncomfortable after wearing them for more than 2 hours. Otherwise, they\'re nearly perfect.',
              date: new Date(2023, 10, 28),
              helpfulCount: 7,
              isVerifiedPurchase: true,
            },
            {
              id: '3',
              userId: 'user3',
              userName: 'Mark R.',
              rating: 3,
              title: 'Good, but not great',
              comment: 'Sound quality is decent, but I expected more at this price point. The noise cancellation is just average compared to competitors. Battery life is good though.',
              date: new Date(2023, 9, 10),
              helpfulCount: 12,
              isVerifiedPurchase: true,
            },
            {
              id: '4',
              userId: 'user4',
              userName: 'Emily J.',
              userAvatar: 'https://via.placeholder.com/40',
              rating: 5,
              title: 'Perfect for travel!',
              comment: 'I bought these specifically for long flights, and they\'ve been a game-changer. The noise cancellation blocks out almost all airplane noise, and the battery lasts for multiple long-haul flights.',
              date: new Date(2023, 8, 15),
              helpfulCount: 21,
              isVerifiedPurchase: true,
            },
            {
              id: '5',
              userId: 'user5',
              userName: 'David W.',
              rating: 2,
              title: 'Disappointed with build quality',
              comment: "While the sound is good, the build quality feels cheap. The plastic creaks and I'm worried about durability. For this price, I expected better construction.",
              date: new Date(2023, 7, 22),
              helpfulCount: 9,
              isVerifiedPurchase: false,
            },
            {
              id: '6',
              userId: 'user6',
              userName: 'Laura M.',
              userAvatar: 'https://via.placeholder.com/40',
              rating: 5,
              title: 'Worth every penny',
              comment: "I debated for months before making this purchase, and I'm so glad I did. The sound quality is exceptional, they're comfortable for all-day wear, and the battery lasts forever. Highly recommended!",
              date: new Date(2023, 6, 5),
              helpfulCount: 15,
              isVerifiedPurchase: true,
            },
            {
              id: '7',
              userId: 'user7',
              userName: 'Michael K.',
              rating: 4,
              title: 'Great headphones with minor software issues',
              comment: "The hardware is fantastic, but the companion app occasionally crashes or fails to connect. Updates have been improving it though, so I'm optimistic.",
              date: new Date(2023, 5, 18),
              helpfulCount: 6,
              isVerifiedPurchase: true,
            }
          ];
          
          // Calculate distribution
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          mockReviews.forEach(review => {
            // Increment the corresponding rating count
            distribution[review.rating as keyof typeof distribution]++;
          });
          
          // Check if the user has purchased or reviewed this product
          const userHasPurchased = isAuthenticated && Math.random() > 0.3;
          const userHasReviewed = mockReviews.some(
            review => user && review.userId === user.id
          );
          
          setReviews(mockReviews);
          setRatingSummary({
            average: rating,
            totalCount: mockReviews.length,
            distribution,
          });
          setHasUserPurchased(userHasPurchased);
          setHasUserReviewed(userHasReviewed);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, isAuthenticated, user, rating]);

  // Filter reviews by rating
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sort]);

  const handleRatingFilter = (rating: number | null) => {
    setFilter(rating);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as any);
  };

  const handleReviewFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserReview(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (newRating: number) => {
    setUserReview(prev => ({ ...prev, rating: newRating }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.info('Please log in to submit a review');
      navigate('/login');
      return;
    }
    
    if (!hasUserPurchased) {
      toast.info('Only verified buyers can leave reviews');
      return;
    }
    
    if (userReview.title.trim() === '' || userReview.comment.trim() === '') {
      toast.error('Please fill out all fields');
      return;
    }
    
    try {
      setSubmittingReview(true);
      
      // In a real app, this would be an API call
      // await api.post(`/products/${productId}/reviews`, userReview);
      
      // Simulate API call with timeout
      setTimeout(() => {
        // Create a new mock review
        const newReview: Review = {
          id: `new-${Date.now()}`,
          userId: user?.id || 'current-user',
          userName: user?.name || 'You',
          userAvatar: user?.avatarUrl,
          rating: userReview.rating,
          title: userReview.title,
          comment: userReview.comment,
          date: new Date(),
          helpfulCount: 0,
          isVerifiedPurchase: true,
        };
        
        // Add the new review to the list
        setReviews(prev => [newReview, ...prev]);
        
        // Update the rating summary
        setRatingSummary(prev => {
          const newDistribution = { ...prev.distribution };
          newDistribution[userReview.rating as keyof typeof newDistribution]++;
          
          const newTotalCount = prev.totalCount + 1;
          const newAverage = ((prev.average * prev.totalCount) + userReview.rating) / newTotalCount;
          
          return {
            average: newAverage,
            totalCount: newTotalCount,
            distribution: newDistribution,
          };
        });
        
        // Reset the form and hide it
        setUserReview({ rating: 5, title: '', comment: '' });
        setShowReviewForm(false);
        setHasUserReviewed(true);
        setSubmittingReview(false);
        
        toast.success('Thank you for your review!');
      }, 1000);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review. Please try again.');
      setSubmittingReview(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.info('Please log in to mark reviews as helpful');
      navigate('/login');
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // await api.post(`/reviews/${reviewId}/helpful`);
      
      // For now, update the state directly
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpfulCount: review.helpfulCount + 1,
                userHasMarkedHelpful: true,
              } 
            : review
        )
      );
    } catch (err) {
      console.error('Error marking review as helpful:', err);
      toast.error('Failed to mark as helpful. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Calculate percentage for rating bars
  const calculatePercentage = (count: number) => {
    return ratingSummary.totalCount > 0
      ? Math.round((count / ratingSummary.totalCount) * 100)
      : 0;
  };

  return (
    <div className="space-y-8">
      {/* Review Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center md:border-r md:border-gray-200 md:pr-8">
          <span className="text-5xl font-bold text-gray-900 mb-2">
            {ratingSummary.average.toFixed(1)}
          </span>
          <StarRating rating={ratingSummary.average} size="large" />
          <span className="text-sm text-gray-500 mt-2">
            {ratingSummary.totalCount} {ratingSummary.totalCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        
        {/* Rating Distribution */}
        <div className="md:col-span-2 space-y-3">
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className="flex items-center space-x-2">
              <button
                onClick={() => handleRatingFilter(filter === stars ? null : stars)}
                className={`text-sm w-16 hover:underline ${filter === stars ? 'font-bold' : ''}`}
              >
                {stars} {stars === 1 ? 'star' : 'stars'}
              </button>
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full" 
                  style={{ width: `${calculatePercentage(ratingSummary.distribution[stars as keyof typeof ratingSummary.distribution])}%` }} 
                />
              </div>
              <span className="text-sm text-gray-500 w-12 text-right">
                {ratingSummary.distribution[stars as keyof typeof ratingSummary.distribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Review Form Section */}
      {!hasUserReviewed && (
        <div className="border-t border-b border-gray-200 py-6">
          {showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="text-yellow-400 focus:outline-none"
                    >
                      <svg 
                        className="w-8 h-8" 
                        fill={userReview.rating >= star ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Review Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={userReview.title}
                  onChange={handleReviewFormChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Review Details
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={userReview.comment}
                  onChange={handleReviewFormChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What did you like or dislike about this product?"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={submittingReview || !hasUserPurchased}
                  loading={submittingReview}
                >
                  Submit Review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
              
              {!hasUserPurchased && (
                <p className="text-sm text-red-600 mt-2">
                  Only verified buyers can leave reviews. Purchase this product to leave a review.
                </p>
              )}
            </form>
          ) : (
            <div className="flex flex-col items-center py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Share your experience with this product
              </h3>
              <Button
                onClick={() => setShowReviewForm(true)}
                disabled={!isAuthenticated || !hasUserPurchased}
              >
                Write a Review
              </Button>
              {!isAuthenticated && (
                <p className="text-sm text-gray-500 mt-2">
                  Please <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">log in</button> to write a review
                </p>
              )}
              {isAuthenticated && !hasUserPurchased && (
                <p className="text-sm text-gray-500 mt-2">
                  Only verified buyers can leave reviews
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Filters and Sorting Section */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === null ? 'primary' : 'outline'}
              size="small"
              onClick={() => handleRatingFilter(null)}
            >
              All
            </Button>
            {[5, 4, 3, 2, 1].map(stars => (
              <Button
                key={stars}
                variant={filter === stars ? 'primary' : 'outline'}
                size="small"
                onClick={() => handleRatingFilter(stars)}
              >
                {stars} {stars === 1 ? 'Star' : 'Stars'}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="sort-reviews" className="text-sm text-gray-600">
              Sort by:
            </label>
            <select
              id="sort-reviews"
              value={sort}
              onChange={handleSortChange}
              className="p-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="mostHelpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-8">
          {currentReviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-8">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {review.userAvatar ? (
                    <img 
                      src={review.userAvatar} 
                      alt={review.userName} 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{review.userName}</h4>
                    <div className="flex items-center text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {review.isVerifiedPurchase && (
                        <span className="ml-2 text-green-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} size="small" showLabel={false} />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{review.title}</h3>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              <div className="flex items-center">
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={review.userHasMarkedHelpful}
                  className={`flex items-center text-sm ${
                    review.userHasMarkedHelpful 
                      ? 'text-gray-400 cursor-default' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Helpful ({review.helpfulCount})
                </button>
                {review.userHasMarkedHelpful && (
                  <span className="text-xs text-gray-500 ml-2">
                    You marked this as helpful
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share your experience with this product</p>
          <Button
            onClick={() => setShowReviewForm(true)}
            disabled={!isAuthenticated || !hasUserPurchased}
          >
            Write a Review
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
