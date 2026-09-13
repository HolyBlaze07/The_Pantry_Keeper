type TermsSubsection = {
  title: string;
  paragraphs: readonly string[];
};

type TermsSection = {
  title: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  closing?: string;
  subsections?: readonly TermsSubsection[];
};

const sections: readonly TermsSection[] = [
  {
    title: "AGREEMENT TO OUR LEGAL TERMS",
    paragraphs: [
      "These Terms of Use govern your access to and use of Amealy, available at amealy.app, including its related features and services (collectively, the \"Services\"). Amealy is a grocery inventory and meal-planning web application that allows users to track groceries, quantities, preferred stock levels, freshness and expiration information, shopping needs, and recipes. Amealy may also provide AI-assisted recipe suggestions based on information contained in a user's inventory.",
      "By accessing or using Amealy, you agree that you have read, understood, and agreed to these Terms of Use. If you do not agree to these Terms, you must discontinue use of the Services. Our Privacy Policy is incorporated into these Terms by reference.",
      "Amealy is currently under active development. Features may be added, changed, removed, interrupted, or unavailable as development continues.",
    ],
  },
  {
    title: "1. OUR SERVICES",
    paragraphs: [
      "Amealy provides tools intended to help users organize grocery inventory and assist with meal planning. Features may include:",
    ],
    list: [
      "Adding, editing, and removing groceries.",
      "Recording grocery quantities and preferred quantities.",
      "Tracking expiration or freshness information.",
      "Identifying groceries that may need restocking.",
      "Generating shopping lists.",
      "Recording grocery usage.",
      "Receiving AI-assisted recipe suggestions.",
      "Saving and managing recipes.",
      "Accessing inventory information across supported devices.",
    ],
    closing: "The Services are intended primarily for personal, non-commercial use. You are responsible for complying with laws applicable to you when accessing or using the Services.",
  },
  {
    title: "2. INTELLECTUAL PROPERTY RIGHTS",
    subsections: [
      {
        title: "Our intellectual property",
        paragraphs: [
          "Unless otherwise indicated, Amealy and its original source code, functionality, software, website design, text, graphics, branding, logos, and other original content are owned by or licensed to the operator of Amealy and are protected by applicable intellectual-property laws.",
          "Third-party software, services, libraries, assets, trademarks, and other materials remain the property of their respective owners and may be subject to separate licenses.",
          "Subject to these Terms, you are granted a limited, revocable, non-exclusive, non-transferable right to access and use Amealy for its intended personal purposes. You may not reproduce, sell, redistribute, commercially exploit, reverse engineer, or otherwise misuse protected portions of Amealy except where permitted by applicable law or an applicable third-party license.",
        ],
      },
      {
        title: "Feedback and submissions",
        paragraphs: [
          "You may voluntarily provide suggestions, ideas, bug reports, comments, or other feedback regarding Amealy. By submitting feedback, you permit us to use that feedback to develop, operate, improve, and modify Amealy without an obligation to compensate you.",
          "You retain ownership of personal information and content that you provide through the Services, subject to the rights reasonably necessary for Amealy and its service providers to process that information and operate the Services.",
        ],
      },
    ],
  },
  {
    title: "3. USER REPRESENTATIONS",
    paragraphs: ["By using Amealy, you represent that:"],
    list: [
      "You have the legal capacity to agree to these Terms.",
      "You are at least 18 years old.",
      "Information you provide will be reasonably accurate and current.",
      "You will not use automated systems, bots, scripts, or similar mechanisms to improperly access or interfere with the Services.",
      "You will not use Amealy for an unlawful or unauthorized purpose.",
      "Your use of the Services will comply with applicable laws and regulations.",
    ],
    closing: "We may suspend or terminate access if information provided is materially false, fraudulent, or used in violation of these Terms.",
  },
  {
    title: "4. PROHIBITED ACTIVITIES",
    paragraphs: ["You may not use Amealy to:"],
    list: [
      "Systematically scrape, harvest, extract, or compile data from the Services without authorization.",
      "Attempt to obtain another user's password, authentication credentials, or private information.",
      "Circumvent or interfere with security features.",
      "Attempt to access another user's grocery inventory or account without authorization.",
      "Introduce viruses, malicious code, malware, or other harmful material.",
      "Interfere with or place an unreasonable burden on Amealy's infrastructure.",
      "Impersonate another person.",
      "Create accounts through deceptive or unauthorized automated means.",
      "Use bots, spiders, scrapers, or unauthorized automated tools to access the Services.",
      "Reverse engineer the Services except where such restriction is prohibited by applicable law.",
      "Harass, threaten, abuse, or harm another person through the Services.",
      "Use Amealy to advertise or offer unauthorized goods or services.",
      "Sell or transfer your Amealy account.",
      "Use Amealy for fraudulent or unlawful activity.",
      "Attempt to bypass restrictions designed to protect Amealy or its users.",
      "Copy or commercially exploit Amealy's proprietary content or software without authorization.",
    ],
  },
  {
    title: "5. USER CONTENT",
    paragraphs: [
      "Amealy allows users to provide private information necessary to use features of the Services, including grocery inventory information and other account-related information.",
      "Amealy does not currently operate as a public social-media or user-content publishing platform. Grocery inventories are intended to remain associated with the applicable user's account rather than being publicly posted for other Amealy users.",
      "You are responsible for information you enter into Amealy and must have the right to provide that information.",
    ],
  },
  {
    title: "6. DATA AND CONTENT LICENSE",
    paragraphs: [
      "You retain ownership of information and content that you provide to Amealy. You grant Amealy a limited right to store, process, transmit, and otherwise use that information only as reasonably necessary to provide, maintain, secure, and improve the Services and as otherwise described in our Privacy Policy.",
      "For example, grocery information may be processed to calculate inventory levels, determine shopping needs, synchronize your pantry between devices, or provide recipe suggestions.",
      "Feedback that you voluntarily provide may be used to improve Amealy without compensation.",
    ],
  },
  {
    title: "7. SERVICES MANAGEMENT",
    paragraphs: ["We reserve the right to:"],
    list: [
      "Monitor the Services for violations of these Terms.",
      "Restrict or suspend access when reasonably necessary.",
      "Take action against misuse, fraud, security threats, or unlawful conduct.",
      "Remove or restrict information that creates technical or security problems.",
      "Modify the Services to protect Amealy, its users, or its infrastructure.",
      "Cooperate with lawful requests from authorities when legally required.",
    ],
  },
  {
    title: "8. TERM AND TERMINATION",
    paragraphs: [
      "These Terms remain effective while you use Amealy. We may restrict, suspend, or terminate access to the Services when reasonably necessary, including for violations of these Terms, fraudulent activity, security threats, unlawful conduct, or misuse of the Services.",
      "If an account is terminated for serious misuse, you may not attempt to circumvent that termination by creating deceptive replacement accounts.",
      "Users who wish to request deletion of their account or associated personal information may use the contact method identified in our Privacy Policy, subject to applicable legal requirements.",
    ],
  },
  {
    title: "9. MODIFICATIONS AND INTERRUPTIONS",
    paragraphs: [
      "Amealy is under active development. We may modify, add, remove, suspend, or discontinue features.",
      "The Services may occasionally experience interruptions because of maintenance, hosting problems, software bugs, third-party outages, updates, network failures, or other technical issues. We do not guarantee uninterrupted or error-free availability.",
      "Because Amealy is currently in beta, users should understand that bugs, synchronization problems, unexpected behavior, or changes to features may occur.",
    ],
  },
  {
    title: "10. GOVERNING LAW",
    paragraphs: [
      "These Terms are governed by the laws of the State of Alabama and the United States, without regard to conflict-of-law principles, except where applicable law requires otherwise.",
      "Nothing in these Terms eliminates rights that cannot legally be waived under applicable consumer-protection or other laws.",
    ],
  },
  {
    title: "11. DISPUTE RESOLUTION",
    subsections: [
      {
        title: "Informal negotiations",
        paragraphs: [
          "Before initiating formal dispute proceedings, you and Amealy agree to make a reasonable effort to resolve disputes informally. A party seeking to raise a dispute should provide written notice describing the issue so that both parties have an opportunity to attempt resolution.",
        ],
      },
      {
        title: "Arbitration",
        paragraphs: [
          "If a dispute cannot be resolved through informal negotiation, the parties may resolve the dispute through binding arbitration to the extent permitted by applicable law and subject to the arbitration terms applicable to the dispute.",
          "Because arbitration provisions can affect significant legal rights and their enforceability depends on applicable law, this provision should be reviewed by qualified legal counsel before Amealy's broader commercial launch.",
        ],
      },
      {
        title: "Exceptions",
        paragraphs: [
          "Disputes involving intellectual-property rights, unauthorized access, privacy violations, theft, piracy, or requests for injunctive relief may be brought before an appropriate court where permitted by law.",
          "Nothing in these Terms prevents either party from exercising rights that applicable law does not permit to be waived.",
        ],
      },
    ],
  },
  {
    title: "12. CORRECTIONS",
    paragraphs: [
      "Information within Amealy may occasionally contain typographical errors, inaccuracies, omissions, outdated information, or technical errors. We reserve the right to correct errors and update information when appropriate.",
    ],
  },
  {
    title: "13. DISCLAIMERS",
    paragraphs: [
      "AMEALY IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.",
      "We do not guarantee that the Services will always be accurate, complete, uninterrupted, secure, or error-free.",
    ],
    subsections: [
      {
        title: "AI-generated recipe information",
        paragraphs: [
          "Amealy may use artificial intelligence to provide recipe ideas or related information. AI-generated information may be incomplete, inaccurate, inappropriate for a particular user, or contain errors.",
          "Users are responsible for independently verifying ingredients, ingredient quantities, allergens, dietary restrictions, cooking instructions, cooking temperatures, food preparation techniques, food safety, and nutritional or dietary suitability.",
          "AI-generated recipes are suggestions and should not be treated as professional medical, nutritional, or food-safety advice.",
        ],
      },
      {
        title: "Food freshness and expiration information",
        paragraphs: [
          "Expiration dates, freshness indicators, reminders, inventory statuses, and similar features within Amealy are organizational tools only. Amealy does not determine whether food is actually safe to consume.",
          "Food can become unsafe before a displayed date, and some foods may remain usable after certain labeled dates depending on the food, storage conditions, handling, packaging, and other circumstances.",
          "Users are responsible for inspecting food and following appropriate food-safety guidance before preparing or consuming it. Do not consume food solely because Amealy displays it as unexpired or available.",
        ],
      },
      {
        title: "Allergies and dietary restrictions",
        paragraphs: [
          "Amealy does not guarantee that recipes or suggested ingredients are free from allergens or appropriate for any medical condition, allergy, intolerance, religious dietary requirement, or other dietary restriction.",
          "Users must independently verify ingredients before preparing or consuming food.",
        ],
      },
    ],
  },
  {
    title: "14. LIMITATIONS OF LIABILITY",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AMEALY AND ITS OPERATOR WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR SERVICE INTERRUPTION.",
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AGGREGATE LIABILITY ARISING FROM OR RELATING TO THE SERVICES WILL NOT EXCEED US $100.",
      "Some jurisdictions do not permit certain exclusions or limitations of liability. In those circumstances, these limitations apply only to the maximum extent permitted by law. Nothing in these Terms excludes liability that cannot legally be excluded.",
    ],
  },
  {
    title: "15. INDEMNIFICATION",
    paragraphs: [
      "To the extent permitted by applicable law, you agree to indemnify and hold harmless Amealy and its operator from third-party claims, losses, liabilities, or reasonable expenses arising from your unlawful misuse of the Services, material violation of these Terms, or infringement of another person's rights.",
      "We reserve the right to control the defense of a matter subject to indemnification where permitted by law.",
    ],
  },
  {
    title: "16. USER DATA",
    paragraphs: [
      "Amealy stores certain information that users provide for purposes of operating the Services. This may include account information, grocery inventory information, quantities, preferred stock amounts, expiration information, shopping information, and other information necessary to provide Amealy's functionality.",
      "We use third-party infrastructure and service providers to operate portions of Amealy. Although reasonable measures are used to protect and maintain the Services, no online service can guarantee that data will never be lost, corrupted, interrupted, or accessed improperly.",
      "During beta testing in particular, users should not rely on Amealy as the sole permanent record of information that is critically important to them. Additional information about how personal information is handled is provided in our Privacy Policy.",
    ],
  },
  {
    title: "17. ELECTRONIC COMMUNICATIONS AND SIGNATURES",
    paragraphs: [
      "Using Amealy, submitting online forms, and communicating with us electronically constitute electronic communications. You consent to receiving notices and disclosures electronically when permitted by applicable law.",
      "Electronic agreements and records may satisfy legal requirements that communications be in writing to the extent permitted by applicable law. This provision does not mean that you consent to receiving marketing communications from Amealy.",
    ],
  },
  {
    title: "18. MISCELLANEOUS",
    paragraphs: [
      "These Terms and policies expressly incorporated into them constitute the agreement between you and Amealy concerning your use of the Services.",
      "If we fail to enforce a provision immediately, that does not necessarily waive our right to enforce it later.",
      "If a provision of these Terms is determined to be invalid or unenforceable, the remaining provisions will remain effective to the extent permitted by law.",
      "Nothing in these Terms creates an employment, partnership, joint venture, or agency relationship between you and Amealy.",
      "We may update these Terms as Amealy develops. For material changes, users may be notified through a notice within Amealy or on the Amealy website before the revised Terms become effective. Changes relating to security, bug fixes, legal requirements, or court orders may become effective immediately when appropriate.",
      "The \"Last updated\" date at the beginning of these Terms will identify the most recent revision.",
    ],
  },
  {
    title: "19. CONTACT US",
    paragraphs: [
      "Questions, complaints, or requests concerning these Terms may be submitted using the contact information provided through Amealy and its Privacy Policy.",
      "Website: amealy.app",
    ],
  },
];

