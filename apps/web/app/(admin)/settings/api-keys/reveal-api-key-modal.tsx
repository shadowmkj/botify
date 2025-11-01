import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RevealApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  prefix?: string | null;
}

export function RevealApiKeyModal({
  open,
  onOpenChange,
  apiKey,
  prefix,
}: RevealApiKeyModalProps) {
  const [showKey, setShowKey] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const handleCopyPrefix = () => {
    if (prefix) {
      navigator.clipboard.writeText(prefix);
      toast.success("Prefix copied to clipboard");
    }
  };

  const handleDone = () => {
    onOpenChange(false);
    setShowKey(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[560px] max-h-[85vh] overflow-y-auto overflow-x-hidden break-words">
        <DialogHeader className="min-w-0">
          <DialogTitle>API Key</DialogTitle>
          <DialogDescription className="break-words">
            This key is only shown once. Copy and store it securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 min-w-0">
          {/* Prefix */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Prefix</p>
            <div className="flex w-full items-center space-x-2 min-w-0">
              <div className="flex-1 min-w-0">
                <Input
                  className="w-full font-mono text-sm truncate"
                  value={prefix || ""}
                  readOnly
                  spellCheck={false}
                  type="text"
                />
              </div>
              <Button
                className="shrink-0"
                variant="outline"
                size="sm"
                onClick={handleCopyPrefix}
                disabled={!prefix}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">API Key</p>
            <div className="flex w-full items-center space-x-2 min-w-0">
              <div className="flex-1 min-w-0">
                <Input
                  className="w-full font-mono text-sm truncate"
                  value={apiKey}
                  readOnly
                  spellCheck={false}
                  type={showKey ? "text" : "password"}
                />
              </div>
              <Button
                className="shrink-0"
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                className="shrink-0"
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2 break-words">
            <p>Keep this key secure. Do not share it publicly.</p>
            <div>
              <p>Use it in your API requests as:</p>
              <pre className="mt-1 w-full max-w-full rounded-md bg-muted px-3 py-2 whitespace-pre-wrap break-words overflow-hidden">
                <code className="text-xs break-all">
                  Authorization: Bearer {showKey ? apiKey : "••••••••••••••••"}
                </code>
              </pre>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={handleDone}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
