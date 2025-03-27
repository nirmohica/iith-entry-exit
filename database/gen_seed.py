#!/usr/bin/env python3
"""
Author: Deepseek R1
Date: 22 March, 2025

This script generates seed data for the gateAccess database.
It creates:
 - Organizational Units (departments)
 - Residents (students and faculty) with pre-generated IDs
 - Student and Faculty records
 - Relationships between residents and org units (res_org)
 - Access records for residents (each with an entry and exit)
 - Visitor records with associated access logs (storing OTP in the access table)
 - Links between residents and visitors (res_visitors)
 - Visitor access records in visitor_accesses (without password)
 - Optional vehicle records
"""

from faker import Faker
import json
import random
import string
from datetime import datetime, timedelta
from collections import defaultdict

fake = Faker('en_IN')

# --------------------------
# Configuration Variables
# --------------------------
NUM_RESIDENTS = 9900  # Total residents
STUDENT_RATIO = 0.9
NUM_STUDENTS = int(NUM_RESIDENTS * STUDENT_RATIO)  # e.g., 8910 students
NUM_FACULTY = NUM_RESIDENTS - NUM_STUDENTS         # e.g., 990 faculty

ACCESS_RECORDS = 19800  # Total access records (both residents and visitors)
RESIDENT_ACCESS_RATIO = 0.9  # 90% of access records are for residents
VEHICLE_PROBABILITY = 0.3

# --------------------------
# Department Data
# --------------------------
# Each tuple: (Full Department Name, Short Code for ID generation, Mail Code)
departments = [
    ('Artificial Intelligence', 'AI', 'ai'),
    ('Biomedical Engineering', 'BM', 'bme'),
    ('Biotechnology', 'BT', 'bt'),
    ('Chemical Engineering', 'CH', 'che'),
    ('Climate Change', 'CC', 'cc'),
    ('Civil Engineering', 'CE', 'ce'),
    ('Computer Science and Engineering', 'CS', 'cse'),
    ('Electrical Engineering', 'EE', 'ee'),
    ('Engineering Science', 'ES', 'es'),
    ('Heritage Science and Technology', 'HS', 'hst'),
    ('Materials Science and Metallurgical Engineering', 'MS', 'msme'),
    ('Mechanical & Aerospace Engineering', 'ME', 'mae'),
]

# --------------------------
# Helper Functions for ID and Address Generation
# --------------------------
def generate_student_college_address():
    block = random.choice('ABCDEFGHIJKLMNOPQRS')
    floor = random.randint(1, 10)
    room = random.randint(0, 38)
    return f"{block}-{floor}{room:02d}"

student_address_counts = defaultdict(int)

def generate_faculty_college_address():
    floor = random.randint(1, 20)
    room = random.randint(1, 50)
    return f"Faculty Tower-{floor:02d}{room:02d}"

def generate_student_id(dept_code):
    # Format: deptcode + 2-digit year + degree + "110" + 2-digit roll number
    year = f"{random.randint(18, 25):02d}"
    degree = random.choices(['BTECH', 'MTECH', 'RESCH'], weights=[70, 20, 10])[0]
    roll = f"{random.randint(1, 60):02d}"
    return f"{dept_code}{year}{degree}110{roll}"

def generate_faculty_id(dept_code):
    # Format: F + deptcode + 3-digit random number
    return f"F{dept_code}{random.randint(100, 999):03d}"

def generate_faculty_email(dept_mail_code, first_name, count):
    # For faculty email: firstName + count if needed
    if count == 1:
        return f"{first_name}@{dept_mail_code}.iith.ac.in"
    return f"{first_name}{count:03d}@{dept_mail_code}.iith.ac.in"

# --------------------------
# Data Generation: Residents
# --------------------------
students = []
faculty_members = []
resident_ids = set()
faculty_counters = {dept[1]: 1 for dept in departments}
name_counts = {dept[1]: {} for dept in departments}

# Generate Students
for _ in range(NUM_STUDENTS):
    dept = random.choice(departments)
    student_id = generate_student_id(dept[1])
    while student_id in resident_ids:
        student_id = generate_student_id(dept[1])
    resident_ids.add(student_id)
    
    # Generate a college address ensuring at most 2 duplicates
    college_address = generate_student_college_address()
    while student_address_counts[college_address] >= 2:
        college_address = generate_student_college_address()
    student_address_counts[college_address] += 1
    
    students.append({
        'id': student_id,
        'name': fake.name().replace("'", "''"),
        'email': f"{student_id.lower()}@iith.ac.in",
        'address': json.dumps({
            'street': fake.street_address(),
            'city': fake.city(),
            'state': fake.state(),
            'postal_code': fake.postcode()
        }),
        'phone': fake.unique.phone_number(),
        'college_address': college_address,
        'dept': dept[0]
    })

# Generate Faculty
for _ in range(NUM_FACULTY):
    dept = random.choice(departments)
    faculty_id = generate_faculty_id(dept[1])
    while faculty_id in resident_ids:
        faculty_id = generate_faculty_id(dept[1])
    resident_ids.add(faculty_id)
    
    first_name = fake.first_name().lower()
    if first_name in name_counts[dept[1]]:
        name_counts[dept[1]][first_name] += 1
    else:
        name_counts[dept[1]][first_name] = 1
        
    faculty_members.append({
        'id': faculty_id,
        'name': fake.name().replace("'", "''"),
        'email': generate_faculty_email(dept[2], first_name, name_counts[dept[1]][first_name]),
        'address': json.dumps({
            'street': fake.street_address(),
            'city': fake.city(),
            'state': fake.state(),
            'postal_code': fake.postcode()
        }),
        'phone': fake.unique.phone_number(),
        'college_address': generate_faculty_college_address(),
        'dept': dept[0]
    })

