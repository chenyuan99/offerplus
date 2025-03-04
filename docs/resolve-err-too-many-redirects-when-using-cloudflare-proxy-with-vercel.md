How do I resolve "err_too_many_redirects" when using a Cloudflare proxy with Vercel?
Information about how to resolve the "err_too_many_redirects" error when using a Cloudflare proxy with Vercel.
Last updated on March 6, 2024
Domains & DNS
When assigning a domain to a Project on Vercel that is currently using a Cloudflare proxy, you may encounter the error "err_too_many_redirects". In this article, we will explain why this error occurs and what changes you need to make to resolve it.

Why Does This Error Happen?
This error occurs when your Cloudflare SSL/TLS configuration is set to "Flexible". Under that scenario, Cloudflare will send requests from their servers to your Vercel deployment using HTTP instead of HTTPS. After Vercel answers Cloudflare's request, they will forward the response using HTTPS.

Since Vercel will automatically upgrade all HTTP requests to use SSL when a certificate is present, a 308 status code is sent to the client, causing a redirect to the same location.

Here is a quick summary of the issue:

Cloudflare is serving https://example.com and making requests to http://example.com on Vercel.
Vercel identifies an unprotected request to http://example.com and sends a 308 status code redirect to https://example.com.
Cloudflare will forward the redirect to the user. However, since the client is already on https://example.com, it will generate a redirect to the same location, causing a loop.
Solution
To fix the issue, you need to set the "SSL/TLS" option in Cloudflare to "Full". It is important to also follow the instructions in our Cloudflare guide so the domain keeps working without any issues.
