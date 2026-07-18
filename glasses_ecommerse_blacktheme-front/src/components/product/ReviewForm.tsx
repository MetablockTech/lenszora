import { useState } from "react";
import { Star } from "lucide-react";
import { reviews, getToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    productId: string;
    productTitle: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ReviewForm = ({ productId, productTitle, onSuccess, onCancel }: ReviewFormProps) => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) {
            toast({
                title: "Error",
                description: "You must be logged in to submit a review.",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);
            await reviews.submit({ productId, rating, title, comment }, token);
            toast({
                title: "Review Submitted",
                description: "Thank you for your feedback!",
            });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit review",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 border border-border/50 rounded-lg">
            <h3 className="font-playfair text-xl font-bold text-foreground mb-4">
                Review {productTitle}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Rating
                    </label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        (hoveredRating || rating) >= star
                                            ? "fill-primary text-primary"
                                            : "text-muted-foreground"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Review Title
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summarize your experience"
                        className="w-full bg-secondary border border-border/50 rounded-md px-4 py-2 focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Your Review
                    </label>
                    <textarea
                        required
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you like or dislike?"
                        className="w-full bg-secondary border border-border/50 rounded-md px-4 py-2 focus:border-primary focus:outline-none resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-gold py-2 disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit Review"}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-border/50 hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
