#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://batchmath.net";
const errors = [];
const warnings = [];
const stats = {};
const fail = message => errors.push(message);
const warn = message => warnings.push(message);
const norm = value => value.split(path.sep).join("/");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "qa-results"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
function attr(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}
function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attr(tag, "name").toLowerCase() === key.toLowerCase() ||
        attr(tag, "property").toLowerCase() === key.toLowerCase()) return attr(tag, "content");
  }
  return "";
}
function linkRel(html, expected) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attr(tag, "rel").toLowerCase().split(/\s+/).includes(expected.toLowerCase())) return attr(tag, "href");
  }
  return "";
}
function decode(value) {
  return String(value || "").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
function text(value) {
  return decode(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
const pageTitle = html => text((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
const noindex = html => /<meta\b[^>]*(?:name\s*=\s*(["'])robots\1[^>]*content\s*=\s*(["'])[^"']*noindex|content\s*=\s*(["'])[^"']*noindex[^"']*\3[^>]*name\s*=\s*(["'])robots\4)/i.test(html);
const relFor = file => norm(path.relative(ROOT, file));
function routeFor(file) {
  const rel = relFor(file);
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}
const expectedCanonical = file => ORIGIN + routeFor(file);
const practicePage = rel => /(?:^|\/)(?:[^/]*practice|continuity-parameters)\/index\.html$/.test(rel);

const all = walk(ROOT);
const htmlFiles = all.filter(file => file.endsWith(".html"));
const publicFiles = htmlFiles.filter(file => relFor(file).endsWith("index.html") && !noindex(fs.readFileSync(file, "utf8")));
const noindexFiles = htmlFiles.filter(file => noindex(fs.readFileSync(file, "utf8")));
const publicSet = new Set(publicFiles.map(file => path.resolve(file)));
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
const incoming = new Map(publicFiles.map(file => [path.resolve(file), 0]));
let breadcrumbPages = 0;
let contextPages = 0;
let structuredPages = 0;
let internalTargets = 0;
let queryLinks = 0;
let httpInternalLinks = 0;
let brokenLinks = 0;

function resolveInternal(from, raw) {
  if (!raw || raw.startsWith("#") || /^(?:mailto:|tel:|data:|javascript:|blob:)/i.test(raw)) return null;
  if (/\+(?:esc|encodeURIComponent)\s*\(/.test(raw)) return null;
  if (/^https?:\/\//i.test(raw)) {
    if (!/^https?:\/\/(?:www\.)?batchmath\.net(?:\/|$)/i.test(raw)) return null;
    const parsed = new URL(raw);
    raw = parsed.pathname + parsed.search + parsed.hash;
  }
  let clean = raw.split("#")[0].split("?")[0];
  if (!clean) return null;
  try { clean = decodeURIComponent(clean); } catch {}
  let target = clean.startsWith("/") ? path.join(ROOT, clean.replace(/^\/+/, "")) : path.resolve(path.dirname(from), clean);
  if (clean.endsWith("/")) target = path.join(target, "index.html");
  else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  return path.resolve(target);
}

for (const file of publicFiles) {
  const rel = relFor(file);
  const html = fs.readFileSync(file, "utf8");
  const title = pageTitle(html);
  const description = decode(meta(html, "description")).trim();
  const canonical = linkRel(html, "canonical");
  if (!title) fail(rel + ": missing title");
  if (title.length > 85) fail(rel + ": title is longer than 85 characters (" + title.length + ")");
  if (!description) fail(rel + ": missing meta description");
  if (!canonical) fail(rel + ": missing canonical");
  if (canonical !== expectedCanonical(file)) fail(rel + ": canonical does not match clean HTTPS route");
  for (const pair of [[titles, title, "title"], [descriptions, description, "description"], [canonicals, canonical, "canonical"]]) {
    const map = pair[0], value = pair[1], label = pair[2];
    if (!value) continue;
    if (map.has(value)) fail(rel + ": duplicate " + label + " also used by " + map.get(value));
    else map.set(value, rel);
  }
  for (const key of ["og:site_name", "og:type", "og:title", "og:description", "og:url", "og:image",
                     "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (!meta(html, key)) fail(rel + ": missing " + key);
  }
  if (meta(html, "og:url") !== canonical) fail(rel + ": og:url differs from canonical");
  if (meta(html, "twitter:card") !== "summary_large_image") fail(rel + ": unexpected Twitter card type");
  if ((html.match(/<h1\b/gi) || []).length !== 1) fail(rel + ": expected exactly one H1");
  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map(match => Number(match[1]));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) fail(rel + ": heading hierarchy skips from H" + headings[i - 1] + " to H" + headings[i]);
  }

  const jsonScripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)];
  if (jsonScripts.length !== 1) fail(rel + ": expected one JSON-LD block, found " + jsonScripts.length);
  else {
    try {
      const data = JSON.parse(jsonScripts[0][2]);
      const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      const types = graph.flatMap(node => Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter(Boolean);
      for (const unsupported of ["Course", "PracticeProblem", "VideoObject"]) {
        if (types.includes(unsupported)) fail(rel + ": contains deliberately unsupported/misleading " + unsupported + " markup");
      }
      if (rel === "index.html") {
        if (!types.includes("WebSite")) fail(rel + ": home JSON-LD missing WebSite");
        if (!types.includes("EducationalOrganization")) fail(rel + ": home JSON-LD missing EducationalOrganization");
      } else {
        const breadcrumb = graph.find(node => node["@type"] === "BreadcrumbList");
        if (!breadcrumb) fail(rel + ": JSON-LD missing BreadcrumbList");
        else {
          const list = breadcrumb.itemListElement || [];
          if (!list.length || list[list.length - 1].item !== canonical) fail(rel + ": breadcrumb JSON-LD does not end at canonical URL");
        }
      }
      structuredPages++;
    } catch (error) {
      fail(rel + ": invalid JSON-LD: " + error.message);
    }
  }

  const visibleBreadcrumbs = (html.match(/data-batchmath-breadcrumbs=/g) || []).length;
  if (rel === "index.html" && visibleBreadcrumbs) fail(rel + ": home should not show a breadcrumb");
  if (rel !== "index.html") {
    if (visibleBreadcrumbs !== 1) fail(rel + ": expected one visible breadcrumb");
    else breadcrumbPages++;
  }
  const contexts = (html.match(/data-batchmath-seo-context=/g) || []).length;
  if (practicePage(rel)) {
    if (contexts !== 1) fail(rel + ": practice page missing one static context sentence");
    else contextPages++;
  } else if (contexts) fail(rel + ": non-practice page received practice context");

  if (/\?from=(?:topic|unit-practice)(?:[&#"']|$)/i.test(html)) {
    queryLinks++;
    fail(rel + ": still creates tracking-only from= parameter links");
  }
  if (/http:\/\/(?:www\.)?batchmath\.net/i.test(html)) {
    httpInternalLinks++;
    fail(rel + ": contains an HTTP BatchMath link");
  }
  if (rel !== "ap-calculus/ap-test-preparation/free-response-questions/index.html" &&
      /\b(?:Coming Soon|in development|content coming later)\b/i.test(text(html))) {
    warn(rel + ": contains stale-status wording for manual review");
  }

  for (const match of html.matchAll(/\b(?:href|src|poster)\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    const target = resolveInternal(file, match[2]);
    if (!target) continue;
    internalTargets++;
    if (!fs.existsSync(target)) {
      brokenLinks++;
      fail(rel + ": broken internal target " + match[2]);
    }
  }
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi)) {
    const target = resolveInternal(file, match[2]);
    if (!target || target === path.resolve(file)) continue;
    if (publicSet.has(target)) incoming.set(target, (incoming.get(target) || 0) + 1);
  }
}

const orphanFiles = [];
for (const file of publicFiles) {
  if (relFor(file) === "index.html") continue;
  if ((incoming.get(path.resolve(file)) || 0) === 0) orphanFiles.push(relFor(file));
}
for (const rel of orphanFiles) fail(rel + ": crawlable orphan with no normal internal anchor link");

const expectedNoindex = new Set(["404.html", "diagnostics/index.html", "offline.html"]);
for (const file of noindexFiles) {
  const rel = relFor(file);
  if (!expectedNoindex.has(rel)) fail(rel + ": unexpected noindex page remains");
}
for (const rel of expectedNoindex) {
  if (!noindexFiles.some(file => relFor(file) === rel)) fail(rel + ": expected utility noindex is missing");
}

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
const expectedUrls = publicFiles.map(expectedCanonical).sort();
const actualUrls = [...sitemapUrls].sort();
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap.xml contains duplicate URLs");
if (JSON.stringify(actualUrls) !== JSON.stringify(expectedUrls)) fail("sitemap.xml does not exactly match the public canonical set");
if (/<(?:lastmod|changefreq|priority)>/i.test(sitemap)) fail("sitemap.xml includes fabricated or unnecessary optional fields");
if (sitemapUrls.some(url => !url.startsWith(ORIGIN + "/"))) fail("sitemap.xml contains a nonpreferred origin");

const robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\/(?:\s|$)/i.test(robots)) fail("robots.txt does not allow public crawling");
if (!/Sitemap:\s*https:\/\/batchmath\.net\/sitemap\.xml/i.test(robots)) fail("robots.txt does not reference the canonical sitemap");
if (/Disallow:\s*\/(?:\s|$)/i.test(robots)) fail("robots.txt blocks the whole site");

const css = fs.readFileSync(path.join(ROOT, "assets/site.css"), "utf8");
for (const token of [".bm-breadcrumbs", "flex-wrap:wrap", "overflow-wrap:anywhere", ".bm-seo-context"]) {
  if (!css.includes(token)) fail("assets/site.css missing responsive SEO style " + token);
}

stats.htmlPages = htmlFiles.length;
stats.indexablePages = publicFiles.length;
stats.noindexUtilityPages = noindexFiles.length;
stats.sitemapUrls = sitemapUrls.length;
stats.structuredDataPages = structuredPages;
stats.visibleBreadcrumbPages = breadcrumbPages;
stats.practiceContextPages = contextPages;
stats.uniqueTitles = titles.size;
stats.uniqueDescriptions = descriptions.size;
stats.internalTargetsChecked = internalTargets;
stats.brokenInternalTargets = brokenLinks;
stats.orphanPages = orphanFiles.length;
stats.trackingQueryLinks = queryLinks;
stats.httpInternalLinks = httpInternalLinks;

const report = { ok: errors.length === 0, generatedAt: new Date().toISOString(), stats, warnings, errors };
const outDir = path.join(ROOT, "qa-results");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "seo-qa.json"), JSON.stringify(report, null, 2) + "\n");
const lines = ["BatchMath technical SEO QA", "Result: " + (report.ok ? "PASS" : "FAIL"), "",
  ...Object.entries(stats).map(entry => entry[0] + ": " + entry[1]), "",
  "Warnings: " + warnings.length, ...warnings.map(item => "- " + item), "",
  "Errors: " + errors.length, ...errors.map(item => "- " + item), ""];
fs.writeFileSync(path.join(outDir, "seo-qa.txt"), lines.join("\n"));
console.log(lines.join("\n"));
if (errors.length) process.exit(1);
