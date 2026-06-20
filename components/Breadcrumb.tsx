'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={item.id || 'root'} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
          <button
            onClick={() => onNavigate(item.id)}
            className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
              index === items.length - 1
                ? 'text-gray-900 font-medium cursor-default'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            disabled={index === items.length - 1}
          >
            {index === 0 ? (
              <>
                <Home className="h-4 w-4" />
                <span>Root</span>
              </>
            ) : (
              <span>{item.name}</span>
            )}
          </button>
        </div>
      ))}
    </nav>
  );
}