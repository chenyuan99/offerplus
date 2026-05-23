import SwiftUI

struct AddApplicationView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var jobTitle = ""
    @State private var companyName = ""
    @State private var jobLink = ""
    @State private var companyLink = ""
    @State private var status: ApplicationStatus = .applied
    @State private var dateApplied = Date()
    @State private var notes = ""
    @State private var isSaving = false
    @State private var error: String?

    let onAdd: (Application) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Company") {
                    TextField("Company name", text: $companyName)
                    TextField("Company URL (optional)", text: $companyLink)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }

                Section("Role") {
                    TextField("Job title", text: $jobTitle)
                    TextField("Job posting URL (optional)", text: $jobLink)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }

                Section("Details") {
                    Picker("Status", selection: $status) {
                        ForEach(ApplicationStatus.allCases) { s in
                            Text(s.displayName).tag(s)
                        }
                    }
                    DatePicker("Applied on", selection: $dateApplied, displayedComponents: .date)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                if let error {
                    Section {
                        Text(error).foregroundStyle(.red).font(.caption)
                    }
                }
            }
            .navigationTitle("Add Application")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { Task { await save() } }
                        .disabled(isSaving || jobTitle.isEmpty || companyName.isEmpty)
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        error = nil
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let payload = ApplicationInsert(
            job_title: jobTitle,
            company_name: companyName.isEmpty ? nil : companyName,
            job_link: jobLink.isEmpty ? nil : jobLink,
            company_link: companyLink.isEmpty ? nil : companyLink,
            status: status,
            date_applied: formatter.string(from: dateApplied),
            notes: notes.isEmpty ? nil : notes
        )
        do {
            let created = try await ApplicationService.shared.insert(payload)
            onAdd(created)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isSaving = false
    }
}
