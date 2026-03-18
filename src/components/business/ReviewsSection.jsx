import ScrollReveal from "@/components/ScrollReveal";
import EmojiReviewPrompt from "@/components/reviews/EmojiReviewPrompt";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";

export default function ReviewsSection({
  businessPage,
  user,
  showReviewForm,
  setShowReviewForm,
  selectedMoodForReview,
  setSelectedMoodForReview,
  theme,
  reviewsRef,
  onReviewSubmitted,
}) {
  return (
    <ScrollReveal delay={0.3}>
      <div id="reviews-section" ref={reviewsRef} className="pt-8 border-t">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
          <EmojiReviewPrompt
            businessName={businessPage.business_name || businessPage.display_title || "העסק"}
            onOpenForm={(mood) => {
              setSelectedMoodForReview(mood);
              setShowReviewForm(true);
            }}
            theme={theme}
          />

          <div className="pt-2">
            {user && showReviewForm && (
              <div className="mb-8 bg-gradient-to-r from-slate-50 to-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-lg">
                <ReviewForm
                  businessPageId={businessPage.id}
                  onSubmit={onReviewSubmitted}
                  onCancel={() => setShowReviewForm(false)}
                  initialMood={selectedMoodForReview}
                />
              </div>
            )}
            <ReviewList businessPageId={businessPage.id} />
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
