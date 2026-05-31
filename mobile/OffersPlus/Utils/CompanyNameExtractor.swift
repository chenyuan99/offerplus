import Foundation

enum CompanyNameExtractor {
    static func extract(from urlString: String) -> String {
        guard let url = URL(string: urlString),
              let host = url.host else { return urlString }

        let path = url.path

        // LinkedIn: /company/<slug>
        if host.contains("linkedin.com"),
           let range = path.range(of: #"/company/([^/?#]+)"#, options: .regularExpression) {
            let slug = String(path[range]).replacingOccurrences(of: "/company/", with: "")
            return toTitleCase(slug)
        }

        // Greenhouse: job-boards.greenhouse.io/<company> or boards.greenhouse.io/<company>
        if host == "job-boards.greenhouse.io" || host == "boards.greenhouse.io" {
            let slug = path.split(separator: "/").first.map(String.init) ?? host
            return toTitleCase(slug)
        }

        // Lever: jobs.lever.co/<company>
        if host == "jobs.lever.co" {
            let slug = path.split(separator: "/").first.map(String.init) ?? host
            return toTitleCase(slug)
        }

        // Workday: <company>.wd*.myworkdayjobs.com
        if host.contains("myworkdayjobs.com") {
            let subdomain = host.split(separator: ".").first.map(String.init) ?? host
            return toTitleCase(subdomain)
        }

        // Eightfold: <company>.eightfold.ai
        if host.contains("eightfold.ai") && host != "eightfold.ai" {
            let subdomain = host.split(separator: ".").first.map(String.init) ?? host
            return toTitleCase(subdomain)
        }

        // iCIMS: careers-<company>.icims.com
        if host.contains("icims.com") {
            var subdomain = host.split(separator: ".").first.map(String.init) ?? host
            for prefix in ["uscareers-", "us-careers-", "careers-"] {
                if subdomain.hasPrefix(prefix) {
                    subdomain = String(subdomain.dropFirst(prefix.count))
                    break
                }
            }
            return toTitleCase(subdomain)
        }

        // careers.* or jobs.* subdomain
        let parts = host.split(separator: ".")
        if parts.first == "careers" || parts.first == "jobs", parts.count >= 3 {
            return toTitleCase(String(parts[1]))
        }

        // Fallback: first meaningful domain segment
        let cleanHost = host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
        let segment = cleanHost.split(separator: ".").first.map(String.init) ?? cleanHost
        return toTitleCase(segment)
    }

    private static func toTitleCase(_ slug: String) -> String {
        slug.replacingOccurrences(of: "-", with: " ")
            .split(separator: " ")
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: " ")
    }
}
