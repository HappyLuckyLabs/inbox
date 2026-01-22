'use client';

import { motion } from 'framer-motion';

export type CategoryType =
  | 'engineering-hiring'
  | 'investor-update'
  | 'team-building'
  | 'product-feedback'
  | 'customer-support'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'personal';

interface CategoryConfig {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}

const categoryConfigs: Record<CategoryType, CategoryConfig> = {
  'engineering-hiring': {
    label: 'Engineering Hiring',
    bgColor: 'bg-[hsl(250,35%,92%)]',
    textColor: 'text-[hsl(250,40%,45%)]',
    dotColor: 'bg-[hsl(250,50%,60%)]',
  },
  'investor-update': {
    label: 'Investor Update',
    bgColor: 'bg-[hsl(10,80%,85%)]',
    textColor: 'text-[hsl(10,60%,40%)]',
    dotColor: 'bg-[hsl(10,70%,60%)]',
  },
  'team-building': {
    label: 'Team Building',
    bgColor: 'bg-[hsl(150,25%,88%)]',
    textColor: 'text-[hsl(150,35%,35%)]',
    dotColor: 'bg-[hsl(150,40%,50%)]',
  },
  'product-feedback': {
    label: 'Product Feedback',
    bgColor: 'bg-[hsl(200,40%,90%)]',
    textColor: 'text-[hsl(200,45%,40%)]',
    dotColor: 'bg-[hsl(200,50%,55%)]',
  },
  'customer-support': {
    label: 'Customer Support',
    bgColor: 'bg-[hsl(25,80%,90%)]',
    textColor: 'text-[hsl(25,60%,40%)]',
    dotColor: 'bg-[hsl(25,70%,60%)]',
  },
  'marketing': {
    label: 'Marketing',
    bgColor: 'bg-[hsl(280,35%,90%)]',
    textColor: 'text-[hsl(280,40%,40%)]',
    dotColor: 'bg-[hsl(280,50%,60%)]',
  },
  'sales': {
    label: 'Sales',
    bgColor: 'bg-[hsl(180,35%,88%)]',
    textColor: 'text-[hsl(180,40%,35%)]',
    dotColor: 'bg-[hsl(180,45%,50%)]',
  },
  'operations': {
    label: 'Operations',
    bgColor: 'bg-[hsl(40,50%,90%)]',
    textColor: 'text-[hsl(40,50%,40%)]',
    dotColor: 'bg-[hsl(40,60%,55%)]',
  },
  'personal': {
    label: 'Personal',
    bgColor: 'bg-[hsl(30,35%,90%)]',
    textColor: 'text-[hsl(30,30%,40%)]',
    dotColor: 'bg-[hsl(30,40%,55%)]',
  },
};

interface CategoryTagProps {
  category: CategoryType;
  size?: 'sm' | 'md';
  animate?: boolean;
}

export function CategoryTag({ category, size = 'md', animate = false }: CategoryTagProps) {
  const config = categoryConfigs[category];

  const TagComponent = animate ? motion.span : 'span';
  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  } : {};

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <TagComponent
      {...animationProps}
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${config.bgColor} ${config.textColor}`}
    >
      <span className={`${dotSize} rounded-full ${config.dotColor}`} />
      {config.label}
    </TagComponent>
  );
}

interface CategoryTagListProps {
  categories: CategoryType[];
  maxVisible?: number;
}

export function CategoryTagList({ categories, maxVisible = 2 }: CategoryTagListProps) {
  const visibleCategories = categories.slice(0, maxVisible);
  const remainingCount = categories.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibleCategories.map((category, index) => (
        <CategoryTag key={category} category={category} size="sm" animate />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-[hsl(25,10%,55%)] font-medium px-2">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
