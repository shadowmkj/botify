interface LineItem {
  title?: string;
  name?: string;
  quantity?: number;
  price?: string | number;
}

interface TemplateOrder {
  customer?: { first_name?: string };
  email?: string;
  order_number?: string | number;
  total_price?: string | number;
  currency?: string;
  order_status_url?: string;
  financial_status?: string;
  created_at?: string;
  line_items?: LineItem[];
  [key: string]: unknown;
}

export function parseTemplate(template: string, order: TemplateOrder): string {
  if (!template) return "";

  // Helper to safely access nested object properties
  const getValue = (obj: unknown, path: string): string => {
    if (!obj || typeof obj !== "object") return "";
    const val = path.split(".").reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== "object") {
        return undefined;
      }
      return (acc as Record<string, unknown>)[part];
    }, obj);
    return val != null ? String(val) : "";
  };

  const variables: Record<string, string> = {
    '{customer_name}': getValue(order, 'customer.first_name'),
    '{email}': getValue(order, 'email'),
    '{order_number}': getValue(order, 'order_number'),
    '{total_price}': getValue(order, 'total_price'),
    '{currency}': getValue(order, 'currency'),
    '{order_status_url}': getValue(order, 'order_status_url'),
    '{financial_status}': getValue(order, 'financial_status'),
    '{created_at}': getValue(order, 'created_at'),
  };

  // Special computed variable: {items_list}
  if (order?.line_items && Array.isArray(order.line_items)) {
    const currency = getValue(order, 'currency') || '₹';
    const itemsList = order.line_items
      .map((item: LineItem) => `${item.title || item.name} x${item.quantity} - ${currency}${item.price}`)
      .join('\n');
    variables['{items_list}'] = itemsList;
  } else {
    variables['{items_list}'] = '';
  }

  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
}
