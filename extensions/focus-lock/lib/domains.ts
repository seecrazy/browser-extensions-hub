import { isValidDomain, normalizeDomain } from "./types";

export function addDomain(domains: string[], input: string): string[] {
  const domain = normalizeDomain(input);

  if (!isValidDomain(domain)) {
    throw new Error("Please enter a valid domain, such as example.com.");
  }

  return domains.includes(domain) ? domains : [...domains, domain].sort();
}

export function removeDomain(domains: string[], input: string): string[] {
  const domain = normalizeDomain(input);
  return domains.filter((candidate) => candidate !== domain);
}

export function normalizeDomainList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Import file must contain an array of domains.");
  }

  const domains = value
    .filter((domain): domain is string => typeof domain === "string")
    .map((domain) => normalizeDomain(domain))
    .filter(isValidDomain);
  return [...new Set(domains)].sort();
}
