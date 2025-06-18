export interface FetcherData {
  cookies: string;
  origin: string;
  host: string;
}

const BROWSER = !import.meta.env.SSR;

export default function getFetcher(fetcherData: FetcherData): typeof fetch {
  const fetcher: typeof fetch = (input, init) => {
    if (BROWSER) {
      return fetch(input, init);
    }
    let url: string;

    if (typeof input === "string") {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      throw new Error("Invalid input type for fetch");
    }
    // Only prepend origin if not in browser and url is relative
    if (!/^https?:\/\//.test(url) && fetcherData.origin) {
      url = fetcherData.origin.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
    }
    const request = input instanceof Request 
      ? new Request(url, input)
      : new Request(url, init);

    const newUrl = new URL(request.url);

    if (`.${newUrl.hostname}`.endsWith(`.${fetcherData.host}`) && request.credentials !== 'omit') {
      const cookie = fetcherData.cookies;
      if (cookie) request.headers.set('cookie', cookie);
    }
    
    return fetch(request);
  };

  return fetcher;
}