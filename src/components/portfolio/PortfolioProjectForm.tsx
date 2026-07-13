import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { uploadPortfolioImage, type PortfolioProject } from "@/hooks/usePortfolioProjects";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PortfolioProjectFormProps {
  initial?: PortfolioProject | null;
  isPending: boolean;
  onSubmit: (data: {
    title: string;
    description?: string;
    image_url?: string | null;
    project_link?: string;
  }) => Promise<void>;
  submitLabel: string;
}

export function PortfolioProjectForm({ initial, isPending, onSubmit, submitLabel }: PortfolioProjectFormProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    project_link: initial?.project_link ?? "",
  });
  const [previewUrl, setPreviewUrl] = useState(initial?.image_url ?? "");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadPortfolioImage(user.id, file);
      setForm((f) => ({ ...f, image_url: url }));
      setPreviewUrl(url);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, image_url: "" }));
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      image_url: form.image_url.trim() || undefined,
      project_link: form.project_link.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          placeholder="Project name"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="What did you build or contribute to?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="resize-none min-h-[80px]"
          maxLength={500}
        />
      </div>
      <div className="space-y-2">
        <Label>Project Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full h-20 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Upload image"}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <Label>Project Link</Label>
        <Input
          placeholder="https://github.com/..."
          value={form.project_link}
          onChange={(e) => setForm({ ...form, project_link: e.target.value })}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!form.title.trim() || isPending || uploading}
        className="w-full gradient-primary border-0"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}
