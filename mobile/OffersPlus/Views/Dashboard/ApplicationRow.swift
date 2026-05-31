import SwiftUI

struct ApplicationRow: View {
    let application: Application

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(application.displayCompanyName)
                    .font(.headline)
                Spacer()
                StatusBadge(status: application.status)
            }

            Text(application.job_title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            Text(application.formattedDate)
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadge: View {
    let status: ApplicationStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(status.color.opacity(0.15))
            .foregroundStyle(status.color)
            .clipShape(Capsule())
    }
}
