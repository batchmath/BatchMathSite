# BatchMath instructional video presentation standard

This is the permanent default for future Codex and Claude Code video work across
AP Calculus AB, Integrated Math 1, and Calculus Prep. Use a different presentation
only when explicitly requested by the site owner, or when preserving one of the
specialized workflows documented below.

## Primary lectures and supporting recordings

When a topic explicitly designates a primary lecture and separate examples or
proofs, keep the lecture large and directly playable. Mark its collection with
`data-video-role="lecture"`. Multiple designated lectures retain their sequence
and the normal collection-count rule below; do not infer a primary merely from
the first recording.

Combine the supporting recordings into one compact collection marked
`data-video-role="supporting"`. **Every supporting collection opens the shared
large modal, including collections of one or two videos.** Keep titles visible,
label proof cards as Proof and example cards as Additional Example, and retain
optional proof explanations. Cards are independently selectable; no viewing
order is enforced. Use up to three desktop columns, two on tablets, and one on
mobile, limited to the number of cards. Single supporting cards stay compact.

For example, Chain Rule has the large lecture `73RKQ9ybsDc` and one supporting
gallery containing proof `RhxU25eA1a8` followed by examples `uDWcP2R8UMo` and
`JbPkKwquxm0`. Its six assignment walkthrough buttons remain attached to their
assignments. Never move homework walkthroughs into the supporting collection.

Converted proof cards retain their title, accessible Play label, thumbnail,
original embed URL/offsets, player accessibility/configuration and optional note.
Their covers carry `data-bm-standard-cover`, so legacy listeners do not also
activate them. No iframe exists in their initial HTML.

## Collections without a designated primary

| Videos in one instructional collection | Presentation |
| --- | --- |
| 1 | One large, directly playable 16:9 player |
| 2 | Two medium, directly playable 16:9 players; stack on narrow screens |
| 3 or more | Compact thumbnails opening one large modal player |

Count the direct `.video-item` children of each `[data-bm-videos]` grid. The table
applies to unmarked collections and designated lecture groups. The explicit
supporting role overrides the count rule and always selects the modal gallery.
IM1's approved instructional collections have no designated primary and retain
their established presentation, titles and ordering.

The shared script computes `data-video-layout="large"`, `"pair"`, or `"gallery"`
on every load. No query parameter or student-facing comparison switcher is used.
Old `videoPreview` query parameters have no effect.

## Shared components and markup

Load these assets once, after the shared site stylesheet:

```html
<link rel="stylesheet" href="/assets/instructional-videos.css">
<script defer src="/assets/instructional-videos.js"></script>
```

Example using an existing approved video:

```html
<section class="video-section lecture-section">
  <h2>Instructional Videos</h2>
  <div class="video-grid" data-bm-videos>
    <div class="video-item">
      <h3 class="video-title">Solving Linear Equations Using Addition and Subtraction</h3>
      <div class="video-embed" data-video-id="rLTzuyGUl1I"
           data-player-title="Solving Linear Equations Using Addition and Subtraction">
        <div class="video-cover" data-bm-standard-cover>
          <img class="video-thumb"
               src="https://i.ytimg.com/vi/rLTzuyGUl1I/hqdefault.jpg"
               alt="" width="480" height="360" loading="lazy" decoding="async">
          <button class="video-play" type="button"
                  aria-label="Play Solving Linear Equations Using Addition and Subtraction"></button>
        </div>
      </div>
    </div>
  </div>
</section>
```

To add more videos, add sibling `.video-item` cards **in the approved order**.
Use separate grids for separate instructional collections. Do not copy player
JavaScript or CSS into pages. Legacy `multi` classes are harmless, but the count
and shared implementation determine the layout.

An authored `data-video-layout` may describe the initial layout; the script
recomputes it, so adding a third card automatically enables the gallery.

### Titles and accessibility

- Use the approved title in `.video-title`; do not invent lesson content.
- Set `data-player-title` to the accessible iframe title. Existing recordings may
  retain a longer established player title than their visible card heading.
