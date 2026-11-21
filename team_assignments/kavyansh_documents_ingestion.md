# Kavyansh — Document Intake and Evidence Index

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Kavyansh
**Primary area:** file validation, text extraction, chunking, embeddings, and Qdrant metadata

## Outcome

Turn a manual or maintenance report into searchable, traceable evidence. Every indexed chunk must point back to the document and page or row it came from so the assistant can cite it.

## What you’ll learn

- **Technical skills:** validating uploads and extracting page/row text; chunking and citation metadata; embeddings, Qdrant indexing, and repeatable retrieval.

**In plain language:** You’ll learn how to turn manuals and reports into searchable evidence that can be traced back to its source.

## Work to complete

- Implement `POST /api/v1/documents/upload`, `GET /api/v1/documents`, `GET /api/v1/documents/{document_id}`, and `DELETE /api/v1/documents/{document_id}` using Tatvik’s document schema and auth dependency.
- Accept PDF, plain text, and CSV files with size limits, safe filenames, and clear unsupported-file errors. Extract text and preserve page/row metadata.
- Chunk text with configurable size and overlap. Store stable chunk IDs, document ID, title, page/row, and chunk position in Qdrant payloads.
- Reuse the existing BGE embedding and Qdrant services. Make re-indexing idempotent and delete document vectors when a document is deleted.
- Use Tatvik’s shared document states (`uploaded`, `processing`, `processed`, `failed`) and surface a useful error message when extraction or embedding fails. Do not introduce a separate status enum.
- Add one small, license-safe demo manual and one maintenance report with known passages used by the supervisor demo.
- Add OCR for scanned images as a stretch task after PDF/text/CSV ingestion and citation metadata pass.

## Ownership boundaries

- Own document-specific routes, extraction/chunking services, and document fixtures.
- Tatvik owns SQLAlchemy models and migrations. Request schema changes from Tatvik instead of creating a competing migration.
- Prathmesh consumes this retrieval/index API. Keep user-facing answer generation out of this package.

## Parallel work and integration

Build against the contract described in Tatvik’s assignment, using a local document repository/auth fixture or adapter where the Tatvik implementation is not yet available. Do not import or wait for another team’s unmerged branch. Keep persistence behind the repository interface so it can be connected to Tatvik’s schema after merge. Keep changes within the ownership areas above, document contract assumptions, and include examples so the PR can be tested and integrated independently.

## Acceptance checklist

- [ ] Uploading each required file type returns a document ID and status.
- [ ] Unsupported type, oversized file, empty text, and extraction failure return clear 4xx/5xx responses without leaking stack traces.
- [ ] Reprocessing the same document does not duplicate vectors.
- [ ] A search returns ranked chunks with document title, page/row, and stable chunk ID.
- [ ] Deleting a document removes its Qdrant points and persisted metadata.
- [ ] Tests cover extraction, chunk boundaries, metadata, repeated indexing, and failure cleanup.
- [ ] The demo manual contains evidence for the seeded supplier/component/failure relationships.

## PR instructions

Create `team/kavyansh-document-index`, push it, and open one PR against `main`. Link to the contract or local fixture used, and list any assumptions to reconcile during integration. Include fixture provenance/licenses, allowed formats/limits, and tests in the PR description. Do not commit uploaded user data, model caches, or credentials.
