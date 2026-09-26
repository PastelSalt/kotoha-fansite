// Archive instead of delete: copy the row to archived_content and remove it in one transaction.
import { sql } from './db.js';
import { HttpError } from './http.js';

// source_table → human-readable section ("where it was deleted from")
export const SECTIONS = {
  videos: 'Latest Videos',
  news: 'News',
  achievements: 'Achievements',
  discography_items: 'Discography',
  gallery_images: 'Gallery',
  admin_users: 'Accounts',
};

const RESTORABLE = new Set(['videos', 'news', 'achievements', 'discography_items']);

/**
 * Moves one row to the archive. `table` must be a key of SECTIONS (never user input directly).
 * Returns the archived_content id, or throws 404 when the row doesn't exist.
 */
export async function archiveRow(table, id, admin, { reason = null, note = null } = {}) {
  if (!Object.hasOwn(SECTIONS, table) || table === 'admin_users') throw new Error(`archiveRow: bad table ${table}`);
  const s = sql();
  const [inserted, deleted] = await s.transaction([
    s.query(
      `insert into archived_content
         (source_table, source_section, original_id, record, archived_by_id, archived_by_username, reason, note)
       select $1, $2, t.id, to_jsonb(t), $3, $4, $5, $6 from ${table} t where t.id = $7
       returning id`,
      [table, SECTIONS[table], admin.id, admin.username, reason, note, id],
    ),
    s.query(`delete from ${table} where id = $1 returning id`, [id]),
  ]);
  if (!inserted.length || !deleted.length) throw new HttpError(404, 'NOT_FOUND', 'Item not found');
  return Number(inserted[0].id);
}

/** Records an account removal (the admin_users row stays, deactivated; no password hash in the snapshot). */
export async function archiveAccountSnapshot(userRow, admin, { reason = null } = {}) {
  const { password_hash, ...safe } = userRow; // eslint-disable-line no-unused-vars
  const [row] = await sql()`
    insert into archived_content
      (source_table, source_section, original_id, record, archived_by_id, archived_by_username, reason, note)
    values ('admin_users', ${SECTIONS.admin_users}, ${userRow.id}, ${JSON.stringify(safe)}::jsonb,
            ${admin.id}, ${admin.username}, ${reason}, 'Account deactivated (sessions revoked)')
    returning id`;
  return Number(row.id);
}

/** Restores an archived content row with its original id. The archive entry is kept as history. */
export async function restoreArchived(archiveId, admin) {
  const [entry] = await sql()`select * from archived_content where id = ${archiveId}`;
  if (!entry) throw new HttpError(404, 'NOT_FOUND', 'Archive entry not found');
  if (entry.restored_at) throw new HttpError(409, 'ALREADY_RESTORED', 'This item was already restored');
  if (!RESTORABLE.has(entry.source_table)) {
    throw new HttpError(409, 'NOT_RESTORABLE',
      entry.source_table === 'gallery_images'
        ? 'The image file was permanently deleted, so it cannot be restored'
        : 'This kind of item cannot be restored here');
  }
  const table = entry.source_table; // whitelisted above
  const s = sql();
  try {
    await s.transaction([
      s.query(
        `insert into ${table} overriding system value
         select * from jsonb_populate_record(null::${table}, $1::jsonb)`,
        [JSON.stringify(entry.record)],
      ),
      s.query(`update archived_content set restored_at = now(), restored_by_id = $1 where id = $2`, [admin.id, archiveId]),
    ]);
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(409, 'CONFLICT', 'An item with the same unique value already exists (e.g. the same YouTube video)');
    }
    throw err;
  }
  return { table, id: Number(entry.original_id) };
}
