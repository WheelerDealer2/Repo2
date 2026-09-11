import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Wheeler Dealer",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Terms of Service</h1>
      <p className="mb-8 mt-1.5 text-sm text-[#5a5d61]">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-[14.5px] leading-relaxed text-[#3a3d42]">
        <Section title="1. What Wheeler Dealer is">
          <p>
            Wheeler Dealer is an online marketplace that lets registered users
            (&quot;sellers&quot;) post listings for cars they own and are
            selling, and lets other users (&quot;buyers&quot;) browse those
            listings and contact sellers. We are not a party to any sale
            between a buyer and seller — we don&apos;t own, inspect, or
            guarantee the condition, title, or legality of any vehicle
            listed on the platform, and we&apos;re not involved in
            negotiating price, arranging payment for the vehicle, or
            transferring ownership. Buyers and sellers are solely
            responsible for verifying vehicle condition, ownership, and
            complying with all applicable registration and transfer-of-title
            laws in their jurisdiction.
          </p>
        </Section>

        <Section title="2. Accounts">
          <p>
            You need an account to post a listing or message a seller.
            You&apos;re responsible for keeping your login credentials secure
            and for all activity under your account. You must provide
            accurate information and be old enough to lawfully enter a
            contract in your jurisdiction.
          </p>
        </Section>

        <Section title="3. Listing fees">
          <p>
            Posting a listing costs a flat fee, charged once at posting time
            via our payment processor, Stripe. <strong>Listing fees are
            non-refundable</strong> once paid, including if you remove your
            listing early, your vehicle sells elsewhere, or your listing is
            removed for violating these terms. We don&apos;t process or
            hold any payment for the vehicle itself — that happens directly
            between buyer and seller, entirely outside this platform.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to:</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Post a listing for a vehicle you don&apos;t own or aren&apos;t authorized to sell</li>
            <li>Post false, misleading, or fraudulent information about a vehicle</li>
            <li>Use the platform to harass, scam, or send unsolicited commercial messages to other users</li>
            <li>Attempt to circumvent, disable, or interfere with the platform&apos;s security features</li>
          </ul>
          <p className="mt-2">
            We may remove listings or suspend accounts that violate these
            terms, at our discretion.
          </p>
        </Section>

        <Section title="5. No warranty">
          <p>
            The platform is provided &quot;as is.&quot; We make no warranty
            about the accuracy of listings, the conduct of other users, or
            that the service will be uninterrupted or error-free. To the
            fullest extent permitted by law, we disclaim liability for
            disputes, losses, or damages arising from transactions between
            users conducted through or facilitated by the platform.
          </p>
        </Section>

        <Section title="6. Changes">
          <p>
            We may update these terms from time to time. Continued use of
            the platform after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>Questions about these terms? Contact us through your account&apos;s support channel.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
