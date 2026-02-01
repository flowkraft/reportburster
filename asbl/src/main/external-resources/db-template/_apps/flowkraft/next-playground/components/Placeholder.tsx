import { LucideIcon } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function Placeholder({ title, description, icon: Icon }: PlaceholderProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 text-center">
        <Icon className="w-16 h-16 text-cyan-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {description}
        </p>
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          This component is currently under development
        </div>
      </div>
    </div>
  );
}
