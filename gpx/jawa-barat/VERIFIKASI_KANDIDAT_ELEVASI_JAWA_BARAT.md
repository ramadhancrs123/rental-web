# Laporan Verifikasi Kandidat Waypoint dan Elevasi — Jawa Barat

Tanggal pemeriksaan: 30 October 2026 00:58 WIB.

## Ringkasan hasil

- 20 destinasi dipertahankan; 19 mempunyai GPX lokal yang cocok. Halimun belum mempunyai GPX lokal.
- 315 kandidat waypoint diperiksa; 322 lokasi unik diminta dari dua dataset elevasi setelah titik ADM4 BMKG turut dimasukkan.
- Kedekatan waypoint ke geometri GPX dihitung sebagai indikasi spasial. Hasil ini tidak menetapkan jalur resmi secara otomatis.
- Elevasi dibandingkan dengan SRTM 30 m dan ASTER GDEM 30 m melalui Open Topo Data. DEM adalah sumber pembanding model, bukan pengukuran lapangan.
- 18 kode ADM4 BMKG diperiksa ulang; kegagalan permintaan BMKG: 0.
- Semua kandidat tetap berstatus pending review; verifiedElevationM tetap null sampai sumber jalur/elevasi otoritatif atau konfirmasi lapangan tersedia.

## Status verifikasi elevasi

| Status | Jumlah |
|---|---:|
| dem_cross_checked_consistent_pending_ground_truth | 147 |
| dem_only_estimate_pending_manual_review | 102 |
| track_profile_dem_corroborated_pending_manual_review | 61 |
| dem_models_disagree_pending_review | 2 |
| source_elevation_value_suspicious_pending_review | 2 |
| gpx_waypoint_and_name_label_conflict | 1 |

## Kedekatan terhadap geometri GPX

| Status | Jumlah |
|---|---:|
| on_or_very_near_gpx_track_candidate | 282 |
| far_from_gpx_tracks_or_other_access | 11 |
| within_200m_of_gpx_track_candidate | 11 |
| near_gpx_track_candidate | 10 |
| within_500m_but_association_uncertain | 1 |

## Ringkasan per destinasi

| Destinasi | Kandidat waypoint | Status elevasi |
|---|---:|---|
| Bukit Tunggul | 3 | dem_cross_checked_consistent_pending_ground_truth: 3 |
| Burangrang | 10 | dem_only_estimate_pending_manual_review: 6; dem_cross_checked_consistent_pending_ground_truth: 4 |
| Ceremai | 43 | dem_only_estimate_pending_manual_review: 15; dem_cross_checked_consistent_pending_ground_truth: 14; track_profile_dem_corroborated_pending_manual_review: 13; source_elevation_value_suspicious_pending_review: 1 |
| Cikuray | 20 | dem_only_estimate_pending_manual_review: 16; dem_cross_checked_consistent_pending_ground_truth: 4 |
| Galunggung | 23 | dem_only_estimate_pending_manual_review: 16; dem_cross_checked_consistent_pending_ground_truth: 7 |
| Gede – Pangrango | 36 | dem_cross_checked_consistent_pending_ground_truth: 20; track_profile_dem_corroborated_pending_manual_review: 10; dem_only_estimate_pending_manual_review: 5; dem_models_disagree_pending_review: 1 |
| Guntur – Masigit | 10 | dem_cross_checked_consistent_pending_ground_truth: 6; dem_only_estimate_pending_manual_review: 4 |
| Halimun | 0 | Tidak ada GPX lokal |
| Kendeng | 12 | dem_cross_checked_consistent_pending_ground_truth: 10; gpx_waypoint_and_name_label_conflict: 1; source_elevation_value_suspicious_pending_review: 1 |
| Manglayang | 7 | dem_cross_checked_consistent_pending_ground_truth: 5; dem_only_estimate_pending_manual_review: 2 |
| Papandayan | 13 | dem_cross_checked_consistent_pending_ground_truth: 6; dem_only_estimate_pending_manual_review: 4; track_profile_dem_corroborated_pending_manual_review: 3 |
| Patuha | 7 | dem_cross_checked_consistent_pending_ground_truth: 6; dem_only_estimate_pending_manual_review: 1 |
| Rakutak | 16 | dem_cross_checked_consistent_pending_ground_truth: 10; dem_only_estimate_pending_manual_review: 4; track_profile_dem_corroborated_pending_manual_review: 2 |
| Salak | 38 | track_profile_dem_corroborated_pending_manual_review: 19; dem_cross_checked_consistent_pending_ground_truth: 14; dem_only_estimate_pending_manual_review: 5 |
| Tangkuban Perahu | 17 | dem_only_estimate_pending_manual_review: 11; track_profile_dem_corroborated_pending_manual_review: 5; dem_cross_checked_consistent_pending_ground_truth: 1 |
| Wayang | 6 | dem_only_estimate_pending_manual_review: 3; dem_cross_checked_consistent_pending_ground_truth: 2; dem_models_disagree_pending_review: 1 |
| Peg. Malabar Puncak Besar | 10 | dem_cross_checked_consistent_pending_ground_truth: 6; track_profile_dem_corroborated_pending_manual_review: 3; dem_only_estimate_pending_manual_review: 1 |
| Peg. Malabar Puncak Haruman | 17 | dem_cross_checked_consistent_pending_ground_truth: 11; dem_only_estimate_pending_manual_review: 3; track_profile_dem_corroborated_pending_manual_review: 3 |
| Peg. Malabar Puncak Puntang | 15 | dem_cross_checked_consistent_pending_ground_truth: 13; dem_only_estimate_pending_manual_review: 1; track_profile_dem_corroborated_pending_manual_review: 1 |
| Tegal Panjang | 12 | dem_cross_checked_consistent_pending_ground_truth: 5; dem_only_estimate_pending_manual_review: 5; track_profile_dem_corroborated_pending_manual_review: 2 |

