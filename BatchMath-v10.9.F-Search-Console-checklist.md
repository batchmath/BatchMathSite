# BatchMath v10.9.F Search Console Checklist

1. Deploy the complete v10.9.F site and confirm that the preferred public host is https://batchmath.net/.
2. In Search Console, open the existing BatchMath property and resubmit or confirm https://batchmath.net/sitemap.xml.
3. Confirm that the submitted sitemap reports 242 discovered URLs after Google refreshes it.
4. Use URL Inspection on a small representative set:
   - https://batchmath.net/
   - https://batchmath.net/ap-calculus/
   - https://batchmath.net/ap-calculus/unit-1-limits-continuity/
   - one topic page;
   - one practice page;
   - https://batchmath.net/im1/unit-3-linear-equation/
5. For those URLs, confirm that the user-declared canonical and Google-selected canonical are the same clean parameter-free HTTPS URL. Request indexing for the highest-priority changed pages if Google has not recrawled them.
6. Run Google’s Rich Results Test on the home page and one topic/practice page. Confirm WebSite/Organization and BreadcrumbList parse without errors.
7. In Page Indexing, watch for unexpected excluded, crawled-not-indexed, duplicate, or alternate-page reports. Old noindex IM1 Unit 4–11 placeholders should simply fall out if Google previously discovered them.
8. Check Core Web Vitals for both Mobile and Desktop after enough post-deployment field data is available.
9. In Performance, record a 28-day baseline for clicks, impressions, average position, pages, and queries. Compare it again after two to four weeks; do not judge the technical release from the first few days of crawl volatility.
