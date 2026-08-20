import { cn } from "@/lib/utils";

describe("utils cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isHidden = false;
    const isFlex = true;
    expect(cn("base-class", isHidden && "hidden", isFlex && "flex")).toBe("base-class flex");
  });

  it("should resolve tailwind conflict classes with twMerge", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