## Kandidat yang perlu peninjauan prioritas

Daftar lengkap disimpan pada dataEnhancement.elevationVerificationSummary.flaggedCandidateExamples di JSON.
- **Ceremai — START CIBULUH** (ceremai-wpt-031): flags gpx_waypoint_elevation_outside_0_4000m_screening_range; GPX=4184.0, label=None, SRTM=1274.0 m, ASTER=1288.0 m, jarak ke track=12.5 m.
- **Ceremai — BASECAMP TRISAKTI SADAREHE** (ceremai-wpt-036): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=1295.0 m, ASTER=1285.0 m, jarak ke track=4590.4 m.
- **Ceremai — POS 1 LAWANG GEDE** (ceremai-wpt-037): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=1519.0 m, ASTER=1516.0 m, jarak ke track=3964.8 m.
- **Ceremai — POS 2 TEGAL JAMUJU** (ceremai-wpt-038): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=1701.0 m, ASTER=1688.0 m, jarak ke track=3436.8 m.
- **Ceremai — POS 3 KAYU MANIS** (ceremai-wpt-039): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=1950.0 m, ASTER=1941.0 m, jarak ke track=2792.5 m.
- **Ceremai — POS 4 PENGORBANAN** (ceremai-wpt-040): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2054.0 m, ASTER=2043.0 m, jarak ke track=2314.5 m.
- **Ceremai — POS 5 BUYUT KETUG** (ceremai-wpt-041): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2202.0 m, ASTER=2187.0 m, jarak ke track=1957.7 m.
- **Ceremai — POS 6 SUMBER HIRUP** (ceremai-wpt-042): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2286.0 m, ASTER=2281.0 m, jarak ke track=1774.3 m.
- **Ceremai — POS 7 TANJAKAN CITA CITA** (ceremai-wpt-043): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2496.0 m, ASTER=2489.0 m, jarak ke track=1468.0 m.
- **Kendeng — PINTU HUTAN** (kendeng-wpt-004): flags gpx_waypoint_elevation_outside_0_4000m_screening_range; GPX=-0.11, label=None, SRTM=1966.0 m, ASTER=1970.0 m, jarak ke track=11.7 m.
- **Peg. Malabar Puncak Besar — Village** (peg-malabar-puncak-besar-wpt-010): flags waypoint_not_close_to_a_source_gpx_track; GPX=1584.0, label=None, SRTM=1570.0 m, ASTER=1573.0 m, jarak ke track=342.9 m.
- **Tegal Panjang — Gunung Jaya** (tegal-panjang-wpt-005): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2176.0 m, ASTER=2173.0 m, jarak ke track=943.5 m.
- **Tegal Panjang — Gunung Kendang** (tegal-panjang-wpt-006): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2605.0 m, ASTER=2600.0 m, jarak ke track=3301.2 m.
- **Tegal Panjang — Mount Papandayan** (tegal-panjang-wpt-008): flags check_whether_waypoint_belongs_to_another_route_or_unincluded_track, waypoint_not_close_to_a_source_gpx_track; GPX=None, label=None, SRTM=2196.0 m, ASTER=2197.0 m, jarak ke track=1384.7 m.

## Keputusan data

1. Kandidat yang dekat dengan geometri track memiliki kecocokan spasial yang lebih kuat, tetapi nama pos, akses dan asosiasi jalur belum disahkan otoritatif.
2. Nilai GPX yang berbeda jauh dari label atau DEM ditandai; nilai sumber asli tidak ditimpa angka DEM.
3. Untuk kandidat yang tidak memiliki elevasi GPX/label, DEM hanya menjadi estimasi elevasi permukaan. Simpan sebagai kandidat, bukan elevasi lapangan final.
4. 11 kandidat berada lebih dari 500 m dari seluruh track dalam file GPX yang dipasangkan. Periksa apakah titik tersebut milik akses/jalur lain atau tidak disertai track yang benar.
5. altitudeAdjustedTemperatureReady tetap false; estimasi suhu tidak diaktifkan dari hasil DEM ini saja.

## Keterbatasan sumber dan akurasi

File GPX mengidentifikasi Global Mapper sebagai pembuat/pengekspor file, tetapi metadata yang ditinjau tidak mencantumkan asal survei atau izin penggunaan yang memadai. SRTM dan ASTER GDEM adalah model elevasi grid; kecocokan kedua model bukan bukti elevasi lapangan atau identitas pos resmi.

Sumber: Open Topo Data API (https://www.opentopodata.org/api/), SRTM dataset (https://www.opentopodata.org/datasets/srtm/), ASTER GDEM V3 NASA Open Data (https://data.nasa.gov/dataset/aster-global-digital-elevation-model-v003), API prakiraan cuaca BMKG (https://data.bmkg.go.id/prakiraan-cuaca/).

Frontend tidak diubah; tidak ada kode aplikasi, skema database atau deployment yang disentuh.
