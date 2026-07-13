import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface WorkspaceFile {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export function useWorkspaceFiles(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["workspace-files", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("workspace_files")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkspaceFile[];
    },
    enabled: !!workspaceId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`workspace-files-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_files",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return query;
}

export function useUploadWorkspaceFile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      file,
    }: {
      workspaceId: string;
      file: File;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${workspaceId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("workspace-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("workspace-files")
        .getPublicUrl(filePath);

      // Create file record
      const { error: insertError } = await supabase.from("workspace_files").insert({
        workspace_id: workspaceId,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      });

      if (insertError) throw insertError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-files", variables.workspaceId] });
    },
  });
}

export function useDeleteWorkspaceFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      workspaceId,
      fileUrl,
    }: {
      fileId: string;
      workspaceId: string;
      fileUrl: string;
    }) => {
      // Extract file path from URL
      const urlParts = fileUrl.split("/workspace-files/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("workspace-files").remove([filePath]);
      }

      const { error } = await supabase.from("workspace_files").delete().eq("id", fileId);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-files", variables.workspaceId] });
    },
  });
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
