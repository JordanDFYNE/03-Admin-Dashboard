export function errorHandler(error, request, response) {
  const status = error.status || 500;
  const payload = {
    error: {
      message: error.message || 'Unexpected server error',
    },
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json(payload);
}
