
UPDATE public.hiking_data_sources
SET name='PMPA ASTACALA — Jalur Pendakian Gunung',
    source_url='https://pmpa.astacala.org/jalur-pendakian-gunung/',
    notes=concat_ws(E'\n', nullif(notes,''),
      'Manifest sumber lokal: gpx/jawa-barat/jalur_pendakian_jawa_barat.json (schema 2.3.0, SHA-256 5489be2d17ce761f512377220a7afb5f4320e32562f244e23ea4d9bddd20809f). Raw GPX disimpan privat; hak publikasi masih memerlukan konfirmasi tertulis. Jalur dan checkpoint yang diimpor merupakan kandidat, bukan rute resmi/terverifikasi.'),
    permission_status='permission_required',
    is_public=false,
    is_active=true,
    updated_at=now()
WHERE code='astacala_bank_data';
