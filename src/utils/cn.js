import clsx from "clsx";

/**
 * Utility function to merge class names
 * Uses clsx for conditional class names
 *
 * @example
 * cn('text-red-500', isActive && 'bg-blue-500', { 'font-bold': isBold })
 */
export const cn = (...classes) => {
  return clsx(...classes);
};

/**
 * Creates a variant class name builder
 * Useful for component variants
 *
 * @example
 * const buttonVariants = createVariants({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     variant: {
 *       primary: 'bg-blue-500 text-white',
 *       secondary: 'bg-gray-500 text-white'
 *     },
 *     size: {
 *       sm: 'text-sm',
 *       md: 'text-base',
 *       lg: 'text-lg'
 *     }
 *   }
 * });
 */
export const createVariants = ({ base, variants }) => {
  return (props = {}) => {
    const variantClasses = Object.keys(variants).map((variantKey) => {
      const variant = props[variantKey];
      return variants[variantKey]?.[variant];
    });

    return cn(base, ...variantClasses, props.className);
  };
};

export default cn;
