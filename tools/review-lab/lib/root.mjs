// Paths for the review lab. ROOT is the site tree the tools work on: BM_ROOT (a baseline checkout, an extracted
// ZIP) or this checkout. REVIEW_HOME holds downloads and results outside the checkout (see lib/env.sh).
import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
export const LAB=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const REPO=path.resolve(LAB,'../..');
export const ROOT=path.resolve(process.env.BM_ROOT||REPO);
export const REVIEW_HOME=path.resolve(process.env.REVIEW_HOME||path.join(process.env.XDG_CACHE_HOME||path.join(os.homedir(),'.cache'),'batchmath-review-lab'));
