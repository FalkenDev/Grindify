/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

/*
 * Legal documents (privacy policy, terms, legal notice). Rendered by
 * components/legal/LegalDocument.vue – this is the single source of the texts.
 *
 * Available placeholders: {operator}, {email}, {city}, {country}, {backupDays}, {logDays}.
 * Note: vue-i18n treats { } @ $ | as special characters – do not use them literally.
 */

export default {
  versionLine: 'Version {version} · Effective {date}',
  notConfiguredValue: '[not configured]',
  notConfiguredTitle: 'Operator details missing',
  notConfiguredText:
    'The operator of this instance has not configured all legal details. Values marked [not configured] must be set before the service is used in production. Missing: {missing}',

  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        title: '1. Data controller',
        paragraphs: [
          '{operator} is the data controller for the personal data processed in this Grindify instance (“the Service”). Contact: {email}.',
          'Grindify is open-source software. This instance is operated by {operator}, who decides how your data is processed.',
        ],
      },
      {
        title: '2. Personal data we process',
        items: [
          {
            label: 'Account data',
            text: 'First and last name, email address, password (stored only as a secure hash), profile picture, language, unit and display preferences.',
          },
          {
            label: 'Sign-in with Google or GitHub',
            text: 'If you choose to sign in with Google or GitHub we receive and store your account ID with that provider, your name, email address and profile picture. The profile picture is downloaded and stored on our server.',
          },
          {
            label: 'Body and health data',
            text: 'Body weight and weight logs, height, target weight and weight goal, gender, date of birth, and progress photos including their date, pose and notes. Weight, body measurements and progress photos are health data (a special category of personal data under Art. 9 GDPR).',
          },
          {
            label: 'Training data',
            text: 'Workouts, exercises, sessions, sets, repetitions, weights, RPE, activities, schedules, goals, streaks, and images you upload for your own exercises.',
          },
          {
            label: 'Technical and security data',
            text: 'Login times, IP address and browser/user agent in security logs, and technical server logs.',
          },
          {
            label: 'Consent records',
            text: 'Date and version of the terms and privacy policy you accepted, and the date you consented to the processing of health data.',
          },
        ],
      },
      {
        title: '3. Purposes and legal bases',
        items: [
          {
            label: 'Providing the Service – Art. 6(1)(b) GDPR (contract)',
            text: 'Creating and managing your account, storing and displaying your training data and statistics, and sending necessary emails such as verification codes and password resets.',
          },
          {
            label: 'Health data – Art. 6(1)(a) and Art. 9(2)(a) GDPR (explicit consent)',
            text: 'Body weight, body measurements, target weight and progress photos are only processed with your explicit consent, which you give separately. The consent is voluntary: you can use Grindify without it, only the weight, body measurement and progress photo features are then unavailable. You can give or withdraw it at any time in Settings without affecting the rest of your account.',
          },
          {
            label: 'Security – Art. 6(1)(f) GDPR (legitimate interest)',
            text: 'Protecting your account and the Service against abuse, for example rate limiting of login attempts and security logs.',
          },
          {
            label: 'Legal obligations – Art. 6(1)(c) GDPR',
            text: 'When we are required by law to keep or disclose data.',
          },
        ],
        after: [
          'We do not use your data for advertising, profiling or analytics, and we never sell it.',
        ],
      },
      {
        title: '4. Recipients and processors',
        items: [
          {
            label: 'Hosting',
            text: 'The Service and its database are hosted on servers operated by {operator}.',
          },
          {
            label: 'CDN/proxy',
            text: 'Traffic to the Service may pass through a CDN/proxy provider that the operator uses to deliver and protect the Service. The provider then processes technical data such as your IP address on behalf of the operator. If the provider is located outside the EU/EEA (for example in the USA), the transfer relies on the EU–US Data Privacy Framework and/or the EU Standard Contractual Clauses.',
          },
          {
            label: 'Email (Resend, USA)',
            text: 'Transactional emails such as verification codes and password resets are sent via Resend. Your email address and the content of those emails are transferred to the USA based on the EU–US Data Privacy Framework and/or the EU Standard Contractual Clauses.',
          },
          {
            label: 'Google and GitHub (USA)',
            text: 'Only if you choose to sign in with Google or GitHub. The provider then learns that you use the Service. Their own privacy policies apply to their processing.',
          },
          {
            label: 'Administrators',
            text: 'Administrators of the Service can see account details (such as name, email address, registration date and verification status) and aggregated statistics about how the Service is used. Access is limited to what is needed to run and support the Service.',
          },
        ],
      },
      {
        title: '5. Cookies and local storage',
        items: [
          {
            label: 'auth_token (cookie)',
            text: 'A strictly necessary httpOnly cookie that keeps you signed in. It cannot be read by scripts and is removed when you log out.',
          },
          {
            label: 'Local storage on your device',
            text: 'Your login status and basic profile, cached training data (workouts, exercises, sessions) for speed and offline use, and your language and theme preference. User data is removed from the device when you log out; language and theme are kept.',
          },
          {
            label: 'App cache',
            text: 'The app files are cached by a service worker so the app loads quickly and works offline.',
          },
        ],
        after: [
          'We do not use any tracking, analytics or advertising cookies. Storage that is strictly necessary to provide the Service does not require consent, which is why no cookie banner is shown.',
        ],
      },
      {
        title: '6. Retention',
        items: [
          { text: 'Your data is kept for as long as you have an account.' },
          {
            text: 'When you delete your account, your personal data and uploaded files (progress photos, profile picture, exercise images) are deleted immediately.',
          },
          {
            text: 'When you withdraw your consent to health data, your weight logs, progress photos and body measurements are deleted immediately. Your account and training data are kept.',
          },
          {
            text: 'Backups are overwritten within {backupDays} days, after which deleted data is also gone from the backups.',
          },
          { text: 'Security logs are kept for {logDays} days.' },
        ],
      },
      {
        title: '7. Your rights',
        items: [
          {
            label: 'Access and data portability (Art. 15 and 20)',
            text: 'Under Settings you can export all your data as a zip file containing your data in JSON format together with your uploaded images.',
          },
          {
            label: 'Rectification (Art. 16)',
            text: 'You can edit your details under Settings at any time.',
          },
          {
            label: 'Erasure (Art. 17)',
            text: 'You can delete your account and all data under Settings.',
          },
          {
            label: 'Withdraw consent (Art. 7(3))',
            text: 'You can withdraw your consent to health data under Settings at any time. Your account keeps working; only the health data features are disabled. Withdrawal does not affect processing that took place before it.',
          },
          {
            label: 'Restriction and objection (Art. 18 and 21)',
            text: 'You can request restricted processing and object to processing based on legitimate interest.',
          },
        ],
        after: ['To exercise your rights, contact {email}. We respond within one month.'],
      },
      {
        title: '8. Security',
        paragraphs: [
          'Passwords are stored as secure hashes, traffic is encrypted, the login cookie is not accessible to scripts, and progress photos can only be accessed by you when signed in.',
        ],
      },
      {
        title: '9. Right to lodge a complaint',
        paragraphs: [
          'If you believe that your personal data is processed in breach of the GDPR, you can lodge a complaint with the Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten, IMY), imy.se, phone +46 8 657 61 00.',
        ],
      },
      {
        title: '10. Changes',
        paragraphs: [
          'If we make material changes to this policy, the version number is updated and you will be asked to review and accept the new version in the app.',
        ],
      },
      {
        title: '11. Contact',
        paragraphs: ['Questions about privacy: {email}.'],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    sections: [
      {
        title: '1. Acceptance',
        paragraphs: [
          'By creating an account and using Grindify (“the Service”) you agree to these terms. If you do not agree, you may not use the Service.',
        ],
      },
      {
        title: '2. The Service',
        paragraphs: [
          'Grindify is a fitness tracking application for planning workouts, logging sessions, tracking progress and setting goals. This instance of the Service is provided by {operator} (“we”, “us”).',
        ],
      },
      {
        title: '3. Account and security',
        paragraphs: [
          'You must provide accurate information and be at least 16 years old. You are responsible for keeping your login details secret and for activity on your account. Tell us immediately if you suspect unauthorised use.',
        ],
      },
      {
        title: '4. Your data',
        paragraphs: [
          'You keep ownership of the data you enter (workouts, measurements, goals and so on). We only process it to provide the Service to you, as described in the Privacy Policy. We do not sell your data.',
        ],
      },
      {
        title: '5. Content you upload',
        paragraphs: [
          'You own the images you upload, such as progress photos, profile pictures and exercise images. You give us a limited, non-exclusive right to store, process and display them solely to provide the Service to you. They are not published, shared with other users, or used for marketing, AI training or any other purpose.',
          'You may only upload content you have the right to use, and it must not be unlawful or infringe the rights of others. Content is deleted when you delete it or your account.',
        ],
      },
      {
        title: '6. Prohibited use',
        items: [
          { text: 'Using the Service for unlawful purposes' },
          { text: 'Attempting to access other accounts or systems without permission' },
          { text: 'Disrupting or overloading the Service' },
          { text: 'Sharing your login details with others' },
          { text: 'Scraping or extracting data from the Service with automated tools' },
        ],
      },
      {
        title: '7. Health disclaimer',
        paragraphs: [
          'Grindify is not a medical service and nothing in the app is medical advice. Consult a qualified healthcare professional before starting a training programme.',
        ],
      },
      {
        title: '8. Open source',
        paragraphs: [
          'Grindify is free software licensed under the GNU Affero General Public License v3 (AGPL-3.0). The source code is available from the project repository.',
        ],
      },
      {
        title: '9. Limitation of liability',
        paragraphs: [
          'The Service is provided “as is” without warranties. To the extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the Service.',
        ],
      },
      {
        title: '10. Availability',
        paragraphs: [
          'We do not guarantee uninterrupted operation. We may change, suspend or discontinue the Service, with reasonable notice where possible.',
        ],
      },
      {
        title: '11. Termination',
        paragraphs: [
          'You can delete your account at any time in Settings. We may suspend or terminate accounts that violate these terms. Data is then deleted according to the Privacy Policy.',
        ],
      },
      {
        title: '12. Changes to the terms',
        paragraphs: [
          'If we make material changes, the version number is updated and you will be asked to accept the new terms in the app before continuing to use the Service.',
        ],
      },
      {
        title: '13. Governing law',
        paragraphs: [
          'These terms are governed by Swedish law. Mandatory consumer protection rules in your country of residence still apply.',
        ],
      },
      {
        title: '14. Contact',
        paragraphs: ['Questions about these terms: {email}.'],
      },
    ],
  },

  imprint: {
    title: 'Legal Notice',
    sections: [
      {
        title: 'Service operator',
        paragraphs: ['{operator}', '{city}, {country}', 'Email: {email}'],
      },
      {
        title: 'About this service',
        paragraphs: [
          'This Grindify instance is a fitness tracking service operated by {operator}. Grindify itself is open-source software.',
        ],
      },
      {
        title: 'Supervisory authority',
        paragraphs: [
          'Integritetsskyddsmyndigheten (IMY), Box 8114, 104 20 Stockholm, Sweden. imy.se, phone +46 8 657 61 00.',
        ],
      },
      {
        title: 'Open source license',
        paragraphs: [
          'Grindify is free software licensed under the GNU Affero General Public License v3 (AGPL-3.0). The source code is available from the project repository.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          'For all enquiries, including GDPR requests (access, erasure, portability): {email}.',
        ],
      },
    ],
  },
}
