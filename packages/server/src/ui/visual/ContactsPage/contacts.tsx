import React from 'react';
import ContactMethod from './contactMethod';
import EmailIcon from '../../icons/emailMono.svg';
import GithubIcon from '../../icons/githubMono.svg';
import FacebookIcon from '../../icons/facebookMono.svg';
import TwitterIcon from '../../icons/twitterMono.svg';

export default function Contacts() {
  return (
    <div className="grid gap-4 md:gap-8">
      <ContactMethod
        contactDescription="Email"
        contactLink="mailto: hi@rollingversions.com?subject=Rolling Versions"
        contactAddress="hi@rollingversions.com"
        contactIcon={EmailIcon}
      />
      <ContactMethod
        contactDescription="Twitter"
        contactLink="https://twitter.com/RollingVersions"
        contactAddress="@rollingversions"
        contactIcon={TwitterIcon}
      />
      <ContactMethod
        contactDescription="GitHub"
        contactLink="https://github.com/RollingVersions/RollingVersions"
        contactAddress="RollingVersions/RollingVersions"
        contactIcon={GithubIcon}
      />
      <ContactMethod
        contactDescription="Facebook"
        contactLink="https://www.facebook.com/RollingVersions/"
        contactAddress="Rolling Versions"
        contactIcon={FacebookIcon}
      />
    </div>
  );
}
