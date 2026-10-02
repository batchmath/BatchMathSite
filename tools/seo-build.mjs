#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://batchmath.net";
const VERSION = "10.9.F";
const SOCIAL_IMAGE = ORIGIN + "/assets/batchmath-social-card-v1.png";
const SOCIAL_ALT = "BatchMath — math resources for Integrated Math 1, Calculus Prep, and AP Calculus AB";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "qa-results"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}
const norm = value => value.split(path.sep).join("/");
const relFor = file => norm(path.relative(ROOT, file));
const noindex = html => /<meta\b[^>]*(?:name\s*=\s*(["'])robots\1[^>]*content\s*=\s*(["'])[^"']*noindex|content\s*=\s*(["'])[^"']*noindex[^"']*\3[^>]*name\s*=\s*(["'])robots\4)/i.test(html);
function routeFor(file) {
  const rel = relFor(file);
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}
const canonicalFor = file => ORIGIN + routeFor(file);

function attr(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}
function getMeta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attr(tag, "name").toLowerCase() === key.toLowerCase() ||
        attr(tag, "property").toLowerCase() === key.toLowerCase()) return attr(tag, "content");
  }
  return "";
}
function decode(value) {
  return String(value || "")
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}
function stripTags(value) {
  return decode(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const titleFrom = html => stripTags((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
const h1From = html => stripTags((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "");
const cleanLabel = value => value.replace(/^\d+[A-Z]?\.\s*/, "").replace(/\s+/g, " ").trim();

const titleOverrides = new Map(Object.entries({
  "ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html":
    "Indeterminate Limits Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html":
    "One-Sided Limits Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-3-applications-derivative/topics/absolute-and-local-extrema-and-the-extreme-value-theorem/practice/index.html":
    "Extrema & Extreme Value Theorem Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/practice/index.html":
    "Implicit Tangent Lines Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/practice/index.html":
    "Increasing, Decreasing & Concavity Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/index.html":
    "Definite Integrals from Sums Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/index.html":
    "Fundamental Theorem & Integral Rules Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/practice/index.html":
    "Mean Value Theorem for Integrals Practice | AP Calculus AB | BatchMath",
  "ap-calculus/unit-4-integrals/topics/u-substitution-integrals/practice/index.html":
    "U-Substitution Integrals Practice | AP Calculus AB | BatchMath",
  "im1/unit-2-algebraic-operations-equations-inequalities/index.html":
    "Unit 2: Algebra, Equations & Inequalities | Integrated Math 1 | BatchMath",
  "im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/converting-point-slope-to-slope-intercept/practice/index.html":
    "Point-Slope to Slope-Intercept Practice | Integrated Math 1 | BatchMath"
}));

function courseFor(rel) {
  if (rel.startsWith("ap-calculus/")) return "AP Calculus AB";
  if (rel.startsWith("im1/")) return "Integrated Math 1";
  if (rel.startsWith("calculus-prep/")) return "Calculus Prep";
  return "BatchMath";
}
function isPractice(rel, html) {
  return /(?:^|\/)(?:[^/]*practice|continuity-parameters)\/index\.html$/.test(rel);
}
function practiceSubject(html) {
  return cleanLabel(h1From(html)).replace(/\s+Practice$/i, "").replace(/\s+/g, " ").trim() || "math";
}
function improveDescription(rel, html, description) {
  const subject = practiceSubject(html);
  if (rel.startsWith("im1/unit-3-linear-equation/") && isPractice(rel, html)) {
    let section = "Unit 3";
    if (rel.includes("/a-arithmetic-sequences-")) section = "Unit 3 arithmetic sequences";
    else if (rel.includes("/b-functions-function-notation-and-slope/")) section = "Unit 3 functions and slope";
    else if (rel.includes("/c-slope-intercept-form-and-point-slope-form/")) section = "Unit 3 linear equations";
    else if (rel.includes("/d-recursive-formulas-for-linear-relationships/")) section = "Unit 3 recursive formulas";
    return "Practice " + subject + " in Integrated Math 1 " + section + " with randomized questions and immediate feedback.";
  }
  if (/worked explanations where\.|choosing every\.|answers are\.$/i.test(description)) {
    return "Practice " + subject + " in " + courseFor(rel) + " with interactive questions and immediate feedback.";
  }
  return description;
}
function contextSentence(rel, html) {
  const subject = practiceSubject(html);
  const course = courseFor(rel);
  if (/comprehensive review/i.test(subject)) {
    return "Use this interactive " + course + " review to practice skills from across the unit with immediate answer checking.";
  }
  return "Use this interactive " + course + " practice to work on " + subject + " with immediate answer checking.";
}
function cleanTrackingHref(raw) {
  if (!raw || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(raw)) return raw;
  const hashAt = raw.indexOf("#");
  const hash = hashAt >= 0 ? raw.slice(hashAt) : "";
  const beforeHash = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
  const queryAt = beforeHash.indexOf("?");
  if (queryAt < 0) return raw;
  const base = beforeHash.slice(0, queryAt);
  const params = new URLSearchParams(beforeHash.slice(queryAt + 1));
  const from = params.get("from");
  if (from === "topic" || from === "unit-practice") params.delete("from");
  const rest = params.toString();
  return base + (rest ? "?" + rest : "") + hash;
}
function cleanInternalHrefs(html) {
  return html.replace(/\bhref\s*=\s*(["'])([\s\S]*?)\1/gi, (whole, quote, href) =>
    "href=" + quote + cleanTrackingHref(href) + quote);
}
function removeSeoMetadata(html) {
  html = html.replace(/\s*<!-- BatchMath technical SEO metadata — v10\.9\.F -->[\s\S]*?<script\b[^>]*data-batchmath-structured-data="10\.9\.F"[^>]*>[\s\S]*?<\/script>\s*/gi, "\n");
  const names = new Set(["description", "twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]);
  const properties = new Set(["og:site_name", "og:type", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:type", "og:image:alt"]);
  html = html.replace(/<meta\b[^>]*>/gi, tag => {
    const name = attr(tag, "name").toLowerCase();
    const property = attr(tag, "property").toLowerCase();
    return names.has(name) || properties.has(property) ? "" : tag;
  });
  html = html.replace(/<link\b[^>]*>/gi, tag =>
    attr(tag, "rel").toLowerCase().split(/\s+/).includes("canonical") ? "" : tag);
  return html.replace(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>\s*/gi, "");
}
function organizationNode() {
  return {
    "@type": ["Organization", "EducationalOrganization"],
    "@id": ORIGIN + "/#organization",
    name: "BatchMath",
    url: ORIGIN + "/",
    logo: { "@type": "ImageObject", url: ORIGIN + "/apple-touch-icon.png", width: 180, height: 180 },
    image: SOCIAL_IMAGE,
    description: "Free mathematics instruction, practice, videos, worksheets, and resources for high school students and teachers.",
    sameAs: ["https://www.youtube.com/@batchmath7898", "https://www.instagram.com/batchmath/"]
  };
}
function breadcrumbNode(crumbs) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem", position: index + 1, name: crumb.name, item: ORIGIN + crumb.route
    }))
  };
}
function structuredGraph(rel, title, description, canonical, crumbs) {
  if (rel === "index.html") {
    return [{
      "@type": "WebSite", "@id": ORIGIN + "/#website", name: "BatchMath",
      alternateName: "BatchMath", url: ORIGIN + "/", description,
      publisher: { "@id": ORIGIN + "/#organization" }
    }, organizationNode()];
  }
  const page = {
    "@type": rel === "about/index.html" ? "AboutPage" : "WebPage",
    "@id": canonical + "#page", name: title, url: canonical, description,
    isPartOf: { "@id": ORIGIN + "/#website" }
  };
  const graph = [page];
  if (rel === "about/index.html") graph.push(organizationNode());
  graph.push(breadcrumbNode(crumbs));
  return graph;
}
function metadataBlock(title, description, canonical, graph) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return [
    "<!-- BatchMath technical SEO metadata — v10.9.F -->",
    '<meta name="description" content="' + d + '">',
    '<link rel="canonical" href="' + canonical + '">',
    '<meta property="og:site_name" content="BatchMath">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + t + '">',
    '<meta property="og:description" content="' + d + '">',
    '<meta property="og:url" content="' + canonical + '">',
    '<meta property="og:image" content="' + SOCIAL_IMAGE + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:alt" content="' + escapeHtml(SOCIAL_ALT) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + t + '">',
    '<meta name="twitter:description" content="' + d + '">',
    '<meta name="twitter:image" content="' + SOCIAL_IMAGE + '">',
    '<meta name="twitter:image:alt" content="' + escapeHtml(SOCIAL_ALT) + '">',
    '<script type="application/ld+json" data-batchmath-structured-data="' + VERSION + '">' + json + "</script>",
    ""
  ].join("\n");
}
function breadcrumbMarkup(crumbs) {
  const items = crumbs.map((crumb, index) => {
    const name = escapeHtml(crumb.name);
    if (index === crumbs.length - 1) return '<li aria-current="page"><span>' + name + "</span></li>";
    return '<li><a href="' + crumb.route + '">' + name + "</a></li>";
  }).join("");
  return '<nav class="bm-breadcrumbs" aria-label="Breadcrumb" data-batchmath-breadcrumbs="' + VERSION + '"><ol>' + items + "</ol></nav>";
}
function cleanIm1Navigation(rel, html) {
  if (rel === "im1/index.html") {
    const replacement =
      '<div class="bm-context-bar"><strong>Available now:</strong><span>Units 1–3</span></div>' +
      '<div class="unit-nav"><label for="unit-select">Jump to unit:</label><select id="unit-select" class="unit-select">' +
      '<option value="">Select a unit</option><option value="unit-1-review/">Unit 1 - Review</option>' +
      '<option value="unit-2-algebraic-operations-equations-inequalities/">Unit 2 - Algebraic Operations, Equations, and Inequalities</option>' +
      '<option value="unit-3-linear-equation/">Unit 3 - Linear</option></select></div>' +
      '<div class="unit-grid"><a class="card" href="unit-1-review/">Unit 1 - Review</a>' +
      '<a class="card" href="unit-2-algebraic-operations-equations-inequalities/">Unit 2 - Algebraic Operations, Equations, and Inequalities</a>' +
      '<a class="card" href="unit-3-linear-equation/">Unit 3 - Linear</a></div>';
    html = html.replace(/<div class="bm-context-bar">[\s\S]*?<\/div><div class="unit-nav">[\s\S]*?<\/div><div class="unit-grid">[\s\S]*?<\/div>(?=<\/main>)/, replacement);
  }
  if (rel === "im1/unit-1-review/index.html") {
    const replacement =
      '<div class="unit-nav"><label for="unit-select">Jump to unit:</label><select class="unit-select" id="unit-select">' +
      '<option selected="" value="../unit-1-review/">Unit 1 - Review</option>' +
      '<option value="../unit-2-algebraic-operations-equations-inequalities/">Unit 2 - Algebraic Operations, Equations, and Inequalities</option>' +
      '<option value="../unit-3-linear-equation/">Unit 3 - Linear</option></select></div>';
    html = html.replace(/<div class="unit-nav"><label for="unit-select">Jump to unit:<\/label><select[\s\S]*?<\/select><\/div>/, replacement);
  }
  if (rel === "index.html") {
    html = html.replace(
      '<div class="course-card-note">Foundations, algebra, functions, geometry &amp; review</div>',
      '<div class="course-card-note">Units 1–3: foundations, algebra, sequences &amp; linear relationships</div>'
    );
  }
  return html;
}
function makeNestedChainLinkStatic(rel, html) {
  if (rel !== "ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html") return html;
  html = html.replace(/<script\b[^>]*data-batchmath-nested-chain-launch[^>]*>[\s\S]*?<\/script>/i, "");
  if (!html.includes('href="nested-chain-rule-practice/"')) {
    const anchor = '<a aria-label="Nested Chain Rule Practice" class="resource-link bm-practice-launch bm-practice-derivative" data-bm-resource="practice" href="nested-chain-rule-practice/"><span aria-hidden="true" class="bm-practice-icon bm-practice-icon-derivative2"><span class="bm-deriv-num">d²y</span><span class="bm-deriv-den">dx²</span></span><span class="bm-practice-label">Nested Chain Rule Practice</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a>';
    html = html.replace(/(<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row">[\s\S]*?<\/a>)(<\/div><\/section>)/, "$1" + anchor + "$2");
  }
  return html;
}
function fixHeadingHierarchy(rel, html) {
  if (rel !== "ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html") return html;
  return html.replace(/\.identity-group h3/g, ".identity-group h2")
    .replace(/<h3>(Reciprocal \/ Quotient|Pythagorean|Double Angle \/ Power Reduction|Even \/ Odd)<\/h3>/g, "<h2>$1</h2>");
}

const allFiles = walk(ROOT);
const publicFiles = allFiles.filter(file => relFor(file).endsWith("index.html") && !noindex(fs.readFileSync(file, "utf8")));
const publicByRel = new Map(publicFiles.map(file => [relFor(file), file]));
const initial = new Map(publicFiles.map(file => {
  const html = fs.readFileSync(file, "utf8");
  return [relFor(file), { html, h1: h1From(html) }];
}));
function crumbsFor(file) {
  const rel = relFor(file);
  if (rel === "index.html") return [];
  const crumbs = [{ name: "Home", route: "/" }];
  const dir = path.posix.dirname(rel);
  const pieces = dir === "." ? [] : dir.split("/");
  let current = "";
  for (const piece of pieces) {
    current = current ? current + "/" + piece : piece;
    const candidate = current + "/index.html";
    if (!publicByRel.has(candidate)) continue;
    const fallback = piece.replace(/-/g, " ");
    const name = cleanLabel((initial.get(candidate) || {}).h1 || fallback);
    crumbs.push({ name, route: routeFor(publicByRel.get(candidate)) });
  }
  return crumbs;
}

let changed = 0;
let contexts = 0;
let breadcrumbs = 0;
let cleanedLinks = 0;
for (const file of publicFiles) {
  const rel = relFor(file);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = cleanIm1Navigation(rel, html);
  html = makeNestedChainLinkStatic(rel, html);
  html = fixHeadingHierarchy(rel, html);
  cleanedLinks += (html.match(/\?from=(?:topic|unit-practice)/g) || []).length;
  html = cleanInternalHrefs(html);

  const title = titleOverrides.get(rel) || titleFrom(html);
  let description = decode(getMeta(html, "description")).replace(/\s+/g, " ").trim();
  description = improveDescription(rel, html, description);
  const canonical = canonicalFor(file);
  const crumbs = crumbsFor(file);

  html = html.replace(/<nav\b[^>]*data-batchmath-breadcrumbs[^>]*>[\s\S]*?<\/nav>\s*/gi, "");
  html = html.replace(/<p\b[^>]*class=(["'])[^"']*\bbm-seo-context\b[^"']*\1[^>]*>[\s\S]*?<\/p>\s*/gi, "");
  html = removeSeoMetadata(html);
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "<title>" + escapeHtml(title) + "</title>");
  const graph = structuredGraph(rel, title, description, canonical, crumbs);
  html = html.replace(/<\/head>/i, metadataBlock(title, description, canonical, graph) + "</head>");

  if (crumbs.length) {
    html = html.replace(/(<main\b[^>]*>)/i, "$1" + breadcrumbMarkup(crumbs));
    breadcrumbs++;
  }
  if (isPractice(rel, html)) {
    const context = escapeHtml(contextSentence(rel, html));
    html = html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i, '$1<p class="bm-seo-context" data-batchmath-seo-context="' + VERSION + '">' + context + "</p>");
    contexts++;
  }
  if (html !== before) {
    fs.writeFileSync(file, html);
    changed++;
  }
}
console.log("SEO build " + VERSION + ": " + publicFiles.length + " public pages; " + changed + " files updated; " + breadcrumbs + " breadcrumb trails; " + contexts + " practice contexts; " + cleanedLinks + " tracking-only links cleaned.");
