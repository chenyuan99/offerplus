import WidgetKit
import SwiftUI

@main
struct OffersPlusWidgetBundle: WidgetBundle {
    var body: some Widget {
        OffersPlusWidget()
    }
}

struct OffersPlusWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            OffersPlusWidgetEntryView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small")

            OffersPlusWidgetEntryView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")

            OffersPlusWidgetEntryView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")

            OffersPlusWidgetEntryView(entry: ActiveApplicationsEntry(date: .now, apps: [], isSignedIn: true))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small — Empty")
        }
    }
}
