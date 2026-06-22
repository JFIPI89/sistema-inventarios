import { logoutAction } from "@/actions/auth";

export async function POST() {
  await logoutAction();
}
