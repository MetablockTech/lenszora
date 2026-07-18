import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { reviews as reviewsApi } from "@/lib/api";

interface Review {
  _id: string;
  user: {
    email: string;
  };
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  averageRating: number;
  totalReviews: number;
}

const ProductReviews = ({ productId, averageRating, totalReviews }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  async function loadReviews() {
    try {
      setLoading(true);
      const data = await reviewsApi.getByProduct(productId);
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  const ratingStats = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, percentage };
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "highest-rating") {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-playfair text-xl font-semibold text-foreground gold-underline">
          Customer Reviews
        </h3>
      </div>

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-2 gap-8 p-4 md:p-6 border border-border/50 bg-card"
      >
        {/* Average Rating */}
        <div className="text-left md:text-center md:border-r border-border/30">
          <div className="text-5xl font-playfair font-bold text-primary mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-start md:justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-5 w-5",
                  i < Math.round(averageRating) ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Based on {totalReviews} reviews
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          {ratingStats.map((stat) => (
            <div key={stat.stars} className="flex items-center gap-3">
              <span className="text-sm w-12">{stat.stars} star</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-10">{stat.percentage}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <div className="flex gap-2">
          {["Newest", "Highest Rating"].map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option.toLowerCase().replace(" ", "-"))}
              className={cn(
                "px-3 py-1.5 text-sm border transition-all",
                sortBy === option.toLowerCase().replace(" ", "-")
                  ? "border-primary text-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/50"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-lg">
            <p className="text-muted-foreground">No reviews yet for this product.</p>
          </div>
        ) : (
          sortedReviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 md:p-6 border border-border/50 bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <span className="font-playfair font-bold text-primary">
                      {review.user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {review.user.email.split('@')[0]}
                      </span>
                      {review.isVerified && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>

              <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {review.comment}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
