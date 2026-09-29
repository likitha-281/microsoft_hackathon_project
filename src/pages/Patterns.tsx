import React, { useState, useEffect } from 'react';
import { PatternItem } from '../types/experience';
import { fetchPatterns } from '../services/api';
import { PatternCard } from '../components/PatternCard';

export const Patterns: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPatterns();
      setPatterns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load failure patterns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, []);

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-sans tracking-tight">
          What keeps going wrong?
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Recurring failure patterns discovered from organizational incident memories.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-3 rounded-lg text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {/* Patterns Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs">
            Analyzing recurring failure patterns from stored incidents...
          </div>
        ) : patterns.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-lg bg-zinc-900/30">
            No recurring failure patterns detected yet.
          </div>
        ) : (
          patterns.map((p) => (
            <PatternCard key={p.name} pattern={p} />
          ))
        )}
      </div>
    </div>
  );
};
