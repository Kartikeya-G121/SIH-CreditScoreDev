CREATE TABLE blacklisted_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL
);

CREATE INDEX idx_blacklisted_tokens_token ON blacklisted_tokens(token);
