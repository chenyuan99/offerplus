import WidgetKit
import SwiftUI

@main
struct OffersPlusWidgetBundle: WidgetBundle {
    var body: some Widget {
        OffersPlusWidget()
    }
}

#Preview("Small", as: .systemSmall) {
    OffersPlusWidget()
} timeline: {
    ActiveApplicationsEntry.placeholder
    ActiveApplicationsEntry(date: .now, apps: [], isSignedIn: true)
}

#Preview("Medium", as: .systemMedium) {
    OffersPlusWidget()
} timeline: {
    ActiveApplicationsEntry.placeholder
}

#Preview("Large", as: .systemLarge) {
    OffersPlusWidget()
} timeline: {
    ActiveApplicationsEntry.placeholder
}
