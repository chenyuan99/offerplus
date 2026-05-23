import SwiftUI
import Supabase

@main
struct OffersPlusApp: App {
    @StateObject private var authState = AuthState()

    var body: some Scene {
        WindowGroup {
            Group {
                if authState.isLoading {
                    ProgressView()
                } else if authState.isAuthenticated {
                    DashboardView()
                        .environmentObject(authState)
                } else {
                    LoginView()
                        .environmentObject(authState)
                }
            }
            .task { await authState.initialize() }
        }
    }
}
