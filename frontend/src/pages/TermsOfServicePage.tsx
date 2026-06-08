import { Reveal } from "../components/ui/Reveal";
import { Link } from "react-router-dom";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mb-10">
    <h2
      className="mb-4 text-xl font-black"
      style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
    >
      {title}
    </h2>
    <div className="space-y-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>
      {children}
    </div>
  </section>
);

export function TermsOfServicePage() {
  const lastUpdated = "26 May 2025";

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-10"
      style={{ color: "var(--on-surface)" }}
    >
      {/* ── Header ── */}
      <Reveal>
        <div
          className="relative overflow-hidden mb-10 rounded-[2rem] p-8 md:p-12 shadow-sm"
          style={{ background: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }}
          />
          <div className="relative z-10">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--primary)" }}
            >
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--on-surface)" }}>
              Terms of Service
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Intro ── */}
      <Reveal delayMs={40}>
        <div
          className="mb-8 rounded-2xl p-5 text-sm leading-7"
          style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
        >
          Please read these Terms of Service ("Terms") carefully before using{" "}
          <strong style={{ color: "var(--on-surface)" }}>NearMyColleges</strong> (the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
        </div>
      </Reveal>

      {/* ── Sections ── */}
      <Reveal delayMs={60}>
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By creating an account, listing a property, or otherwise using NearMyColleges, you confirm that you are at least <strong style={{ color: "var(--on-surface)" }}>18 years old</strong>, have read and understood these Terms, and agree to be bound by them. If you are using the Platform on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="platform-role" title="2. Role of NearMyColleges">
            <p>
              NearMyColleges is a <strong style={{ color: "var(--on-surface)" }}>listing and discovery platform</strong>. We connect students searching for accommodation with property owners and PG operators. We are <strong style={{ color: "var(--on-surface)" }}>not a party</strong> to any rental or housing agreement between students and property owners. All transactions, agreements, and disputes are solely between the student and the property owner.
            </p>
            <p>
              We do not guarantee the accuracy, quality, safety, or legality of any listed property. We strongly encourage users to visit properties in person before making any payment or commitment.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="student-obligations" title="3. Student Obligations">
            <p>As a student user, you agree to:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Provide accurate and truthful information when creating your account.</li>
              <li>Use the Platform solely for the purpose of finding student accommodation.</li>
              <li>Not share or misuse contact information obtained through the Platform for purposes other than housing inquiries.</li>
              <li>Not make fraudulent or fake booking inquiries.</li>
              <li>Conduct your own due diligence before committing to any accommodation or making any payment to a property owner.</li>
              <li>Report any suspicious listing or fraudulent activity to us immediately at <a href="mailto:support@nearmycolleges.in" className="font-bold" style={{ color: "var(--primary)" }}>support@nearmycolleges.in</a>.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="owner-obligations" title="4. Property Owner Obligations">
            <p>As a property owner or PG operator, you agree to:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Provide accurate, up-to-date, and non-misleading information about your property, including photos, pricing, and amenities.</li>
              <li>Ensure your property complies with all applicable local laws and regulations.</li>
              <li>Respond to student inquiries in a timely and professional manner.</li>
              <li>Not list properties you do not own or have the legal right to rent.</li>
              <li>Not use the contact information of students for any purpose other than responding to their housing inquiries.</li>
              <li>Accept the commission arrangement as agreed with the NearMyColleges admin at the time of onboarding. Commission terms will be communicated directly by our team.</li>
              <li>Remove listings immediately if a property becomes unavailable.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="listing-approval" title="5. Listing Approval & Moderation">
            <p>
              All property listings are subject to review and approval by our admin team before going live. NearMyColleges reserves the right to:
            </p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Approve, reject, or remove any listing at our sole discretion.</li>
              <li>Request additional verification documents from property owners.</li>
              <li>Mark listings as "verified" or "featured" based on quality and compliance standards.</li>
              <li>Suspend or permanently ban any user or listing that violates these Terms or our community guidelines.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="payments" title="6. Payments & Fees">
            <p>
              NearMyColleges is currently a <strong style={{ color: "var(--on-surface)" }}>free-to-browse platform for students</strong>. We do not process rental payments or security deposits — all financial transactions for accommodation are conducted directly between the student and the property owner.
            </p>
            <p className="mt-3">
              For property owners, a commission may be applicable per successful booking facilitated through the Platform. The exact commission amount and terms will be agreed upon separately between you and the NearMyColleges admin team. We are not liable for any payment disputes between students and owners.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="prohibited" title="7. Prohibited Activities">
            <p>You must not:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Post false, misleading, or fraudulent listings.</li>
              <li>Scrape, crawl, or extract data from the Platform in an automated manner.</li>
              <li>Attempt to reverse-engineer, hack, or compromise the Platform's security.</li>
              <li>Harass, threaten, or abuse other users.</li>
              <li>Use the Platform for any illegal purpose.</li>
              <li>Create multiple accounts to circumvent a ban or restriction.</li>
              <li>Post content that is defamatory, obscene, or infringes on third-party intellectual property rights.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="intellectual-property" title="8. Intellectual Property">
            <p>
              The NearMyColleges brand, logo, website design, and original content are the exclusive intellectual property of NearMyColleges. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
            <p className="mt-3">
              By uploading photos or content to the Platform, you grant NearMyColleges a non-exclusive, royalty-free licence to use, display, and distribute that content on the Platform for the purpose of operating the listing service.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="disclaimer" title="9. Disclaimer of Warranties">
            <p>
              The Platform is provided on an <strong style={{ color: "var(--on-surface)" }}>"as is"</strong> and <strong style={{ color: "var(--on-surface)" }}>"as available"</strong> basis. We make no warranties, express or implied, including but not limited to:
            </p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>The accuracy or completeness of any listing information.</li>
              <li>The fitness of any property for a particular purpose.</li>
              <li>Uninterrupted or error-free access to the Platform.</li>
              <li>The safety, legality, or quality of any listed property.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="limitation" title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, NearMyColleges shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
            </p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Your use of or inability to use the Platform.</li>
              <li>Any housing disputes between students and property owners.</li>
              <li>Financial loss resulting from dealings with property owners found through the Platform.</li>
              <li>Any unauthorised access to your account.</li>
            </ul>
            <p className="mt-3">
              Our total liability for any claim arising from your use of the Platform shall not exceed the greater of ₹500 or the amount you paid us in the last 3 months.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="termination" title="11. Account Termination">
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without notice, if you violate these Terms. You may also delete your account at any time from your Profile settings page. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="governing-law" title="12. Governing Law & Disputes">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
            <p className="mt-3">
              We encourage you to first contact us to resolve any issues amicably before pursuing legal remedies.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="changes" title="13. Changes to These Terms">
            <p>
              We may revise these Terms from time to time. We will notify you of material changes by updating the "Last Updated" date and, where appropriate, by sending you a notification. Continued use of the Platform after any changes constitutes acceptance of the new Terms.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="contact" title="14. Contact Us">
            <p>
              For questions about these Terms, please reach out:
            </p>
            <div className="mt-3 rounded-xl p-4 space-y-2" style={{ background: "var(--surface-container)" }}>
              <p><strong style={{ color: "var(--on-surface)" }}>NearMyColleges</strong></p>
              <p>📧 <a href="mailto:support@nearmycolleges.in" className="font-bold" style={{ color: "var(--primary)" }}>support@nearmycolleges.in</a></p>
              <p>📞 <a href="tel:+918152916235" className="font-bold" style={{ color: "var(--primary)" }}>+91 81529 16235</a></p>
              <p>💬 <a href="https://wa.me/918152916235" target="_blank" rel="noopener noreferrer" className="font-bold" style={{ color: "var(--primary)" }}>WhatsApp Support</a></p>
            </div>
          </Section>
        </div>
      </Reveal>

      {/* ── Footer nav ── */}
      <Reveal delayMs={80}>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/privacy-policy" className="btn-ghost !px-5 !py-2.5 !text-sm">
            Privacy Policy →
          </Link>
          <Link to="/discover" className="btn-primary !px-5 !py-2.5 !text-sm">
            Browse Listings →
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
