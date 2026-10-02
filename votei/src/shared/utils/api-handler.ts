import { NextResponse } from 'next/server';
import { BaseError } from '@/shared/errors';
import { ZodError } from 'zod';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function handleError(err: unknown): NextResponse<ApiError> {
  if (err instanceof BaseError) {
    return NextResponse.json(err.toJSON() as ApiError, { status: err.statusCode });
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload.',
          details: err.flatten(),
        },
      },
      { status: 400 }
    );
  }

  if (err instanceof Error && err.name === 'AbortError') {
    return NextResponse.json(
      { success: false, error: { code: 'ABORTED', message: 'Request aborted.' } },
      { status: 499 }
    );
  }

  console.error('[API] Unhandled error:', err);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
    { status: 500 }
  );
}
