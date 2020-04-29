import React from 'react';

// Normally we make contact  links larger than the description
// as that is where users click
// However on mobile phones where description becomes a visual header
// this just looks wrong so we switch sizing around.
function ContactDescription({children}: {children: string}) {
  return <span className="font-poppins text-4xl sm:text-2xl">{children}</span>;
}
function ContactLink({children}: {children: React.ReactNode}) {
  return <span className="font-sans text-3xl">{children}</span>;
}

// TODO Forbes in order to force unequal columns I'm declaring a grid of 3 cols - is that ok? I'm also messing around with top margin to get spacing working on mobile
export default function ContactMethod({
  contactDescription,
  contactLink,
}: {
  contactDescription: string;
  contactLink: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 items-center mb-8 sm:mb-4 sm:grid-cols-3">
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink>{contactLink}</ContactLink>
    </div>
  );
}
