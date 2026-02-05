-- Create the missing modules_applicable_tracks table
CREATE TABLE IF NOT EXISTS modules_applicable_tracks (
    id SERIAL PRIMARY KEY,
    module_id UUID NOT NULL,
    track_id UUID NOT NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(module_id, track_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS modules_applicable_tracks_module_id_idx ON modules_applicable_tracks(module_id);
CREATE INDEX IF NOT EXISTS modules_applicable_tracks_track_id_idx ON modules_applicable_tracks(track_id);
