# Mogollon 2026 archive — live spreadsheet

The page at `/mogollon2026` (GitHub Pages may normalize it to `/mogollon2026/`) now reads your published Google Sheet. `starter.csv` remains the verified development/reference fixture, not the production data source. No Google Sheet cells are modified by the website.

## Current connection

The published source configured in `mogollon2026.js` is:

https://docs.google.com/spreadsheets/d/e/2PACX-1vSk4KcSiCIWnvCibqoiMlieK0ivKTttMMpnoqLKWAIC1wv1hx4LE_TwF63_W3InPnfRJ5sylvvN4fN3/pub?gid=1190649406&single=true&output=csv

Keep **Automatically republish when changes are made** enabled in Google Sheets' Publish to web settings. Preserve the headers:

`Mile,Published,Topic,ProblemLaTeX,SolutionLaTeX,Explanation,VideoURL,VideoLabel,PublishedDate`

Sheet edits do not require another deployment. Open the archive and use Refresh after Google's publication delay. A failed live fetch shows an error/retry state; it never silently substitutes starter data. Browser QA checks the actual published CSV connection without editing the sheet.

## Daily routine

Add one row for each published mile. Use a positive integer `Mile`, enter the problem and a complete written solution (LaTeX) and/or sufficient written explanation, then set `Published` to `TRUE`. Rows without a problem or completed written solution/explanation remain hidden. `Published` is an editorial switch, **not privacy**: every cell in a publicly published sheet is public.

- Leave Mile 5 absent until its actual content is published. Gaps are intentional.
- `Topic`, `VideoURL`, `VideoLabel`, and `PublishedDate` are optional. Topics appear exactly as entered and populate the topic filter automatically.
- Use `\(...\)` for inline mathematics in explanations; use ordinary LaTeX (including `aligned`) for problems/solutions. Do not paste HTML.
- Use the original YouTube URL in `VideoURL`. Several mile rows may share one Short. Blank or invalid video URLs produce no button.
- Dates are optional display text. Mile order is always ascending, regardless of dates or row order.
- The archive fetches on opening, Refresh, every five visible minutes, and when returning to the tab after a minute. Google may take a few minutes to republish. Neither Google CSV data nor the local starter CSV is stored by the service worker.
- Stable links use `https://batchmath.net/mogollon2026#mile-001`, etc. Previous/next links follow **published** miles, so 4 leads to 6.

## Verified starter sources

The exact supplied problems were independently matched to the official `@batchmath7898` video descriptions on October 27, 2026:

- Mile 1: https://www.youtube.com/shorts/MQif1qWGxQ0
- Miles 2–4: https://www.youtube.com/shorts/ATX82WX3HKc — its description explicitly lists 2, 3, 4 even though its current title says 6–7.
- Miles 6–7: https://www.youtube.com/shorts/1czLJNUzvmI
- Full race: https://www.youtube.com/watch?v=IAn8hB0_lOM

The written solutions are mathematical derivations of those verified problems, not invented later race content. Mile 6 specifies no evaluation point, so its solution gives the general tangent slope `2x+1`; no extra point has been invented. Publication dates have not been guessed.

The existing `/archive/` spreadsheet, page, source files, written solutions, and video player are independent and unchanged.
