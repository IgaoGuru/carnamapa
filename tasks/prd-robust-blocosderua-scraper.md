# PRD: Robust Blocosderua.com Scraper

## Introduction

The current scraper for blocosderua.com fails to geocode approximately 11% of events (87 out of 764 cached queries failed). This results in incomplete data with `needs_geocoding: true` flags scattered across output files. The goal is to build a robust, multi-threaded scraping pipeline that achieves 100% geocoding success by implementing a fallback chain: free Nominatim API → Google Maps API. The pipeline should be resumable, cache-aware, and optimized for throughput with parallel processing.

## Goals

- Achieve 100% event geocoding success rate across all 9 cities
- Implement Google Maps API as fallback when Nominatim fails
- Enable parallel/multi-threaded scraping and geocoding for maximum throughput
- Support resumable runs that skip already-processed events
- Preserve existing cache to avoid redundant API calls
- Maintain clean separation between pipeline steps (scraping → geocoding → output)

## User Stories

### US-001: Create pipeline orchestrator
**Description:** As a developer, I want a single entry point that orchestrates all scraping steps so that the entire process runs end-to-end with one command.

**Acceptance Criteria:**
- [ ] Create `pipeline.py` as main orchestrator that coordinates all steps
- [ ] Pipeline accepts CLI arguments for: all cities, specific cities, dry-run mode
- [ ] Pipeline reports progress and summary statistics at completion
- [ ] Each step (scrape, geocode, output) is a separate module called by orchestrator
- [ ] Typecheck/lint passes

### US-002: Implement parallel city scraping
**Description:** As a developer, I want to scrape multiple cities concurrently so that the total scraping time is minimized.

**Acceptance Criteria:**
- [ ] Use ThreadPoolExecutor or asyncio for concurrent HTTP requests
- [ ] Scrape all 9 cities in parallel (one thread per city)
- [ ] Each city's event pages scraped concurrently (configurable max workers)
- [ ] Thread-safe progress logging
- [ ] Graceful error handling - one city's failure doesn't stop others
- [ ] Typecheck/lint passes

### US-003: Implement skip-if-scraped logic
**Description:** As a developer, I want the scraper to skip events that have already been successfully processed so that interrupted runs can resume efficiently.

**Acceptance Criteria:**
- [ ] Check existing output JSON files for already-scraped event IDs
- [ ] Skip fetching detail pages for events already in output with valid coordinates
- [ ] Log skipped events count per city
- [ ] Force-refresh flag to override skip behavior when needed
- [ ] Typecheck/lint passes

### US-004: Implement geocoding fallback chain
**Description:** As a developer, I want geocoding to try multiple providers in sequence so that we maximize success rate.

**Acceptance Criteria:**
- [ ] Primary: Try Nominatim (free, no API key)
- [ ] Fallback 1: Try Google Maps API if Nominatim fails
- [ ] Fallback 2: Try simplified address (neighborhood + city) on both providers
- [ ] Cache results from all providers with provider metadata
- [ ] Log which provider succeeded for each address
- [ ] Typecheck/lint passes

### US-005: Implement parallel geocoding with rate limiting
**Description:** As a developer, I want geocoding to run in parallel while respecting API rate limits so that we maximize throughput without getting blocked.

**Acceptance Criteria:**
- [ ] Batch geocoding requests with configurable concurrency
- [ ] Nominatim: respect 1 request/second limit (OSM policy)
- [ ] Google Maps API: higher concurrency allowed (configurable, default 10)
- [ ] Queue-based processing with worker threads
- [ ] Progress bar or percentage complete logging
- [ ] Typecheck/lint passes

### US-006: Implement address normalization improvements
**Description:** As a developer, I want better address normalization so that geocoding success rate improves before hitting APIs.

**Acceptance Criteria:**
- [ ] Remove common noise: parenthetical notes, zip codes, "Brasil"
- [ ] Normalize neighborhood names (handle variations like "Centro Histórico" vs "Centro")
- [ ] Handle "s/n" (sem número) addresses
- [ ] Extract and preserve landmark names as backup query
- [ ] Typecheck/lint passes

### US-007: Implement geocoding retry for failed entries
**Description:** As a developer, I want a dedicated retry mechanism for previously failed geocoding attempts so that we can reprocess failures with Google API.

