import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Apikey, UpdateApiKeyInput } from "@/lib/api-keys";
import { useState } from "react";
import { toast } from "sonner";

interface ApiKeyActionsProps {
  apiKey: Apikey;
  onUpdate: (input: UpdateApiKeyInput) => void;
  onDelete: (keyId: string) => void;
}

export function ApiKeyActions({ apiKey, onUpdate, onDelete }: ApiKeyActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopyPrefix = () => {
    if (apiKey.prefix) {
      navigator.clipboard.writeText(apiKey.prefix);
      toast.success("Prefix copied to clipboard");
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    onUpdate({ keyId: apiKey.id, enabled });
  };

  const handleDelete = () => {
    onDelete(apiKey.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          checked={apiKey.enabled ?? true}
          onCheckedChange={handleToggleEnabled}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyPrefix}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Prefix
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}