- Give the native button an accurate `aria-label="Play …"` and `type="button"`.
- Thumbnail images are decorative because the card heading and button identify
  the video; use `alt=""`, explicit dimensions, and lazy loading.
- Keep `data-bm-standard-cover` on the cover. It prevents older page-specific
  AP Calculus handlers from also handling a standard card.
- Do not add an iframe to a standard card's initial HTML. The script creates it
  only after activation. Avoid inaccessible clickable containers without buttons.

### YouTube identity and playback

`data-video-id` is the exact 11-character YouTube ID. Without `data-video-src`,
the script uses `https://www.youtube.com/embed/ID?rel=0&playsinline=1`.
It adds `autoplay=1` only after a student activates the button.

For an established recording with deliberate playback configuration, retain its
complete embed URL in `data-video-src`, HTML-escaping ampersands as `&amp;`.
The shared factory preserves parameters such as `start` or `end`. It accepts
HTTPS YouTube or YouTube No-Cookie embed URLs whose ID matches `data-video-id`.
Do not replace an existing offset merely to standardize presentation.

All 13 approved IM1 Unit 2 videos start at 0:00. They have no timestamp or playlist
offsets, and their approved titles and order must remain unchanged.

## Responsive appearance

- Black backgrounds, yellow headings and controls, red video-frame borders.
- All thumbnails and players use a 16:9 aspect ratio.
- Single videos fill the comfortable instructional width, up to 760px.
- Pairs use two equal columns above 760px and stack at 760px and below.
- Galleries use up to three columns at 980px and above, up to two at 600–979px,
  and one below 600px, never exceeding their card count. One-card galleries have
  a maximum width of 280px; two-card galleries 580px. Narrow cards are centered
  at a maximum width of 280px.
- Titles wrap naturally without truncation. Play controls have at least a 44px
  touch target. Do not force extra columns at the expense of legibility.
- Shared rules are scoped to the marked collection and its player. Do not change
  unrelated media or the global site layout to implement this standard.

## Modal interaction

The gallery uses one reusable native `<dialog>` per page, not one iframe or
dialog per thumbnail. Activating a card opens the selected title and iframe.
The player grows to fit the available viewport, up to 1600px wide; sizing accounts
for the title, Close control, frame aspect ratio, and viewport changes.

Required behavior:

- No iframe or autoplay in a standard collection on initial page load.
- Native keyboard activation and modal focus containment.
- An obvious, accessible Close button; Escape and backdrop clicks also close.
- Clicking inside the player or its header leaves the dialog open.
- Opening locks background scrolling; closing restores the previous scroll styles.
- Closing removes the iframe completely, stopping video and audio, and restores
  focus to the selected thumbnail without scrolling the underlying page.
- Reusing the modal replaces the previous iframe; there is never more than one
  active iframe **inside the modal**. Independent direct-play collections retain
  their inline behavior.
- No new tab, experimental switcher, or in-page comparison implementation.

## Specialized interactions preserved as exceptions

These existing workflows remain outside `[data-bm-videos]` and retain their
page-specific handlers and markup:

- Homework Walkthrough Video buttons and `.hw-video-slot` sections.
- Unit 1 comprehensive-review `.review-video-button` / `.review-video-slot`
  collapsible videos.

Power, Product, Quotient and Chain Rule proofs now use the supporting gallery,
with their Proof labels and optional context retained. They are not exceptions.

The remaining exceptions preserve the context and controls of the original educational
workflow. Their hidden iframes and existing playback configuration are not
rewritten by the standard module. Do not put them into a new grid just to change
their count. Adopt the shared presentation only after verifying that the specific
workflow is preserved and the owner requests or approves that change.

Existing legacy `.video-cover` listeners exclude `[data-bm-standard-cover]`, so
proof controls continue working without competing with the shared player.

### Expandable player sizing

