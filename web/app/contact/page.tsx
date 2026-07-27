// web/app/contact/page.tsx
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: '联系我',
  description: '通过表单给我留言',
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <Section title="联系我">
        <div className="max-w-xl">
          <p className="text-gray-500 mb-6">有任何问题或合作意向，欢迎给我留言。</p>
          <ContactForm />
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
