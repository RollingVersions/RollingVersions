import React from 'react';

function ContactDescription({children}: {children: string}) {
  return (
    <span className="font-poppins text-gray-700 text-sm sm:text-xl md:text-2xl">
      {children}
    </span>
  );
}
function ContactLink({children}: {children: React.ReactNode}) {
  return (
    <span className="font-sans text-gray-900 text-2xl sm:text-3xl md:text-4xl sm:col-span-3">
      {children}
    </span>
  );
}

// TODO in order to force unequal columns I'm declaring a grid of multiple cols and spanning with the ContactLink - is that ok? I'm also messing around with top margin to get spacing working on mobile
// TODO All the icons I'm using have the same size viewports, so I've fixed h and w to the same amount, but I'm not sure if this is right as some icons could be different
export default function ContactMethod({
  contactDescription,
  contactLink,
  contactAddress,
  contactIcon,
}: {
  contactDescription: string;
  contactLink: string;
  contactAddress: string;
  contactIcon: string;
}) {
  return (
    <div className="grid items-center mb-8 sm:mb-4 sm:grid-cols-4">
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink>
        <a className="flex items-center" href={contactLink}>
          <img
            className="h-12 w-12"
            src={contactIcon}
            alt={contactDescription + ' Icon'}
          />{' '}
          {contactAddress}
        </a>
      </ContactLink>
    </div>
  );
}
