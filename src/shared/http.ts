export async function fetchText(
  url: string,
  headers?: Record<string, string>,
): Promise<{
  status: number;
  url: string;
  text: string;
}> {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      ...headers,
    },
    redirect: "follow",
  });

  return {
    status: response.status,
    url: response.url,
    text: await response.text(),
  };
}
