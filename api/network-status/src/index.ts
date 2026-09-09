export default {
  async fetch(request: Request, env: Env) {
    const visitorIp = request.headers.get("CF-Connecting-IP");

    let homeIp: string;
    if (env.IS_PLAYWRIGHT === "1") {
      homeIp = "123.45.678.90";
    } else {
      const homeDomain = "home.markometcalfe.com";
      const dnsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${homeDomain}`,
        {
          headers: {
            accept: "application/dns-json",
          },
        },
      );
      const dnsData = (await dnsResponse.json()) as DNSResponse;
      homeIp = dnsData.Answer[0].data;
    }
    const isConnected =
      visitorIp === homeIp ||
      visitorIp === "::1" ||
      visitorIp === "127.0.0.1";

    const response = {
      isConnected,
      yourIp: visitorIp,
      homeIp,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};
