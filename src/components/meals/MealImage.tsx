"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { MealPlaceholder } from "@/components/ui/MealPlaceholder";
import { type ReactNode } from "react";

type ImageSize = "thumbnail" | "card" | "full";

const sizeConfig: Record<ImageSize, { containerClass: string }> = {
  thumbnail: { containerClass: "h-32 w-32" },
  card: { containerClass: "h-40 w-full" },
  full: { containerClass: "h-64 w-full md:h-96" },
};

const placeholderSizeMap: Record<ImageSize, "sm" | "md" | "lg"> = {
  thumbnail: "sm",
  card: "md",
  full: "lg",
};

// Height mapping for fallback consistency
const sizeHeightMap: Record<ImageSize, string> = {
  thumbnail: "h-32",
  card: "h-40",
  full: "h-64",
};

export interface MealImageProps {
  /** Image URL. When absent, the fallback is rendered. */
  src?: string;
  /** Alt text for the image. */
  alt: string;
  /** Display size variant. */
  size: ImageSize;
  /** Custom fallback rendered when no src is provided. Defaults to MealPlaceholder. */
  fallback?: ReactNode;
  /** Meal name passed to MealPlaceholder for generating initials. Falls back to alt. */
  mealName?: string;
  /** Meal type passed to MealPlaceholder for gradient color. */
  mealType?: string;
  /** Additional classes for the container. */
  className?: string;
}

export function MealImage({
  src,
  alt,
  size,
  fallback,
  mealName,
  mealType,
  className,
}: MealImageProps) {
  if (!src) {
    return (
      fallback ?? (
        <MealPlaceholder
          mealName={mealName ?? alt}
          mealType={mealType}
          size={placeholderSizeMap[size]}
          className={cn(sizeHeightMap[size], className)}
        />
      )
    );
  }

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        config.containerClass,
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={
          size === "full"
            ? "(max-width: 768px) 100vw, 1200px"
            : size === "card"
              ? "(max-width: 768px) 50vw, 400px"
              : "200px"
        }
        className="object-cover"
      />
    </div>
  );
}