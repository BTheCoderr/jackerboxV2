import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

type ApiResponse<T> = {
  data?: T;
  error?: string;
  errors?: { [key: string]: string[] };
  message?: string;
  status: number;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 400,
    public errors?: { [key: string]: string[] }
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createApiResponse = <T>(
  response: ApiResponse<T>
): NextResponse => {
  const { data, error, errors, message, status } = response;
  
  const body: any = {};
  if (data) body.data = data;
  if (error) body.error = error;
  if (errors) body.errors = errors;
  if (message) body.message = message;
  
  return NextResponse.json(body, { status });
};

export const handleApiError = (error: unknown): NextResponse => {
  console.error('[API_ERROR]', error);
  
  if (error instanceof ApiError) {
    return createApiResponse({
      error: error.message,
      errors: error.errors,
      status: error.status,
    });
  }
  
  if (error instanceof ZodError) {
    const errors = error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      if (!acc[path]) acc[path] = [];
      acc[path].push(err.message);
      return acc;
    }, {} as { [key: string]: string[] });
    
    return createApiResponse({
      error: 'Validation error',
      errors,
      status: 400,
    });
  }
  
  if (error instanceof Error) {
    return createApiResponse({
      error: error.message,
      status: 500,
    });
  }
  
  return createApiResponse({
    error: 'An unexpected error occurred',
    status: 500,
  });
};

export const unauthorized = (message: string = 'Unauthorized') => {
  return createApiResponse({
    error: message,
    status: 401,
  });
};

export const forbidden = (message: string = 'Forbidden') => {
  return createApiResponse({
    error: message,
    status: 403,
  });
};

export const notFound = (message: string = 'Not found') => {
  return createApiResponse({
    error: message,
    status: 404,
  });
};

export const badRequest = (message: string, errors?: { [key: string]: string[] }) => {
  return createApiResponse({
    error: message,
    errors,
    status: 400,
  });
};

export const success = <T>(data: T, message?: string) => {
  return createApiResponse({
    data,
    message,
    status: 200,
  });
};

export const created = <T>(data: T, message?: string) => {
  return createApiResponse({
    data,
    message,
    status: 201,
  });
}; 