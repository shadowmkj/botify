import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateApiKeyInput } from "@/lib/api-keys";

const createApiKeySchema = z.object({
  name: z.string().optional(),
  expiresIn: z.number().optional(),
  prefix: z.string().optional(),
  remaining: z.number().optional(),
});

type CreateApiKeyForm = z.infer<typeof createApiKeySchema>;

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateApiKeyInput) => void;
  isLoading: boolean;
}

const expiryOptions = [
  { label: "Never", value: -1 },
  { label: "30 days", value: 30 * 24 * 60 * 60 },
  { label: "90 days", value: 90 * 24 * 60 * 60 },
  { label: "1 year", value: 365 * 24 * 60 * 60 },
];

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateApiKeyDialogProps) {
  const form = useForm<CreateApiKeyForm>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      expiresIn: undefined,
      prefix: "",
      remaining: undefined,
    },
  });

  const handleSubmit = (data: CreateApiKeyForm) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My API Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="mykey" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : undefined)
                    }
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expiryOptions.map((option) => (
                        <SelectItem
                          key={option.label}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="remaining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remaining Requests</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
