import { useCallback, useEffect, useState } from 'react';
import type { SavedStickerDesign, StickerDesign } from '../types';
import {
  createStickerDesign,
  deleteStickerDesign,
  listMyStickerDesigns,
  renameStickerDesign,
  updateStickerDesignContent,
} from '../services/stickerDesigns';

/** A signed-in designer's saved sticker-design library — ordered most-recently-
 *  updated first, so `designs[0]` is "the last one they were working on." */
export function useStickerDesigns(uid: string | undefined) {
  const [designs, setDesigns] = useState<SavedStickerDesign[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!uid) {
      setDesigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setDesigns(await listMyStickerDesigns(uid));
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(design: StickerDesign, name: string): Promise<SavedStickerDesign> {
    if (!uid) throw new Error('Sign in required');
    const designId = await createStickerDesign(uid, design, name);
    const created: SavedStickerDesign = {
      designId,
      createdByUid: uid,
      name,
      design,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDesigns((prev) => [created, ...prev]);
    return created;
  }

  async function updateContent(designId: string, design: StickerDesign): Promise<void> {
    await updateStickerDesignContent(designId, design);
    setDesigns((prev) =>
      prev.map((d) => (d.designId === designId ? { ...d, design, updatedAt: Date.now() } : d)),
    );
  }

  async function rename(designId: string, name: string): Promise<void> {
    await renameStickerDesign(designId, name);
    setDesigns((prev) => prev.map((d) => (d.designId === designId ? { ...d, name } : d)));
  }

  async function remove(designId: string): Promise<void> {
    await deleteStickerDesign(designId);
    setDesigns((prev) => prev.filter((d) => d.designId !== designId));
  }

  return { designs, loading, reload, create, updateContent, rename, remove };
}
