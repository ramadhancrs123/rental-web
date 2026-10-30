# Hiking Catalog Assets

Repository-side research and import staging; Supabase remains the runtime source of truth.

## Files
- manifest.json — catalog index and schema version.
- schema.json — compact JSON Data Contract.
- sources.json — source registry, scope and reuse limitations.
- provinces/jawa-barat/cikuray.json — first pilot dataset.
- validation-report.json — result of pilot validation.

## Rules
1. Keep source track names and source coordinates intact; do not rename them as official trails without evidence.
2. Every significant claim must cite source IDs from sources.json.
3. Keep operational status time-bound and route-specific.
4. Keep DEM elevation candidates separate from field-survey/official elevations.
5. Do not import or publish needs_confirmation, provisional, or secondary-report-only claims as verified facts.
6. Keep GPX/KMZ/PDF originals in the existing gpx/ tree; reference them by repository-relative path and SHA-256 instead of duplicating them here.

## Status flow
draft -> pilot_research_complete_reviewable -> reviewed -> approved_for_import -> published.

A dataset's presence in this folder never authorizes a database import or public publication.

## Operational restrictions
Record provincial or national circulars separately from route-specific operator updates. Media-reported reopening does not override a government circular unless an official revocation or route-specific written clearance is verified.

## Jawa Barat batch
- provinces/jawa-barat/catalog.json: 20 mountain records, 120 source tracks, 315 raw waypoints, 44 spatial access-waypoint matches and source-linked route/basecamp references. Six exact duplicate track records remain marked as duplicates. Elevation and derived metrics are intentionally excluded.
