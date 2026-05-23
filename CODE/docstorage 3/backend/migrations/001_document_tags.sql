CREATE TABLE IF NOT EXISTS document_tags (
    id SERIAL PRIMARY KEY,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    meili_doc_id VARCHAR(64) NOT NULL,
    CONSTRAINT uniq_doc_tag UNIQUE (tag_id, meili_doc_id)
);

CREATE INDEX IF NOT EXISTS idx_document_tags_meili_doc_id ON document_tags (meili_doc_id);
