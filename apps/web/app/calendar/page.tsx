
import { Title, Text } from "@tremor/react";
import Background from '../../components/Background';

export const metadata = {
  title: 'Events Calendar | r/CryptoCurrency',
  description: 'Upcoming AMAs, events, and community schedules.',
};

export default function CalendarPage() {
  // Google Calendar Embed URL
  // src 1: cryptocurrency472@gmail.com (Base64 decoded from provided CID)
  // src 2: i0e5as6q033nruqck5c9nfk24k@group.calendar.google.com
  const calendarUrl = "https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=UTC&src=Y3J5cHRvY3VycmVuY3k0NzJAZ21haWwuY29t&src=aTBlNWFzNnEwMzNucnVxY2s1YzluZmsyNGtAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&color=%23F0932B&color=%23D81B60";

  return (
    <Background>
      <main className="p-4 md:p-10 pt-24 min-h-screen">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center md:text-left">
            <Title className="text-slate-900 dark:text-white mb-4 text-3xl font-bold">Community Events</Title>
            <Text className="text-slate-600 dark:text-white/80">
              Stay up to date with upcoming AMAs, talks, and community events. 
              This calendar automatically updates as new events are scheduled.
            </Text>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[800px]">
            <iframe 
              src={calendarUrl} 
              style={{ border: 0 }} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no"
              title="r/CryptoCurrency Events Calendar"
            ></iframe>
          </div>
        </div>
      </main>
    </Background>
  );
}
