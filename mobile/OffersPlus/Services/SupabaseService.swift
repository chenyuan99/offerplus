import Foundation
import Supabase

let supabase = SupabaseClient(
    supabaseURL: Config.supabaseURL,
    supabaseKey: Config.supabaseAnonKey
)

// MARK: - Auth State

@MainActor
class AuthState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true

    func initialize() async {
        for await state in await supabase.auth.authStateChanges {
            isAuthenticated = state.session != nil
            isLoading = false
        }
    }

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
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
