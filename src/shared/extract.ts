import * as cheerio from "cheerio";

import type { ProductSnapshot, SearchResultItem } from "./types.js";

const BLOCKED_TITLE_MARKERS = [
  "just a moment",
  "challenge validation",
  "sorry! something went wrong",
  "access denied",
  "robot or human",
];

export function detectBlockedResponse(
  html: string,
  status: number,
): { blocked: boolean; reason?: string } {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim().toLowerCase() ?? "";

  if ([403, 429, 503].includes(status)) {
    return { blocked: true, reason: `HTTP ${status}` };
  }

  if (BLOCKED_TITLE_MARKERS.some((marker) => title.includes(marker))) {
    return { blocked: true, reason: title || "challenge page" };
  }

  return { blocked: false };
}

export function extractDuckDuckGoResults(html: string, limit = 5): SearchResultItem[] {
  const $ = cheerio.load(html);
  const items: SearchResultItem[] = [];

  $(".result").each((_, element) => {
    if (items.length >= limit) {
      return false;
    }

    const link = $(element).find(".result__a").first();
    const title = link.text().trim();
    const url = link.attr("href")?.trim();
    const snippet = $(element).find(".result__snippet").text().trim() || undefined;

    if (title && url) {
      items.push({ title, url, snippet });
    }

    return undefined;
  });

  return items;
}

export function extractGenericLinks(
  html: string,
  limit = 8,
  domainHint?: string,
): SearchResultItem[] {
  const $ = cheerio.load(html);
  const items: SearchResultItem[] = [];

  $("a[href]").each((_, element) => {
    if (items.length >= limit) {
      return false;
    }

    const href = $(element).attr("href")?.trim();
    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!href || !title || title.length < 6) {
      return undefined;
    }

    if (
      domainHint &&
      href.startsWith("http") &&
      !href.toLowerCase().includes(domainHint.toLowerCase())
    ) {
      return undefined;
    }

    items.push({ title, url: href });
    return undefined;
  });

  return items;
}

export function extractProductSnapshot(html: string, pageUrl: string): ProductSnapshot {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    undefined;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    undefined;
  const canonicalUrl = $('link[rel="canonical"]').attr("href")?.trim() || pageUrl;
  const breadcrumbs = [
    ...new Set(
      $('[aria-label*="breadcrumb" i] a, nav a, .breadcrumb a')
        .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean),
    ),
  ].slice(0, 8);

  const partNumberCandidates = [
    ...new Set(
      html.match(/\b[A-Z0-9][A-Z0-9._/-]{2,}\b/g)?.filter((value) => /\d/.test(value)) ?? [],
    ),
  ].slice(0, 10);

  const specPairs: Array<{ name: string; value: string }> = [];

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("th, td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

    if (cells.length >= 2 && specPairs.length < 12) {
      specPairs.push({ name: cells[0], value: cells.slice(1).join(" | ") });
    }
  });

  return {
    title,
    description,
    canonicalUrl,
    breadcrumbs,
    partNumberCandidates,
    specPairs,
  };
}
