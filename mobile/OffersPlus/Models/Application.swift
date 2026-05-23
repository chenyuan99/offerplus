import Foundation
import SwiftUI

enum ApplicationStatus: String, Codable, CaseIterable, Identifiable {
    case applied
    case in_progress
    case rejected
    case offer
    case accepted
    case oa
    case vo

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .applied:     return "Applied"
        case .in_progress: return "In Progress"
        case .rejected:    return "Rejected"
        case .offer:       return "Offer"
        case .accepted:    return "Accepted"
        case .oa:          return "OA"
        case .vo:          return "VO"
        }
    }

    var color: Color {
        switch self {
        case .applied:     return .blue
        case .in_progress: return .orange
        case .rejected:    return .red
        case .offer:       return .green
        case .accepted:    return .green
        case .oa:          return .purple
        case .vo:          return .indigo
        }
    }
}

struct Application: Codable, Identifiable {
    let id: Int
    let user_id: String
    var job_title: String
    var company_name: String?
    var job_link: String?
    var company_link: String?
    var status: ApplicationStatus
    var date_applied: String
    var notes: String?
    let created_at: String
    let updated_at: String

    var displayCompanyName: String {
        if let name = company_name, !name.isEmpty { return name }
        if let link = company_link { return CompanyNameExtractor.extract(from: link) }
        return "Unknown Company"
    }

    var formattedDate: String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withFullDate]
        guard let date = iso.date(from: date_applied) else { return date_applied }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

struct ApplicationInsert: Encodable {
    var job_title: String
    var company_name: String?
    var job_link: String?
    var company_link: String?
    var status: ApplicationStatus
    var date_applied: String
    var notes: String?
}

struct ApplicationUpdate: Encodable {
    var job_title: String?
    var company_name: String?
    var status: ApplicationStatus?
    var notes: String?
}
