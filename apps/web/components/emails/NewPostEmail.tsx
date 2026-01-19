import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface NewPostEmailProps {
  title: string;
  excerpt?: string;
  slug: string;
  authorName?: string;
  unsubscribeUrl?: string;
}

export default function NewPostEmail({
  title,
  excerpt,
  slug,
  authorName,
  unsubscribeUrl,
}: NewPostEmailProps) {
  const postUrl = `https://rcryptocurrency.com/newsletter/${slug}`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://rcryptocurrency.com/img/logorcc.png"
              width="50"
              height="50"
              alt="r/CryptoCurrency"
              style={logo}
            />
            <Text style={headerText}>r/CryptoCurrency Newsletter</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h1}>{title}</Heading>

            {authorName && (
              <Text style={authorText}>By {authorName}</Text>
            )}

            {excerpt && (
              <Text style={paragraph}>{excerpt}</Text>
            )}

            <Section style={buttonContainer}>
              <Link href={postUrl} style={button}>
                Read Full Post
              </Link>
            </Section>

            <Text style={hint}>
              Or copy this link: {postUrl}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you subscribed to the r/CryptoCurrency newsletter.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://rcryptocurrency.com" style={footerLink}>Website</Link>
              {' • '}
              <Link href="https://reddit.com/r/CryptoCurrency" style={footerLink}>Subreddit</Link>
              {' • '}
              <Link href="https://rcryptocurrency.com/newsletter" style={footerLink}>Past Updates</Link>
              {unsubscribeUrl && (
                <>
                  {' • '}
                  <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#1e293b',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const header = {
  padding: '24px 24px 16px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #334155',
};

const logo = {
  margin: '0 auto 12px',
  borderRadius: '50%',
};

const headerText = {
  color: '#f97316',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const content = {
  padding: '32px 24px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const authorText = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const button = {
  backgroundColor: '#f97316',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hint = {
  color: '#64748b',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
  wordBreak: 'break-all' as const,
};

const footer = {
  borderTop: '1px solid #334155',
  marginTop: '16px',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 12px',
  lineHeight: '18px',
};

const footerLinks = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
};

const footerLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};