# --------------------------
# SQL Generation: Write to seed.sql
# --------------------------
with open('seed.sql', 'w', encoding='utf-8') as f:
    # Organizational Units (Departments)
    f.write("\n-- Organizational Units\n")
    for dept in departments:
        f.write(f"INSERT INTO org_unit (unit_name, unit_type) VALUES ('{dept[0]}', 'academic');\n")
    
    # Residents (Students and Faculty)
    f.write("\n-- Residents\n")
    for s in students:
        f.write(f"INSERT INTO resident (resident_id, resident_name, home_address, email, phone) VALUES ("
                f"'{s['id']}', '{s['name']}', '{s['address']}', '{s['email']}', '{s['phone']}');\n")
    for fac in faculty_members:
        f.write(f"INSERT INTO resident (resident_id, resident_name, home_address, email, phone) VALUES ("
                f"'{fac['id']}', '{fac['name']}', '{fac['address']}', '{fac['email']}', '{fac['phone']}');\n")
    
    # Student and Faculty Tables
    f.write("\n-- Students\n")
    for s in students:
        f.write(f"INSERT INTO student (resident_id, college_address) VALUES ('{s['id']}', '{s['college_address']}');\n")
    
    f.write("\n-- Faculty\n")
    for fac in faculty_members:
        f.write(f"INSERT INTO faculty (resident_id, college_address) VALUES ('{fac['id']}', '{fac['college_address']}');\n")
    
    # Res_Org Relationships
    f.write("\n-- Res_Org Relationships\n")
    for s in students:
        f.write(f"INSERT INTO res_org (resident_id, unit_name) VALUES ('{s['id']}', '{s['dept']}');\n")
    for fac in faculty_members:
        f.write(f"INSERT INTO res_org (resident_id, unit_name) VALUES ('{fac['id']}', '{fac['dept']}');\n")
    
    # --------------------------
    # Access Records Generation for Residents
    # --------------------------
    f.write("\n-- Access Records for Residents\n")
    timeline = {}
    # For each resident access record (for residents)
    for i in range(int(ACCESS_RECORDS * RESIDENT_ACCESS_RATIO)):
        res_id = random.choice([s['id'] for s in students] + [fac['id'] for fac in faculty_members])
        # Maintain a timeline for each resident to ensure entries and exits are coherent.
        if res_id not in timeline:
            timeline[res_id] = datetime.now() - timedelta(days=365)
        entry_time = timeline[res_id] + timedelta(minutes=random.randint(10, 1440))
        exit_time = entry_time + timedelta(minutes=random.randint(10, 240))
        timeline[res_id] = exit_time
        # Insert into access table (for residents, no OTP needed)
        f.write(f"INSERT INTO access (entry_time, exit_time) VALUES ('{entry_time}', '{exit_time}');\n")
        # Assume access IDs are sequential, starting at 1
        access_id = i + 1
        f.write(f"INSERT INTO res_accesses (resident_id, access_id) VALUES ('{res_id}', {access_id});\n")
        # Optionally insert vehicle record for resident if applicable
        if random.random() < VEHICLE_PROBABILITY:
            f.write(f"INSERT INTO vehicle (vehicle_number, vehicle_type, access_id) VALUES "
                    f"('{fake.license_plate()}', '{random.choice(['Car', 'Bike'])}', {access_id});\n")
    
    # --------------------------
    # Access Records Generation for Visitors
    # --------------------------
    f.write("\n-- Access Records for Visitors\n")
    visitor_counter = 1
    for i in range(int(ACCESS_RECORDS * (1 - RESIDENT_ACCESS_RATIO))):
        res_id = random.choice([s['id'] for s in students] + [fac['id'] for fac in faculty_members])
        entry_time = fake.date_time_this_year()
        exit_time = entry_time + timedelta(hours=random.randint(1, 6))
        
        # Insert a new visitor record with random details
        city = fake.city()
        state = fake.state()
        f.write(f"INSERT INTO visitor (visitor_name, from_address, expected_stay) VALUES ("
                f"'{fake.name()}', '{json.dumps({'street': fake.street_address(), 'city': city, 'state': state, 'postal_code': fake.postcode()})}', "
                f"'{exit_time - entry_time}');\n")
        
        # Generate an OTP for this visitor access
        visitor_otp = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        # Calculate access_id for visitor accesses: resident accesses occupy the first block.
        access_id = i + 1 + int(ACCESS_RECORDS * RESIDENT_ACCESS_RATIO)
        # Insert into access table with the OTP in the password field.
        f.write(f"INSERT INTO access (entry_time, exit_time, password) VALUES ('{entry_time}', '{exit_time}', '{visitor_otp}');\n")
        
        # Link the visitor with the resident
        f.write(f"INSERT INTO res_visitors (resident_id, visitor_id) VALUES ('{res_id}', {visitor_counter});\n")
        
        # Insert into visitor_accesses (without the password)
        f.write(f"INSERT INTO visitor_accesses (visitor_id, access_id) VALUES ({visitor_counter}, {access_id});\n")
        
        # Optionally, insert a vehicle record for the visitor
        if random.random() < VEHICLE_PROBABILITY:
            f.write(f"INSERT INTO vehicle (vehicle_number, vehicle_type, access_id) VALUES "
                    f"('{fake.license_plate()}', '{random.choice(['Car', 'Bike'])}', {access_id});\n")
        
        visitor_counter += 1

print("Seed data generation complete! Check seed.sql")

