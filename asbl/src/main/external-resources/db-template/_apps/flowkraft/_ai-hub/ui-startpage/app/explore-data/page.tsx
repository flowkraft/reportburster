"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// lucide-react removed — icons replaced with inline heroicons below
import type { Canvas } from "@/lib/db/schema";
import {
  listCanvases, createCanvas as apiCreateCanvas, deleteCanvas as apiDeleteCanvas,
  duplicateCanvas, updateCanvas, listDemoCanvases, createCanvasFromDemo,
} from "@/lib/explore-data/rb-api";
import { listShareLinks } from "@/lib/explore-data/share-api";
import { ShareDialog } from "@/components/explore-data/export/ShareDialog";

/** The report code a canvas has published, read the way the editor page reads it. */
const publishedCodeOf = (canvas: Canvas | null): string =>
  (canvas as { exportedReportCode?: string | null } | null)?.exportedReportCode ?? "";

export default function DataCanvasListPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Canvas | null>(null);
  // The published report code to manage links for; null closes the dialog.
  const [toShare, setToShare] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // What goes with the canvas, so the dialog can say it: how many share links open the dashboard
  // this canvas published (null while it is not known), and whether the person wants it kept.
  const [publishedLinks, setPublishedLinks] = useState<number | null>(null);
  const [keepPublished, setKeepPublished] = useState(false);
  // #36: the search box over the names, the canvas whose name is being typed again, and the demos
  // "New from a demo" offers (null while its dialog is closed).
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [demos, setDemos] = useState<{ id: string; name: string; description?: string | null }[] | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  const fetchCanvases = async () => {
    const data = await listCanvases();
    setCanvases(data as Canvas[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCanvases();
  }, []);

  const handleCreate = async () => {
    const canvas = await apiCreateCanvas("Untitled Canvas");
    router.push(`/explore-data/${canvas.id}`);
  };

  /** A copy of the canvas, "<name> (copy)", listed beside it (#36). */
  const handleDuplicate = async (canvas: Canvas, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateCanvas(canvas.id);
    await fetchCanvases();
  };

  const startRename = (canvas: Canvas, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameText(canvas.name);
    setRenaming(canvas.id);
  };

  /** The typed name is kept on Enter or when the box is left; an empty one changes nothing. */
  const commitRename = async (canvas: Canvas) => {
    const name = renameText.trim();
    setRenaming(null);
    if (!name || name === canvas.name) return;
    setCanvases((prev) => prev.map((c) => (c.id === canvas.id ? { ...c, name } : c)));
    await updateCanvas(canvas.id, { name });
  };

  const openDemos = async () => {
    setDemos(await listDemoCanvases());
  };

  /** A new canvas, a copy of the demo's, opened at once (#36). */
  const createFromDemo = async (demoId: string) => {
    setDemoBusy(true);
    try {
      const canvas = await createCanvasFromDemo(demoId);
      router.push(`/explore-data/${canvas.id}`);
    } finally {
      setDemoBusy(false);
    }
  };

  const shown = canvases.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  const handleDeleteClick = (canvas: Canvas, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepPublished(false);
    setPublishedLinks(null);
    setToDelete(canvas);
  };

  // The dialog names what else goes, and a number it cannot read is a number it does not claim.
  useEffect(() => {
    const code = publishedCodeOf(toDelete);
    if (!code) return;
    let alive = true;
    listShareLinks(code)
      .then((links) => { if (alive) setPublishedLinks(links.length); })
      .catch(() => { if (alive) setPublishedLinks(null); });
    return () => { alive = false; };
  }, [toDelete]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDeleteCanvas(toDelete.id, keepPublished);
      setCanvases((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!toDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setToDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toDelete, deleting]);

  // The second half of the delete dialog's sentence. A number that could not be read is not
  // claimed ("its share links"), and one link is not "1 share links".
  const linksPhrase =
    publishedLinks === null
      ? "its share links"
      : publishedLinks === 1
        ? "its 1 share link"
        : `its ${publishedLinks} share links`;
  const publishedConsequence =
    publishedLinks === 0
      ? keepPublished ? "keeps answering." : "is deleted too."
      : `and ${linksPhrase} ${keepPublished ? "keep answering." : "are deleted too."}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-base-content/60 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 id="explore-data-page-heading" className="text-2xl font-bold text-base-content">Explore Data</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Build interactive dashboards visually
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
          id="btnNewFromDemo"
          onClick={openDemos}
          title="Start from a copy of one of the shipped dashboard demos"
          className="px-4 py-2 rounded-lg border border-base-300 text-base-content text-sm font-medium hover:bg-base-200 transition-colors"
        >
          New from a demo
        </button>
        <button
          id="btnNewCanvas"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Canvas
        </button>
        </div>
      </div>

      {canvases.length > 0 && (
        <input
          id="inputSearchCanvases"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search canvases by name"
          className="w-full mb-4 text-sm bg-base-100 border border-base-300 rounded-lg px-3 py-2 text-base-content"
        />
      )}
      {canvases.length > 0 && shown.length === 0 && (
        <p id="txtNoCanvasMatch" className="text-sm text-base-content/60 mb-4">No canvas is named like that.</p>
      )}

      {canvases.length === 0 ? (
        <div className="border border-dashed border-base-300 rounded-xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto mb-4 text-base-content/30"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
          <h3 className="text-lg font-medium text-base-content mb-1">No canvases yet</h3>
          <p className="text-sm text-base-content/60 mb-4">
            Create your first canvas to start building a dashboard
          </p>
          <button
            id="btnNewCanvasEmpty"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Canvas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((canvas) => {
            const state = JSON.parse(canvas.state || "{}");
            const widgetCount = state.widgets?.length || 0;
            // The published report code is its own column on the canvas, returned at the top
            // level of the DTO — autosave writes only { widgets, parametersConfig } into `state`,
            // so it is never in there. Read it the same way the editor page does.
            const exportedReportCode = (canvas as { exportedReportCode?: string | null })
              .exportedReportCode;
            return (
              <div
                id={`canvasCard-${canvas.id}`}
                key={canvas.id}
                onClick={() => router.push(`/explore-data/${canvas.id}`)}
                className="group relative border border-base-300 rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all bg-base-100"
              >
                <div className="flex items-start justify-between mb-3">
                  {renaming === canvas.id ? (
                    <input
                      id={`inputRenameCanvas-${canvas.id}`}
                      autoFocus
                      value={renameText}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(canvas);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      onBlur={() => commitRename(canvas)}
                      className="font-medium text-sm text-base-content bg-base-100 border border-primary/40 rounded px-1 py-0.5 mr-24 min-w-0 flex-1"
                    />
                  ) : (
                    <h3 id={`canvasName-${canvas.id}`} className="font-medium text-base-content text-sm truncate pr-24">
                      {canvas.name}
                    </h3>
                  )}
                  {/* #36: rename and duplicate, beside share and delete. */}
                  <button
                    id={`btnRenameCanvas-${canvas.id}`}
                    onClick={(e) => startRename(canvas, e)}
                    aria-label={`Rename canvas ${canvas.name}`}
                    title="Rename"
                    className="absolute top-4 right-[4.75rem] p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-base-content/60 hover:text-primary transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" /></svg>
                  </button>
                  <button
                    id={`btnDuplicateCanvas-${canvas.id}`}
                    onClick={(e) => handleDuplicate(canvas, e)}
                    aria-label={`Duplicate canvas ${canvas.name}`}
                    title="Duplicate"
                    className="absolute top-4 right-[3.25rem] p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-base-content/60 hover:text-primary transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                  </button>
                  {/* Share — only for canvases that have actually been published, since a share
                      link points at /dashboard/{reportId} and that only exists after Publish. */}
                  {exportedReportCode && (
                    <button
                      id={`btnShareCanvas-${canvas.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setToShare(exportedReportCode as string);
                      }}
                      aria-label={`Share dashboard ${canvas.name}`}
                      title="Let people without an account open this dashboard"
                      className="absolute top-4 right-[1.75rem] p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-base-content/60 hover:text-primary transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                    </button>
                  )}
                  <button
                    id={`btnDeleteCanvas-${canvas.id}`}
                    onClick={(e) => handleDeleteClick(canvas, e)}
                    aria-label={`Delete canvas ${canvas.name}`}
                    className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-error/10 text-base-content/60 hover:text-error transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  <span>{widgetCount} component{widgetCount !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{new Date(canvas.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toDelete && (
        <div
          id="overlayDeleteCanvas"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deleting && setToDelete(null)}
        >
          <div
            id="dlgDeleteCanvas"
            className="bg-base-100 border border-base-300 rounded-xl shadow-lg w-full max-w-sm mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-canvas-title"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-error/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-error"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="delete-canvas-title" className="text-sm font-semibold text-base-content">
                  Delete canvas?
                </h2>
                <p className="text-xs text-base-content/60 mt-1">
                  <span className="font-medium text-base-content">{toDelete.name}</span> will be
                  permanently removed. This action cannot be undone.
                </p>
                {/* What else goes, said out loud: a published dashboard is a report of its own and
                    used to be deleted in silence (D2). */}
                {publishedCodeOf(toDelete) && (
                  <p id="txtDeleteCanvasPublished" className="text-xs text-base-content/60 mt-2">
                    Its published dashboard{" "}
                    <span className="font-medium text-base-content">
                      /dashboard/{publishedCodeOf(toDelete)}
                    </span>
                    {` ${publishedConsequence}`}
                  </p>
                )}
              </div>
            </div>
            {publishedCodeOf(toDelete) && (
              <label className="flex items-center gap-2 text-xs text-base-content cursor-pointer mt-3">
                <input
                  id="chkKeepPublished"
                  type="checkbox"
                  checked={keepPublished}
                  onChange={(e) => setKeepPublished(e.target.checked)}
                  disabled={deleting}
                  className="rounded border-base-300"
                />
                <span>Keep the published dashboard</span>
              </label>
            )}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                id="btnCancelDeleteCanvas"
                type="button"
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-base-300 text-base-content hover:bg-base-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="btnConfirmDeleteCanvas"
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                autoFocus
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-error text-error-content hover:bg-error/90 transition-colors disabled:opacity-60"
              >
                {deleting && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 animate-spin"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
                {deleting ? "Deleting…" : "Delete canvas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {demos !== null && (
        <div
          id="overlayNewFromDemo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !demoBusy && setDemos(null)}
        >
          <div
            id="dlgNewFromDemo"
            className="bg-base-100 border border-base-300 rounded-xl shadow-lg w-full max-w-lg mx-4 p-5 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-sm font-semibold text-base-content">New from a demo</h2>
            <p className="text-xs text-base-content/60 mt-1">A copy of the demo&apos;s canvas, yours to change; the demo itself stays as it is.</p>
            <div className="mt-3 overflow-auto space-y-1">
              {demos.length === 0 && <p className="text-xs text-base-content/60">No demo canvases are installed.</p>}
              {demos.map((demo) => (
                <button
                  id={`btnDemoCanvas-${demo.id}`}
                  key={demo.id}
                  type="button"
                  disabled={demoBusy}
                  onClick={() => createFromDemo(demo.id)}
                  className="w-full text-left px-3 py-2 rounded-md border border-base-300 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-base-content">{demo.name}</span>
                  {demo.description && <span className="block text-xs text-base-content/60 line-clamp-2">{demo.description}</span>}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                id="btnCloseNewFromDemo"
                type="button"
                onClick={() => setDemos(null)}
                disabled={demoBusy}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-base-300 text-base-content hover:bg-base-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toShare && (
        <ShareDialog open onClose={() => setToShare(null)} reportId={toShare} />
      )}
    </div>
  );
}
