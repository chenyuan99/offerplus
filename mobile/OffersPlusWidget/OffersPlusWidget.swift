import WidgetKit
import SwiftUI
import UIKit

// MARK: - Shared storage

let appGroupID = "group.com.riseworks.offersplus"

func widgetDefaults() -> UserDefaults {
    UserDefaults(suiteName: appGroupID) ?? .standard
}

// MARK: - Models

struct WidgetApp: Codable, Identifiable {
    let id: Int
    let company_name: String?
    let job_title: String
    let status: String

    var company: String { company_name ?? "Unknown" }

    var statusLabel: String {
        switch status {
        case "oa":        return "OA"
        case "vo":        return "VO"
        case "interview": return "Interview"
        default:          return status.capitalized
        }
    }

    var statusColor: Color {
        switch status {
        case "oa":        return .purple
        case "vo":        return .indigo
        case "interview": return Color(red: 0.94, green: 0.48, blue: 0.00) // system orange-ish
        default:          return .gray
        }
    }
}

// MARK: - Timeline Entry

struct ActiveApplicationsEntry: TimelineEntry {
    let date: Date
    let apps: [WidgetApp]
    let isSignedIn: Bool

    var interviews: [WidgetApp] { apps.filter { $0.status == "interview" } }
    var oas:        [WidgetApp] { apps.filter { $0.status == "oa" } }
    var vos:        [WidgetApp] { apps.filter { $0.status == "vo" } }

    static let placeholder = ActiveApplicationsEntry(
        date: .now,
        apps: [
            WidgetApp(id: 1, company_name: "Anthropic", job_title: "Software Engineer", status: "interview"),
            WidgetApp(id: 2, company_name: "Amazon",    job_title: "SDE",               status: "oa"),
            WidgetApp(id: 3, company_name: "Google",    job_title: "Software Engineer", status: "vo"),
            WidgetApp(id: 4, company_name: "Apple",     job_title: "SWE",               status: "interview"),
        ],
        isSignedIn: true
    )
}

// MARK: - Provider

struct ActiveApplicationsProvider: TimelineProvider {
    func placeholder(in context: Context) -> ActiveApplicationsEntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (ActiveApplicationsEntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
        } else {
            completion(loadCached())
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ActiveApplicationsEntry>) -> Void) {
        fetchLive { entry in
            let refreshAt = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(refreshAt)))
        }
    }

    // MARK: Private

    private func loadCached() -> ActiveApplicationsEntry {
        let defaults = widgetDefaults()
        let isSignedIn = defaults.bool(forKey: "isSignedIn")
        guard let data = defaults.data(forKey: "activeApplications"),
              let apps = try? JSONDecoder().decode([WidgetApp].self, from: data)
        else {
            return ActiveApplicationsEntry(date: .now, apps: [], isSignedIn: isSignedIn)
        }
        return ActiveApplicationsEntry(date: .now, apps: apps, isSignedIn: isSignedIn)
    }

    private func fetchLive(completion: @escaping (ActiveApplicationsEntry) -> Void) {
        let defaults = widgetDefaults()
        guard
            let jwt = defaults.string(forKey: "accessToken"),
            let anonKey = defaults.string(forKey: "anonKey"),
            let baseURL = defaults.string(forKey: "supabaseURL")
        else {
            completion(ActiveApplicationsEntry(date: .now, apps: [], isSignedIn: false))
            return
        }

        var comps = URLComponents(string: "\(baseURL)/rest/v1/applications")!
        comps.queryItems = [
            URLQueryItem(name: "status", value: "in.(oa,vo,interview)"),
            URLQueryItem(name: "select",  value: "id,company_name,job_title,status"),
            URLQueryItem(name: "order",   value: "date_applied.desc"),
            URLQueryItem(name: "limit",   value: "20"),
        ]

        var req = URLRequest(url: comps.url!)
        req.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        req.setValue(anonKey,         forHTTPHeaderField: "apikey")

        URLSession.shared.dataTask(with: req) { data, _, _ in
            if let data, let apps = try? JSONDecoder().decode([WidgetApp].self, from: data) {
                defaults.set(data, forKey: "activeApplications")
                completion(ActiveApplicationsEntry(date: .now, apps: apps, isSignedIn: true))
            } else {
                completion(self.loadCached())
            }
        }.resume()
    }
}

// MARK: - Brand colour

private let brand = Color(red: 0.525, green: 0.122, blue: 0.255)

// MARK: - Small Widget

struct SmallWidgetView: View {
    let entry: ActiveApplicationsEntry

    var body: some View {
        if !entry.isSignedIn {
            signInPrompt
        } else if entry.apps.isEmpty {
            emptyState
        } else {
            content
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack(spacing: 4) {
                Circle().fill(brand).frame(width: 8, height: 8)
                Text("OfferPlus").font(.caption.weight(.semibold)).foregroundStyle(brand)
            }

            Spacer()

            // Count rows
            statusRow(color: .orange, label: "Interview", count: entry.interviews.count)
            statusRow(color: .purple, label: "OA",        count: entry.oas.count)
            statusRow(color: .indigo, label: "VO",        count: entry.vos.count)

            Spacer()

            // Total
            Text("\(entry.apps.count) active")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Color(UIColor.systemBackground))
    }

