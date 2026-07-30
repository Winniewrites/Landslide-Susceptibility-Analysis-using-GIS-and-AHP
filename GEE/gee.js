/*
LANDSLIDE SUSCEPTIBILITY - DATA ACQUISITION SCRIPT 
Study area: West Pokot & Elgeyo Marakwet Counties, Kenya
Method: Multi-criteria AHP overlay
Output CRS: EPSG:32636 (UTM Zone 36N)
Output resolution: 30m (matched to ALOS DEM)
*/

// 1. STUDY AREA - using your uploaded county boundary asset
var countyBounds = ee.FeatureCollection('projects/ee-wonyancha22/assets/county_bounds');

var aoi = countyBounds.geometry();
Map.centerObject(aoi, 9);
Map.addLayer(aoi, {color: 'red'}, 'Study Area Boundary');

var CRS = 'EPSG:32636';
var SCALE = 30;

// 2. DEM AND TERRAIN DERIVATIVES
// ALOS AW3D30 v3.2 - better for steep/rifted terrain like the Kerio escarpment
var dem = ee.ImageCollection('JAXA/ALOS/AW3D30/V3_2')
  .select('DSM')
  .mosaic()
  .clip(aoi)
  .rename('elevation');

var terrain = ee.Terrain.products(dem);
var slope = terrain.select('slope');
var aspect = terrain.select('aspect');

// Curvature (profile) - GEE has no built-in curvature, derive via convolution
var kernel = ee.Kernel.laplacian8(1, false);
var curvature = dem.convolve(kernel).rename('curvature');
/*
 Topographic Wetness Index (TWI) - needs flow accumulation
 Using HydroSHEDS accumulation (coarser, 15 arc-sec ~450m) as an approximation.
 For a proper watershed-scale TWI, derive flow accumulation from the ALOS DEM
 in QGIS (SAGA/GRASS hydrology tools) or WhiteboxTools instead - GEE's
 hydrology toolkit is limited for fine-scale flow routing.
 
var flowAcc = ee.Image('WWF/HydroSHEDS/15ACC').clip(aoi);
var slopeRad = slope.multiply(Math.PI / 180);
var twi = flowAcc.add(1).log().divide(slopeRad.tan().add(0.001)).rename('twi');
*/

// 3. LAND USE / LAND COVER
var lulc = ee.ImageCollection('ESA/WorldCover/v200').first().clip(aoi);

// 4. NDVI (Sentinel-2, cloud-masked, dry-season composite recommended
//    since vegetation cover during dry season better reflects baseline
//    stabilizing cover for susceptibility mapping)
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-03-31') // adjust to dry season window
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds);

var s2Median = s2.median().clip(aoi);
var ndvi = s2Median.normalizedDifference(['B8', 'B4']).rename('ndvi');

// 5. RAINFALL (CHIRPS)
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .filterBounds(aoi)
  .filterDate('2015-01-01', '2024-12-31')
  .select('precipitation');

var annualMeanRainfall = chirps.sum()
  .divide(10) // 10 years of data -> mean annual total
  .clip(aoi)
  .rename('mean_annual_rainfall');

// Consider also extracting max daily rainfall / rainfall intensity events,
// since landslides in this region are often triggered by intense short bursts
// rather than annual totals. CHIRPS_DAILY lets you compute percentile
// thresholds (e.g. 95th percentile daily rainfall) if useful for your AHP factor.

// 6. ISDASOIL EXTRACTION FOR LANDSLIDE MODELING

// SOIL TEXTURE (Correct bands: 'texture_0_20' or 'texture_20_50')
var soilTexture = ee.Image('ISDASOIL/Africa/v1/texture_class')
  .select('texture_0_20') // Fixed: replaced 'b0' with actual band name
  .clip(aoi)
  .rename('soil_texture');

// SOIL ORGANIC CARBON (Correct bands: 'mean_0_20' or 'mean_20_50')
// NOTE: iSDA Organic Carbon values must be back-transformed using: exp(x/10)-1
var soilOCRaw = ee.Image('ISDASOIL/Africa/v1/carbon_organic')
  .select('mean_0_20')   // Fixed: replaced 'b0' with the actual mean band name
  .clip(aoi);

// Optional but highly recommended for accuracy: back-transform raw values to g/kg
var soilOC = soilOCRaw.divide(10).exp().subtract(1).rename('soil_organic_carbon');

// DEPTH TO BEDROCK (Correct band: 'mean')
var soilDepth = ee.Image('ISDASOIL/Africa/v1/bedrock_depth')
  .select('mean_0_200')        // Fixed: added explicit selection of the 'mean' band 
  .clip(aoi)
  .rename('depth_to_bedrock');

// VERIFICATION (Check your console to ensure bands are cleanly loaded)
print('Texture Band:', soilTexture.bandNames());
print('Carbon Band:', soilOC.bandNames());
print('Bedrock Depth Band:', soilDepth.bandNames());
/*
 7. DISTANCE TO DRAINAGE (derived from HydroSHEDS flow accumulation)
var streamThreshold = 500; // adjust based on your watershed's drainage density
var streams = flowAcc.gt(streamThreshold).selfMask();
var distToStreams = streams.fastDistanceTransform(256).sqrt()
  .multiply(ee.Image.pixelArea().sqrt())
  .clip(aoi)
  .rename('dist_to_streams');
This is an approximation from coarse HydroSHEDS data. For watershed-scale
precision, delineate streams from the ALOS DEM itself in QGIS/SAGA and
import the result as a GEE asset, then recompute distance here.
*/

/* 8. LAYERS YOU STILL NEED TO SOURCE EXTERNALLY AND UPLOAD AS ASSETS
 - Geology/lithology: Kenya Geological Survey maps (digitize/georeference)
 - Roads: OSM extract for Kenya via Geofabrik (https://download.geofabrik.de/africa/kenya.html),
   then compute distance-to-roads the same way as distToStreams above

*/
// 9. VISUALIZE (sanity check before export)
Map.addLayer(dem, {min: 500, max: 3000, palette: ['blue', 'green', 'yellow', 'brown', 'white']}, 'DEM');
Map.addLayer(slope, {min: 0, max: 60, palette: ['green', 'yellow', 'red']}, 'Slope');
Map.addLayer(ndvi, {min: -0.2, max: 0.8, palette: ['brown', 'yellow', 'green']}, 'NDVI');
Map.addLayer(annualMeanRainfall, {min: 500, max: 1800, palette: ['white', 'blue']}, 'Mean Annual Rainfall');


// 10. EXPORT EACH LAYER TO DRIVE (clipped, aligned, ready for AHP reclassification)
var layersToExport = {
  //'elevation': dem,
 // 'slope': slope,
  //'aspect': aspect,
  //'ndvi': ndvi,
  //'curvature': curvature,
  //'lulc': lulc,
 // 'mean_annual_rainfall': annualMeanRainfall,
  //'twi': twi,
  'soil_texture': soilTexture,
 'soil_organic_carbon': soilOC,
  'depth_to_bedrock': soilDepth,
  };
  //'dist_to_streams': distToStreams


Object.keys(layersToExport).forEach(function(name) {
  Export.image.toDrive({
    image: layersToExport[name],
    description: 'landslide_' + name,
    folder: 'Landslide_Data_Maps',
    fileNamePrefix: name,
    region: aoi,
    scale: SCALE,
    crs: CRS,
    maxPixels: 1e13
  });
});
