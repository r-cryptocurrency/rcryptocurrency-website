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

interface WelcomeEmailProps {
  unsubscribeUrl?: string;
}

export default function WelcomeEmail({ unsubscribeUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the r/CryptoCurrency newsletter!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://rcryptocurrency.com/img/logorcc.png"
              width="60"
              height="60"
              alt="r/CryptoCurrency"
              style={logo}
            />
            <Heading style={h1}>Welcome to r/CryptoCurrency!</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Thanks for subscribing to the r/CryptoCurrency newsletter. You're now part of our community of crypto enthusiasts!
            </Text>

            <Text style={paragraph}>
              Here's what you can expect:
            </Text>

            <Section style={listSection}>
              <Text style={listItem}>
                <span style={bullet}>&#x2022;</span> MOON distribution announcements and claim reminders
              </Text>
              <Text style={listItem}>
                <span style={bullet}>&#x2022;</span> Governance proposals and voting updates
              </Text>
              <Text style={listItem}>
                <span style={bullet}>&#x2022;</span> Weekly burn and market stats
              </Text>
              <Text style={listItem}>
                <span style={bullet}>&#x2022;</span> Community highlights and important announcements
              </Text>
            </Section>

            <Text style={paragraph}>
              In the meantime, check out our site for the latest stats, leaderboards, and more:
            </Text>

            <Section style={buttonContainer}>
              <Link href="https://rcryptocurrency.com" style={button}>
                Visit rcryptocurrency.com
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              r/CryptoCurrency Newsletter
            </Text>
            <Text style={footerLinks}>
              <Link href="https://rcryptocurrency.com" style={footerLink}>Website</Link>
              {' • '}
              <Link href="https://reddit.com/r/CryptoCurrency" style={footerLink}>Subreddit</Link>
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
  padding: '32px 24px 24px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 16px',
  borderRadius: '50%',
};

const h1 = {
  color: '#f97316',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 24px',
};

const paragraph = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const listSection = {
  margin: '16px 0',
  paddingLeft: '8px',
};

const listItem = {
  color: '#cbd5e1',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const bullet = {
  color: '#f97316',
  marginRight: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
  padding: '14px 28px',
};

const footer = {
  borderTop: '1px solid #334155',
  marginTop: '32px',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 8px',
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
