import { DnsScanResult, SubdomainInfo, DnsResponse } from '@/types/dns';

export async function checkDns(domain: string): Promise<string[]> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data: DnsResponse = await response.json();
    
    return data.Answer
      ?.filter(record => record.type === 1)
      .map(record => record.data) || [];
  } catch {
    return [];
  }
}

export async function scanSubdomain(domain: string, subdomain: string): Promise<SubdomainInfo> {
  const fullDomain = subdomain === domain ? domain : `${subdomain}.${domain}`;
  const ips = await checkDns(fullDomain);
  
  return {
    subdomain: fullDomain,
    dnsIp: ips,
    lastChecked: Date.now()
  };
}

export function saveToStorage(result: DnsScanResult) {
  const stored = localStorage.getItem('dnsScanResults') || '[]';
  const results: DnsScanResult[] = JSON.parse(stored);
  const existingIndex = results.findIndex(r => r.id === result.id);
  
  if (existingIndex >= 0) {
    results[existingIndex] = result;
  } else {
    results.push(result);
  }
  
  localStorage.setItem('dnsScanResults', JSON.stringify(results));
}

export function getFromStorage(): DnsScanResult[] {
  const stored = localStorage.getItem('dnsScanResults') || '[]';
  return JSON.parse(stored);
}

export function removeFromStorage(id: string) {
  const stored = localStorage.getItem('dnsScanResults') || '[]';
  const results: DnsScanResult[] = JSON.parse(stored);
  localStorage.setItem('dnsScanResults', 
    JSON.stringify(results.filter(r => r.id !== id)));
}
