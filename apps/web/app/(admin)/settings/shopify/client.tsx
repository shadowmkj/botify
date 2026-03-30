"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  ShoppingBag,
  Save,
  Plug,
  Clock,
} from "lucide-react";

const shopifySchema = z.object({
  shopifyKey: z
    .string()
    .min(1, "Shopify API Key is required")
    .min(8, "API Key must be at least 8 characters"),
  shopifyDomain: z
    .string()
    .min(1, "Shopify Domain is required")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
      "Domain must be in the format: yourstore.myshopify.com"
    ),
  shopifyTemplateId: z.string().optional().nullable(),
});

type ShopifyFormValues = z.infer<typeof shopifySchema>;

interface ShopifySettingsClientProps {
  shopifyKey: string | null;
  shopifyDomain: string | null;
  updatedAt: Date | null;
  shopifyTemplateId?: string | null;
  templates?: { id: string; name: string }[];
}

export function ShopifySettingsClient({
  shopifyKey,
  shopifyDomain,
  updatedAt,
  shopifyTemplateId,
  templates = [],
}: ShopifySettingsClientProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      shopifyKey: shopifyKey ?? "",
      shopifyDomain: shopifyDomain ?? "",
      shopifyTemplateId: shopifyTemplateId ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  const isConnected = !!(shopifyKey && shopifyDomain);

  async function onSubmit(values: ShopifyFormValues) {
    try {
      const response = await fetch("/api/settings/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save Shopify settings");
        return;
      }

      toast.success("Shopify integration settings saved successfully");
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  async function handleTestConnection() {
    const values = form.getValues();
    const result = shopifySchema.safeParse(values);

    if (!result.success) {
      toast.error("Please fill in valid details before testing the connection");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/settings/shopify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Connection test failed");
        return;
      }

      toast.success("Shopify connection verified successfully!");
    } catch {
      toast.error("Connection test failed. Check your credentials.");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your integration settings
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Shopify Integration
              </CardTitle>
              <CardDescription className="mt-1">
                Connect your Shopify store to enable order notifications and
                customer messaging via WhatsApp.
              </CardDescription>
            </div>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={
                isConnected
                  ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10"
                  : ""
              }
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          {updatedAt && isConnected && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Last updated:{" "}
                {new Date(updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Shopify API Key */}
              <FormField
                control={form.control}
                name="shopifyKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shopify API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          id="shopify-api-key"
                          type={showApiKey ? "text" : "password"}
                          placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                          className="pr-10 font-mono text-sm"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={showApiKey ? "Hide API key" : "Show API key"}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your Shopify Admin API access token. Found in your Shopify
                      Admin → Apps → API credentials.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Shopify Domain */}
              <FormField
                control={form.control}
                name="shopifyDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shopify Domain</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="shopify-domain"
                        type="text"
                        placeholder="yourstore.myshopify.com"
                        className="font-mono text-sm"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Your shop's myshopify.com domain (e.g.,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        yourstore.myshopify.com
                      </code>
                      ). Do not include{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        https://
                      </code>
                      .
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message Template Selection */}
              <FormField
                control={form.control}
                name="shopifyTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Template</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No template (Use default text)</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the template to be used when sending order notifications via Baileys.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                  id="save-shopify-settings"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="gap-2"
                  id="test-shopify-connection"
                >
                  <Plug className="h-4 w-4" />
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
        <h3 className="text-sm font-medium mb-2">How to get your Shopify credentials</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Log in to your Shopify Admin panel</li>
          <li>
            Go to <strong>Settings → Apps and sales channels → Develop apps</strong>
          </li>
          <li>Create a new app or select an existing one</li>
          <li>
            Under <strong>API credentials</strong>, find your Admin API access token
          </li>
          <li>
            Your domain is your store URL:{" "}
            <code className="text-xs bg-background px-1 py-0.5 rounded border">
              yourstore.myshopify.com
            </code>
          </li>
          <li>
            Message templates can be managed in the{" "}
            <a href="/templates" className="text-primary hover:underline font-medium">Message Templates</a> tab.
          </li>
        </ol>
      </div>
    </div>
  );
}
