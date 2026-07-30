# Landslide-Susceptibility-Analysis-using-GIS-and-AHP
## Study Area

Elgeyo Marakwet and West Pokot Counties, Kenya

---

## Overview

This project develops a GIS-based landslide susceptibility model using the Analytical Hierarchy Process (AHP) integrated with geospatial analysis techniques.

The model combines terrain, hydrological, geological, environmental and anthropogenic conditioning factors to identify areas susceptible to rainfall-induced landslides.

The workflow integrates:

- Google Earth Engine
- WhiteboxTools
- QGIS
- Python
- Rasterio
- NumPy

---

## Objectives

- Generate terrain derivatives from ALOS DEM
- Produce hydrological indices
- Prepare proximity layers
- Standardize conditioning factors
- Apply Analytical Hierarchy Process (AHP)
- Generate a Landslide Susceptibility Index (LSI)
- Validate and improve the susceptibility model

---

## Conditioning Factors

| Factor | Source |
|---------|--------|
| Slope | ALOS DEM |
| Rainfall | CHIRPS |
| Geology | Geological Survey of Kenya |
| Soil | ISRIC SoilGrids |
| Land Use/Land Cover | ESA WorldCover |
| Distance to Roads | OpenStreetMap |
| Distance to Streams | Derived from DEM |
| Topographic Wetness Index | WhiteboxTools |

---

## Repository Structure

```text
data/
gee/
notebooks/
outputs/
qgis/
src/
docs/
```

---

## Workflow

*(Insert workflow diagram here)*

---

## Results

*(Insert figures here)*

### Study Area

*(Insert map)*

### Terrain Derivatives

*(Insert figures)*

### Hydrological Factors

*(Insert figures)*

### Final Landslide Susceptibility Map

*(Insert figure)*

---

## Software

- Python 3.11
- Google Earth Engine
- QGIS 3.40
- WhiteboxTools
- Rasterio
- GDAL
- NumPy
- Matplotlib
- Jupyter Notebook

---

## Future Improvements

- Incorporate landslide inventory data
- Perform sensitivity analysis
- Evaluate AHP consistency
- Compare AHP with Random Forest
- Compare AHP with XGBoost
- Add model validation using ROC/AUC
- Publish an interactive web map

---

## Author

Winnie Nyabwari Onyancha

GIS Analyst | Remote Sensing | Python | Spatial Data Science
