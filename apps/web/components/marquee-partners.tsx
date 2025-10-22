import Image from "next/image";
import React from "react";

const MarqueePartners = () => {
  const partners = [
    { name: "Partner 1", logo: "/docker.png" },
    { name: "Partner 2", logo: "/nextjs.png" },
    { name: "Partner 3", logo: "/redis.png" },
    { name: "Partner 4", logo: "/postgress.png" },
    { name: "Partner 5", logo: "/tailwind.png" },
  ];

  return (
    <div className="relative flex overflow-hidden max-w-7xl mx-auto py-8">
      <div className="flex animate-marquee whitespace-nowrap items-center space-x-8">
        {partners.map((partner, index) => (
          <div key={index} className="flex-shrink-0 w-32 h-32 mx-4 relative">
            <Image
              fill
              src={partner.logo}
              alt={partner.name}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
      <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap items-center space-x-8">
        {partners.map((partner, index) => (
          <div key={index} className="flex-shrink-0 w-32 h-32 mx-4 relative">
            <Image
              fill
              src={partner.logo}
              alt={partner.name}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueePartners;
