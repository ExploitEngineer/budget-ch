import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export function apiSuccess<T = unknown>({
  data,
  status = 200,
  message,
}: {
  data: T;
  status?: number;
  message?: string;
}) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function apiError<T = unknown>({
  message,
  status = 500,
}: {
  message: string;
  status?: number;
}) {
  return NextResponse.json({ success: false, message }, { status });
}
