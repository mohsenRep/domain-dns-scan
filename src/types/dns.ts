export interface DnsScanResult {
  id: string;
  domain: string;
  subdomains: SubdomainInfo[];
  timestamp: number;
}

export interface SubdomainInfo {
  subdomain: string;
  dnsIp: string[];
  lastChecked: number;
}


