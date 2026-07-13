import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  ExternalLink,
  Trash2,
  Pencil,
  Loader2,
  FolderOpen,
  ImageIcon,
} from "lucide-react";
import {
  usePortfolioProjects,
  useAddPortfolioProject,
  useUpdatePortfolioProject,
  useDeletePortfolioProject,
  type PortfolioProject,
} from "@/hooks/usePortfolioProjects";
import { PortfolioProjectForm } from "./PortfolioProjectForm";

interface PortfolioShowcaseProps {
  userId: string;
  isOwner: boolean;
}

export function PortfolioShowcase({ userId, isOwner }: PortfolioShowcaseProps) {
  const { data: projects = [], isLoading } = usePortfolioProjects(userId);
  const addProject = useAddPortfolioProject();
  const updateProject = useUpdatePortfolioProject();
  const deleteProject = useDeletePortfolioProject();
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<PortfolioProject | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Projects & Work
        </h3>
        {isOwner && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>
              <PortfolioProjectForm
                isPending={addProject.isPending}
                submitLabel="Add Project"
                onSubmit={async (data) => {
                  await addProject.mutateAsync(data);
                  setAddOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editProject && (
            <PortfolioProjectForm
              initial={editProject}
              isPending={updateProject.isPending}
              submitLabel="Save Changes"
              onSubmit={async (data) => {
                await updateProject.mutateAsync({
                  id: editProject.id,
                  title: data.title,
                  description: data.description ?? null,
                  image_url: data.image_url ?? null,
                  project_link: data.project_link ?? null,
                });
                setEditProject(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No projects showcased yet</p>
          {isOwner && (
            <p className="text-xs mt-1">Add your best work to stand out!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {project.image_url && (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {project.title}
                      </h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {project.project_link && (
                        <a
                          href={project.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {isOwner && (
                        <>
                          <button
                            onClick={() => setEditProject(project)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProject.mutate(project.id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            disabled={deleteProject.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
