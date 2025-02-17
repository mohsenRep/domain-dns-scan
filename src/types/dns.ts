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

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: DnsAnswer[];
}


