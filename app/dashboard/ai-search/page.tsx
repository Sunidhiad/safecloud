'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { Search, File, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/files/fileTypes';

interface SearchResult {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_ai_metadata?: {
    extracted_text: string;
    manual_tags: string[];
    color_tags: string[];
  };
}

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await fetch(`/api/files/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.files || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">AI-Powered Search</h1>
          <p className="text-slate-500 mb-6">Search files by name, content, or image colors</p>

          {/* Search Bar */}
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by filename, content, colors... (e.g., 'blue', 'document', 'report')"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Results */}
          {searched && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No results found for "{query}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-3">Found {results.length} results</p>
                  {results.map(result => (
                    <div key={result.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">{result.file_name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{formatFileSize(result.file_size)}</p>
                          {result.file_ai_metadata?.extracted_text && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {result.file_ai_metadata.extracted_text.substring(0, 200)}
                            </p>
                          )}
                          {result.file_ai_metadata?.color_tags && result.file_ai_metadata.color_tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {result.file_ai_metadata.color_tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-xs text-slate-600 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/api/files/download/${result.id}`}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}