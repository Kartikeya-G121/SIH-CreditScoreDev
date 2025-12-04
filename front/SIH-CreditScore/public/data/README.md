# India TopoJSON Data

This directory contains the TopoJSON file for rendering the India state heatmap.

## Getting the TopoJSON File

The heatmap component requires a TopoJSON file with India's state boundaries. You have two options:

### Option 1: Download from GitHub (Recommended)
Download a proper India states TopoJSON from one of these sources:

1. **DataMeet India Maps** (Most Popular):
   ```bash
   curl -o public/data/india_states.topojson https://raw.githubusercontent.com/datameet/maps/master/States/india_state.topojson
   ```

2. **Alternative Source**:
   ```bash
   curl -o public/data/india_states.topojson https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json
   ```

### Option 2: Use the Simplified Version
A simplified TopoJSON file has been created for development purposes. It includes basic geometries for major Indian states but may not be as accurate as the official versions.

## File Structure
The TopoJSON file should have this structure:
```json
{
  "type": "Topology",
  "objects": {
    "states": {
      "type": "GeometryCollection",
      "geometries": [...]
    }
  },
  "arcs": [...],
  "transform": {...}
}
```

## State Property Names
The component looks for these property names in the TopoJSON:
- `NAME_1` - Full state name
- `ST_NM` - State name abbreviation
- `ISO_3166-2` - ISO code
- `state_code` - State code

Make sure your TopoJSON file includes at least one of these properties for proper data matching.
