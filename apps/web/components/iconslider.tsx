import LogoLoop from "@/components/Logoloop";
import FadeInView from "./animate-ui/fade-in-view";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiRedis,
} from "react-icons/si";

const Ballpage = () => {
  const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    { node: <SiRedis />, title: "Redis", href: "https://redis.io" },
    { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
    {
      node: <SiTypescript />,
      title: "TypeScript",
      href: "https://www.typescriptlang.org",
    },
    {
      node: <SiTailwindcss />,
      title: "Tailwind CSS",
      href: "https://tailwindcss.com",
    },
  ];

  // Alternative with image sources
  const imageLogos = [
    {
      src: "/logos/company1.png",
      alt: "Company 1",
      href: "https://company1.com",
    },
    {
      src: "/logos/company2.png",
      alt: "Company 2",
      href: "https://company2.com",
    },
    {
      src: "/logos/company3.png",
      alt: "Company 3",
      href: "https://company3.com",
    },
  ];
  console.log("LogoLoop is:", LogoLoop);

  return (
    <section className="pb-20 pt-2 md:pb-32 md:pt-32 container mx-auto">
      <FadeInView className="text-center space-y-4 pb-16 mx-auto max-w-4xl">
        <h2 className="mx-auto mt-4 text-3xl text-muted-foreground font-bold sm:text-5xl tracking-tight">
          Technology Partners
        </h2>
      </FadeInView>
      <div
        style={{ height: "200px", position: "relative", overflow: "hidden" }}
      >
        <LogoLoop
          logos={techLogos}
          speed={120}
          direction="left"
          logoHeight={48}
          gap={40}
          pauseOnHover
          scaleOnHover
          fadeOut
          fadeOutColor="#ffffff"
          ariaLabel="Technology partners"
        />
      </div>
    </section>
  );
};
export default Ballpage;
