import { env } from "@/lib/env/server";
import Image from "next/image";

export default function Home() {
  const configSettings = {
    host: env.DATABASE_HOST,
    pwd: env.DATABASE_PASSWORD,
    user: env.DATABASE_USERNAME,
  };

  console.log("only on server");
  console.log({ configSettings });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>
  );
}
