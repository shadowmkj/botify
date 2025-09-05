### Task: Add a Marquee Display of Partner Logos

**Objective:** Create a new component to display partner logos in a horizontally scrolling marquee and integrate it into the homepage.

**Implementation Steps:**

1.  **Create the Component File:**
    *   Create a new file at `apps/web/components/marquee-partners.tsx`.

2.  **Implement the Marquee Logic:**
    *   Use HTML and CSS to create a container that moves its children horizontally.
    *   The animation should be a continuous, smooth scroll from right to left.
    *   The logos should loop infinitely.

3.  **Add Placeholder Logos:**
    *   For now, use simple placeholder logos. We can use `div` elements with background colors or simple SVG icons to represent the logos.
    *   The component will be designed to easily accept a list of logo URLs or components in the future.

4.  **Integrate into the Homepage:**
    *   Open the file `apps/web/app/(root)/page.tsx`.
    *   Import the new `MarqueePartners` component.
    *   Add the `<MarqueePartners />` component right below the `<TechStackSection />`.

5.  **Styling:**
    *   Use Tailwind CSS for styling to ensure consistency with the rest of the application.
    *   Add styles for the marquee container, the scrolling track, and the individual logo elements.
    *   Ensure the marquee is responsive and looks good on different screen sizes.

**File to be Modified:**

*   `apps/web/app/(root)/page.tsx`

**New File to be Created:**

*   `apps/web/components/marquee-partners.tsx`
