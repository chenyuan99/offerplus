import Foundation
import AuthenticationServices
import Supabase
import WidgetKit

let supabase = SupabaseClient(
    supabaseURL: Config.supabaseURL,
    supabaseKey: Config.supabaseAnonKey,
    options: SupabaseClientOptions(
        auth: .init(emitLocalSessionAsInitialSession: true)
    )
)

// MARK: - Auth State

@MainActor
class AuthState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true

    func initialize() async {
        for await state in supabase.auth.authStateChanges {
            isAuthenticated = state.session != nil
            isLoading = false
            syncCredentialsToWidget(session: state.session)
        }
    }

    private func syncCredentialsToWidget(session: Session?) {
        let defaults = UserDefaults(suiteName: "group.com.riseworks.offersplus")
        if let session {
            defaults?.set(Config.supabaseURL.absoluteString, forKey: "supabaseURL")
            defaults?.set(Config.supabaseAnonKey,             forKey: "anonKey")
            defaults?.set(session.accessToken,                forKey: "accessToken")
            defaults?.set(true,                               forKey: "isSignedIn")
        } else {
            defaults?.removeObject(forKey: "accessToken")
            defaults?.set(false, forKey: "isSignedIn")
        }
        WidgetCenter.shared.reloadAllTimelines()
    }

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
    }

    func signInWithGoogle() async throws {
        try await supabase.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "com.riseworks.offersplus://login-callback"),
            queryParams: [("prompt", "select_account")]
        ) { url in
            try await withCheckedThrowingContinuation { continuation in
                let session = ASWebAuthenticationSession(
                    url: url,
                    callbackURLScheme: "com.riseworks.offersplus"
                ) { callbackURL, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else if let callbackURL = callbackURL {
                        continuation.resume(returning: callbackURL)
                    } else {
                        continuation.resume(throwing: URLError(.badServerResponse))
                    }
                }
                session.prefersEphemeralWebBrowserSession = false
                session.presentationContextProvider = PresentationContextProvider.shared
                session.start()
            }
        }
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }
}

// MARK: - ASWebAuthenticationSession presentation context

private final class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = PresentationContextProvider()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}

// MARK: - Application Service

class ApplicationService {
    static let shared = ApplicationService()

    func fetchAll() async throws -> [Application] {
        try await supabase
            .from("applications")
            .select()
            .order("date_applied", ascending: false)
            .execute()
            .value
    }

    func insert(_ payload: ApplicationInsert) async throws -> Application {
        try await supabase
            .from("applications")
            .insert(payload)
            .select()
            .single()
            .execute()
            .value
    }

    func update(id: Int, _ payload: ApplicationUpdate) async throws {
        try await supabase
            .from("applications")
            .update(payload)
            .eq("id", value: id)
            .execute()
    }

    func delete(id: Int) async throws {
        try await supabase
            .from("applications")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
