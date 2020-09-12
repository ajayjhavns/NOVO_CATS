//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// This file has all the code to deal with the oData
//-----------------------------------------------------------------------
sap.ui.define(
	[
		'sap/ui/model/Filter'
	],
	function (Filter) {
		'use strict';

		return {
			getData: function (oModel, sOrgUnit) {
					return new Promise(function (resolve, reject) {

					var oParams = {
						keyDate: new Date(),
						asManager: true,
						asEmployee: false,
						asAdministrator: false,
						orgUnitIdAsTop: ""
					};

					// Orgunit ?
					if (sOrgUnit) {
						oParams.orgUnitIdAsTop = sOrgUnit;
					}

					var success = function (oData) {
						// Change data before resolving Promise
						if (oData || oData.results) {
							for (var i = 0; i < oData.results.length; i++) {
								if (oData.results[i].Name) {
									oData.results[i].shortFilterName = oData.results[i].Name.substring(0, 1).toUpperCase();
								}
							}
						}
						resolve(oData);
					};

					var error = function (err) {
						reject(err);
					};

					oModel.callFunction("/getOrgUnitStructure", {
						urlParameters: oParams,
						success: success,
						error: error
					});
				});
			}
		};
	}
);
