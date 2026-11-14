"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { PlusIcon } from "@/components/icons";
import { MIN_RECOMMENDED_WIDTH, prepareImage, uploadProductImage } from "@/lib/image-upload";

/** One gallery entry in the product form. `src` stays empty until the upload finishes. */
export type ImageRow = {
  key: string;
  src: string;
  alt: string;
  /** Local object URL of the cropped photo, shown while (and after) it uploads. */
  preview?: string;
  /** 0–100 while uploading. */
  progress?: number;
  error?: string;
  warning?: string;
};

export const MAX_IMAGES = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type Props = {
  images: ImageRow[];
  onChange: (update: (rows: ImageRow[]) => ImageRow[]) => void;
  /** Alt text to start new images with, such as the product name and color. */
  defaultAlt: () => string;
};

/**
 * Product gallery editor: upload photos (drop or pick), see each one as the
 * storefront will crop it, write alt text, reorder and remove. An Unsplash
 * link can still be added, for the sample catalog.
 */
export function ImageUpload({ images, onChange, defaultAlt }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [link, setLink] = useState("");
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Set<string>());

  // Stop uploads and free the local previews when the form goes away.
  useEffect(() => {
    const pending = controllers.current;
    const urls = previews.current;
    return () => {
      pending.forEach((c) => c.abort());
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const patch = (key: string, fields: Partial<ImageRow>) =>
    onChange((rows) => rows.map((row) => (row.key === key ? { ...row, ...fields } : row)));

  const room = MAX_IMAGES - images.length;

  function addFiles(files: File[]) {
    const accepted = files.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(room, 0));
    if (accepted.length === 0) return;
    const alt = defaultAlt();
    const added = accepted.map((file) => ({ file, key: crypto.randomUUID() }));
    onChange((rows) => [...rows, ...added.map(({ key }) => ({ key, src: "", alt, progress: 0 }))]);
    for (const { file, key } of added) void upload(file, key);
  }

  async function upload(file: File, key: string) {
    const controller = new AbortController();
    controllers.current.set(key, controller);
    try {
      const prepared = await prepareImage(file);
      const preview = URL.createObjectURL(prepared.blob);
      previews.current.add(preview);
      patch(key, {
        preview,
        warning:
          prepared.sourceWidth < MIN_RECOMMENDED_WIDTH
            ? `This photo is ${prepared.sourceWidth} px wide after cropping and may look soft. ${MIN_RECOMMENDED_WIDTH} px or more is best.`
            : undefined,
      });
      const src = await uploadProductImage(file.name, prepared, {
        signal: controller.signal,
        onProgress: (progress) => patch(key, { progress }),
      });
      patch(key, { src, progress: undefined });
    } catch (error) {
      if (controller.signal.aborted) return;
      patch(key, {
        progress: undefined,
        error: error instanceof Error ? error.message : "The upload failed. Please try again.",
      });
    } finally {
      controllers.current.delete(key);
    }
  }

  function remove(row: ImageRow) {
    controllers.current.get(row.key)?.abort();
    if (row.preview) {
      URL.revokeObjectURL(row.preview);
      previews.current.delete(row.preview);
    }
    onChange((rows) => rows.filter((r) => r.key !== row.key));
  }

  function move(index: number, by: -1 | 1) {
    onChange((rows) => {
      const next = [...rows];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row);
      return next;
    });
  }

  function addLink() {
    const src = link.trim();
    if (!src || room <= 0) return;
    onChange((rows) => [...rows, { key: crypto.randomUUID(), src, alt: defaultAlt() }]);
    setLink("");
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  return (
    <div className="space-y-5">
      {images.length > 0 && (
        <ol className="space-y-3">
          {images.map((row, i) => (
            <li key={row.key} className="flex gap-4 rounded-[0.5rem] border bg-surface/50 p-3">
              <div className="relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-[0.375rem] bg-surface">
                {(row.preview || row.src) && (
                  // A local preview or an already allowed URL; no need for the optimizer here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.preview ?? row.src} alt="" className="size-full object-cover" />
                )}
                {row.progress !== undefined && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-ink/15" aria-hidden>
                    <div className="h-full bg-ink transition-[width]" style={{ width: `${row.progress}%` }} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[0.8125rem]">
                  <span className="font-medium">
                    {i === 0 ? "Listing image" : `Image ${i + 1}`}
                    {row.progress !== undefined && (
                      <span className="ml-2 font-normal text-muted" role="status">
                        Uploading… {Math.round(row.progress)}%
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-muted">
                    <button
                      type="button"
                      className="cursor-pointer hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      Up<span className="sr-only"> (move image {i + 1} earlier)</span>
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={i === images.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      Down<span className="sr-only"> (move image {i + 1} later)</span>
                    </button>
                    <button type="button" className="cursor-pointer hover:text-ink" onClick={() => remove(row)}>
                      Remove<span className="sr-only"> image {i + 1}</span>
                    </button>
                  </span>
                </div>

                <label className="sr-only" htmlFor={`${inputId}-alt-${row.key}`}>
                  Description of image {i + 1} (alt text)
                </label>
                <input
                  id={`${inputId}-alt-${row.key}`}
                  className="admin-field"
                  placeholder="Describe the photo (alt text)"
                  value={row.alt}
                  maxLength={200}
                  required
                  onChange={(e) => patch(row.key, { alt: e.target.value })}
                />
                {!row.preview && row.src && <p className="truncate text-[0.75rem] text-muted">{row.src}</p>}
                {row.error && (
                  <p className="text-[0.8125rem] text-sale" role="alert">
                    {row.error}
                  </p>
                )}
                {row.warning && !row.error && <p className="text-[0.8125rem] text-muted">{row.warning}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (room > 0) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-disabled={room <= 0}
        className={`flex flex-col items-center gap-1.5 rounded-[0.5rem] border border-dashed px-4 py-6 text-center text-[0.8125rem] transition-colors ${
          room <= 0
            ? "cursor-not-allowed opacity-50"
            : dragging
              ? "cursor-copy border-ink bg-surface"
              : "cursor-pointer hover:border-subtle hover:bg-surface/50"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          <PlusIcon className="size-4" strokeWidth={1.5} />
          {room > 0 ? "Drop photos here or choose files" : `Up to ${MAX_IMAGES} images`}
        </span>
        <span className="text-muted">
          JPEG, PNG, WebP or AVIF. Photos are cropped to 4:5 from the centre; 1200 px wide or more looks best.
        </span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={room <= 0}
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>

      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${inputId}-link`} className="admin-label mb-1.5 block">
            Or add an Unsplash link
          </label>
          <input
            id={`${inputId}-link`}
            className="admin-field"
            placeholder="https://images.unsplash.com/photo-…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary h-10"
          disabled={!link.trim() || room <= 0}
          onClick={addLink}
        >
          Add link
        </button>
      </div>
    </div>
  );
}
