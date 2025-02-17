'use client';

import { useState, useEffect } from 'react';
import { DnsScanResult } from '@/types/dns';
import { scanSubdomain, saveToStorage, getFromStorage, removeFromStorage } from '@/services/dnsService';
import DomainTable from '@/components/DomainTable';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [subdomains, setSubdomains] = useState<string>('');
  const [results, setResults] = useState<DnsScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const stored = getFromStorage();
    setResults(stored);
    if (stored.length > 0) {
      setActiveTab(stored[0].id);
    }
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);

    try {
      const subs = subdomains
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      // Add main domain to list
      if (!subs.includes(domain)) {
        subs.unshift(domain);
      }

      const scanResults = await Promise.all(
        subs.map(sub => scanSubdomain(domain, sub))
      );

      const newResult: DnsScanResult = {
        id: Date.now().toString(),
        domain,
        subdomains: scanResults,
        timestamp: Date.now()
      };

      saveToStorage(newResult);
      setResults(prev => [...prev, newResult]);
      setActiveTab(newResult.id);
      setDomain('');
      setSubdomains('');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTabClose = (id: string) => {
    removeFromStorage(id);
    setResults(prev => prev.filter(r => r.id !== id));
    if (activeTab === id) {
      setActiveTab(results[0]?.id || null);
    }
  };

  const handleUpdate = (updated: DnsScanResult) => {
    saveToStorage(updated);
    setResults(prev => 
      prev.map(r => r.id === updated.id ? updated : r)
    );
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleScan} className="mb-4">
        <div className="mb-4">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Enter domain (e.g., example.com)"
            className="border p-2 w-full"
            disabled={isScanning}
          />
        </div>
        <div className="mb-4">
          <textarea
            value={subdomains}
            onChange={e => setSubdomains(e.target.value)}
            placeholder="Enter subdomains (one per line)"
            className="border p-2 w-full h-32"
            disabled={isScanning}
          />
        </div>
        <button
          type="submit"
          disabled={isScanning || !domain}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isScanning ? 'Scanning...' : 'Scan Domain'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <div className="flex flex-wrap border-b mb-4">
            {results.map(result => (
              <div key={`tab-${result.id}`} className="relative mr-2 mb-2">
                <button
                  onClick={() => setActiveTab(result.id)}
                  className={`px-4 py-2 ${
                    activeTab === result.id ? 'border-b-2 border-blue-500' : ''
                  }`}
                >
                  {result.domain}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabClose(result.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 
                            flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {activeTab && (
            <DomainTable
              key={`table-${activeTab}`}
              result={results.find(r => r.id === activeTab)!}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}
