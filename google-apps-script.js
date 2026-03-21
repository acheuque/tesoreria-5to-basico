// Google Apps Script function that serves spreadsheet data as JSON
function doGet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = spreadsheet.getSheets()[0];  // Get first sheet
  var egresosSheet = spreadsheet.getSheetByName('Egresos'); // Get Egresos sheet
  var donacionesSheet = spreadsheet.getSheetByName('Donaciones'); // Get Donaciones sheet
  
  // Get the total ingresos/egresos data
  var totalsRange = mainSheet.getRange(1, 1, 2, 2);
  var totalsValues = totalsRange.getValues();
  
  // Get the cuotas data
  var cuotasRange = mainSheet.getRange(5, 1, 11, 3);  // From row 5 to 15, columns A to C
  var cuotasValues = cuotasRange.getValues();
  
  // Get the egresos data
  var egresosRange = egresosSheet.getRange("A2:C100"); // Get all rows from A2 to C100
  var egresosValues = egresosRange.getValues().filter(row => row[0] !== ''); // Filter out empty rows

  // Get the donaciones data (if sheet exists)
  var donacionesValues = [];
  if (donacionesSheet) {
    var donacionesRange = donacionesSheet.getRange("A2:C100"); // Get all rows from A2 to C100
    donacionesValues = donacionesRange.getValues().filter(row => row[0] !== ''); // Filter out empty rows
  }
  
  // Create the JSON structure
  var jsonData = {
    totals: {
      [totalsValues[0][0]]: totalsValues[1][0],  // Total Ingresos
      [totalsValues[0][1]]: totalsValues[1][1]   // Total Egresos
    },
    cuotas: [],
    egresos: egresosValues.map(row => ({
      fecha: row[0],
      monto: row[1],
      glosa: row[2]
    })),
    donaciones: donacionesValues.map(row => ({
      fecha: row[0],
      monto: row[1],
      glosa: row[2]
    }))
  };
  
  // Process cuotas data
  for(var i = 1; i < cuotasValues.length; i++) {
    var row = cuotasValues[i];
    if (row[0] !== '') {  // Only process rows with month names
      jsonData.cuotas.push({
        mes: row[0],
        cuotasPagadas: row[1],
        cuotasPendientes: row[2]
      });
    }
  }
  
  // Return the JSON data
  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

/*
Instructions for deployment:
1. Open Google Sheets
2. Go to Extensions > Apps Script
3. Paste this code
4. Click "Deploy" > "New deployment"
5. Click "Select type" > "Web app"
6. Configure:
   - Description: "Spreadsheet JSON API"
   - Execute as: "Me"
   - Who has access: "Anyone"
7. Click "Deploy"
8. Authorize the application
9. Copy the Web app URL for use in script.js

Current deployment URL:
https://script.google.com/macros/s/AKfycbxQ9bxkWrcH58DMwrM3jWX_6Efm9UX7CcFEL0QqigFb4OhI6wfJ67fleQ9wHchcqGeT/exec
*/ 