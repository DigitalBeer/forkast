import { Coffee, UtensilsCrossed, Moon, Cookie, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

const mealTypeConfig = {
  Breakfast: {
    icon: Coffee,
    label: "Breakfast",
    colorClass: "text-meal-breakfast",
  },
  Lunch: {
    icon: UtensilsCrossed,
    label: "Lunch",
    colorClass: "text-meal-lunch",
  },
  Dinner: {
    icon: Moon,
    label: "Dinner",
    colorClass: "text-meal-dinner",
  },
  Snack: {
    icon: Cookie,
    label: "Snack",
    colorClass: "text-meal-snack",
  },
} as const;

type MealTypeKey = keyof typeof mealTypeConfig;

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
} as const;

interface MealTypeIconProps extends Omit<LucideProps, "size"> {
  type: string;
  size?: "sm" | "md" | "lg";
  colored?: boolean;
}

export function MealTypeIcon({
  type,
  size = "md",
  colored = true,
  className,
  ...props
}: MealTypeIconProps) {
  const config = mealTypeConfig[type as MealTypeKey];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Icon
      className={cn(
        sizeClasses[size],
        colored && config.colorClass,
        className
      )}
      aria-label={config.label}
      role="img"
      {...props}
    />
  );
}

export { mealTypeConfig };
