import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "orange" | "indigo" | "gray";
  className?: string;
}

const VARIANTS = {
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  gray: "bg-gray-800 text-gray-500 border-gray-700",
};

export function Badge({ children, variant = "gray", className }: Props) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-xs border whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
