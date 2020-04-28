import React from 'react';
import ContactMethod from './contactMethod';

// TODO make more obvious that these are links?
// TODO twitter link - no idea how to do this
// TODO maybe? symbols for github, twitter and mail?
export default function Contacts() {
  return (
    <div className="container mx-auto">
      <ContactMethod
        contactDescription="By Email"
        contactLink={
          <a href="mailto: hi@rollingversions.com?subject=Rolling Versions">
            hi@rollingversions.com
          </a>
        }
      />
      <ContactMethod
        contactDescription="By Twitter"
        contactLink={
          <a href="https://twitter.com/RollingVersions">@rollingversions</a>
        }
      />
      <ContactMethod
        contactDescription="On Github"
        contactLink={
          <a href="https://github.com/RollingVersions/RollingVersions">
            RollingVersions/RollingVersions
          </a>
        }
      />
    </div>
  );
}
