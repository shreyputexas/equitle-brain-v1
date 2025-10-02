export interface CompanyData {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  revenue?: string;
  description?: string;
  headquarters?: string;
  phone?: string;
  email?: string;
}

export interface ContactData {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  company?: string;
  companyDomain?: string;
}

export interface EnrichmentResult {
  company?: CompanyData;
  contacts?: ContactData[];
  success: boolean;
  error?: string;
  source: string;
}

export interface EnrichmentProvider {
  enrichCompany(domain: string): Promise<EnrichmentResult>;
  enrichContact(name: string, company: string, domain?: string): Promise<EnrichmentResult>;
  searchContacts(company: string, domain?: string, limit?: number): Promise<EnrichmentResult>;
}