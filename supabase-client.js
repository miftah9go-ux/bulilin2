/* ============================================================
   KONFIGURASI SUPABASE
   ============================================================ */
const SUPABASE_URL = 'https://dcprqwihkgqmyvivmtwn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_U8KJrCw_i-HMd-2eqJGucA_01gkVbiq';
const BUCKET = 'gambar-teknik';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   UPLOAD GAMBAR + METADATA KE STORAGE
   Format nama file: <timestamp>__<kategori>__<judul-slug>.<ext>
   ============================================================ */
async function uploadGambarGaleri(file, judul, kategori) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran maksimal 5 MB');
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar');

  const ext = file.name.split('.').pop().toLowerCase();
  const slug = judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'gambar';

  const katSlug = (kategori || 'lainnya')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const fileName = `${Date.now()}__${katSlug}__${slug}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data: { publicUrl } } = sb.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return { fileName, publicUrl };
}

/* ============================================================
   AMBIL SEMUA GAMBAR DARI BUCKET
   ============================================================ */
async function ambilSemuaGambar() {
  const { data, error } = await sb.storage
    .from(BUCKET)
    .list('', {
      limit: 500,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) throw error;

  return (data || [])
    .filter(f => f.name && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
    .map(f => {
      const parts = f.name.replace(/\.[^.]+$/, '').split('__');
      let timestamp = parseInt(parts[0]) || 0;
      let kategori = 'Lainnya';
      let judul = 'Tanpa judul';

      if (parts.length >= 3) {
        kategori = parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        judul = parts.slice(2).join('__').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } else if (parts.length === 2) {
        judul = parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } else {
        judul = parts[0] || f.name;
      }

      const { data: { publicUrl } } = sb.storage
        .from(BUCKET)
        .getPublicUrl(f.name);

      return {
        fileName: f.name,
        judul,
        kategori,
        timestamp,
        tanggal: timestamp ? new Date(timestamp).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric'
        }) : '-',
        url: publicUrl
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

/* ============================================================
   HAPUS GAMBAR
   ============================================================ */
async function hapusGambar(fileName) {
  const { error } = await sb.storage.from(BUCKET).remove([fileName]);
  if (error) throw error;
  return true;
}