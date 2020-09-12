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
			getEmployees: function (oModel) {
				return new Promise(function (resolve, reject) {

					var success = function (oData) {
						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.read('/SubOrdinatesSet', {
						urlParameters: {
							"$expand": "ToSkill"
						},
						success: success,
						error: error
					});

				});
			}
		};
	}
);