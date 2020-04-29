import React from 'react';
import ContactMethod from './contactMethod';
import EmailIcon from '../../icons/emailMono.svg';

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
            <span>
              <img src={EmailIcon} height="1em" alt="Email Icon" />{' '}
              hi@rollingversions.com
            </span>
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
      <ContactMethod
        contactDescription="On Facebook"
        contactLink={
          <a href="https://www.facebook.com/RollingVersions/">
            Rolling Versions
          </a>
        }
      />
    </div>
  );
}
