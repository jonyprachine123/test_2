import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "../contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  approved: boolean;
}

const AdminReviews = () => {
  const { isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    
    const savedReviews = localStorage.getItem("reviews");
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, [isAuthenticated, navigate]);

  const handleCreateReview = () => {
    if (!newReview.name || !newReview.comment) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      approved: true,
    };

    const updatedReviews = [...reviews, review];
    setReviews(updatedReviews);
    localStorage.setItem("reviews", JSON.stringify(updatedReviews));
    
    setNewReview({
      name: "",
      rating: 5,
      comment: "",
    });

    toast({
      title: "Review Created",
      description: "The review has been created successfully.",
    });
  };

  const handleApprove = (id: string) => {
    const updatedReviews = reviews.map(review =>
      review.id === id ? { ...review, approved: true } : review
    );
    setReviews(updatedReviews);
    localStorage.setItem("reviews", JSON.stringify(updatedReviews));
    toast({
      title: "Review Approved",
      description: "The review has been approved and will be visible on the website.",
    });
  };

  const handleDelete = (id: string) => {
    const updatedReviews = reviews.filter(review => review.id !== id);
    setReviews(updatedReviews);
    localStorage.setItem("reviews", JSON.stringify(updatedReviews));
    toast({
      title: "Review Deleted",
      description: "The review has been permanently deleted.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Review Management</h1>
          <Button onClick={() => navigate("/admin/dashboard")}>Back to Dashboard</Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-primary mb-4">Create New Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Name</label>
              <Input
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Enter review comment"
              />
            </div>
            <Button onClick={handleCreateReview} className="w-full">
              Create Review
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Existing Reviews</h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-semibold">{review.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span>Rating: {review.rating}/5</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        review.approved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{review.comment}</p>
                </div>
                <div className="space-x-2">
                  {!review.approved && (
                    <Button
                      onClick={() => handleApprove(review.id)}
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100"
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(review.id)}
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-gray-500">No reviews to display</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;