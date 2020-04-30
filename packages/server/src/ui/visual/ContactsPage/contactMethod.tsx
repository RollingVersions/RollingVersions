import React from 'react';

// Normally we make contact  links larger than the description
// as that is where users click
// However on mobile phones where description becomes a visual header
// this just looks wrong so we switch sizing around.
function ContactDescription({children}: {children: string}) {
  return <span className="font-poppins text-3xl sm:text-2xl">{children}</span>;
}
function ContactLink({children}: {children: React.ReactNode}) {
  return (
    <span className="font-sans text-2xl sm:text-3xl md:text-4xl  sm:col-span-2">
      {children}
    </span>
  );
}

// TODO Forbes in order to force unequal columns I'm declaring a grid of 3 cols - is that ok? I'm also messing around with top margin to get spacing working on mobile
export default function ContactMethod({
  contactDescription,
  contactLink,
  contactAddress,
  contactIcon,
}: {
  contactDescription: string;
  contactLink: string;
  contactAddress: string;
  contactIcon: any;
}) {
  return (
    <div className="grid items-center mb-8 sm:mb-4 sm:grid-cols-3">
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink>
        <a className="flex items-center" href={contactLink}>
          <img
            className="h-12"
            src={contactIcon}
            alt={contactDescription + ' Icon'}
          />{' '}
          {contactAddress}
        </a>
      </ContactLink>
    </div>
  );
}
