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
			getSkills: function (oModel) {
				return new Promise(function (resolve, reject) {

					var success = function (oData) {
						// filter-out all the Skill Type Groups (Otype = "QK")
						// the data should only include Skill Types
						oData.results = oData.results.filter(function (obj) {
							return obj.Otype !== "QK";
						});

						// >>> Ricardo Quintas (rqu) | 23/09/2019 | Sort Alphabetically fix
						oData.results = oData.results.sort(function (a, b) {
							if (a.Stext.toLowerCase() < b.Stext.toLowerCase()) return -1;
							if (a.Stext.toLowerCase() > b.Stext.toLowerCase()) return 1;
							return 0;
						});
						// <<< Ricardo Quintas (rqu) | 23/0/2019 | Sort Alphabetically fix

						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.read('/SkillSet', {
						success: success,
						error: error
					});

				});
			}
		};
	}
);