Homework walkthroughs stay within their assignment containers. Expandable
review frames use the available instructional width, up to 760px, through the
scoped `body .review-video-slot .review-video-frame` rule in `assets/site.css`.
Their existing 16:9 wrapper, source URLs and expand/collapse handlers remain
page-owned. Do not globally size unrelated iframes.

The Chain Rule and Quotient Rule table-walkthrough overrides intentionally use
an automatic-height wrapper around a 16:9 iframe. Their measured content area
fits without extra wrapper space; preserve these verified overrides.

The additional sizing suite inventories all 198 recordings across 66 eligible
pages, including 95 homework and seven review players. Run
`python3 tools/video-sizing-inventory.py` and `node tools/video-sizing-qa.mjs`
to check 320/375/390/768/1280px widths and representative landscape/short-height
views. Its measurements and rationale are in `docs/audits/VIDEO-SIZING-FINAL.md`.

## Verification for future changes

Run the browser regression suite and release reference/syntax checks:

```sh
node tools/video-presentation-qa.mjs
npm run qa:static
```

Install Playwright Chromium if necessary. In a managed environment with system
Chromium, select it without modifying site code:

```sh
BM_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/video-presentation-qa.mjs
```

The suite audits in-scope course HTML and tests every in-scope video page at 375,
768, and 1280px, including each standard card, collection counts, title wrapping,
16:9 frames, modal focus/close/stop behavior, approved IM1 mappings, intentional
offset preservation, short viewports, orientation changes, and specialized controls.
Its report is written to `qa-results/video-presentation-qa.json`.

Keep headings, routes, metadata, assignments, answer keys, practice links,
generators, and checkers unchanged when working on video presentation.
Inspect protected specialized sections and preserve their content and parameters.
Report iframe/UI test results separately from actual external YouTube playback;
simulated responses do not establish that a recording is reachable or playable.

## Integration scope — Unit 6 temporarily deferred

On `integration/mathlive-im1-videos-content`, the permanent standard applies to
the approved AP Calculus Units 1–5 and IM1 content. The entire AP Calculus Unit 6
directory remains exactly at MathLive source commit
`919ca1806f07e3cd2af552142926e7ca2b78e8d5`. Its five topic pages awaiting the shared player and its specialized comprehensive
review video page remain deferred; **none** is counted in this integrated rollout. Unit 6 video adoption and MathLive
compatibility verification are deferred until the separate Claude work is ready.
The browser suite reports those pages as deferred, rather than passing them.

The integration has 66 in-scope video pages, 61 with standard collections.
The lecture/supporting correction audits all 66 and changes 15 explicitly
designated lecture-plus-supporting pages. There are 55 large, four pair, and
17 gallery collections, including 15 supporting galleries. The IM1 Key Features
and Equations galleries retain their existing collection behavior.
See [the complete hierarchy inventory](audits/VIDEO-HIERARCHY.md).
The original content-branch audit below is retained as historical source evidence;
its Unit 6 coverage is not a claim about this integration.

## Source-branch adoption audit — November 4, 2026

All 270 HTML pages in the three course directories were inspected. There are 72
video-bearing pages, of which 66 contain standard collections. No applicable
Calculus Prep video collections exist at this checkpoint.

| Course | One-video collections | Two-video collections | Three-or-more collections |
| --- | ---: | ---: | ---: |
| AP Calculus AB | 71 | 5 | 2 |
| Integrated Math 1 | 2 | 1 | 2 |
| Calculus Prep | 0 | 0 | 0 |
| Total | 73 | 6 | 4 |

The four modal collections are:

- AP Calculus Unit 3, Equations of Tangent and Normal Lines — four Additional Examples.
- AP Calculus Unit 6, Solids of Revolution — three Lecture Videos.
- IM1 Unit 2, Coordinate System and Nine Key Features — four instructional videos.
- IM1 Unit 2, Solving Linear Equations — five instructional videos.

The audit also preserves 103 homework slots, four proof players, and seven
collapsible review videos as specialized exceptions. Six video-bearing pages
contain only specialized resources and therefore do not load the shared module.
