import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PortfolioProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_link: string | null;
  created_at: string;
  updated_at: string;
}

export function usePortfolioProjects(userId?: string) {
  return useQuery({
    queryKey: ["portfolio-projects", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("portfolio_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PortfolioProject[];
    },
    enabled: !!userId,
  });
}

export function useAddPortfolioProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: {
      title: string;
      description?: string;
      image_url?: string;
      project_link?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("portfolio_projects")
        .insert({ ...project, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects", user?.id] });
    },
  });
}

export function useUpdatePortfolioProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string | null;
      image_url?: string | null;
      project_link?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("portfolio_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects", user?.id] });
    },
  });
}

export function useDeletePortfolioProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("portfolio_projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects", user?.id] });
    },
  });
}

export async function uploadPortfolioImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("portfolio-images")
    .upload(filePath, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage
    .from("portfolio-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
