import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UnsavedChangesDialogProps {
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onSave,
  onDiscard,
  onCancel,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Would you like to save them before proceeding?"
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <div className="flex gap-3 justify-end mt-4">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium"
          >
            Discard
          </button>
          <AlertDialogAction onClick={onSave} className="bg-primary">
            Save Changes
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