export function TermsOfUse() {
  return (
    <article className="privacy-policy-container terms-of-use-container">
      <style>{`
        .terms-of-use-container {
          color: #595959;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        .terms-of-use-container h1,
        .terms-of-use-container h2,
        .terms-of-use-container h3 {
          color: #000000;
          font-family: Arial, sans-serif;
        }
        .terms-of-use-container h1 {
          font-size: 26px;
          margin-bottom: 0.25rem;
        }
        .terms-of-use-container h2 {
          font-size: 19px;
          margin: 2rem 0 0.75rem;
        }
        .terms-of-use-container h3 {
          font-size: 17px;
          margin: 1.25rem 0 0.5rem;
        }
        .terms-of-use-container p {
          margin: 0 0 0.9rem;
        }
        .terms-of-use-container ul {
          margin: 0 0 1rem;
          padding-left: 1.5rem;
        }
        .terms-of-use-container li {
          margin-bottom: 0.35rem;
        }
        .terms-of-use-container .terms-updated {
          color: #595959;
          font-size: 14px;
          margin-bottom: 2rem;
        }
      `}</style>
      <h1>TERMS OF USE</h1>
      <p className="terms-updated">Last updated: September 13, 2026</p>

      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.closing && <p>{section.closing}</p>}
          {section.subsections?.map((subsection) => (
            <div key={subsection.title}>
              <h3>{subsection.title}</h3>
              {subsection.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
