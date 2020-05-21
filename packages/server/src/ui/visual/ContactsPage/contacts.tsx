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
        contactIcon={
          <EmailIcon className="h-12 w-12" aria-label="Email Icon" role="img" />
        }
      />
      <ContactMethod
        contactDescription="Twitter"
        contactLink="https://twitter.com/RollingVersions"
        contactAddress="@rollingversions"
        contactIcon={
          <TwitterIcon
            className="h-12 w-12"
            aria-label="Twitter Logo"
            role="img"
          />
        }
      />
      <ContactMethod
        contactDescription="GitHub"
        contactLink="https://github.com/RollingVersions/RollingVersions"
        contactAddress="RollingVersions/RollingVersions"
        contactIcon={
          <GithubIcon
            className="h-12 w-12"
            aria-label="GitHub Logo"
            role="img"
          />
        }
      />
      <ContactMethod
        contactDescription="Facebook"
        contactLink="https://www.facebook.com/RollingVersions/"
        contactAddress="Rolling Versions"
        contactIcon={
          <FacebookIcon
            className="h-12 w-12"
            aria-label="Facebook Logo"
            role="img"
          />
        }
      />
    </div>
  );
}
