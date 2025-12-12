import React, { useState, useEffect, useCallback } from "react";
import { Favorite } from "@/entities/Favorite";
import { BusinessPage } from "@/entities/BusinessPage";
import { User } from "@/entities/User";
import ListingGrid from "@/components/explore/ListingGrid";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { Category } from "@/entities/Category";
import BannerCarousel from "@/components/banners/BannerCarousel";

export default function FavoritesPage() {
  const [favoritePages, setFavoritePages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFavorites = useCallback(async (currentUser) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 1. קבל את כל המועדפים של המשתמש
      const favs = await Favorite.filter({ user_email: currentUser.email });
      const businessPageIds = favs.map((f) => f.business_page_id);

      if (businessPageIds.length > 0) {
        // 2. קבל את כל עמודי העסק המתאימים
        const pages = await BusinessPage.filter({
          id: { "$in": businessPageIds },
          is_active: true,
          approval_status: 'approved'
        });
        setFavoritePages(pages);
      } else {
        setFavoritePages([]);
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("אירעה שגיאה בטעינת המועדפים.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [currentUser, cats] = await Promise.all([
        User.me().catch(() => null),
        Category.list()
      ]);

      setUser(currentUser);
      setCategories(cats);

      if (currentUser) {
        await loadFavorites(currentUser);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error on initial load:", err);
      setError("אירעה שגיאה בטעינת העמוד.");
      setLoading(false);
    }
  }, [loadFavorites]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16" dir="rtl">
        <h2 className="text-2xl font-bold mb-2">עמוד המועדפים</h2>
        <p className="text-slate-600 mb-4">עליך להתחבר כדי לראות את העסקים ששמרת.</p>
        <Button onClick={() => User.loginWithRedirect(window.location.href)}>
          התחברות
        </Button>
      </div>
    );
  }
  
  if (error) {
      return <div className="text-center py-16 text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
                <Heart className="w-8 h-8 text-red-500" />
                העסקים שאהבתי
            </h1>
        </div>

        {favoritePages.length > 0 ? (
          <div className="space-y-8">
            <ListingGrid 
                listings={favoritePages} 
                loading={loading}
                categories={categories}
            />
            <div className="my-8">
               <BannerCarousel placement="favorites_interstitial" size="wide" />
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed">
            <Heart className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">עדיין אין לך מועדפים</h3>
            <p className="mt-2 text-base text-slate-500">
              שמור עסקים שאהבת כדי למצוא אותם כאן מאוחר יותר.
            </p>
            <Link to={createPageUrl("Browse")}>
              <Button className="mt-6">
                חזרה לעמוד הבית
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}