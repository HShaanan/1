import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { createBusinessUrl } from "@/utils";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f3f4f6'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

function getKashrutLabel(business, kashrutData) {
  if (!kashrutData?.length || !business.kashrut_authority) return null;
  const match = kashrutData.find(
    (k) =>
      k.id === business.kashrut_authority ||
      k.name === business.kashrut_authority
  );
  return match ? match.name || match.label || null : null;
}

function getCategoryName(business, categories) {
  if (!categories?.length) return null;
  const match = categories.find(
    (c) => c.id === business.category_id || c.id === business.category
  );
  return match?.name || null;
}

function renderStars(rating) {
  if (!rating && rating !== 0) return null;
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.floor(rounded);
        const half = !filled && i + 0.5 <= rounded;
        return (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              filled
                ? "fill-amber-400 text-amber-400"
                : half
                ? "fill-amber-400/50 text-amber-400"
                : "fill-none text-gray-300"
            }`}
          />
        );
      })}
      <span className="text-xs text-gray-500 mr-1">
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

export default function BusinessCard({
  business,
  variant = "business",
  categories = [],
  kashrutData = [],
}) {
  const imageSrc =
    business.preview_image || business.images?.[0] || PLACEHOLDER_IMAGE;
  const kashrutMatch = getKashrutLabel(business, kashrutData);
  const categoryName = getCategoryName(business, categories);
  const isOpen = business.is_open;
  const url = createBusinessUrl(business.url_slug || business.id);

  return (
    <Link
      to={url}
      dir="rtl"
      className="group block rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={business.name || ""}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top badges row */}
        <div className="absolute top-2 right-2 flex flex-wrap gap-1.5">
          {business.is_promoted && (
            <Badge className="bg-gradient-to-l from-amber-400 to-yellow-500 text-white border-0 text-[11px] font-semibold shadow-sm px-2 py-0.5">
              <span className="ml-1">&#10024;</span>
              מקודם
            </Badge>
          )}
          {kashrutMatch && (
            <Badge className="bg-emerald-500 text-white border-0 text-[11px] font-semibold shadow-sm px-2 py-0.5">
              כשר
            </Badge>
          )}
        </div>

        {/* Name overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-2.5 pt-8">
          <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow-sm">
            {business.name}
          </h3>
        </div>
      </div>

      {/* Info area below image */}
      <div className="p-3 space-y-1.5">
        {/* Professional variant: title */}
        {variant === "professional" && business.professional_title && (
          <p className="text-sm text-gray-600 font-medium leading-snug">
            {business.professional_title}
          </p>
        )}

        {/* Category */}
        {categoryName && (
          <p className="text-xs text-gray-500 font-medium">{categoryName}</p>
        )}

        {/* Location */}
        {(business.city || business.address) && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {business.city}
              {business.city && business.address ? ", " : ""}
              {business.address}
            </span>
          </div>
        )}

        {/* Rating */}
        {business.rating != null && renderStars(business.rating)}

        {/* Professional specialties */}
        {variant === "professional" &&
          business.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {business.specialties.slice(0, 3).map((spec, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 font-normal"
                >
                  {spec}
                </Badge>
              ))}
              {business.specialties.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{business.specialties.length - 3}
                </span>
              )}
            </div>
          )}

        {/* Open / closed status */}
        {typeof isOpen === "boolean" && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isOpen ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="text-[11px] text-gray-500">
              {isOpen ? "פתוח" : "סגור"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
