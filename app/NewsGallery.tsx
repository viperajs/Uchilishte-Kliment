'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog } from 'radix-ui';

// Photo grid for a news article; clicking a photo opens a full-screen viewer with arrow-key navigation.
export function NewsGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const step = (d: number) => setOpen(i => i === null ? i : (i + d + images.length) % images.length);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  if (!images.length) return null;
  return <>
    <div className="news-gallery">{images.map((src, i) => <button type="button" key={src} onClick={() => setOpen(i)} aria-label={`Отвори снимка ${i + 1} от ${images.length}`}><img src={src} alt={`${title} — снимка ${i + 1}`} loading="lazy" /></button>)}</div>
    <Dialog.Root open={open !== null} onOpenChange={o => { if (!o) setOpen(null); }}>
      <Dialog.Portal><Dialog.Content className="news-lightbox" aria-describedby={undefined}>
        <Dialog.Title className="sr-only">{title} — снимка {(open ?? 0) + 1} от {images.length}</Dialog.Title>
        {open !== null && <img src={images[open]} alt={`${title} — снимка ${open + 1}`} />}
        <span className="news-lightbox-count">{(open ?? 0) + 1} / {images.length}</span>
        {images.length > 1 && <><button type="button" className="prev" aria-label="Предишна снимка" onClick={() => step(-1)}><ChevronLeft size={30} /></button><button type="button" className="next" aria-label="Следваща снимка" onClick={() => step(1)}><ChevronRight size={30} /></button></>}
        <button type="button" className="close" aria-label="Затвори" onClick={() => setOpen(null)}><X size={26} /></button>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
