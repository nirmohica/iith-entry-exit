-- Q1- latest_accesses retrieves the top 5 records of a resident by inputting the resident ID. Function

CREATE OR REPLACE FUNCTION latest_accesses(p_resident_id VARCHAR(20))
RETURNS TABLE (
    access_id INT,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.access_id, a.entry_time, a.exit_time
    FROM access a
    JOIN res_accesses ra ON a.access_id = ra.access_id
    WHERE ra.resident_id = p_resident_id
    ORDER BY a.entry_time DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Q2- add_resident_entry requires the resident ID as input. Stored Procedure

-- Stored procedure to add a resident entry
CREATE OR REPLACE PROCEDURE add_resident_entry(p_resident_id VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    new_access_id INT;
BEGIN
    -- Insert a new entry in the access table
    INSERT INTO access (entry_time) VALUES (CURRENT_TIMESTAMP) RETURNING access_id INTO new_access_id;
    
    -- Link the new access entry with the resident
    INSERT INTO res_accesses (resident_id, access_id) VALUES (p_resident_id, new_access_id);
END;
$$;

-- Q3- add_visitor_entry requires the resident ID, an array of names, and vehicle details as input. Stored procedure

CREATE OR REPLACE PROCEDURE add_visitor_entry(
    p_resident_id VARCHAR(20),
    p_visitor_names TEXT[],
    p_vehicle_number VARCHAR(20),
    p_vehicle_type VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_access_id INT;
    v_visitor_id INT;  -- Renamed variable to avoid confusion
    visitor_name TEXT;
BEGIN
    -- Insert a new entry in the access table
    INSERT INTO access (entry_time) VALUES (CURRENT_TIMESTAMP) 
    RETURNING access_id INTO new_access_id;
    
    -- Iterate over visitor names and insert into visitor table
    FOREACH visitor_name IN ARRAY p_visitor_names LOOP
        INSERT INTO visitor (visitor_name, from_address, expected_stay) 
        VALUES (visitor_name, '{}'::jsonb, INTERVAL '0') 
        RETURNING visitor.visitor_id INTO v_visitor_id;  -- Fixed ambiguity
        
        -- Link the visitor with the resident
        INSERT INTO res_visitors (resident_id, visitor_id) 
        VALUES (p_resident_id, v_visitor_id);
        
        -- Link the visitor with the access entry
        INSERT INTO visitor_accesses (visitor_id, access_id) 
        VALUES (v_visitor_id, new_access_id);
    END LOOP;
    
    -- If vehicle details are provided, insert into vehicle table
    IF p_vehicle_number IS NOT NULL THEN
        INSERT INTO vehicle (vehicle_number, vehicle_type, access_id) 
        VALUES (p_vehicle_number, p_vehicle_type, new_access_id);
    END IF;
END;
$$;



-- Q4- search_resident_id searches for a resident by ID. Input can be incomplete (e.g., CS23BTECH11). Function 

CREATE OR REPLACE FUNCTION search_resident_id(p_resident_id TEXT)
RETURNS TABLE (
    name VARCHAR(100),
    resident_id INT,
    phone VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.resident_id, r.phone
    FROM resident r
    WHERE CAST(r.resident_id AS TEXT) LIKE p_resident_id || '%';
END;
$$ LANGUAGE plpgsql;


-- Q5 - search_resident_name searches for a resident by name with similar input and output. 
-- Function to search for a resident by name (exact matching)
CREATE OR REPLACE FUNCTION search_resident_name(p_resident_name VARCHAR(100))
RETURNS TABLE (
    name VARCHAR(100),
    resident_id INT,
    phone VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.resident_id, r.phone
    FROM resident r
    WHERE r.name = p_resident_name;
END;
$$ LANGUAGE plpgsql;


-- Q6 - add_resident_exit requires the resident ID as input. Stored Procedure

-- Stored procedure to mark resident exit
CREATE OR REPLACE PROCEDURE add_resident_exit(p_resident_id VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    latest_access_id INT;
BEGIN
    -- Get the latest access ID for the resident that doesn't have an exit time
    SELECT a.access_id
    INTO latest_access_id
    FROM access a
    JOIN res_accesses ra ON a.access_id = ra.access_id
    WHERE ra.resident_id = p_resident_id AND a.exit_time IS NULL
    ORDER BY a.entry_time DESC
    LIMIT 1;
    
    -- If a matching entry is found, update the exit time
    IF latest_access_id IS NOT NULL THEN
        UPDATE access
        SET exit_time = CURRENT_TIMESTAMP
        WHERE access_id = latest_access_id;
    END IF;
END;
$$;


-- Q7 - add_visitor_exit requires the resident ID as input. Stored procedure
-- Stored procedure to mark a specific visitor's exit
CREATE OR REPLACE PROCEDURE add_visitor_exit(p_resident_id VARCHAR(20), p_visitor_id INT)
LANGUAGE plpgsql
AS $$
DECLARE
    latest_access_id INT;
BEGIN
    -- Find the latest access ID for the given visitor linked to the resident that doesn't have an exit time
    SELECT va.access_id
    INTO latest_access_id
    FROM visitor_accesses va
    JOIN res_visitors rv ON va.visitor_id = rv.visitor_id
    JOIN access a ON va.access_id = a.access_id
    WHERE rv.resident_id = p_resident_id
      AND va.visitor_id = p_visitor_id
      AND a.exit_time IS NULL
    ORDER BY a.entry_time DESC
    LIMIT 1;
    
    -- If a matching entry is found, update the exit time
    IF latest_access_id IS NOT NULL THEN
        UPDATE access
        SET exit_time = CURRENT_TIMESTAMP
        WHERE access_id = latest_access_id;
    END IF;
END;
$$;