    private func statusRow(color: Color, label: String, count: Int) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 4, height: 14)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
            Text("\(count)")
                .font(.caption.weight(.bold))
                .foregroundStyle(count > 0 ? color : .secondary)
        }
    }

    private var signInPrompt: some View {
        VStack(spacing: 6) {
            Circle().fill(brand).frame(width: 8, height: 8)
            Text("Sign in to\nOfferPlus").font(.caption.weight(.medium)).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Circle().fill(brand).frame(width: 8, height: 8)
                Text("OfferPlus").font(.caption.weight(.semibold)).foregroundStyle(brand)
            }
            Spacer()
            Text("No active\napplications")
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Color(UIColor.systemBackground))
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let entry: ActiveApplicationsEntry

    var body: some View {
        if !entry.isSignedIn {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    headerRow
                    Text("Sign in to see active applications")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding()
            .background(Color(UIColor.systemBackground))
        } else {
            VStack(alignment: .leading, spacing: 0) {
                // Header bar
                HStack {
                    headerRow
                    Spacer()
                    countBadges
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)

                Divider()

                // App list (up to 3)
                let shown = Array(entry.apps.prefix(3))
                if shown.isEmpty {
                    Text("No OA, VO or Interview applications")
                        .font(.caption).foregroundStyle(.secondary)
                        .padding(.horizontal, 14).padding(.top, 10)
                } else {
                    ForEach(shown) { app in
                        appRow(app)
                        if app.id != shown.last?.id { Divider().padding(.leading, 14) }
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color(UIColor.systemBackground))
        }
    }

    private var headerRow: some View {
        HStack(spacing: 5) {
            Circle().fill(brand).frame(width: 8, height: 8)
            Text("OfferPlus").font(.subheadline.weight(.semibold)).foregroundStyle(brand)
        }
    }

    private var countBadges: some View {
        HStack(spacing: 6) {
            countChip(count: entry.interviews.count, color: .orange, label: "Interview")
            countChip(count: entry.oas.count,        color: .purple, label: "OA")
            countChip(count: entry.vos.count,        color: .indigo, label: "VO")
        }
    }

    private func countChip(count: Int, color: Color, label: String) -> some View {
        HStack(spacing: 3) {
            Text("\(count)").font(.caption.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .padding(.horizontal, 6).padding(.vertical, 2)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
    }

    private func appRow(_ app: WidgetApp) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                Text(app.company)
                    .font(.footnote.weight(.medium))
                    .lineLimit(1)
                Text(app.job_title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
            Text(app.statusLabel)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(app.statusColor)
                .padding(.horizontal, 7).padding(.vertical, 3)
                .background(app.statusColor.opacity(0.12))
                .clipShape(Capsule())
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 7)
    }
}

// MARK: - Large Widget

struct LargeWidgetView: View {
    let entry: ActiveApplicationsEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 5) {
                    Circle().fill(brand).frame(width: 10, height: 10)
                    Text("OfferPlus").font(.headline.weight(.bold)).foregroundStyle(brand)
                }
                Spacer()
                Text("Active Applications").font(.caption).foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)

            // Summary strip
            HStack(spacing: 0) {
                summaryCell(count: entry.interviews.count, label: "Interview", color: .orange)
                Divider().frame(height: 32)
                summaryCell(count: entry.oas.count,        label: "OA",        color: .purple)
                Divider().frame(height: 32)
                summaryCell(count: entry.vos.count,        label: "VO",        color: .indigo)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color(UIColor.secondarySystemBackground))

            // App list (up to 7)
            let shown = Array(entry.apps.prefix(7))
            if shown.isEmpty {
                Spacer()
                Text(entry.isSignedIn ? "No OA, VO or Interview applications" : "Sign in to see active applications")
                    .font(.callout).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                ForEach(shown) { app in
                    HStack {
                        // Status accent
                        RoundedRectangle(cornerRadius: 2)
                            .fill(app.statusColor)
                            .frame(width: 3, height: 28)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(app.company)
                                .font(.footnote.weight(.semibold))
                                .lineLimit(1)
                            Text(app.job_title)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Text(app.statusLabel)
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(app.statusColor)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(app.statusColor.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)

                    if app.id != shown.last?.id {
                        Divider().padding(.leading, 30)
                    }
                }
                Spacer(minLength: 0)

                if entry.apps.count > 7 {
                    Text("+\(entry.apps.count - 7) more")
                        .font(.caption2).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 10)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(UIColor.systemBackground))
    }

    private func summaryCell(count: Int, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.title2.weight(.bold))
                .foregroundStyle(count > 0 ? color : .secondary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Widget Configuration

struct OffersPlusWidget: Widget {
    let kind = "OffersPlusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ActiveApplicationsProvider()) { entry in
            if #available(iOS 17.0, *) {
                OffersPlusWidgetEntryView(entry: entry)
                    .containerBackground(.background, for: .widget)
            } else {
                OffersPlusWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Active Applications")
        .description("Track your OA, VO, and Interview applications at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct OffersPlusWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: ActiveApplicationsEntry

    var body: some View {
        switch family {
        case .systemSmall:  SmallWidgetView(entry: entry)
        case .systemMedium: MediumWidgetView(entry: entry)
        case .systemLarge:  LargeWidgetView(entry: entry)
        default:            MediumWidgetView(entry: entry)
        }
    }
}
