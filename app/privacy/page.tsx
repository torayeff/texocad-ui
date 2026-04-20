import { LegalDocument, LegalSection } from "@/app/components/LegalDocument";
import {
  LEGAL_ENTITY_ADDRESS,
  LEGAL_ENTITY_NAME,
  LEGAL_ENTITY_NUMBER,
  LEGAL_LAST_UPDATED,
  SITE_NAME,
  SITE_ROUTES,
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/app/lib/site";

const PRIVACY_TOC = [
  { id: "controller", label: "Who controls your data" },
  { id: "data-we-collect", label: "What we collect" },
  { id: "how-we-use-data", label: "How we use personal data" },
  { id: "ai-processing", label: "AI processing and model training" },
  { id: "lawful-bases", label: "Lawful bases" },
  { id: "sharing", label: "How we share information" },
  { id: "transfers", label: "International transfers" },
  { id: "retention-security", label: "Retention and security" },
  { id: "cookies", label: "Cookies and analytics" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Policy changes" },
  { id: "contact", label: "Contact details" },
] as const;

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      tableOfContents={PRIVACY_TOC}
      summary={
        <>
          <p>
            This Privacy Policy explains how {LEGAL_ENTITY_NAME} collects, uses,
            stores, and shares personal data when you use {SITE_NAME}, a product
            developed and operated by {LEGAL_ENTITY_NAME}, including when you
            visit <a href={SITE_URL}>{SITE_URL}</a>, create an account, use the
            platform, upload design inputs, generate CAD outputs, or contact
            support.
          </p>
          <p>
            Because {SITE_NAME} provides AI-assisted design tools, information
            you submit may be used both to operate the service and to evaluate,
            improve, and train our models and related systems, unless separate
            written terms agreed with you say otherwise.
          </p>
        </>
      }
    >
      <LegalSection id="controller" title="1. Who controls your data">
        <p>
          For the purposes of applicable data protection law, the data
          controller for the services described in this policy is{" "}
          <strong>{LEGAL_ENTITY_NAME}</strong>, company number{" "}
          <strong>{LEGAL_ENTITY_NUMBER}</strong>, of{" "}
          <strong>{LEGAL_ENTITY_ADDRESS}</strong>.
        </p>
        <p>
          This policy applies to personal data processed through the TexoCAD
          website, TexoCAD Studio, billing and account workflows, support
          communications, and any other online or offline interactions that link
          to or refer to this policy.
        </p>
        <p>
          If you use {SITE_NAME} on behalf of an employer, client, or other
          organization, that organization may also determine how certain data is
          used inside its workspace or commercial relationship with us. In that
          case, its own policies or contract with us may also apply.
        </p>
      </LegalSection>

      <LegalSection id="data-we-collect" title="2. What personal data we collect">
        <h3>Information you provide directly</h3>
        <ul>
          <li>
            <strong>Account and identity data</strong>, such as your name, email
            address, sign-in credentials or authentication identifiers, company
            name, and profile details.
          </li>
          <li>
            <strong>Subscription and billing data</strong>, such as plan
            selections, billing address, invoice details, VAT or tax information,
            transaction history, and payment status. Payment card details are
            typically collected by our payment processors rather than stored by us
            in full.
          </li>
          <li>
            <strong>Design and user content</strong>, such as prompts, chat
            messages, requirements, sketches, screenshots, uploads, reference
            files, CAD models, exported files, generated outputs, feedback, and
            revision history.
          </li>
          <li>
            <strong>Communications data</strong>, such as emails, support requests,
            demo requests, survey responses, and any information you choose to
            share with us.
          </li>
        </ul>

        <h3>Information we collect automatically</h3>
        <ul>
          <li>
            <strong>Technical and device data</strong>, such as IP address,
            browser type, operating system, device characteristics, app version,
            and approximate location derived from IP address.
          </li>
          <li>
            <strong>Usage and telemetry data</strong>, such as session timestamps,
            pages viewed, clicks, feature usage, export events, error logs,
            performance metrics, referrer information, and interactions with our
            authentication, billing, and product flows.
          </li>
          <li>
            <strong>Cookie and similar technology data</strong>, such as session
            identifiers, preferences, authentication state, analytics identifiers,
            and security signals.
          </li>
        </ul>

        <h3>Information we receive from third parties</h3>
        <ul>
          <li>
            Identity or account information from authentication providers when you
            sign in using a supported login method.
          </li>
          <li>
            Billing and payment confirmations from payment processors, fraud tools,
            or subscription platforms.
          </li>
          <li>
            Analytics, crash, and infrastructure data from service providers that
            help us operate, secure, and understand the service.
          </li>
        </ul>

        <p>
          If you upload information about other people, you are responsible for
          ensuring you have a lawful basis and all necessary permissions to do so.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-data" title="3. How we use personal data">
        <p>We use personal data to run and improve {SITE_NAME}, including to:</p>
        <ul>
          <li>
            create and manage user accounts, authenticate access, and administer
            subscriptions;
          </li>
          <li>
            receive prompts and uploads, generate outputs, and maintain project
            history and exports;
          </li>
          <li>
            process payments, invoices, renewals, and account communications;
          </li>
          <li>
            provide customer support, resolve bugs, and answer product or billing
            requests;
          </li>
          <li>
            monitor quality, debug failures, detect abuse, enforce our terms, and
            protect the platform and our users;
          </li>
          <li>
            analyse usage patterns, develop new features, and improve model
            quality, safety, reliability, and performance;
          </li>
          <li>
            send service notices, security updates, product announcements, and,
            where permitted, marketing messages; and
          </li>
          <li>
            comply with legal obligations, respond to lawful requests, and protect
            our rights, users, and business.
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id="ai-processing"
        title="4. AI processing, human review, and model training"
      >
        <p>
          {SITE_NAME} is built around AI-assisted design workflows. As a result,
          the prompts, messages, uploads, files, outputs, and feedback you provide
          may be processed by machine learning systems and, where appropriate, by
          authorised personnel or service providers helping us operate the
          platform.
        </p>
        <p>We may use that information to:</p>
        <ul>
          <li>deliver and refine outputs requested by you;</li>
          <li>test model behaviour and product quality;</li>
          <li>investigate bugs, failures, misuse, or security incidents;</li>
          <li>
            build evaluation datasets and internal benchmarks for accuracy,
            relevance, manufacturability checks, or safety controls; and
          </li>
          <li>
            train, fine-tune, and improve our models, prompts, classifiers,
            retrieval systems, and other supporting tooling.
          </li>
        </ul>
        <p>
          Where reasonably practical, we may use segmentation, access controls,
          excerpts, redaction, or de-identification techniques as part of these
          processes. Even so, you should not submit highly sensitive information
          unless you are satisfied with the way this policy describes our use of
          it or unless a separate written agreement with us provides stricter
          protections.
        </p>
        <p>
          If we agree separate commercial terms with you that limit model-training
          use, retention, or access to customer content, those written terms will
          control to the extent they conflict with this policy.
        </p>
      </LegalSection>

      <LegalSection id="lawful-bases" title="5. Our lawful bases for processing">
        <p>
          Where UK or EU-style data protection law applies, we typically rely on
          one or more of the following lawful bases:
        </p>
        <ul>
          <li>
            <strong>Contract</strong>, where processing is necessary to provide
            the services you requested, administer your account, or fulfil our
            subscription obligations.
          </li>
          <li>
            <strong>Legitimate interests</strong>, where processing supports the
            secure operation, improvement, analytics, fraud prevention, business
            administration, or model development needs of our business in a way
            that is not overridden by your rights and interests.
          </li>
          <li>
            <strong>Consent</strong>, where required by law, including for certain
            marketing or optional cookies and similar technologies.
          </li>
          <li>
            <strong>Legal obligation</strong>, where we need to retain records,
            respond to lawful requests, or comply with applicable law.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="sharing" title="6. How we share information">
        <p>We may share personal data with the following categories of recipients:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that help us host, secure, analyse,
            bill, authenticate, monitor, communicate, or support the service.
          </li>
          <li>
            <strong>Model, cloud, and infrastructure providers</strong> that help
            us run AI, storage, compute, logging, or product functionality.
          </li>
          <li>
            <strong>Professional advisers and corporate affiliates</strong>, where
            disclosure is reasonably necessary for legal, accounting, financing, or
            operational purposes.
          </li>
          <li>
            <strong>Regulators, law enforcement, courts, or counterparties</strong>
            , where disclosure is required by law or reasonably necessary to
            establish, exercise, or defend legal claims.
          </li>
          <li>
            <strong>Transaction counterparties</strong>, if we are involved in a
            merger, acquisition, financing, restructuring, or sale of assets.
          </li>
        </ul>
        <p>
          We may also share aggregated or de-identified information that does not
          reasonably identify you.
        </p>
        <p>
          We do not sell personal data in the ordinary sense of selling lists of
          identifiable users to data brokers. However, like many modern software
          products, we may use service providers that process analytics, cookies,
          and behavioural signals on our behalf.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="7. International transfers">
        <p>
          Our providers and systems may process personal data in countries outside
          the United Kingdom or the country in which you are located. When we
          transfer personal data internationally, we use appropriate safeguards as
          required by applicable law, such as contractual protections or reliance
          on recognised adequacy mechanisms where available.
        </p>
      </LegalSection>

      <LegalSection id="retention-security" title="8. Retention and security">
        <h3>Retention</h3>
        <p>
          We retain personal data for as long as reasonably necessary to provide
          the services, maintain records, resolve disputes, enforce agreements,
          improve the product, train and evaluate our systems, and comply with
          legal, tax, accounting, or regulatory obligations.
        </p>
        <p>
          Retention periods vary depending on the type of data, the sensitivity of
          the material, whether the data is tied to an active account or paid
          subscription, and whether we need the information for security,
          debugging, model evaluation, or legal record-keeping.
        </p>

        <h3>Security</h3>
        <p>
          We use technical and organisational measures designed to protect
          personal data against accidental loss, unauthorised access, misuse,
          alteration, and disclosure. These measures may include access controls,
          encrypted transmission, segmented environments, logging, and internal
          review procedures.
        </p>
        <p>
          No internet-connected service is completely secure. You should take care
          when deciding what information to submit to {SITE_NAME}, particularly if
          it is commercially sensitive or relates to regulated, high-risk, or
          safety-critical products.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="9. Cookies and analytics">
        <p>
          We use cookies and similar technologies for authentication, session
          continuity, security, performance monitoring, product analytics, and user
          preferences. Some cookies are necessary for the service to work. Others
          help us understand how people use {SITE_NAME} so we can improve it.
        </p>
        <p>
          You can usually control cookies through your browser settings. Blocking
          certain cookies may affect functionality such as sign-in, session
          persistence, or usage analytics. Unless we state otherwise, we do not
          currently respond to browser-based &quot;Do Not Track&quot; signals.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="10. Your privacy rights">
        <p>
          Depending on where you live and the law that applies, you may have the
          right to request access to personal data we hold about you, ask us to
          correct inaccurate information, delete certain data, restrict or object
          to some processing, or request portability of data you provided to us.
        </p>
        <p>
          You may also have the right to withdraw consent where we rely on it. A
          withdrawal of consent does not affect the lawfulness of processing that
          took place before the withdrawal.
        </p>
        <p>
          To exercise a request, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may ask for
          information needed to verify your identity and understand the scope of
          your request.
        </p>
        <p>
          If you believe we have not handled your personal data properly, you may
          also lodge a complaint with your local regulator. If you are in the UK,
          that includes the Information Commissioner&apos;s Office.
        </p>
      </LegalSection>

      <LegalSection id="children" title="11. Children's data">
        <p>
          {SITE_NAME} is not directed to children under 18, and we do not
          knowingly collect personal data from children. If you believe a child
          has provided us with personal data, contact us and we will investigate
          and take appropriate action.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our products, data practices, legal obligations, or service
          providers. When we do, we will post the updated version here and change
          the &quot;Last updated&quot; date at the top of the page.
        </p>
        <p>
          Your continued use of {SITE_NAME} after an update becomes effective means
          the updated policy will apply to your future interactions with the
          service.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact details">
        <p>
          If you have questions about this Privacy Policy, our privacy practices,
          or how we handle personal data, please contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          You may also write to us at <strong>{LEGAL_ENTITY_NAME}</strong>, company
          number <strong>{LEGAL_ENTITY_NUMBER}</strong>,{" "}
          <strong>{LEGAL_ENTITY_ADDRESS}</strong>.
        </p>
        <p>
          Your use of {SITE_NAME} is also subject to our{" "}
          <a href={SITE_ROUTES.terms}>Terms &amp; Conditions</a>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
