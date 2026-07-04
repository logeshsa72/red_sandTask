// frontend/src/components/ImageUploader.jsx
"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, ImagePlus, Loader2, AlertCircle, GripVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ImageUploader({ images, onChange }) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const uploadFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > 5 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) {
      setError("Only images under 5MB are allowed.");
      return;
    }
    if (images.length + validFiles.length > 10) {
      setError("Maximum 10 images allowed.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach((f) => formData.append("images", f));

      const res = await fetch(`${API_URL}/api/upload/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");

      onChange([...images, ...json.data.urls]);
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }, [images, onChange, token]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  // Drag to reorder
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const handleReorderStart = (idx) => { dragItem.current = idx; };
  const handleReorderEnter = (idx) => { dragOver.current = idx; };
  const handleReorderEnd = () => {
    const reordered = [...images];
    const dragged = reordered.splice(dragItem.current, 1)[0];
    reordered.splice(dragOver.current, 0, dragged);
    onChange(reordered);
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={() => !uploading && inputRef.current.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"}
          ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-indigo-600 font-medium">Uploading images…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Drop images here or <span className="text-indigo-600">click to browse</span>
            </p>
            <p className="text-xs text-slate-400">JPG, PNG, WebP · Max 5MB each · Up to 10 images</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> Drag to reorder · First image = cover photo
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((url, idx) => (
              <div
                key={url}
                draggable
                onDragStart={() => handleReorderStart(idx)}
                onDragEnter={() => handleReorderEnter(idx)}
                onDragEnd={handleReorderEnd}
                className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-grab active:cursor-grabbing"
              >
                <img src={url} alt={`property-${idx}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add more button */}
            {images.length < 10 && !uploading && (
              <button
                onClick={() => inputRef.current.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px] mt-1">Add more</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}