import Foundation
import WidgetKit

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var applications: [Application] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchText = ""
    @Published var statusFilter: ApplicationStatus?

    var filtered: [Application] {
        applications.filter { app in
            let matchesSearch = searchText.isEmpty
                || app.displayCompanyName.localizedCaseInsensitiveContains(searchText)
                || app.job_title.localizedCaseInsensitiveContains(searchText)
            let matchesStatus = statusFilter == nil || app.status == statusFilter
            return matchesSearch && matchesStatus
        }
    }

    var stats: Stats {
        Stats(
            total: applications.count,
            active: applications.filter { $0.status != .rejected }.count,
            applied: applications.filter { $0.status == .applied }.count,
            oa: applications.filter { $0.status == .oa }.count,
            vo: applications.filter { $0.status == .vo }.count,
            offers: applications.filter { $0.status == .offer || $0.status == .accepted }.count,
            rejected: applications.filter { $0.status == .rejected }.count
        )
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            applications = try await ApplicationService.shared.fetchAll()
            cacheActiveApplicationsForWidget()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func cacheActiveApplicationsForWidget() {
        struct Slim: Encodable {
            let id: Int
            let company_name: String?
            let job_title: String
            let status: String
        }
        let active = applications
            .filter { [.oa, .vo, .interview].contains($0.status) }
            .map { Slim(id: $0.id, company_name: $0.company_name, job_title: $0.job_title, status: $0.status.rawValue) }
        if let data = try? JSONEncoder().encode(active) {
            UserDefaults(suiteName: "group.com.riseworks.offersplus")?.set(data, forKey: "activeApplications")
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    func delete(_ application: Application) async {
        do {
            try await ApplicationService.shared.delete(id: application.id)
            applications.removeAll { $0.id == application.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateStatus(id: Int, status: ApplicationStatus) async {
        do {
            try await ApplicationService.shared.update(id: id, ApplicationUpdate(status: status))
            if let i = applications.firstIndex(where: { $0.id == id }) {
                applications[i].status = status
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct Stats {
    let total, active, applied, oa, vo, offers, rejected: Int
}
