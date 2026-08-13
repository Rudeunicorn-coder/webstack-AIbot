/* eslint-disable react/no-unescaped-entities */

import { WebStackProLegalPage } from "@/components/layout/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <WebStackProLegalPage title="Terms of Service" updated="13 August 2026">
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">1. Agreement to These Terms</h2>
        <p>
          These Terms of Service ("Terms") govern your access to and use of the WebStackPro platform
          ("WebStackPro", "we", "us", or "our"), an AI chat agent and unified inbox service for
          businesses, accessible at webstackpro.pro and related domains, applications, APIs and
          services.
        </p>
        <p>
          By creating an account, signing in, subscribing, or otherwise using WebStackPro, you agree
          to be bound by these Terms, our Privacy Policy, and any other policies we publish. If you
          do not agree, do not use the service.
        </p>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria and are intended to
          comply with the Nigeria Data Protection Act 2023, the Nigeria Data Protection Regulation
          2019 (NDPR), and applicable consumer protection law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">2. Eligibility and Accounts</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>You must be at least 18 years old, or an authorised representative of a business, to use WebStackPro.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</li>
          <li>You must provide accurate registration information and keep it up to date.</li>
          <li>You may not create multiple accounts to evade billing, abuse the free trial, or circumvent restrictions.</li>
          <li>We may suspend or terminate accounts that violate these Terms, applicable law, or that pose a security risk.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">3. The WebStackPro Service</h2>
        <p>
          WebStackPro provides a cloud-based AI agent and unified inbox that connects to messaging
          channels you authorise (including WhatsApp, Instagram, Facebook Messenger and a website
          chat widget). The service includes:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Automated, AI-generated replies to customer messages using the Groq platform.</li>
          <li>A knowledge base you train with your own business information, PDFs and notes.</li>
          <li>A dashboard for agents to read, reply to, assign, tag and resolve conversations.</li>
          <li>Optional human hand-off when the AI is not confident.</li>
        </ul>
        <p>
          We may update, add, or retire features from time to time. We will make reasonable efforts
          to notify you of material changes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">4. Your Responsibilities</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Consent:</strong> Before using the service to converse with your customers, you
            must have the necessary rights and consents to do so, including any consents required
            under the Nigeria Data Protection Act 2023 and NDPR, and the WhatsApp / Meta Business
            terms that apply to the channels you connect.
          </li>
          <li>
            <strong>Lawful use:</strong> You will not use WebStackPro to send spam, phishing, fraud,
            harassment, illegal content, or messages that violate the terms of WhatsApp, Meta,
            Google, or any other platform.
          </li>
          <li>
            <strong>Content:</strong> You are solely responsible for the knowledge-base content you
            upload and for the accuracy of the information your AI provides. We do not guarantee that
            AI replies are accurate, complete, or appropriate for your business.
          </li>
          <li>
            <strong>Credentials:</strong> You are responsible for the API tokens, phone numbers and
            page credentials you connect, and for ensuring you are authorised to use them.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">5. AI Output Disclaimer</h2>
        <p>
          WebStackPro uses generative artificial intelligence. AI-generated replies may contain
          errors, inaccuracies, or outdated information. We do not warrant that AI output will be
          accurate, complete, or free of errors. You are responsible for reviewing AI behaviour in
          your business, configuring your knowledge base carefully, and activating human review
          where appropriate. To the maximum extent permitted by law, we are not liable for any loss
          arising from reliance on AI-generated content.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">6. Billing, Plans and Payments</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Plans:</strong> Starter (₦50,000/month) and Pro (₦120,000/month), plus a free
            14-day trial for new customers. Prices are subject to change with notice.
          </li>
          <li>
            <strong>Payments:</strong> Billing is processed securely by Paystack. By subscribing you
            authorise Paystack to charge your payment method on the agreed schedule.
          </li>
          <li>
            <strong>Taxes:</strong> Applicable taxes (including VAT where required by Nigerian law)
            may be added to your invoice.
          </li>
          <li>
            <strong>Trial:</strong> When the trial ends, your account will continue only if you
            subscribe to a paid plan; otherwise service features may be limited or suspended.
          </li>
          <li>
            <strong>Refunds:</strong> Fees are non-refundable except where required by law or where
            we fail to deliver the core service. Refunds will be considered on a case-by-case basis.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">7. Cancellation and Termination</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            You may cancel a paid subscription at any time through your dashboard; service continues
            until the end of the current billing period.
          </li>
          <li>
            We may suspend or terminate access for violation of these Terms, non-payment, fraudulent
            activity, or to comply with law.
          </li>
          <li>
            On termination, we will make reasonable efforts to provide you with an export of your
            data within a reasonable period, subject to technical and legal limitations.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">8. Intellectual Property</h2>
        <p>
          The WebStackPro platform, including its software, design, trademarks, and documentation,
          is owned by WebStackPro or its licensors. Your use of the service does not transfer any
          ownership rights. You retain all rights to the business information and knowledge-base
          content you upload, and you grant us a limited licence to store, process, and display it
          solely to provide the service to you.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">9. Confidentiality and Security</h2>
        <p>
          We apply reasonable administrative, technical and physical safeguards to protect your data,
          including encrypted connections (HTTPS), token-based authentication, and access controls.
          You are responsible for choosing strong passwords, protecting your credentials, and
          promptly notifying us of any suspected unauthorised access to your account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">10. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by Nigerian law, WebStackPro shall not be liable for
          indirect, incidental, special, consequential, or punitive damages, including loss of
          profits, data, goodwill, or revenue, arising out of or in connection with your use of the
          service. Our total aggregate liability arising from or related to the service shall not
          exceed the amount you paid us in the three (3) months preceding the claim.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">11. No Warranty</h2>
        <p>
          The service is provided on an "as is" and "as available" basis. We do not warrant that the
          service will be uninterrupted, error-free, secure, or free from outages. Downtime may occur
          due to maintenance, third-party providers (such as Groq, Supabase, Vercel, Render,
          WhatsApp or Meta), or factors beyond our control.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">12. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless WebStackPro, its officers, employees and agents
          from any claims, damages, liabilities, costs or expenses (including reasonable legal fees)
          arising from your use of the service, your violation of these Terms, or your violation of
          any rights of a third party (including the rights of your customers).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">13. Changes to These Terms</h2>
        <p>
          We may revise these Terms from time to time. Material changes will be notified through the
          service or by email. Continued use after changes take effect constitutes acceptance of the
          revised Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">14. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute
          arising out of these Terms will first be referred to negotiation or mediation in good
          faith, and failing resolution, to the exclusive jurisdiction of the courts of Imo State,
          Nigeria.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">15. Contact</h2>
        <p>
          Questions about these Terms can be sent to the WebStackPro team through the contact
          details published on webstackpro.pro.
        </p>
      </section>
    </WebStackProLegalPage>
  );
}
