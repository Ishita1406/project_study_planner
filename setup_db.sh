#!/bin/bash

# Create PostgreSQL database
sudo -u postgres psql <<EOF
CREATE DATABASE study_planner;
\q
EOF

echo "Database created successfully!"
echo "You can now start the backend server."