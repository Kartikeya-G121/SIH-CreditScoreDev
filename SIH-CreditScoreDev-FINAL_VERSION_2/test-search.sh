#!/bin/bash

# Quick Test Script for Application Search
# This script tests the search functionality with various scenarios

BASE_URL="http://localhost:8080/api/v1"
TOKEN=""

echo "==================================="
echo "Application Search Quick Test"
echo "==================================="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
echo "Please enter your phone number:"
read PHONE
echo "Please enter your password:"
read -s PASSWORD

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"data":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed! Please check your credentials."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo ""

# Step 2: Test search without filters
echo "Step 2: Testing search without filters..."
RESPONSE=$(curl -s -X POST "$BASE_URL/admin/applications/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "page": 0,
    "size": 5,
    "sortBy": "createdAt",
    "sortDirection": "DESC"
  }')

TOTAL=$(echo $RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
echo "✅ Found $TOTAL total applications"
echo ""

# Step 3: Test search by ID
echo "Step 3: Testing search by application ID..."
echo "Enter an application ID to search for:"
read APP_ID

RESPONSE=$(curl -s -X POST "$BASE_URL/admin/applications/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"searchText\": \"$APP_ID\",
    \"page\": 0,
    \"size\": 5
  }")

FOUND=$(echo $RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
echo "✅ Found $FOUND applications matching ID: $APP_ID"
echo ""

# Step 4: Test filter by status
echo "Step 4: Testing filter by status..."
echo "Available statuses: DRAFT, SUBMITTED, SCORING, APPROVED, REJECTED, SANCTIONED, WITHDRAWN"
echo "Enter status to filter by:"
read STATUS

RESPONSE=$(curl -s -X POST "$BASE_URL/admin/applications/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"status\": \"$STATUS\",
    \"page\": 0,
    \"size\": 5
  }")

FOUND=$(echo $RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
echo "✅ Found $FOUND applications with status: $STATUS"
echo ""

# Step 5: Test search by name/email
echo "Step 5: Testing search by name or email..."
echo "Enter search text (name or email):"
read SEARCH_TEXT

RESPONSE=$(curl -s -X POST "$BASE_URL/admin/applications/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"searchText\": \"$SEARCH_TEXT\",
    \"page\": 0,
    \"size\": 5
  }")

FOUND=$(echo $RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
echo "✅ Found $FOUND applications matching: $SEARCH_TEXT"
echo ""

echo "==================================="
echo "All tests completed!"
echo "==================================="
echo ""
echo "Full response from last search:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE
