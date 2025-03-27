-- Shravan and Anup

-- latest_accesses retrieves the top 5 records of a resident by inputting the resident ID. Function
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

-- add_resident_entry requires the resident ID as input. Stored Procedure
-- anup update: prevent adding resident if more than one entry
CREATE OR REPLACE PROCEDURE add_resident_entry(p_resident_id VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    new_access_id INT;
    active_count INT;
BEGIN
    -- check if there's an active access for this resident
    select count(*) into active_count
    from res_accesses ra
    join access a on ra.access_id = a.access_id
    where ra.resident_id = p_resident_id and a.exit_time is null;

    if active_count > 0 then
        raise exception 'resident % already has an active access record', p_resident_id;
    end if;

    -- if no active access exists, insert a new access record
    insert into access (entry_time, password) values (current_timestamp, '0') returning access_id into new_access_id;
    insert into res_accesses (resident_id, access_id) values (p_resident_id, new_access_id);
end;
$$;

-- add_visitor_entry requires the resident id, an array of names, and vehicle details as input. stored procedure
-- anup update: handle already existing vehicles and handle otp
-- credits: chatgpt

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION add_visitor_entry(
    p_resident_id VARCHAR(20),
    p_visitor_names TEXT[],
    p_vehicle_number VARCHAR(20),
    p_vehicle_type VARCHAR(50),
    p_expected_stay INTERVAL
)
RETURNS TABLE (access_id INT, otp VARCHAR(50)) AS $$
DECLARE
    new_access_id INT;
    otp_value VARCHAR(50);
    visitor_name TEXT;
    v_visitor_id INT;
    active_count INT;
BEGIN
    -- check if the resident has an active access record created within the last 10 minutes.
    SELECT COUNT(*) INTO active_count
    FROM res_accesses ra
    JOIN access a ON ra.access_id = a.access_id
    WHERE ra.resident_id = p_resident_id
      AND a.entry_time >= (CURRENT_TIMESTAMP - INTERVAL '10 minutes')
      AND a.exit_time IS NULL;

    IF active_count > 0 THEN
        otp_value := '0';  -- Resident came accompanied; no otp needed.
    ELSE
        -- Generate a secure 6-character otp using pgcrypto.
        otp_value := upper(encode(gen_random_bytes(3), 'hex'));
    END IF;

    -- insert a new access record with the determined otp (or '0').
    INSERT INTO access (entry_time, password)
      VALUES (CURRENT_TIMESTAMP, otp_value)
      RETURNING access.access_id INTO new_access_id;

    -- for each visitor name, insert a visitor record and create the necessary links.
    FOREACH visitor_name IN ARRAY p_visitor_names LOOP
        INSERT INTO visitor (visitor_name, from_address, expected_stay)
          VALUES (visitor_name, '{}'::jsonb, p_expected_stay)
          RETURNING visitor_id INTO v_visitor_id;

        INSERT INTO res_visitors (resident_id, visitor_id)
          VALUES (p_resident_id, v_visitor_id);

        INSERT INTO visitor_accesses (visitor_id, access_id)
          VALUES (v_visitor_id, new_access_id);
    END LOOP;

    -- if vehicle details are provided, insert a vehicle record.
    IF p_vehicle_number IS NOT NULL THEN
        INSERT INTO vehicle (vehicle_number, vehicle_type, access_id)
          VALUES (p_vehicle_number, p_vehicle_type, new_access_id)
          ON CONFLICT (vehicle_number) DO NOTHING;
    END IF;

    RETURN QUERY SELECT new_access_id, otp_value;
END;
$$ LANGUAGE plpgsql;

-- new index for fuzzy search
CREATE extension IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_resident_name_trgm ON resident USING GIN ((resident_name || ' ' || resident_id) gin_trgm_ops);

create or replace function search_resident(p_input text)
returns table (
  name varchar(100),
    resident_id varchar(20),
    phone varchar(15),
    department varchar(100)
) as $$
begin
    return query
    with words as (
        select unnest(string_to_array(lower(p_input), ' ')) as w
    )
    select
        r.resident_name,
        r.resident_id,
        r.phone,
        o.unit_name as department
    from resident r
    left join res_org ro on r.resident_id = ro.resident_id
    left join org_unit o on ro.unit_name = o.unit_name
    where
    (
      -- if the entire input is short (<= 4 chars) and contains no digits,
      -- do a simple substring search on resident_name and department.
      (p_input !~ '[0-9]' and length(p_input) <= 4
         and (lower(r.resident_name) ilike '%' || lower(p_input) || '%'
              or lower(o.unit_name) ilike '%' || lower(p_input) || '%')
      )
      or
      -- otherwise, use word-by-word matching.
      (
        (select count(*) from words)
        =
        (select count(*) from words ww
         where
           (
             ww.w ~ '[0-9]'  -- if the word contains a digit, match only against resident_id
             and r.resident_id ilike '%' || ww.w || '%'
           )
           or
           (
             ww.w !~ '[0-9]'  -- if the word contains no digit,
             and (
                   r.resident_id ilike '%' || ww.w || '%'
                   or similarity(lower(r.resident_name), ww.w) > 0.6
                   or lower(o.unit_name) ilike '%' || ww.w || '%'
                 )
           )
        )
      )
    );
end;
$$ language plpgsql;


-- q6 - add_resident_exit requires the resident id as input. stored procedure

-- stored procedure to mark resident exit
create or replace procedure add_resident_exit(p_resident_id varchar(20))
language plpgsql
as $$
declare
    latest_access_id int;
begin
    -- get the latest access id for the resident that doesn't have an exit time
    select a.access_id
    into latest_access_id
    from access a
    join res_accesses ra on a.access_id = ra.access_id
    where ra.resident_id = p_resident_id and a.exit_time is null
    order by a.entry_time desc
    limit 1;

    -- if a matching entry is found, update the exit time
    if latest_access_id is not null then
        update access
        set exit_time = current_timestamp
        where access_id = latest_access_id;
    end if;
end;
$$;


-- q7 - add_visitor_exit requires the resident id as input. stored procedure
-- stored procedure to mark a specific visitor's exit
create or replace procedure add_visitor_exit(p_resident_id varchar(20), p_visitor_id int)
language plpgsql
as $$
declare
    latest_access_id int;
begin
    -- find the latest access id for the given visitor linked to the resident that doesn't have an exit time
    select va.access_id
    into latest_access_id
    from visitor_accesses va
    join res_visitors rv on va.visitor_id = rv.visitor_id
    join access a on va.access_id = a.access_id
    where rv.resident_id = p_resident_id
      and va.visitor_id = p_visitor_id
      and a.exit_time is null
    order by a.entry_time desc
    limit 1;

    -- if a matching entry is found, update the exit time
    if latest_access_id is not null then
        update access
        set exit_time = current_timestamp
        where access_id = latest_access_id;
    end if;
end;
$$;

-- anup: top 5 visitors for a resident id
CREATE OR REPLACE FUNCTION top_visitors(p_resident_id text)
RETURNS TABLE (
    visitor_name varchar(100),
    visitor_id int
) AS $$
BEGIN
    return query
    select v.visitor_name, v.visitor_id
    from res_visitors rv
    JOIN visitor v on rv.visitor_id = v.visitor_id
    join visitor_accesses va on v.visitor_id = va.visitor_id
    where rv.resident_id = p_resident_id
    order by count(*) over (partition by v.visitor_id) desc
    limit 5;
end;
$$ language plpgsql;

-- anup: active visitors
CREATE OR REPLACE FUNCTION active_visitors(p_resident_id VARCHAR(20))
RETURNS TABLE (
    visitor_id INT,
    visitor_name VARCHAR(100),
    from_address JSONB,
    expected_stay INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.visitor_id, v.visitor_name, v.from_address, v.expected_stay
    FROM visitor v
    JOIN visitor_accesses va ON v.visitor_id = va.visitor_id
    JOIN access a ON va.access_id = a.access_id
    JOIN res_visitors rv ON v.visitor_id = rv.visitor_id
    WHERE rv.resident_id = p_resident_id
      AND a.exit_time IS NULL;
END;
$$ LANGUAGE plpgsql;


-- anup: b-tree index on resident_id
CREATE INDEX IF NOT EXISTS idx_resident_id_prefix ON resident (resident_id text_pattern_ops);


-- anup: index for fast lookups in searching resident (join with res_org, etc)
CREATE INDEX IF NOT EXISTS idx_org_unit_name ON org_unit USING GIN (unit_name gin_trgm_ops);
CREATE OR REPLACE FUNCTION search_resident(p_input TEXT)
RETURNS TABLE (
  name VARCHAR(100),
    resident_id VARCHAR(20),
    phone VARCHAR(15),
    department VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    WITH words AS (
        SELECT UNNEST(STRING_TO_ARRAY(LOWER(p_input), ' ')) AS w
    )
    SELECT
        r.resident_name,
        r.resident_id,
        r.phone,
        o.unit_name AS department
    FROM resident r
    LEFT JOIN res_org ro ON r.resident_id = ro.resident_id
    LEFT JOIN org_unit o ON ro.unit_name = o.unit_name
    WHERE
    (
      -- if the entire input is short (<= 4 chars) and contains no digits,
      -- do a simple substring search on resident_name and department.
      (p_input !~ '[0-9]' AND LENGTH(p_input) <= 4
         AND (LOWER(r.resident_name) ILIKE '%' || LOWER(p_input) || '%'
              OR LOWER(o.unit_name) ILIKE '%' || LOWER(p_input) || '%')
      )
      OR
      -- otherwise, use word-by-word matching.
      (
        (SELECT COUNT(*) FROM words)
        =
        (SELECT COUNT(*) FROM words ww
         WHERE
           (
             ww.w ~ '[0-9]'  -- if the word contains a digit, match only against resident_id
             AND r.resident_id ILIKE '%' || ww.w || '%'
           )
           OR
           (
             ww.w !~ '[0-9]'  -- if the word contains no digit,
             AND (
                   r.resident_id ILIKE '%' || ww.w || '%'
                   OR SIMILARITY(LOWER(r.resident_name), ww.w) > 0.6
                   OR LOWER(o.unit_name) ILIKE '%' || ww.w || '%'
                 )
           )
        )
      )
    );
END;
$$ LANGUAGE plpgsql;


-- q6 - add_resident_exit requires the resident id as input. stored procedure

-- stored procedure to mark resident exit
CREATE OR REPLACE PROCEDURE add_resident_exit(p_resident_id VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    latest_access_id INT;
BEGIN
    -- get the latest access id for the resident that doesn't have an exit time
    SELECT a.access_id
    INTO latest_access_id
    FROM access a
    JOIN res_accesses ra ON a.access_id = ra.access_id
    WHERE ra.resident_id = p_resident_id AND a.exit_time IS NULL
    ORDER BY a.entry_time DESC
    LIMIT 1;

    -- if a matching entry is found, update the exit time
    IF latest_access_id IS NOT NULL THEN
        UPDATE access
        SET exit_time = CURRENT_TIMESTAMP
        WHERE access_id = latest_access_id;
    END IF;
END;
$$;


-- q7 - add_visitor_exit requires the resident id as input. stored procedure
-- stored procedure to mark a specific visitor's exit
CREATE OR REPLACE PROCEDURE add_visitor_exit(p_resident_id VARCHAR(20), p_visitor_id INT)
LANGUAGE plpgsql
AS $$
DECLARE
    latest_access_id INT;
BEGIN
    -- find the latest access id for the given visitor linked to the resident that doesn't have an exit time
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

    -- if a matching entry is found, update the exit time
    IF latest_access_id IS NOT NULL THEN
        UPDATE access
        SET exit_time = CURRENT_TIMESTAMP
        WHERE access_id = latest_access_id;
    END IF;
END;
$$;

-- anup: top 5 visitors for a resident id
CREATE OR REPLACE FUNCTION top_visitors(p_resident_id TEXT)
RETURNS TABLE (
    visitor_name VARCHAR(100),
    visitor_id INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.visitor_name, v.visitor_id
    FROM res_visitors rv
    JOIN visitor v ON rv.visitor_id = v.visitor_id
    JOIN visitor_accesses va ON v.visitor_id = va.visitor_id
    WHERE rv.resident_id = p_resident_id
    ORDER BY COUNT(*) OVER (PARTITION BY v.visitor_id) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- anup: active visitors
CREATE OR REPLACE FUNCTION active_visitors(p_resident_id VARCHAR(20))
RETURNS TABLE (
    visitor_id INT,
    visitor_name VARCHAR(100),
    from_address JSONB,
    expected_stay INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.visitor_id, v.visitor_name, v.from_address, v.expected_stay
    FROM visitor v
    JOIN visitor_accesses va ON v.visitor_id = va.visitor_id
    JOIN access a ON va.access_id = a.access_id
    JOIN res_visitors rv ON v.visitor_id = rv.visitor_id
    WHERE rv.resident_id = p_resident_id
      AND a.exit_time IS NULL;
END;
$$ LANGUAGE plpgsql;


-- anup: b-tree index on resident_id
CREATE INDEX IF NOT EXISTS idx_resident_id_prefix ON resident (resident_id TEXT_PATTERN_OPS);


-- anup: index for fast lookups in searching resident (join with res_org, etc)
CREATE INDEX IF NOT EXISTS idx_org_unit_name ON org_unit USING GIN (unit_name GIN_TRGM_OPS);
