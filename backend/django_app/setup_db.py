#!/usr/bin/env python3
"""
Simple script to create SQLite database with recipe tables for demo purposes.
"""
import sqlite3
import os
import json

def create_database():
    # Remove existing database
    db_path = 'db.sqlite3'
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create basic tables needed for recipes
    cursor.execute('''
    CREATE TABLE recipes_recipe (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        summary TEXT,
        description TEXT,
        track_codes TEXT,  -- JSON array as text
        skill_codes TEXT,  -- JSON array as text
        difficulty TEXT,
        source_type TEXT DEFAULT 'manual',
        estimated_minutes INTEGER DEFAULT 20,
        prerequisites TEXT,  -- JSON array as text
        tools_and_environment TEXT,  -- JSON array as text
        inputs TEXT,  -- JSON array as text
        steps TEXT,  -- JSON array as text
        validation_checks TEXT,  -- JSON array as text
        is_free_sample BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE recipes_userrecipeprogress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        recipe_id TEXT NOT NULL REFERENCES recipes_recipe(id),
        status TEXT DEFAULT 'not_started',
        completed_at DATETIME,
        times_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, recipe_id)
    );
    ''')

    # Sample recipe data
    log_parsing_steps = json.dumps([
        {
            "step_number": 1,
            "instruction": "Open Event Viewer → Windows Logs → Security",
            "expected_outcome": "See Security events list",
            "evidence_hint": "Screenshot of Security log"
        },
        {
            "step_number": 2,
            "instruction": "Filter for Event ID 4625 (Failed Logon)",
            "expected_outcome": "Only failed logons visible",
            "evidence_hint": "Screenshot of filtered results"
        },
        {
            "step_number": 3,
            "instruction": "Examine first failed logon → note Account Name, Workstation Name, Failure Reason",
            "expected_outcome": "Understand attack patterns",
            "evidence_hint": "Screenshot with annotations"
        },
        {
            "step_number": 4,
            "instruction": "Count total failed logons in last 24h → create simple report",
            "expected_outcome": "Daily failed logon summary",
            "evidence_hint": "Your count + screenshot"
        }
    ])

    nmap_steps = json.dumps([
        {
            "step_number": 1,
            "instruction": "nmap -sS scanme.nmap.org",
            "expected_outcome": "SYN scan results",
            "evidence_hint": "Screenshot of open ports"
        },
        {
            "step_number": 2,
            "instruction": "nmap -sV -sC scanme.nmap.org",
            "expected_outcome": "Service versions + scripts",
            "evidence_hint": "Screenshot of service detection"
        },
        {
            "step_number": 3,
            "instruction": "nmap --top-ports 50 scanme.nmap.org",
            "expected_outcome": "Top 50 ports scan",
            "evidence_hint": "Compare results"
        },
        {
            "step_number": 4,
            "instruction": "Save output: nmap -oN my_scan.txt scanme.nmap.org",
            "expected_outcome": "Saved report file",
            "evidence_hint": "File contents screenshot"
        }
    ])

    # Insert sample recipes
    cursor.execute('''
    INSERT INTO recipes_recipe (id, title, slug, summary, description, track_codes, skill_codes, difficulty, source_type, estimated_minutes, prerequisites, tools_and_environment, inputs, steps, validation_checks, is_free_sample, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'sample-1',
        'Log Parsing Basics: Failed Logon Detection',
        'defender-log-parsing-basics',
        'Learn to identify failed logon attempts in Windows Event Logs using basic filtering techniques.',
        'Learn to identify failed logon attempts in Windows Event Logs using basic filtering techniques.',
        json.dumps(['defender']),
        json.dumps(['log_parsing']),
        'beginner',
        'manual',
        20,
        json.dumps(['Basic command line familiarity']),
        json.dumps(['Windows Event Viewer', 'PowerShell']),
        json.dumps(['Windows Event Log access']),
        log_parsing_steps,
        json.dumps(['Can you spot Event ID 4625?', 'What\'s the most common failure reason?']),
        1,
        1
    ))

    cursor.execute('''
    INSERT INTO recipes_recipe (id, title, slug, summary, description, track_codes, skill_codes, difficulty, source_type, estimated_minutes, prerequisites, tools_and_environment, inputs, steps, validation_checks, is_free_sample, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'sample-2',
        'Nmap Basics: Port Scanning Fundamentals',
        'offensive-nmap-basics',
        'Master basic Nmap port scanning techniques for reconnaissance.',
        'Master basic Nmap port scanning techniques for reconnaissance.',
        json.dumps(['offensive']),
        json.dumps(['nmap_scanning']),
        'beginner',
        'manual',
        25,
        json.dumps(['Linux terminal access']),
        json.dumps(['Kali Linux', 'Nmap', 'Target: scanme.nmap.org']),
        json.dumps(['Internet access']),
        nmap_steps,
        json.dumps(['What ports are open?', 'What services run on them?', 'Why save scan results?']),
        1,
        1
    ))

    conn.commit()
    conn.close()

    print('Database created with sample recipes!')

if __name__ == '__main__':
    create_database()
