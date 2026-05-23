import SwiftUI

struct ApplicationDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var application: Application
    @State private var isSaving = false
    @State private var error: String?

    let onSave: (Application) -> Void

    init(application: Application, onSave: @escaping (Application) -> Void) {
        _application = State(initialValue: application)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Company") {
                    TextField("Company name", text: Binding(
                        get: { application.company_name ?? "" },
                        set: { application.company_name = $0.isEmpty ? nil : $0 }
                    ))
                    if let link = application.company_link {
                        Link(link, destination: URL(string: link) ?? URL(string: "https://example.com")!)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                Section("Role") {
                    TextField("Job title", text: $application.job_title)
                    if let link = application.job_link {
                        Link("View posting", destination: URL(string: link) ?? URL(string: "https://example.com")!)
                            .font(.caption)
                    }
                }

                Section("Status") {
                    Picker("Status", selection: $application.status) {
                        ForEach(ApplicationStatus.allCases) { status in
                            Text(status.displayName).tag(status)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Notes") {
                    TextEditor(text: Binding(
                        get: { application.notes ?? "" },
                        set: { application.notes = $0.isEmpty ? nil : $0 }
                    ))
                    .frame(minHeight: 80)
                }

                if let error {
                    Section {
                        Text(error).foregroundStyle(.red).font(.caption)
                    }
                }
            }
            .navigationTitle(application.displayCompanyName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(isSaving)
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        error = nil
        do {
            let update = ApplicationUpdate(
                job_title: application.job_title,
                company_name: application.company_name,
                status: application.status,
                notes: application.notes
            )
            try await ApplicationService.shared.update(id: application.id, update)
            onSave(application)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isSaving = false
    }
}
