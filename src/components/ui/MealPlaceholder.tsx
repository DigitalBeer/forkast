import { cn } from "@/lib/utils";
import { MealTypeIcon } from "./MealTypeIcon";

const gradientClasses: Record<string, string> = {
  Breakfast: "from-meal-breakfast to-meal-breakfast-light",
  Lunch: "from-meal-lunch to-meal-lunch-light",
  Dinner: "from-meal-dinner to-meal-dinner-light",
  Snack: "from-meal-snack to-meal-snack-light",
};

const sizeClasses = {
  sm: "h-16",
  md: "h-32",
  lg: "h-48",
} as const;

const initialsSizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

interface MealPlaceholderProps {
  mealName: string;
  mealType?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MealPlaceholder({
  mealName,
  mealType,
  size = "md",
  className,
}: MealPlaceholderProps) {
  const gradient = mealType
    ? gradientClasses[mealType] || "from-cookbook-warm-gray to-cookbook-warm-gray/70"
    : "from-cookbook-warm-gray to-cookbook-warm-gray/70";

  const initials = mealName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br flex items-center justify-center rounded-lg w-full",
        gradient,
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "font-serif font-bold text-white/90 select-none",
          initialsSizeClasses[size]
        )}
      >
        {initials}
      </span>
      {mealType && (
        <MealTypeIcon
          type={mealType}
          size="sm"
          colored={false}
          className="absolute bottom-1.5 right-1.5 text-white/70"
        />
      )}
    </div>
  );
}
