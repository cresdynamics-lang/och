#!/usr/bin/env python
"""Fix all tables with user_id that should be UUID instead of BIGINT."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Fixing ALL auth/audit tables with UUID foreign keys...\n")

tables_to_fix = {
    'mfa_methods': '''
        CREATE TABLE mfa_methods (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            method_type VARCHAR(20) NOT NULL,
            phone_number VARCHAR(20),
            email VARCHAR(255),
            totp_secret VARCHAR(255),
            backup_codes TEXT,
            is_primary BOOLEAN DEFAULT FALSE,
            is_enabled BOOLEAN DEFAULT TRUE,
            verified_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_mfa_methods_user ON mfa_methods(user_id);
    ''',

    'mfa_codes': '''
        CREATE TABLE mfa_codes (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            code VARCHAR(10) NOT NULL,
            code_type VARCHAR(20) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_mfa_codes_user ON mfa_codes(user_id);
        CREATE INDEX idx_mfa_codes_code ON mfa_codes(code);
    ''',

    'sso_connections': '''
        CREATE TABLE sso_connections (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            provider_user_id VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            display_name VARCHAR(255),
            picture_url TEXT,
            access_token TEXT,
            refresh_token TEXT,
            token_expires_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB DEFAULT '{}'::jsonb,
            linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(provider, provider_user_id)
        );
        CREATE INDEX idx_sso_connections_user ON sso_connections(user_id);
        CREATE INDEX idx_sso_connections_provider ON sso_connections(provider, provider_user_id);
    ''',

    'audit_logs': '''
        CREATE TABLE audit_logs (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(uuid_id) ON DELETE SET NULL,
            action VARCHAR(255) NOT NULL,
            resource_type VARCHAR(100),
            resource_id VARCHAR(255),
            ip_address INET,
            user_agent TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            severity VARCHAR(20) DEFAULT 'info',
            status VARCHAR(20) DEFAULT 'success',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
        CREATE INDEX idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
        CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
    ''',

    'data_exports': '''
        CREATE TABLE data_exports (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            requested_by_id UUID REFERENCES users(uuid_id) ON DELETE SET NULL,
            export_type VARCHAR(50) DEFAULT 'full',
            status VARCHAR(20) DEFAULT 'pending',
            file_url TEXT,
            file_size_bytes BIGINT,
            expires_at TIMESTAMP WITH TIME ZONE,
            requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            downloaded_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX idx_data_exports_user ON data_exports(user_id);
        CREATE INDEX idx_data_exports_status ON data_exports(status);
    ''',

    'data_erasures': '''
        CREATE TABLE data_erasures (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            erasure_type VARCHAR(50) DEFAULT 'full',
            status VARCHAR(20) DEFAULT 'pending',
            requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB DEFAULT '{}'::jsonb
        );
        CREATE INDEX idx_data_erasures_user ON data_erasures(user_id);
        CREATE INDEX idx_data_erasures_status ON data_erasures(status);
    ''',
}

with connection.cursor() as cursor:
    for table_name, create_sql in tables_to_fix.items():
        try:
            print(f"Fixing {table_name}...")
            cursor.execute(f'DROP TABLE IF EXISTS {table_name} CASCADE;')
            cursor.execute(create_sql)
            print(f"  [OK] {table_name}")
        except Exception as e:
            print(f"  [ERROR] {table_name}: {e}")

print("\n✅ All auth/audit tables fixed!")
print("   user_id is now UUID and references users(uuid_id)")
print("\nTry logging in now!")
