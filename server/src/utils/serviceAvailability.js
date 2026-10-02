export function isServiceUnavailable(error) {
  const message = String(error?.message || '');
  return error?.status >= 500 ||
    error?.name === 'AuthRetryableFetchError' ||
    /SUPABASE_TIMEOUT|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(message);
}

export function sendServiceUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Authentication service is temporarily unavailable. Please try again.'
    }
  });
}
