import SwiftUI

struct StatsView: View {
    let stats: Stats

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                StatCard(label: "Total", value: stats.total, color: .primary)
                StatCard(label: "Active", value: stats.active, color: .blue)
                StatCard(label: "Applied", value: stats.applied, color: .blue)
                StatCard(label: "OA", value: stats.oa, color: .purple)
                StatCard(label: "VO", value: stats.vo, color: .indigo)
                StatCard(label: "Offers", value: stats.offers, color: .green)
                StatCard(label: "Rejected", value: stats.rejected, color: .red)
            }
            .padding(.horizontal)
        }
    }
}

private struct StatCard: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(width: 72)
        .padding(.vertical, 12)
        .background(.regularMaterial)
        .cornerRadius(12)
    }
}
