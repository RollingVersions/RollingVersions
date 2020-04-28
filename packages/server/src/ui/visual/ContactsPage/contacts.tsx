import React from 'react';

function ContactMethod({children}: {children: string}) {
  return <p className="font-poppins text-4xl">{children}</p>;
}
function Description({children}: {children: React.ReactNode}) {
  return <p className="font-sans text-2xl">{children}</p>;
}

// TODO put method and links on same row
// TODO show as links
export default function Contacts() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl grid grid-cols-1 gap-10">
        <section>
          <ContactMethod>By Email</ContactMethod>
          <Description>
            <a href="mailto: hi@rollingversions.com?subject = Rolling Versions">
              hi@rollingversions.com
            </a>
          </Description>
        </section>
        <section>
          <ContactMethod>By Twitter</ContactMethod>
          <Description>@rollingversions</Description>
        </section>
        <section>
          <ContactMethod>On GitHub</ContactMethod>
          <Description>
            <a href="https://github.com/RollingVersions/RollingVersions">
              RollingVersions/RollingVersions
            </a>
          </Description>
        </section>
      </div>
    </div>
  );
}
