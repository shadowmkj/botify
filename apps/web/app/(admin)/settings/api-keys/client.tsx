"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiKeyService,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  ApiKeyWithSecret,
} from "@/lib/api-keys";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { ApiKeyActions } from "./api-key-actions";
import { RevealApiKeyModal } from "./reveal-api-key-modal";
import { useState } from "react";
import Link from "next/link";

const QUERY_KEY = ["api-keys"];

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKeyWithSecret | null>(null);

  const {
    data: apiKeys,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await ApiKeyService.list();
      if (error) throw error;

      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: ApiKeyService.create,
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Failed to create API key");
        return;
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setCreateDialogOpen(false);
      setNewApiKey(result.data);
      setRevealModalOpen(true);
      toast.success("API key created successfully");
    },
    onError: () => {
      toast.error("Failed to create API key");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ApiKeyService.update,
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Failed to update API key");
        return;
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("API key updated");
    },
    onError: () => {
      toast.error("Failed to update API key");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ApiKeyService.delete,
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Failed to delete API key");
        return;
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("API key deleted");
    },
    onError: () => {
      toast.error("Failed to delete API key");
    },
  });

  const handleCreate = (input: CreateApiKeyInput) => {
    createMutation.mutate(input);
  };

  const handleUpdate = (input: UpdateApiKeyInput) => {
    updateMutation.mutate(input);
  };

  const handleDelete = (keyId: string) => {
    deleteMutation.mutate(keyId);
  };

  if (error) {
    return <div className="p-4">Error loading API keys</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for programmatic access. Use them in requests with{" "}
            <code>Authorization: Bearer &lt;key&gt;</code>.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Keys are only shown once at creation. If you lose a key, create a
            new one and revoke the old one.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Note:If you need assistance integrating our API with your
            application, please reach out to our support team
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : apiKeys?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No API keys found.</p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            Create your first API key
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys?.map((key) => (
              <TableRow key={key.id}>
                <TableCell>{key.name || "Unnamed"}</TableCell>
                <TableCell>{key.prefix}</TableCell>
                <TableCell>
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {key.expiresAt
                    ? new Date(key.expiresAt).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>{key.enabled ? "Enabled" : "Disabled"}</TableCell>
                <TableCell>
                  <ApiKeyActions
                    apiKey={key}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      {newApiKey && (
        <RevealApiKeyModal
          open={revealModalOpen}
          onOpenChange={(open) => {
            setRevealModalOpen(open);
            if (!open) {
              setNewApiKey(null);
            }
          }}
          apiKey={newApiKey.key}
          prefix={newApiKey.prefix}
        />
      )}
      <div className="mt-8 pt-6 border-t">
        <Link href="/api-doc">
          <Button variant="outline">API Documentation</Button>
        </Link>
      </div>
    </div>
  );
}
