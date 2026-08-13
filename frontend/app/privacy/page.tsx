/* eslint-disable react/no-unescaped-entities */

import { WebStackProLegalPage } from "@/components/layout/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <WebStackProLegalPage title="Privacy Policy" updated="13 August 2026">
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">1. Who We Are</h2>
        <p>
          WebStackPro ("we", "us", or "our") provides an AI chat agent and unified inbox for
          businesses, based in Owerri, Imo State, Nigeria. This Privacy Policy explains what
          personal data we collect, why we collect it, how we use it, and the rights you have under
          the Nigeria Data Protection Act 2023, the Nigeria Data Protection Regulation 2019 (NDPR),
          and other applicable laws.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">2. Who This Policy Covers</h2>
        <p>This policy covers two groups of people:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Business users</strong> — the businesses that subscribe to WebStackPro and use
            the dashboard, and their team members ("Agents").
          </li>
          <li>
            <strong>End customers</strong> — the visitors and customers who chat with a business
            through WebStackPro channels (the chat widget, WhatsApp, Instagram or Messenger).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">3. Data We Collect</h2>
        <h3 className="text-lg font-semibold text-navy">From business users and agents:</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Account details: name, email address, and authentication identifiers.</li>
          <li>Business details: business name, plan, and billing information.</li>
          <li>Content you upload: knowledge-base entries, PDFs, notes, and settings.</li>
          <li>Channel credentials you connect (e.g. WhatsApp/Meta access tokens, stored securely and used only to deliver the service).</li>
          <li>Payment data processed by Paystack (we do not store your full card details).</li>
        </ul>
        <h3 className="text-lg font-semibold text-navy">From end customers:</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Name and email, if provided through the chat widget (lead capture).</li>
          <li>Chat messages and conversation history sent to the business via the widget, WhatsApp, Instagram or Messenger.</li>
          <li>Technical identifiers, such as a visitor ID and channel identifiers used to keep conversations linked.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">4. How We Use Data</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>To operate, maintain and secure your WebStackPro account and the service.</li>
          <li>To generate AI replies to customer messages using the Groq AI platform (messages are processed to produce replies).</li>
          <li>To provide the unified inbox, team management, tags, notes and analytics features.</li>
          <li>To process payments through Paystack and manage subscriptions.</li>
          <li>To provide support, send service notifications, and inform you about features.</li>
          <li>To comply with legal obligations and prevent fraud or abuse.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">5. Lawful Basis for Processing</h2>
        <p>
          We process personal data on the following legal bases: your consent (which you may withdraw
          at any time); performance of a contract with you; our legitimate interests in operating and
          improving the service; and compliance with legal obligations. For end-customer data, we
          act as a data processor on behalf of the business that owns the WebStackPro account, and
          that business is responsible for the lawful basis for processing its customers' data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">6. Sharing of Data</h2>
        <p>We do not sell personal data. We share data only as needed:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Service providers</strong> — Groq (AI processing), Supabase (database and
            authentication), Paystack (payments), and hosting providers such as Vercel and Render.
            Each provider receives only the data required to perform its function.
          </li>
          <li>
            <strong>Channel platforms</strong> — when you connect WhatsApp, Instagram or Messenger,
            messages flow through Meta's platforms per their terms.
          </li>
          <li>
            <strong>Legal requirements</strong> — where required by law, regulation, or valid legal
            process, or to protect our rights and the safety of users.
          </li>
          <li>
            <strong>Business transfers</strong> — in the event of a merger, acquisition, or sale of
            assets, user data may be transferred as part of the transaction.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">7. Data Storage and Security</h2>
        <p>
          Your data is stored on secure servers (currently via Supabase, hosted on cloud
          infrastructure). We protect data with encrypted connections (HTTPS), token-based
          authentication, and access controls. No method of transmission or storage is completely
          secure, and we cannot guarantee absolute security. Please notify us immediately if you
          suspect unauthorised access to your account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">8. AI Processing</h2>
        <p>
          When a customer sends a message, it is processed by the AI model (via Groq) to generate a
          reply. AI-generated replies are returned to you and your customer through the connected
          channel. We use these processing tools to provide the service; AI output is not used to
          train third-party models in a way that is attributed to you beyond what is required to
          provide the service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">9. Retention</h2>
        <p>
          We keep account and conversation data for as long as your account is active or as needed to
          provide the service, and afterwards as required by law or for legitimate business purposes.
          When you close your account, we will make reasonable efforts to delete or anonymise your
          data on request, subject to legal, security and technical retention requirements.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">10. Your Rights</h2>
        <p>Under the Nigeria Data Protection Act 2023 and NDPR, you have rights to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your data, subject to legal obligations.</li>
          <li>Restrict or object to certain processing.</li>
          <li>Withdraw consent at any time where processing is based on consent.</li>
          <li>Request a copy of your data in a portable format.</li>
          <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC).</li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the details in Section 13. We will
          respond within the timeframes required by law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">11. Cookies and Analytics</h2>
        <p>
          We use essential storage (such as your browser's local storage for the chat widget's
          visitor identity and the dashboard session token) to make the service work. We may also use
          analytics tools to understand how the service is used so we can improve it. You can clear
          your browser's local storage at any time, which may reset your widget session.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">12. Children's Privacy</h2>
        <p>
          The service is intended for businesses and adults. We do not knowingly collect personal
          data from children under 13. If you believe a child has provided us personal data, contact
          us and we will take steps to delete it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-navy">13. Contact Us</h2>
        <p>
          For privacy questions, data requests, or concerns, please contact us through the contact
          details published on webstackpro.pro, or write to the WebStackPro team, Owerri, Imo State,
          Nigeria. If you believe your data has been processed in violation of the Nigeria Data
          Protection Act 2023, you may also lodge a complaint with the Nigeria Data Protection
          Commission (NDPC).
        </p>
      </section>
    </WebStackProLegalPage>
  );
}
