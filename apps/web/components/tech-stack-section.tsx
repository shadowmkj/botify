import { Code, Database, Layers, Lock, Zap } from "lucide-react";
import React from "react";
import { Badge } from "./ui/badge";

import FadeInView from "./animate-ui/fade-in-view";

const stack = [
  {
    name: "Built with Next.js & TypeScript",
    icon: <Zap className="h-6 w-6 text-primary" />,
    description:
      "Developed using Next.js and TypeScript, our app provides a fast, responsive, and secure platform. Enjoy a seamless UI/UX with real-time updates and advanced automation features",
  },
  {
    name: "Reliable Message Queue with Redis",
    icon: <Code className="h-6 w-6 text-blue-500" />,
    description:
      "We use Redis for advanced queue handling, allowing each message to be processed efficiently. This ensures your campaigns stay fast, organized, and reliable — even during peak loads.",
  },
  {
    name: "High-Speed WhatsApp Messaging",
    icon: <Layers className="h-6 w-6 text-sky-500" />,
    description:
      "Our bulk WhatsApp sender is built with Next.js and Redis Queue, ensuring smooth and instant delivery. Manage thousands of messages simultaneously without lag or server overload.",
  },
  {
    name: "Dockerized One-Click Installation",
    icon: <Lock className="h-6 w-6 text-primary" />,
    description:
      "Say goodbye to setup pain! Our software comes with a fully Dockerized deployment — install and run everything with just one command. No version conflicts, dependency issues, or manual configuration.",
  },
  {
    name: "Built for Marketing & Customer Engagement",
    icon: <Code className="h-6 w-6 text-indigo-500" />,
    description:
      "Automate WhatsApp campaigns, send promotions, alerts, or updates in bulk — all from a single dashboard. Engage your audience instantly and track delivery performance in real time",
  },
  {
    name: "Scalable Architecture with PostgreSQL",
    icon: <Database className="h-6 w-6 text-blue-600" />,
    description:
      "Backed by PostgreSQL, our system ensures data integrity, scalability, and performance. Easily manage contacts, campaigns, and message histories in a structured and secure environment.",
  },
];

export default function TechStackSection() {
  return (
    <section className="pb-20 pt-20 md:pb-8 md:pt-32 container mx-auto">
      <FadeInView className="text-center space-y-4 pb-16 mx-auto max-w-4xl">
        <Badge className="px-4 py-1.5 text-sm font-medium">Botify</Badge>
        <h2 className="mx-auto mt-4 text-3xl text-muted-foreground font-bold sm:text-5xl tracking-tight">
          Powered by Codenik
        </h2>
        <p className="text-xl text-muted-foreground pt-1">
          Built with the latest and most reliable technologies in the industry
        </p>
      </FadeInView>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((item, index) => (
          <FadeInView
            key={index}
            delay={0.1 * (index + 2)}
            className="group relative transition-shadow duration-300 hover:z-[1] hover:shadow-2xl hover:shadow-primary rounded-3xl border border-card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative space-y-8 py-12 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h5 className="text-xl text-muted-foreground font-semibold transition group-hover:text-primary">
                  {item.name}
                </h5>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </FadeInView>
        ))}
      </div>
    </section>
  );
}
