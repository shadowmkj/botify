import { parseTemplate } from "@/lib/templateParser";

describe("parseTemplate", () => {
  it("should return empty string if template is empty", () => {
    expect(parseTemplate("", {})).toBe("");
  });

  it("should replace template variables with order values", () => {
    const template = "Hi {customer_name}, your order #{order_number} for {total_price} {currency} is {financial_status}.";
    const order = {
      customer: { first_name: "Alice" },
      order_number: "1001",
      total_price: 250,
      currency: "USD",
      financial_status: "PAID",
    };

    const result = parseTemplate(template, order);
    expect(result).toBe("Hi Alice, your order #1001 for 250 USD is PAID.");
  });

  it("should replace {items_list} when line_items are provided", () => {
    const template = "Items:\n{items_list}";
    const order = {
      currency: "$",
      line_items: [
        { title: "Widget A", quantity: 2, price: 10 },
        { name: "Widget B", quantity: 1, price: 20 },
      ],
    };

    const result = parseTemplate(template, order);
    expect(result).toContain("Widget A x2 - $10");
    expect(result).toContain("Widget B x1 - $20");
  });

  it("should handle missing line items gracefully", () => {
    const template = "Order: {order_number}, Items: {items_list}";
    const order = {
      order_number: 123,
    };

    const result = parseTemplate(template, order);
    expect(result).toBe("Order: 123, Items: ");
  });

  it("should replace missing properties with empty string", () => {
    const template = "Email: {email}, Status URL: {order_status_url}";
    const order = {};

    const result = parseTemplate(template, order);
    expect(result).toBe("Email: , Status URL: ");
  });
});
