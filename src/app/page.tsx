import { env } from '@/lib/env/server';

export default function Home() {
  const configSettings = {
    url: env.DATABASE_URL,
  };

  console.log('only on server');
  console.log({ configSettings });

  return <div>Home</div>;
}
