import React from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { toggleReviewReaction } from "@/functions/toggleReviewReaction";
import { getMyReviewReaction } from "@/functions/getMyReviewReaction";

export default function ReactionButtons({
  reviewId,
  initialLikes = 0,
  initialDislikes = 0,
  size = "sm",
  className = ""
}) {
  const [likeCount, setLikeCount] = React.useState(initialLikes);
  const [dislikeCount, setDislikeCount] = React.useState(initialDislikes);
  const [myReaction, setMyReaction] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getMyReviewReaction({ review_id: reviewId });
        if (active && data?.success) {
          setMyReaction(data.my_reaction || null);
        }
      } catch {
        // ignore (user not logged in / guest)
      }
    })();
    return () => { active = false; };
  }, [reviewId]);

  const handleClick = async (type) => {
    try {
      setLoading(true);
      const { data, status } = await toggleReviewReaction({ review_id: reviewId, type });
      if (status === 401) {
        alert("נדרש להתחבר כדי להגיב על ביקורת.");
        return;
      }
      if (data?.success) {
        setLikeCount(data.like_count ?? likeCount);
        setDislikeCount(data.dislike_count ?? dislikeCount);
        setMyReaction(data.my_reaction ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  const btnBase = "rounded-full gap-2 px-3";
  const sizes = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <div className={`flex items-center gap-2 ${className}`} dir="rtl">
      <Button
        type="button"
        variant={myReaction === "like" ? "default" : "outline"}
        className={`${btnBase} ${sizes}`}
        disabled={loading}
        onClick={() => handleClick("like")}
        title="אהבתי"
      >
        {loading && myReaction === "like" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
        <span>אהבתי</span>
        <span className="text-xs opacity-80">{likeCount}</span>
      </Button>

      <Button
        type="button"
        variant={myReaction === "dislike" ? "default" : "outline"}
        className={`${btnBase} ${sizes}`}
        disabled={loading}
        onClick={() => handleClick("dislike")}
        title="לא אהבתי"
      >
        {loading && myReaction === "dislike" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
        <span>לא אהבתי</span>
        <span className="text-xs opacity-80">{dislikeCount}</span>
      </Button>
    </div>
  );
}