// Custom fetch wrapper that includes credentials and proper headers
export const apiFetch = async ({ url, body }: { url: string; body: any }) => {
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(body),
  });

  if (!result.ok || result.status >= 300) {
    const errorText = await result.text();
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      // Ignore JSON parse error
    }

    if (errorData.__error) {
      throw new Error(errorData.__error);
    }
    // If the error is not JSON, throw the raw text
    throw new Error(errorText || `HTTP ${result.status}: ${result.statusText}`);
  }

  const data = await result.json();
  return data;
};