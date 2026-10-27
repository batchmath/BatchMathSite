# Mogollon 2026 archive — one-time spreadsheet connection

The page is fully implemented at `/mogollon2026` (GitHub Pages may normalize it to `/mogollon2026/`). It currently displays the six verified starter entries from `starter.csv`, with an explicit notice that the live spreadsheet is not connected. No Google account was connected during implementation; a spreadsheet has **not** been created or published on your behalf.

## One setup path

1. Create a **new Google Sheet**, named `100 Miles of Calculus 1 — Mogollon 2026`. Do not use the Problem of the Day spreadsheet.
2. In Google Sheets, choose **File → Import → Upload** and import this folder's `starter.csv` into the new sheet. It contains the six verified entries, in the production schema, with complete written solutions. Keep the headers exactly as follows:

   `Mile,Published,Topic,ProblemLaTeX,SolutionLaTeX,Explanation,VideoURL,VideoLabel,PublishedDate`

3. Choose **File → Share → Publish to web**, select this one sheet, and select **Comma-separated values (.csv)**. Publish it and leave **Automatically republish when changes are made** enabled. Use the resulting public CSV URL, not the ordinary editor/share URL.
4. Open `mogollon2026/mogollon2026.js`. Replace the empty string in the one setting `const SHEET_CSV_URL = '';` with that published CSV URL. Deploy this one-time connection change through your usual process.
5. Open `https://batchmath.net/mogollon2026` in a browser. Confirm the starter-data warning is replaced by an update time, all six entries appear, and Refresh retrieves the live CSV without a cross-origin error. Make a harmless text edit in the sheet, wait for Google's publication delay, and click Refresh to verify it appears **without another site deployment**.

The actual new Google CSV URL/browser CORS and an edit to that new sheet could not be tested before this connection exists. The page does not silently fall back to starter data if a configured live source fails. It shows an error/retry state instead.

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
