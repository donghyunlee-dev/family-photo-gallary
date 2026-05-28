import { redirect } from "next/navigation";

import LoginScreen from "@/components/auth/login-screen";
import { getAuthorizedRoomId } from "@/lib/auth/session";

export default async function Home() {
  const authorizedRoomId = await getAuthorizedRoomId();

  if (authorizedRoomId) {
    redirect(`/${authorizedRoomId}`);
  }

  return <LoginScreen />;
}

