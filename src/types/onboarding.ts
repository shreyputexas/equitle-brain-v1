// src/types/onboarding.ts
export type SearchDetails = {
  searchStage: "Pre-Launch" | "Launched" | "Under LOI" | "Acquired";
  searchDuration: "0-3 months" | "3-6 months" | "6-12 months" | "12+ months";
  targetCompanySize: "$1–5M" | "$5–10M" | "$10–20M" | "$20M+";
  investmentRange: "$0–250k" | "$250–500k" | "$500k–$1M" | "$1M+";
  targetIndustries: string[]; // ["Technology","Healthcare",...]
};

export type TeamExperience = {
  teamSize: "Solo" | "2" | "3+";
  currentRole: string;              // free text or dropdown
  previousExperience: string;       // textarea or dropdown
  educationBackground?: string;     // optional textarea
};

export type Preferences = {
  communicationPreference: "Email" | "Phone" | "Both";
  newsletterOptIn: boolean;
  termsAccepted: boolean;
  termsAcceptedAt?: number;         // Date.now()
};