**Acceptance Criteria:**
- [ ] Scan all output files for entries with `needs_geocoding: true`
- [ ] Retry with Google Maps API (skip Nominatim since it already failed)
- [ ] Update output files in-place with new coordinates
- [ ] Clear `needs_geocoding` flag and `geocoding_query` on success
- [ ] Generate retry report: total retried, succeeded, still failing
- [ ] Typecheck/lint passes

### US-008: Implement comprehensive logging and reporting
**Description:** As a developer, I want detailed logs and a final summary report so that I can monitor progress and identify issues.

**Acceptance Criteria:**
- [ ] Per-city statistics: events found, scraped, geocoded, skipped
- [ ] Geocoding statistics: Nominatim hits, Google hits, cache hits, failures
- [ ] Timing statistics: total runtime, time per city, time per step
- [ ] Final summary written to `logs/pipeline-run-{timestamp}.json`
- [ ] Console output shows real-time progress
- [ ] Typecheck/lint passes

### US-009: Update configuration for Google Maps API
**Description:** As a developer, I want the configuration to support Google Maps API credentials so that the fallback geocoder works.

**Acceptance Criteria:**
- [ ] Add `GOOGLE_MAPS_API_KEY` to `.env.example` with documentation
- [ ] Validate API key on startup if Google fallback is enabled
- [ ] Add configuration for geocoding concurrency limits
- [ ] Add configuration for enabling/disabling Google fallback
- [ ] Typecheck/lint passes

### US-010: Verify all cities scraped completely
**Description:** As a developer, I want to verify that all 9 cities have complete data so that we know the scraper succeeded.

**Acceptance Criteria:**
- [ ] Run pipeline for all cities: São Paulo, Rio de Janeiro, Belo Horizonte, Salvador, Florianópolis, Recife/Olinda, Brasília, Porto Alegre, Fortaleza
- [ ] Verify each output JSON has 0 entries with `needs_geocoding: true`
- [ ] Verify all events have valid coordinates within Brazil bounds
- [ ] Generate verification report with event counts per city
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: The pipeline must be executable via `python pipeline.py` with optional city filters
- FR-2: The pipeline must scrape all 9 configured cities when run without filters
- FR-3: The scraper must use ThreadPoolExecutor for parallel HTTP requests
- FR-4: The scraper must skip events already present in output files with valid coordinates
- FR-5: The geocoder must try Nominatim first, then Google Maps API on failure
- FR-6: The geocoder must cache all results (success and failure) with provider metadata
- FR-7: The geocoder must respect Nominatim's 1 req/sec rate limit
- FR-8: The geocoder must validate coordinates fall within Brazil bounds (-73.99 to -32.39 lon, -33.77 to 5.27 lat)
- FR-9: The pipeline must generate JSON output files in `output/{city-slug}.json`
- FR-10: The pipeline must write run statistics to `logs/pipeline-run-{timestamp}.json`
- FR-11: The pipeline must continue processing other cities if one city fails
- FR-12: The pipeline must provide a `--retry-failed` flag to reprocess failed geocoding entries

## Non-Goals

- No changes to the frontend or map display
- No changes to the GeoJSON output schema (maintain compatibility)
- No scraping of additional carnival websites beyond blocosderua.com
- No automatic scheduling/cron setup
- No database storage (continue using JSON files)
- No web UI for monitoring scraper progress

## Technical Considerations

- **Threading model:** Use `concurrent.futures.ThreadPoolExecutor` for simplicity and compatibility
- **Geocoding library:** Continue using `geopy` which supports both Nominatim and GoogleV3
- **Rate limiting:** Use `time.sleep()` or token bucket for Nominatim; Google has higher limits
- **Cache format:** Extend existing JSON cache to include provider info and timestamp
- **Error handling:** Catch and log all exceptions; never let one failure stop the pipeline
- **Existing code:** Refactor `scraper.py` and `geocoder.py` rather than rewriting from scratch

## Success Metrics

- 100% of events across all 9 cities have valid coordinates (no `needs_geocoding: true`)
- Pipeline completes full run in under 30 minutes (with parallelization)
- Geocoding cache hit rate > 80% on subsequent runs
- Zero unhandled exceptions during pipeline execution

## Open Questions

- What is the Google Maps API budget/quota limit we should respect?
- Should we implement exponential backoff for API failures or fail fast?
- Do we need to handle blocosderua.com website structure changes (monitoring/alerts)?
