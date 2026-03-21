import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({ username: adminUser, role: "admin" });
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 0, path: "/",
  });
  return response;
}
