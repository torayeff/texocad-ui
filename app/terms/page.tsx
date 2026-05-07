import { LegalDocument, LegalSection } from "@/app/components/legal-document";
import {
  LEGAL_ENTITY_ADDRESS,
  LEGAL_ENTITY_NAME,
  LEGAL_ENTITY_NUMBER,
  LEGAL_GOVERNING_LAW,
  LEGAL_LAST_UPDATED,
  SITE_NAME,
  SITE_ROUTES,
  SUPPORT_EMAIL,
} from "@/app/lib/site";

const TERMS_TOC = [
  { id: "scope", label: "Scope and acceptance" },
  { id: "accounts", label: "Accounts and eligibility" },
  { id: "licence", label: "Access and licence" },
  { id: "restrictions", label: "Use restrictions" },
  { id: "content", label: "Inputs, outputs, and training rights" },
  { id: "ai-limitations", label: "AI limitations and engineering review" },
  { id: "billing", label: "Fees and subscriptions" },
  { id: "third-party-services", label: "Third-party services" },
  { id: "operations", label: "Service operations and changes" },
  { id: "ip-confidentiality", label: "IP, confidentiality, and feedback" },
  { id: "termination", label: "Suspension and termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Liability limits" },
  { id: "general", label: "Governing law and contact" },
] as const;

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      lastUpdated={LEGAL_LAST_UPDATED}
      tableOfContents={TERMS_TOC}
      summary={
        <>
          <p>
            These Terms &amp; Conditions govern access to the TexoCAD website,
            studio, and related services provided by {LEGAL_ENTITY_NAME}.{" "}
            {SITE_NAME} is a product developed and operated by{" "}
            {LEGAL_ENTITY_NAME}. By using the service, you agree to these terms.
          </p>
          <p>
            {SITE_NAME} uses AI to help generate and refine design outputs. That
            makes human review essential: you are responsible for evaluating any
            output before relying on it for manufacturing, safety, compliance, or
            other real-world decisions.
          </p>
        </>
      }
    >
      <LegalSection id="scope" title="1. Scope and acceptance">
        <p>
          These Terms &amp; Conditions form a binding agreement between you and{" "}
          <strong>{LEGAL_ENTITY_NAME}</strong>, company number{" "}
          <strong>{LEGAL_ENTITY_NUMBER}</strong>, of{" "}
          <strong>{LEGAL_ENTITY_ADDRESS}</strong>.
        </p>
        <p>
          They apply to your access to and use of the {SITE_NAME} website,
          TexoCAD Studio, account system, subscription flows, outputs, and any
          related software, documentation, or services we make available
          (together, the <strong>&quot;Services&quot;</strong>).
        </p>
        <p>
          If you access the Services on behalf of a company or other legal entity,
          you represent that you have authority to bind that entity, and{" "}
          &quot;you&quot; includes both you and that entity.
        </p>
        <p>
          If we enter into a separate written order form, enterprise agreement, or
          other contract with you, that agreement will control to the extent it
          conflicts with these Terms.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="2. Accounts and eligibility">
        <p>
          You must be legally capable of entering into a binding agreement to use
          the Services. If you use the Services for a business, you must also have
          authority to do so.
        </p>
        <p>You agree to:</p>
        <ul>
          <li>provide accurate and current registration information;</li>
          <li>
            keep your login credentials secure and not share them except within
            authorised account controls we provide;
          </li>
          <li>
            take responsibility for activity that occurs under your account or
            workspace; and
          </li>
          <li>
            notify us promptly if you believe your account or credentials have
            been compromised.
          </li>
        </ul>
        <p>
          We may refuse registration, reclaim usernames, or require account
          changes where reasonably necessary for security, legal, or operational
          reasons.
        </p>
      </LegalSection>

      <LegalSection id="licence" title="3. Access to the Services and licence">
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive,
          non-transferable, non-sublicensable, revocable right to access and use
          the Services for your own internal business or personal design purposes.
        </p>
        <p>
          Your access may depend on the plan you purchase, technical limits,
          product availability, rate limits, export settings, or any usage caps we
          communicate in the product, at checkout, or in a separate order form.
        </p>
        <p>
          No ownership rights in the Services are transferred to you. The Services
          are licensed, not sold.
        </p>
      </LegalSection>

      <LegalSection id="restrictions" title="4. Use restrictions">
        <p>You must not, and must not allow any other person to:</p>
        <ul>
          <li>
            copy, resell, lease, white-label, or commercially exploit the Services
            except as expressly permitted in writing;
          </li>
          <li>
            reverse engineer, decompile, disassemble, or try to extract source
            code, underlying models, datasets, prompts, or non-public system
            behaviour;
          </li>
          <li>
            scrape, harvest, benchmark, or use automated means to access the
            Services in a way that bypasses our intended interfaces or protective
            measures;
          </li>
          <li>
            upload or submit unlawful, infringing, deceptive, malicious, or
            harmful material, including malware or content that violates the rights
            of others;
          </li>
          <li>
            interfere with the security, stability, or performance of the Services
            or attempt to gain unauthorised access to accounts, data, or systems;
          </li>
          <li>
            use the Services to build a competing service or training corpus from
            non-public outputs, unless we agree otherwise in writing; or
          </li>
          <li>
            use the Services in violation of applicable law, export controls,
            sanctions, or professional obligations.
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id="content"
        title="5. Your inputs, outputs, and our rights to use them"
      >
        <p>
          As between you and us, you retain ownership of the prompts, files,
          sketches, messages, project data, and other materials you submit to the
          Services (<strong>&quot;Inputs&quot;</strong>). Subject to applicable law and the
          rights of any third parties, you also retain any rights you may have in
          the outputs generated for you by the Services{" "}
          (<strong>&quot;Outputs&quot;</strong>).
        </p>
        <p>
          You grant us a worldwide, non-exclusive, royalty-free licence to host,
          store, reproduce, transmit, analyse, adapt, modify, and otherwise use
          Inputs, Outputs, and related metadata to:
        </p>
        <ul>
          <li>provide, maintain, and support the Services;</li>
          <li>store project history and enable exports and collaboration;</li>
          <li>monitor quality, security, abuse, and product performance;</li>
          <li>
            improve, train, fine-tune, evaluate, and develop our models, prompts,
            retrieval systems, and other AI or software components; and
          </li>
          <li>comply with law and enforce our agreements.</li>
        </ul>
        <p>
          You confirm that you have all rights, permissions, and lawful bases
          necessary to submit Inputs and to grant the licence described above.
        </p>
        <p>
          Because AI systems may generate similar results for different users,
          Outputs are not guaranteed to be unique. We do not guarantee that
          Outputs are free of third-party rights, technical defects, or factual
          inaccuracies.
        </p>
        <p>
          If we separately agree in writing to restrict training, retention, or
          use of your Inputs or Outputs, that written agreement will control over
          this section to the extent of any conflict.
        </p>
      </LegalSection>

      <LegalSection
        id="ai-limitations"
        title="6. AI limitations and engineering review"
      >
        <p>
          {SITE_NAME} provides AI-assisted design support, not guaranteed
          engineering conclusions. Outputs may be incomplete, imprecise, based on
          incorrect assumptions, or unsuitable for your intended use.
        </p>
        <p>
          You are solely responsible for reviewing, testing, simulating,
          dimensioning, validating, and approving any Inputs, Outputs, exports,
          drawings, toolpaths, bills of materials, tolerances, or other results
          before relying on them.
        </p>
        <p>
          In particular, you must not rely on the Services as the sole basis for
          decisions involving:
        </p>
        <ul>
          <li>manufacturing readiness or supplier handoff;</li>
          <li>compliance with regulatory, industry, or contractual standards;</li>
          <li>safety-critical, medical, aerospace, defence, automotive, or
            structural applications;</li>
          <li>material selection, load-bearing performance, or failure analysis;</li>
          <li>professional sign-off, certification, or legal compliance; or</li>
          <li>any use where errors could cause injury, property damage, or
            substantial loss.</li>
        </ul>
      </LegalSection>

      <LegalSection id="billing" title="7. Fees, subscriptions, taxes, and refunds">
        <p>
          Paid features may require a subscription or other purchase. Pricing,
          billing intervals, renewal terms, usage limits, and included features
          will be shown in the product, at checkout, or in a separate order form.
        </p>
        <p>
          If you subscribe on a recurring basis, you authorise us and our payment
          providers to charge the applicable fees and taxes using your selected
          payment method until you cancel.
        </p>
        <p>
          Unless applicable law requires otherwise or we expressly state
          otherwise, fees are non-refundable once charged. We may suspend or limit
          access if payment is overdue or a charge is reversed, declined, or
          disputed.
        </p>
        <p>
          You are responsible for all applicable taxes, duties, and levies other
          than taxes based on our net income.
        </p>
      </LegalSection>

      <LegalSection id="third-party-services" title="8. Third-party services">
        <p>
          The Services may depend on or interoperate with third-party services,
          such as authentication providers, payment processors, cloud
          infrastructure, analytics vendors, or external model providers.
        </p>
        <p>
          Those third-party services are governed by their own terms and privacy
          policies. We are not responsible for third-party products, websites, or
          services that we do not control, including their uptime, security, data
          handling, or compatibility with your workflow.
        </p>
        <p>
          TexoCAD Studio uses <strong>occt-import-js</strong>, a
          JavaScript/WebAssembly interface for Open CASCADE Technology, to read
          STEP files in the browser. The library is licensed under GNU LGPL v2.1
          and is served as a separate WebAssembly asset.
        </p>
        <ul>
          <li>
            <a href="/licenses/occt-import-js-lgpl-2.1.txt">
              occt-import-js LGPL v2.1 license
            </a>
          </li>
          <li>
            <a href="/licenses/opencascade-technology-lgpl-2.1.txt">
              Open CASCADE Technology license
            </a>
          </li>
          <li>
            <a href="https://github.com/kovacsv/occt-import-js">
              occt-import-js source repository
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id="operations"
        title="9. Service operations, support, beta features, and changes"
      >
        <p>
          We may update, modify, suspend, or discontinue any feature of the
          Services at any time. We may also impose reasonable usage limits or
          technical controls to protect the platform and other users.
        </p>
        <p>
          We will use commercially reasonable efforts to keep the Services
          available, but we do not promise uninterrupted or error-free operation.
          Planned maintenance, bugs, infrastructure outages, model changes, and
          third-party failures may affect the service.
        </p>
        <p>
          If we offer beta, preview, experimental, or early-access functionality,
          that functionality may be incomplete, unstable, or changed or removed at
          any time and is provided on an even more limited basis than the rest of
          the Services.
        </p>
        <p>
          Unless we agree otherwise in writing, any support we provide is offered
          on a reasonable-efforts basis and does not create a service level
          agreement.
        </p>
      </LegalSection>

      <LegalSection
        id="ip-confidentiality"
        title="10. Intellectual property, confidentiality, and feedback"
      >
        <p>
          We and our licensors own the Services and all related software, models,
          interfaces, workflows, branding, documentation, aggregated analytics,
          and other intellectual property rights in and to the Services, excluding
          your Inputs and any rights you retain in Outputs under Section 5.
        </p>
        <p>
          If either party shares non-public information that should reasonably be
          understood as confidential, the receiving party must use it only for the
          purpose for which it was disclosed and protect it with reasonable care.
          This does not apply to information that is already public through no
          fault of the receiving party, was lawfully known already, or must be
          disclosed by law.
        </p>
        <p>
          If you send us ideas, feature requests, comments, or other feedback, you
          grant us a perpetual, irrevocable, worldwide, royalty-free right to use
          that feedback for any lawful business purpose without compensation or
          attribution.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="11. Suspension and termination">
        <p>
          You may stop using the Services at any time. If you have a recurring
          subscription, cancellation will normally take effect at the end of the
          current billing period unless stated otherwise at checkout.
        </p>
        <p>
          We may suspend or terminate your access immediately if we reasonably
          believe that:
        </p>
        <ul>
          <li>you have breached these Terms;</li>
          <li>your use creates security, legal, or operational risk;</li>
          <li>payment is overdue or disputed;</li>
          <li>we are required to do so by law or by a third-party provider; or</li>
          <li>continuing to provide access is no longer commercially practical.</li>
        </ul>
        <p>
          On termination, your right to use the Services ends immediately. Sections
          that by their nature should survive termination, including those dealing
          with payment, intellectual property, confidentiality, disclaimers,
          liability, and dispute resolution, will continue to apply.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="12. Disclaimers">
        <p>
          To the maximum extent permitted by law, the Services are provided
          &quot;as is&quot; and &quot;as available&quot;. We do not guarantee that the Services will
          be uninterrupted, secure, error-free, or fit for your particular
          workflow, project, or compliance needs.
        </p>
        <p>
          We disclaim all implied warranties, conditions, and representations,
          including implied warranties of merchantability, satisfactory quality,
          fitness for a particular purpose, non-infringement, and any warranty
          arising from a course of dealing or usage of trade.
        </p>
        <p>
          Without limiting the above, we do not warrant that any output is
          accurate, manufacturable, unique, production-ready, compliant, or safe
          for deployment without independent professional review.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="13. Limitation of liability">
        <p>
          Nothing in these Terms limits or excludes liability that cannot lawfully
          be limited or excluded, including liability for death or personal injury
          caused by negligence, fraud, or fraudulent misrepresentation.
        </p>
        <p>
          Subject to the previous paragraph, we will not be liable for any
          indirect, incidental, special, punitive, or consequential loss, or for
          any loss of profit, revenue, business, goodwill, anticipated savings,
          data, or business interruption arising out of or connected with the
          Services.
        </p>
        <p>
          Subject to the first paragraph of this section, our total aggregate
          liability arising out of or in connection with the Services or these
          Terms will not exceed the total fees paid by you to us for the Services
          in the twelve months before the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection
        id="general"
        title="14. Governing law, disputes, notices, and contact"
      >
        <p>
          These Terms and any dispute or claim arising out of or in connection with
          them are governed by the laws of <strong>{LEGAL_GOVERNING_LAW}</strong>,
          without regard to conflict-of-law principles.
        </p>
        <p>
          The courts of England and Wales will have exclusive jurisdiction over
          disputes relating to these Terms, unless mandatory consumer law gives you
          the right to bring a claim elsewhere.
        </p>
        <p>
          We may update these Terms from time to time. When we do, we will post
          the revised version and update the date at the top of this page.
          Continuing to use the Services after the updated Terms become effective
          means the updated Terms will apply going forward.
        </p>
        <p>
          Notices, support enquiries, and intellectual property complaints should
          be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. If
          you believe content or activity on the Services infringes your rights,
          please include enough detail for us to identify the material, understand
          your claim, and contact you.
        </p>
        <p>
          Your personal data is handled in accordance with our{" "}
          <a href={SITE_ROUTES.privacy}>Privacy Policy</a>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
