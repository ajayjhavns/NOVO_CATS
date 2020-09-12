//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	'sap/m/MessageBox'
], function (jQuery, BaseObject, Filter, JSONModel, ChartFormatter, Format, MessageBox) {

	var ExportToExcel = BaseObject.extend("com.nn.cats.employee.classes.ExportToExcel", {
		constructor: function (fileName) {

			this._fileName = fileName;
			this._excel = "";
		},

		addLines: function (array, columns, propertyFieldName) {

			for (var e in array) {

				this._excel += "<tr>";

				for (var i in columns) {

					var value = "";

					if (array[e][columns[i][propertyFieldName]]) {
						value = array[e][columns[i][propertyFieldName]];
					}

					this._excel += "<td>" + value + "</td>";
				}

				this._excel += "</tr>";

			}
		},

		addLabels: function (columns, labelName) {

			this._excel += "<tr class='gavdi-header'>";
			for (var i in columns) {
				this._excel += "<td><b>" + columns[i][labelName] + "</b></td>";
			}

			this._excel += "</tr>";

		},

		startTable: function () {

			this._excel += "<style>";
			// this._excel += "table, td, tr {"; // Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 12
			// this._excel += "border: 1px solid black;}"; // Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 12

			// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 12
			this._excel += "body { font-family: 'Arial'; }";
			this._excel += ".gavdi-header { background-color: #00B0F0; color: #fff; }";
			// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 12

			this._excel += "</style>";

			this._excel += "<table>";
		},

		endTable: function () {

			this._excel += "</table>";
		},

		addTitle: function (title) {

			this._excel += "<p>" + title + "</p>";
		},

		addSubTitle: function (title) {

			this._excel += "<p>" + title + "</p>";
		},

		getExcel: function () {
			return this._excel;
		},

		getFileName: function () {
			return this._fileName;
		},

		printHtml: function (title) {

			var mywindow = window.open('', 'PRINT', 'height=400,width=600');

			mywindow.document.write('<html><head><title>' + title + '</title>');
			mywindow.document.write('</head><body >');

			mywindow.document.write(this._excel);
			mywindow.document.write('</body></html>');

			mywindow.document.close(); // necessary for IE >= 10
			mywindow.focus(); // necessary for IE >= 10*/

			mywindow.print();
			mywindow.close();
		}
	});

	return ExportToExcel;
});