import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types/experience';
import { searchMemory } from '../services/api';
import { MemoryList } from '../components/MemoryList';

export const Memory: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedFailureType, setSelectedFailureType] = useState('all');

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const data = await searchMemory({
        q: searchQuery,
        service: selectedService,
        severity: selectedSeverity,
        failure_type: selectedFailureType
      });
      setMemories(data.memories);
    } catch (err: any) {
      console.error('Failed to search memory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMemories();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedService, selectedSeverity, selectedFailureType]);

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-sans tracking-tight">
          Organizational Memory
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Troubleshooting experience captured from previous incidents.
        </p>
      </div>

      {/* Memory List Component */}
      <MemoryList
        memories={memories}
        isLoading={isLoading}
        searchQuery={searchQuery}
        selectedService={selectedService}
        selectedSeverity={selectedSeverity}
        selectedFailureType={selectedFailureType}
        onSearchChange={setSearchQuery}
        onServiceChange={setSelectedService}
        onSeverityChange={setSelectedSeverity}
        onFailureTypeChange={setSelectedFailureType}
      />
    </div>
  );
};
