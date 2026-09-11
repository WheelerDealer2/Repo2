import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Wheeler Dealer",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Privacy Policy</h1>
      <p className="mb-8 mt-1.5 text-sm text-[#5a5d61]">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-[14.5px] leading-relaxed text-[#3a3d42]">
        <Section title="1. What we collect">
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Account info:</strong> email address, display name, and an optional location, when you sign up</li>
            <li><strong>Listing content:</strong> the vehicle details, description, and photos you choose to post</li>
            <li><strong>Messages:</strong> the content of messages you send to other users through the platform</li>
            <li><strong>Payment info:</strong> when you pay a listing fee, payment is handled entirely by Stripe — we never see or store your card details, only a record that a payment succeeded or failed</li>
          </ul>
        </Section>

        <Section title="2. How we use it">
          <p>
            We use your information to operate the marketplace: showing
            your listings to other users, letting buyers and sellers
            message each other, processing listing fee payments, and
            keeping your account secure. We don&apos;t sell your personal
            information to third parties.
          </p>
        </Section>

        <Section title="3. Who can see what">
          <ul className="ml-5 list-disc space-y-1">
            <li>Your display name, location, and active listings are visible to anyone visiting the site</li>
            <li>Your email address is never shown publicly — other users only see your display name</li>
            <li>Messages you send are only visible to you and the recipient</li>
          </ul>
        </Section>

        <Section title="4. Service providers">
          <p>
            We use third-party services to run the platform: Supabase
            (database, authentication, and photo storage) and Stripe
            (payment processing). These providers process your data on our
            behalf under their own privacy and security commitments.
          </p>
        </Section>

        <Section title="5. Data retention & deletion">
          <p>
            We keep your account and listing data for as long as your
            account is active. Deleting a listing removes its data and
            photos. If you&apos;d like your account and associated data
            deleted entirely, contact us through your account&apos;s support
            channel.
          </p>
        </Section>

        <Section title="6. Changes">
          <p>
            We may update this policy from time to time. Continued use of
            the platform after a change means you accept the updated
            policy.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>Questions about this policy? Contact us through your account&apos;s support channel.</p>
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
