// src/app/api/auth/session/route.ts

import { auth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "No ID token provided." }, { status: 400 });
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const options = {
      name: "__session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    // Set the secure, httpOnly cookie in the browser.
    cookies().set(options);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Failed to create session." }, { status: 401 });
  }
}