/**
 * Privacy policy (/privacy/, footer link "Privacy Policy", Danish
 * "privatlivspolitik").
 *
 * DRAFT. Not legal advice. Written from the brief and from what the code of
 * this site does on 4 Oct 2026. Simon must review it, and ideally a lawyer,
 * before launch.
 *
 * What the code does (checked by searching src/, public/ and dist/ for
 * cookies, localStorage, sessionStorage, IndexedDB, analytics and tracking
 * tags, and for external URLs):
 * - No cookies are set, no localStorage / sessionStorage / IndexedDB is used,
 *   no analytics, advertising or social media scripts are loaded.
 * - Fonts (@fontsource), images and videos are served from the site itself.
 *   The only external links are to Amazon ("Buy now", "Shopping basket").
 * - The Home page reads document.referrer and the navigation type in the
 *   browser to decide whether to play the intro animation. Nothing is stored
 *   or sent.
 * - Subscribe form (Footer.astro): with NEWSLETTER_ENDPOINT empty in
 *   src/data/site.ts it opens a prefilled mail to hi@exoskins.shop in the
 *   visitor's mail app; nothing is sent by the site itself.
 *
 * Open points for Simon:
 * 1. Company registration number (CVR): unknown, so it is not printed.
 *    Add it to the "Who is responsible" section.
 * 2. Retention periods: the text says "until you unsubscribe" and "until the
 *    enquiry is closed". Confirm, or set fixed periods.
 * 3. Email and newsletter provider: not chosen. When NEWSLETTER_ENDPOINT is
 *    set, the "News and drop notifications" text must be changed (the form
 *    then sends the address straight to that provider) and the provider named
 *    under "Who we share data with".
 * 4. Hosting provider: not chosen. Name it, and state where it stores its
 *    server logs and for how long.
 * 5. Amazon orders: if eXo receives order data from Amazon (for example a
 *    delivery address for orders eXo ships itself), this policy must describe
 *    that processing too.
 */

/** Inline links use [label](href); href is a full URL, mailto: or tel:. */
export type PrivacyBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

export interface PrivacySection {
  heading: string;
  blocks: PrivacyBlock[];
}

export const PRIVACY_TITLE = 'Privacy Policy';

export const PRIVACY_DESCRIPTION =
  'What personal data eXo collects through exoskins.shop, why, how long it is kept and what your rights are.';

/** Shown under the title; ISO date for the <time> element. */
export const PRIVACY_UPDATED = { label: '4 October 2026', iso: '2026-10-04' } as const;

