# Third-party assets in this experiment

All copies are confined to `experiments/math-entry/vendor/`. No root dependency declaration or installed package was changed.

- **MathLive 0.111.1**, MIT. Published tarball: <https://registry.npmjs.org/mathlive/-/mathlive-0.111.1.tgz>. The tarball’s SHA-512 integrity was verified against npm registry metadata before extraction. Runtime: `vendor/mathlive/mathlive.min.mjs`; its 20 WOFF2 fonts are in `vendor/mathlive/fonts/`. The library loads those fonts from the explicitly configured local directory. No Compute Engine, sound assets, or network speech service is included. License: `vendor/mathlive/LICENSE.txt`.
- **KaTeX fonts** distributed with MathLive. The upstream MIT notice is also retained in `vendor/mathlive/KATEX-LICENSE.txt`, from <https://github.com/KaTeX/KaTeX/blob/main/LICENSE>.
- **MathJax 4.1.3**, Apache-2.0. Copied from the already installed, version-verified MathJax package: `tex-chtml.js`, the bundled speech worker and its maps, and the license. The worker/maps are necessary to make this MathJax 4 bundle start without external network requests. License: `vendor/mathjax/LICENSE`.
- **@mathjax/mathjax-newcm-font 4.1.3**, declared Apache-2.0 by its package metadata. Copied from the already installed, version-verified font package: `chtml.js`, CHTML dynamic font data, and WOFF2 files. The package metadata and Apache license text are retained in `vendor/mathjax-newcm/`. Source repository: <https://github.com/mathjax/MathJax-fonts>.

`dependency-lock.json` records the selected versions, provenance, file sizes, and SHA-256 checksums for every vendored file, including supplementary license notices. The focused automated tests verify those checksums. The experiment uses the original BatchMath editor and grader files by relative URL; they are not duplicated or modified here.
