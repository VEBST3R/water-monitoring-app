# Water Quality Monitoring App - Data Consistency Implementation

## Overview

This document outlines the changes made to ensure data consistency across all components in the water quality monitoring app. The primary focus was to implement a standard Water Quality Index (WQI) calculation method and ensure that all components use the same data sources and calculation methods.

## Key Changes

### 1. Centralized WQI Calculation

We created a centralized utility function for calculating the Water Quality Index (WQI) in `utils/wqiUtils.ts`. This ensures that all components use the same calculation method, resulting in consistent water quality assessments across the app.

The calculation takes into account four key water parameters:

- pH level (weight: 25%)
- Temperature (weight: 20%)
- TDS (Total Dissolved Solids) (weight: 25%)
- Turbidity (weight: 30%)

### 2. Component Updates

The following components were updated to use the centralized WQI calculation:

#### WQIChartView Component

- Removed the local implementation of the `calculateWQI` function
- Now imports and uses the centralized function from `utils/wqiUtils.ts`
- Improved to clearly distinguish between server and local WQI values
- Prioritizes server values when available
- Maintains existing functionality with real API data fetching

#### DetailedParametersView Component

- Fixed type definition for historical data
- Updated the `getWaterQualityAssessment` function to use the centralized WQI calculation
- Improved assessment logic to provide consistent results with the WQI chart
- Now explicitly calculates WQI using the same centralized function
- Added proper validation to match the calculation approach of other components

#### ScoreCircle Component

- Now uses the centralized WQI calculation
- Added logic to calculate WQI locally if the server doesn't provide it
- Updated to properly check if server WQI values are valid (greater than 0)
- Improved error handling and data synchronization

#### Main App Component (index.tsx)

- Updated the `updateCurrentDeviceData` function to use the centralized WQI calculation
- Added fallback to locally calculated WQI when server data doesn't include it
- Enhanced validation to ensure server WQI values are positive numbers
- Ensures consistent deviceId is passed to all child components

### 3. Data Flow Improvements

- Consistent deviceId passing between components
- Proper fallback to locally calculated WQI when server data is incomplete
- Improved error handling in API calls

## Benefits

1. **Data Consistency**: All components now display the same WQI values for the same device and parameters
2. **Improved Reliability**: Local calculation provides fallback when server data is incomplete
3. **Maintainability**: Centralized calculation makes future adjustments to WQI algorithm easier
4. **User Experience**: Consistent water quality indicators across all app views

## Technical Implementation

The WQI calculation uses weighted scoring for each parameter:

```typescript
// Calculate weighted average
const wqi =
  weights.pH * pHScore +
  weights.temperature * tempScore +
  weights.tds * tdsScore +
  weights.turbidity * turbidityScore;
```

Each parameter is scored on a scale of 0-100 based on established water quality standards, with specific scoring functions for each parameter's acceptable ranges.

## Future Improvements

1. Implement server-side validation using the same WQI calculation method
2. Add user customization of parameter weights based on specific use cases
3. Extend WQI calculation to include additional parameters (e.g., dissolved oxygen, conductivity)
4. Implement historical WQI trend analysis
5. Add a global state management solution (e.g., Redux) for even better data consistency
6. Implement caching to reduce API calls and ensure data consistency during offline periods
7. Add more sophisticated validation for edge cases in the data
