"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type Category = { id: string; name: string };
type Venue = { id: string; name: string };
type Faculty = { id: string; name: string; categories: Category[]; venues: Venue[] };

export default function AdminCategoriesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New faculty form
  const [newFacultyName, setNewFacultyName] = useState("");
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState<string | null>(null);

  // Per-faculty inline inputs
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [venueInputs, setVenueInputs] = useState<Record<string, string>>({});
  const [addingCategory, setAddingCategory] = useState<Record<string, boolean>>({});
  const [addingVenue, setAddingVenue] = useState<Record<string, boolean>>({});
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // Delete confirm modal
  const [deleteModal, setDeleteModal] = useState<{
    type: "faculty" | "category" | "venue";
    id: string;
    name: string;
    facultyId?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const facultyInputRef = useRef<HTMLInputElement>(null);

  async function loadFaculties() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/faculties`, { credentials: "include" });
      if (!res.ok) { setError("Failed to load faculties."); return; }
      const payload = await res.json();
      setFaculties(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadFaculties(); }, []);

  // ---------- Faculty ----------
  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!newFacultyName.trim()) return;
    setAddingFaculty(true);
    setFacultyError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/faculties`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFacultyName.trim() }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setFacultyError(payload?.message || "Failed to add faculty."); return; }
      setNewFacultyName("");
      setFaculties((prev) => [...prev, { ...(payload.data as Faculty), categories: [], venues: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      facultyInputRef.current?.focus();
    } catch {
      setFacultyError("Unable to add faculty.");
    } finally {
      setAddingFaculty(false);
    }
  }

  // ---------- Category ----------
  async function handleAddCategory(facultyId: string) {
    const name = categoryInputs[facultyId]?.trim();
    if (!name) return;
    setAddingCategory((p) => ({ ...p, [facultyId]: true }));
    setInlineErrors((p) => ({ ...p, [`cat-${facultyId}`]: "" }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/faculties/${facultyId}/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setInlineErrors((p) => ({ ...p, [`cat-${facultyId}`]: payload?.message || "Failed." }));
        return;
      }
      setCategoryInputs((p) => ({ ...p, [facultyId]: "" }));
      setFaculties((prev) =>
        prev.map((f) =>
          f.id === facultyId
            ? { ...f, categories: [...f.categories, payload.data as Category].sort((a, b) => a.name.localeCompare(b.name)) }
            : f
        )
      );
    } catch {
      setInlineErrors((p) => ({ ...p, [`cat-${facultyId}`]: "Unable to add." }));
    } finally {
      setAddingCategory((p) => ({ ...p, [facultyId]: false }));
    }
  }

  // ---------- Venue ----------
  async function handleAddVenue(facultyId: string) {
    const name = venueInputs[facultyId]?.trim();
    if (!name) return;
    setAddingVenue((p) => ({ ...p, [facultyId]: true }));
    setInlineErrors((p) => ({ ...p, [`venue-${facultyId}`]: "" }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/faculties/${facultyId}/venues`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setInlineErrors((p) => ({ ...p, [`venue-${facultyId}`]: payload?.message || "Failed." }));
        return;
      }
      setVenueInputs((p) => ({ ...p, [facultyId]: "" }));
      setFaculties((prev) =>
        prev.map((f) =>
          f.id === facultyId
            ? { ...f, venues: [...f.venues, payload.data as Venue].sort((a, b) => a.name.localeCompare(b.name)) }
            : f
        )
      );
    } catch {
      setInlineErrors((p) => ({ ...p, [`venue-${facultyId}`]: "Unable to add." }));
    } finally {
      setAddingVenue((p) => ({ ...p, [facultyId]: false }));
    }
  }

  // ---------- Delete ----------
  async function handleConfirmDelete() {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      let url = "";
      if (deleteModal.type === "faculty") url = `${API_BASE_URL}/admin/faculties/${deleteModal.id}`;
      if (deleteModal.type === "category") url = `${API_BASE_URL}/admin/categories/${deleteModal.id}`;
      if (deleteModal.type === "venue") url = `${API_BASE_URL}/admin/venues/${deleteModal.id}`;

      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok && res.status !== 204) return;

      if (deleteModal.type === "faculty") {
        setFaculties((prev) => prev.filter((f) => f.id !== deleteModal.id));
      } else if (deleteModal.type === "category") {
        setFaculties((prev) =>
          prev.map((f) => ({ ...f, categories: f.categories.filter((c) => c.id !== deleteModal.id) }))
        );
      } else {
        setFaculties((prev) =>
          prev.map((f) => ({ ...f, venues: f.venues.filter((v) => v.id !== deleteModal.id) }))
        );
      }
      setDeleteModal(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories &amp; Venues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage faculties, event categories, and venues. Organizers select from these when creating events.
        </p>
      </div>

      {/* Add Faculty */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleAddFaculty(e)} className="flex gap-2">
            <Input
              ref={facultyInputRef}
              placeholder="e.g. Faculty of Engineering"
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addingFaculty || !newFacultyName.trim()}>
              {addingFaculty ? "Adding..." : "Add Faculty"}
            </Button>
          </form>
          {facultyError && <p className="mt-2 text-sm text-destructive">{facultyError}</p>}
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Faculty list */}
      {!isLoading && !error && faculties.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No faculties yet. Add your first faculty above.
        </div>
      )}

      {faculties.map((faculty) => (
        <Card key={faculty.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{faculty.name}</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                onClick={() => setDeleteModal({ type: "faculty", id: faculty.id, name: faculty.name })}
              >
                Delete Faculty
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Categories */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories ({faculty.categories.length})
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {faculty.categories.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No categories yet.</span>
                )}
                {faculty.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium"
                  >
                    {cat.name}
                    <button
                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setDeleteModal({ type: "category", id: cat.id, name: cat.name, facultyId: faculty.id })}
                      aria-label={`Delete ${cat.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {/* Add category inline */}
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  className="h-8 text-sm flex-1"
                  value={categoryInputs[faculty.id] ?? ""}
                  onChange={(e) => setCategoryInputs((p) => ({ ...p, [faculty.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddCategory(faculty.id); } }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={addingCategory[faculty.id] || !categoryInputs[faculty.id]?.trim()}
                  onClick={() => void handleAddCategory(faculty.id)}
                >
                  + Add
                </Button>
              </div>
              {inlineErrors[`cat-${faculty.id}`] && (
                <p className="mt-1 text-xs text-destructive">{inlineErrors[`cat-${faculty.id}`]}</p>
              )}
            </div>

            <div className="border-t" />

            {/* Venues */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Venues ({faculty.venues.length})
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {faculty.venues.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No venues yet.</span>
                )}
                {faculty.venues.map((venue) => (
                  <span
                    key={venue.id}
                    className="flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium"
                  >
                    {venue.name}
                    <button
                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setDeleteModal({ type: "venue", id: venue.id, name: venue.name, facultyId: faculty.id })}
                      aria-label={`Delete ${venue.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {/* Add venue inline */}
              <div className="flex gap-2">
                <Input
                  placeholder="New venue name..."
                  className="h-8 text-sm flex-1"
                  value={venueInputs[faculty.id] ?? ""}
                  onChange={(e) => setVenueInputs((p) => ({ ...p, [faculty.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddVenue(faculty.id); } }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={addingVenue[faculty.id] || !venueInputs[faculty.id]?.trim()}
                  onClick={() => void handleAddVenue(faculty.id)}
                >
                  + Add
                </Button>
              </div>
              {inlineErrors[`venue-${faculty.id}`] && (
                <p className="mt-1 text-xs text-destructive">{inlineErrors[`venue-${faculty.id}`]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold capitalize">Delete {deleteModal.type}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">"{deleteModal.name}"</span>?
              {deleteModal.type === "faculty" && (
                <span className="block mt-1 text-destructive text-xs">
                  This will also delete all its categories and venues.
                </span>
              )}
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" disabled={isDeleting} onClick={() => setDeleteModal(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" disabled={isDeleting} onClick={() => void handleConfirmDelete()}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
