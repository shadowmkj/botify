
import Image from 'next/image';
import React from 'react';

const MarqueePartners = () => {
  const partners = [
    { name: 'Partner 1', logo: '/logo.png' },
    { name: 'Partner 2', logo: '/logo.png' },
    { name: 'Partner 3', logo: '/logo.png' },
    { name: 'Partner 4', logo: '/logo.png' },
    { name: 'Partner 5', logo: '/logo.png' },
    { name: 'Partner 6', logo: '/logo.png' },
    { name: 'Partner 7', logo: '/logo.png' },
    { name: 'Partner 8', logo: '/logo.png' },
    { name: 'Partner 9', logo: '/logo.png' },
    { name: 'Partner 10', logo: '/logo.png' },
  ];

  return (
    <div className="relative flex overflow-hidden max-w-7xl mx-auto">
      <div className="flex animate-marquee whitespace-nowrap">
        {partners.map((partner, index) => (
          <div key={index} className="flex-shrink-0 w-32 h-32 mx-4">
            <Image fill src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
          </div>
        ))}
      </div>
      <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
        {partners.map((partner, index) => (
          <div key={index} className="flex-shrink-0 w-32 h-32 mx-4">
            <Image fill src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueePartners;
