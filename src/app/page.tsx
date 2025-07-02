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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="glass rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">Domain DNS Scanner</h1>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="Enter domain (e.g., example.com)"
                className="w-full px-4 py-3 rounded-lg input-glass text-gray-800 placeholder-gray-500"
                disabled={isScanning}
              />
            </div>
            <div>
              <textarea
                value={subdomains}
                onChange={e => setSubdomains(e.target.value)}
                placeholder="Enter subdomains (one per line)"
                className="w-full px-4 py-3 rounded-lg input-glass text-gray-800 placeholder-gray-500 h-32"
                disabled={isScanning}
              />
            </div>
            <button
              type="submit"
              disabled={isScanning || !domain}
              className={`w-full py-3 rounded-lg transition-all duration-200 ${
                isScanning || !domain
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-[0.99]'
              } text-white font-medium`}
            >
              {isScanning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </span>
              ) : (
                'Scan Domain'
              )}
            </button>
          </form>
        </div>

        {results.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200/30 pb-4">
              {results.map(result => (
                <div key={`tab-${result.id}`} className="relative">
                  <button
                    onClick={() => setActiveTab(result.id)}
                    className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                      activeTab === result.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100/50'
                    }`}
                  >
                    {result.domain}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(result.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 
                              flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
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
    </div>
  );
}
