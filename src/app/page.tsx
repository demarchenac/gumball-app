import Image from 'next/image';

import { env } from '@/lib/env/server';

export default function Home() {
  const configSettings = {
    url: env.DATABASE_URL,
  };

  console.log('only on server');
  console.log({ configSettings });

  return <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>;
}
