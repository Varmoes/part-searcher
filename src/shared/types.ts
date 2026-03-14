export type SupplierMode = "direct" | "search-engine" | "hybrid";

export interface SupplierDefinition {
  id: string;
  name: string;
  homepage: string;
  domain: string;
  aliases?: string[];
  notes?: string;
  browserPreferred?: boolean;
  mode: SupplierMode;
  searchUrlTemplate?: string;
  productUrlTemplate?: string;
}

export interface SearchPlan {
  supplierId: string;
  supplierName: string;
  searchUrl: string;
  siteSearchUrl: string;
  directPartUrl?: string;
  browserPreferred: boolean;
  notes?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet?: string;
}

export interface ScrapeEnvelope<T> {
  ok: boolean;
  supplierId: string;
  strategy: string;
  requestedUrl: string;
  finalUrl?: string;
  blocked?: boolean;
  reason?: string;
  data: T;
}

export interface ProductSnapshot {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  breadcrumbs?: string[];
  partNumberCandidates?: string[];
  specPairs?: Array<{ name: string; value: string }>;
}

export interface McmasterCredentials {
  username: string;
  password: string;
  pfxPath: string;
  pfxPassphrase?: string;
}