export const PRIVACY_INTRO =
  'This policy explains what personal data eXo collects through exoskins.shop, why we collect it, and what rights you have. The site collects very little, and this page says exactly what.';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    heading: 'Who is responsible',
    blocks: [
      {
        type: 'p',
        text: 'eXo is the data controller for the personal data described in this policy.',
      },
      {
        type: 'ul',
        items: [
          'eXo, Glimvej 17, 2650 Hvidovre, Denmark',
          'Email: [hi@exoskins.shop](mailto:hi@exoskins.shop)',
          'Phone: [+45 6061 6041](tel:+4560616041)',
        ],
      },
      {
        type: 'p',
        text: 'If you have questions about this policy or about your data, write to [hi@exoskins.shop](mailto:hi@exoskins.shop).',
      },
    ],
  },
  {
    heading: 'What we collect and why',
    blocks: [
      {
        type: 'ul',
        items: [
          'News and drop notifications. When you use "Subscribe to news" or "Get notified here", the form opens a prefilled email in your own mail app. We receive your email address only if you send that email. We use it to tell you about new skins and eXo news.',
          'When you contact us. If you email or call us, we receive what you send: your email address or phone number, your name if you give it, and your message. We use it to answer you.',
          'Server logs. When you visit the site, the servers of our hosting provider record the technical data that every web request carries: your IP address, the date and time, the page requested, the referring page and your browser type. This data is used to deliver the site and keep it secure.',
        ],
      },
      {
        type: 'p',
        text: 'The site has no user accounts and takes no payments. We do not ask for your name, postal address or payment details on this site.',
      },
    ],
  },
  {
    heading: 'Buying on Amazon',
    blocks: [
      {
        type: 'p',
        text: 'eXo skins are sold through Amazon. "Buy now" and "Shopping basket" take you to Amazon. Your order, payment and delivery are handled there, and Amazon is responsible for that data under its own privacy notice, which you find on the Amazon site you buy from.',
      },
    ],
  },
  {
    heading: 'Cookies and tracking',
    blocks: [
      {
        type: 'p',
        text: 'exoskins.shop sets no cookies. At the time of writing it uses no analytics, no advertising or tracking tools and no social media plugins, and it does not use your browser’s local storage or session storage.',
      },
      {
        type: 'p',
        text: 'Fonts, images and videos are served from the site itself, so loading a page does not contact other companies. On the Home page, a small script checks in your browser whether you came from another page of this site, only to decide whether to play the opening animation. Nothing is stored or sent.',
      },
      {
        type: 'p',
        text: 'If we add analytics or other tools later, we will update this policy first and ask for your consent where the law requires it.',
      },
    ],
  },
  {
    heading: 'Legal basis',
    blocks: [
      {
        type: 'ul',
        items: [
          'News and drop notifications: your consent (GDPR Article 6(1)(a)). You can withdraw it at any time.',
          'Answering your enquiries: our legitimate interest in replying to people who contact us (GDPR Article 6(1)(f)).',
          'Server logs: our legitimate interest in delivering a working and secure website (GDPR Article 6(1)(f)).',
        ],
      },
    ],
  },
  {
    heading: 'How long we keep your data',
    blocks: [
      {
        type: 'ul',
        items: [
          'News and drop notifications: until you unsubscribe or withdraw your consent. Then we delete your address.',
          'Enquiries: until your enquiry is answered and closed, unless the law requires us to keep it longer.',
          'Server logs: for a limited period set by the hosting provider, to run and secure the site.',
        ],
      },
    ],
  },
  {
    heading: 'Who we share data with',
    blocks: [
      {
        type: 'p',
        text: 'We use service providers who process data on our behalf and only on our instructions:',
      },
      {
        type: 'ul',
        items: [
          'our hosting provider, which runs the website and its server logs',
          'our email provider, which handles the email you send us and our replies',
        ],
      },
      {
        type: 'p',
        text: 'We do not sell your data, and we do not share it for advertising. We only pass it to public authorities where the law requires us to.',
      },
    ],
  },
  {
    heading: 'Transfers outside the EU',
    blocks: [
      {
        type: 'p',
        text: 'Some of our service providers may process data outside the EU and EEA, for example in the United States. When that happens, the transfer follows the GDPR’s rules for transfers: it is based on an adequacy decision of the European Commission, such as the EU-US Data Privacy Framework for certified companies, or on the Commission’s standard contractual clauses. You can ask us which safeguard applies.',
      },
    ],
  },
  {
    heading: 'Your rights',
    blocks: [
      {
        type: 'p',
        text: 'Under the GDPR you have the right to:',
      },
      {
        type: 'ul',
        items: [
          'access the personal data we hold about you',
          'have incorrect data corrected',
          'have your data deleted',
          'have the processing of your data restricted',
          'object to processing that is based on our legitimate interest',
          'receive your data in a structured, machine-readable format (data portability)',
          'withdraw your consent at any time, without affecting processing that took place before',
        ],
      },
      {
        type: 'p',
        text: 'To use any of these rights, email [hi@exoskins.shop](mailto:hi@exoskins.shop). We answer within one month.',
      },
    ],
  },
  {
    heading: 'Complaints',
    blocks: [
      {
        type: 'p',
        text: 'If you think we handle your data wrongly, you can complain to the Danish Data Protection Agency (Datatilsynet) at [datatilsynet.dk](https://www.datatilsynet.dk/). We would also like to hear from you, so we can try to put it right.',
      },
    ],
  },
  {
    heading: 'Changes to this policy',
    blocks: [
      {
        type: 'p',
        text: 'We update this policy when the site or the way we use data changes. The date at the top shows when it was last changed.',
      },
    ],
  },
];
