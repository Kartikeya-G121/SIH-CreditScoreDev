-- Create Partner Module Tables (Consolidated V30)

-- 1. Channel Partners Table
CREATE TABLE channel_partners (
    partner_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id),
    login_email VARCHAR(255) NOT NULL,
    organization_email VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by_admin_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partner_user ON channel_partners(user_id);
CREATE INDEX idx_partner_active ON channel_partners(is_active);

-- 2. Channel Partner Profiles Table
CREATE TABLE channel_partner_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT UNIQUE NOT NULL REFERENCES channel_partners(partner_id),
    organization_type VARCHAR(255) NOT NULL,
    registered_address VARCHAR(255),
    state VARCHAR(255),
    district VARCHAR(255),
    pincode VARCHAR(255),
    contact_person_name VARCHAR(255),
    contact_phone VARCHAR(255),
    organization_website VARCHAR(255),
    support_email VARCHAR(255),
    organization_logo VARCHAR(255),
    registration_cert_pdf VARCHAR(255),
    gst_pan_pdf VARCHAR(255),
    profile_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Partner Account Requests Table
CREATE TABLE partner_account_requests (
    request_id BIGSERIAL PRIMARY KEY,
    gmail_for_login VARCHAR(255) NOT NULL,
    official_org_email VARCHAR(255) NOT NULL,
    contact_person_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(255),
    note TEXT,
    status VARCHAR(255) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partner_req_status ON partner_account_requests(status);
CREATE INDEX idx_partner_req_gmail ON partner_account_requests(gmail_for_login);
CREATE INDEX idx_partner_req_org_email ON partner_account_requests(official_org_email);

-- 4. Loan Officers Table
CREATE TABLE loan_officers (
    officer_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id),
    partner_id BIGINT NOT NULL REFERENCES channel_partners(partner_id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_officer_user ON loan_officers(user_id);
CREATE INDEX idx_officer_partner ON loan_officers(partner_id);
CREATE INDEX idx_officer_active ON loan_officers(is_active);

-- 5. Loan Officer Profiles Table
CREATE TABLE loan_officer_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    officer_id BIGINT UNIQUE NOT NULL REFERENCES loan_officers(officer_id),
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    employee_id VARCHAR(255),
    office_location VARCHAR(255),
    profile_photo_url VARCHAR(255),
    id_card_pdf_url VARCHAR(255),
    profile_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Officer Assigned Schemes (ElementCollection)
CREATE TABLE officer_assigned_schemes (
    officer_id BIGINT NOT NULL REFERENCES loan_officers(officer_id),
    scheme_id INTEGER
);
